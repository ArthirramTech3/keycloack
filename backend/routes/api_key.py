from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import APIKey, APIKeyType, APIKeyModelRestriction, Organization, UsageLog
from schemas import APIKeyCreate, APIKeyUpdate, APIKeyResponse, UsageLogResponse, UsageSummary


from utils.keycloak import verify_admin_role, verify_token, get_user_id_from_token

from utils.api_key_utils import generate_api_key

router = APIRouter()

@router.get("/", response_model=List[APIKeyResponse])
async def list_api_keys(
    organization_id: Optional[int] = None,
    key_type: Optional[str] = None,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_admin_role)
):
    """List all API keys (admin only). Can filter by organization or key type."""
    query = db.query(APIKey)
    
    if organization_id:
        query = query.filter(APIKey.organization_id == organization_id)
    if key_type:
        query = query.filter(APIKey.key_type == APIKeyType(key_type))
    
    return query.all()

@router.post("/", response_model=APIKeyResponse)
async def create_api_key(
    key_data: APIKeyCreate,
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_admin_role)
):
    """Create a new API key for an organization/admin/user."""
    # Verify organization exists
    org = db.query(Organization).filter(Organization.id == key_data.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Generate unique API key
    key_type_enum = APIKeyType(key_data.key_type.value)
    new_key = generate_api_key(key_type_enum)
    
    api_key = APIKey(
        organization_id=key_data.organization_id,
        keycloak_user_id=key_data.keycloak_user_id,
        key_type=key_type_enum,
        api_key=new_key,
        name=key_data.name,
        daily_token_limit=key_data.daily_token_limit,
        monthly_token_limit=key_data.monthly_token_limit
    )
    
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    
    # Add model restrictions if specified
    if key_data.allowed_models:
        for model_id in key_data.allowed_models:
            restriction = APIKeyModelRestriction(
                api_key_id=api_key.id,
                model_id=model_id
            )
            db.add(restriction)
        db.commit()
    
    return api_key

@router.get("/my-keys", response_model=List[APIKeyResponse])
async def get_my_api_keys(
    db: Session = Depends(get_db),
    token_data: dict = Depends(verify_token)
):
    """Get API keys for the current authenticated user."""
    user_id = get_user_id_from_token(token_data)
    keys = db.query(APIKey).filter(APIKey.keycloak_user_id == user_id).all()
    return keys

@router.get("/{key_id}", response_model=APIKeyResponse)
async def get_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """Get API key details (admin only)."""
    api_key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    return api_key

@router.put("/{key_id}", response_model=APIKeyResponse)
async def update_api_key(
    key_id: int,
    key_data: APIKeyUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """Update API key settings (admin only)."""
    api_key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    update_data = key_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(api_key, key, value)
    
    db.commit()
    db.refresh(api_key)
    return api_key

@router.delete("/{key_id}")
async def delete_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """Delete an API key (admin only)."""
    api_key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    db.delete(api_key)
    db.commit()
    return {"message": "API key deleted successfully"}

@router.post("/{key_id}/regenerate", response_model=APIKeyResponse)
async def regenerate_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """Regenerate an API key (admin only)."""
    api_key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    api_key.api_key = generate_api_key(api_key.key_type)
    db.commit()
    db.refresh(api_key)
    return api_key

# --- Usage Endpoints ---
@router.get("/{key_id}/usage", response_model=List[UsageLogResponse])
async def get_api_key_usage(
    key_id: int,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """Get usage logs for an API key (admin only)."""
    api_key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    logs = db.query(UsageLog).filter(
        UsageLog.api_key_id == key_id
    ).order_by(UsageLog.request_timestamp.desc()).limit(limit).all()
    
    return logs

@router.get("/{key_id}/usage/summary", response_model=UsageSummary)
async def get_api_key_usage_summary(
    key_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """Get usage summary for an API key (admin only)."""
    api_key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    logs = db.query(UsageLog).filter(UsageLog.api_key_id == key_id).all()
    
    total_tokens = sum(log.total_tokens for log in logs)
    total_cost = sum(log.cost for log in logs)
    models_used = list(set(log.model_id for log in logs))
    
    return UsageSummary(
        total_requests=len(logs),
        total_tokens=total_tokens,
        total_cost=total_cost,
        tokens_today=api_key.tokens_used_today,
        tokens_this_month=api_key.tokens_used_month,
        models_used=models_used
    )
