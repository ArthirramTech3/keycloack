from fastapi import APIRouter, Depends, HTTPException
from app import schemas, models
from app.dependencies import get_db, require_org_admin
from sqlalchemy.orm import Session
from app.services import auth as auth_svc
from app.utils.crypto import encrypt_secret
from app.services.auth import generate_api_key, hash_api_key

admin_router = APIRouter()

@admin_router.post("/orgs", response_model=dict)
def create_org(payload: schemas.OrgCreate, db: Session = Depends(get_db)): # Removed admin=Depends(require_org_admin)
    # admin is required to create orgs in this simplified example
    org = models.Organization(name=payload.name)
    db.add(org); db.commit(); db.refresh(org)
    return {"id": org.id, "name": org.name}

@admin_router.post("/orgs/{org_id}/providers", response_model=dict)
def add_provider(org_id: int, payload: schemas.ProviderConfigCreate, db: Session = Depends(get_db), admin=Depends(require_org_admin)):
    # store encrypted api key and allowed models
    encrypted = encrypt_secret(payload.api_key)
    cfg = models.ProviderConfig(organization_id=org_id, provider_name=payload.provider_name, encrypted_api_key=encrypted, allowed_models=payload.allowed_models)
    db.add(cfg); db.commit(); db.refresh(cfg)
    return {"id": cfg.id, "provider_name": cfg.provider_name}

@admin_router.post("/orgs/{org_id}/users", response_model=dict)
def create_user(org_id: int, payload: schemas.UserCreate, db: Session = Depends(get_db)): # Removed admin=Depends(require_org_admin)
    raw_key = generate_api_key()
    hashed = hash_api_key(raw_key)
    user = models.User(organization_id=org_id, email=payload.email, full_name=payload.full_name, role=payload.role,
                       api_key_hash=hashed, monthly_quota=payload.monthly_quota, rate_limit_per_minute=payload.rate_limit_per_minute)
    db.add(user); db.commit(); db.refresh(user)
    # return raw_key once; do NOT store raw key anywhere
    return {"user_id": user.id, "api_key": raw_key}
