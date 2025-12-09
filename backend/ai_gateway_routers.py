from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from main import get_db
from ai_gateway_models import User as AIGatewayUser, Organization, ProviderConfig, UsageLog, Alert # Import new models
from ai_gateway_auth import get_ai_gateway_user, require_ai_gateway_admin, generate_api_key, hash_api_key, verify_api_key
from main import KEYCLOAK_URL, REALM, get_admin_token # For Keycloak user details and general admin
from main import AIGatewayUserCreate, OrgCreate, ProviderConfigCreate, APIKeyRotate, ChatRequest # schemas
from main import OrganizationResponse, AIGatewayUserResponse, ProviderConfigResponse, UsageLogResponse, AlertResponse # schemas

# Import other services needed by the AI Gateway
from services.ai_gateway.providers import forward_to_provider
from services.ai_gateway.quotas import check_and_record_quota
from utils.ai_gateway.crypto import encrypt_secret # For encrypting provider API keys

# --- Admin Router for AI Gateway specific management ---
ai_gateway_admin_router = APIRouter(prefix="/ai-gateway-admin", tags=["AI Gateway Admin"])

@ai_gateway_admin_router.post("/orgs", response_model=OrganizationResponse, dependencies=[Depends(require_ai_gateway_admin)])
async def create_org(payload: OrgCreate, db: Session = Depends(get_db)):
    """Create a new organization."""
    org = db.query(Organization).filter(Organization.name == payload.name).first()
    if org:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Organization with this name already exists")
    org = Organization(name=payload.name)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

@ai_gateway_admin_router.post("/orgs/{org_id}/providers", response_model=ProviderConfigResponse, dependencies=[Depends(require_ai_gateway_admin)])
async def add_provider(org_id: int, payload: ProviderConfigCreate, db: Session = Depends(get_db)):
    """Add a provider configuration for an organization."""
    organization = db.query(Organization).filter(Organization.id == org_id).first()
    if not organization:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    existing_cfg = db.query(ProviderConfig).filter(
        ProviderConfig.organization_id == org_id,
        ProviderConfig.provider_name == payload.provider_name
    ).first()
    if existing_cfg:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Provider config already exists for this organization")

    encrypted = encrypt_secret(payload.api_key)
    cfg = ProviderConfig(organization_id=org_id, provider_name=payload.provider_name, encrypted_api_key=encrypted, allowed_models=payload.allowed_models)
    db.add(cfg)
    db.commit()
    db.refresh(cfg)
    return cfg

@ai_gateway_admin_router.post("/orgs/{org_id}/users", response_model=AIGatewayUserResponse, dependencies=[Depends(require_ai_gateway_admin)])
async def create_ai_gateway_user_admin(org_id: int, payload: AIGatewayUserCreate, db: Session = Depends(get_db)):
    """Create a new AI Gateway user entry for an existing Keycloak user (Admin only)."""
    organization = db.query(Organization).filter(Organization.id == org_id).first()
    if not organization:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    existing_user = db.query(AIGatewayUser).filter(
        AIGatewayUser.keycloak_user_id == payload.keycloak_user_id
    ).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="AI Gateway user already exists for this Keycloak user")

    raw_key = generate_api_key()
    hashed = hash_api_key(raw_key)
    user = AIGatewayUser(
        organization_id=org_id,
        keycloak_user_id=payload.keycloak_user_id,
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
        api_key_hash=hashed,
        monthly_quota=payload.monthly_quota,
        rate_limit_per_minute=payload.rate_limit_per_minute
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    # Note: raw_key should be securely returned to the user via a frontend flow, not here directly
    # For now, we return it for testing/demonstration purposes
    setattr(user, 'api_key', raw_key) # Temporarily add raw_key to the user object for response
    return user

@ai_gateway_admin_router.get("/orgs/{org_id}/users", response_model=List[AIGatewayUserResponse], dependencies=[Depends(require_ai_gateway_admin)])
async def get_org_users(org_id: int, db: Session = Depends(get_db)):
    """Get all AI Gateway users for a specific organization."""
    users = db.query(AIGatewayUser).filter(AIGatewayUser.organization_id == org_id).all()
    if not users:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No AI Gateway users found for this organization")
    return users

# --- Proxy Router for AI Gateway API usage ---
ai_gateway_proxy_router = APIRouter(prefix="/v1", tags=["AI Gateway Proxy"])

@ai_gateway_proxy_router.post("/chat/completions")
async def proxy_chat(req: ChatRequest, ai_user: AIGatewayUser = Depends(get_ai_gateway_user), db: Session = Depends(get_db)):
    """
    Proxy chat requests to the configured AI provider, with usage tracking and rate limiting.
    Authenticated via Keycloak token, then maps to AI Gateway user.
    """
    # Validate provider allowed for user's org
    cfg = db.query(ProviderConfig).filter(
        ProviderConfig.organization_id == ai_user.organization_id,
        ProviderConfig.provider_name == req.provider
    ).first()
    if not cfg:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Provider not configured for your organization")
    if req.model not in (cfg.allowed_models or []):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Model not allowed for your organization")

    # Simple token estimate: use len of messages as proxy (replace with tokenizer)
    tokens_estimate = sum(len(m.get("content","")) for m in req.messages) // 4
    ok, used = check_and_record_quota(ai_user, tokens_estimate)
    if not ok:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Monthly quota exceeded")

    # Build provider payload (normalize to OpenAI style)
    payload = {"model": req.model, "messages": req.messages}
    resp = await forward_to_provider(req.provider, cfg.encrypted_api_key, req.model, payload)

    # Record usage (for exercise we assume provider returns usage)
    usage_in = tokens_estimate
    usage_out = resp.get("usage",{}).get("completion_tokens",0) if isinstance(resp, dict) else 0
    total = usage_in + usage_out
    log = UsageLog(user_id=ai_user.id, organization_id=ai_user.organization_id, provider=req.provider, model=req.model,
                          tokens_in=usage_in, tokens_out=usage_out, total_tokens=total)
    db.add(log)
    db.commit()
    db.refresh(log) # Refresh to get ID and timestamp

    return resp
