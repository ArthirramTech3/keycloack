# backend/routes/admin_models.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import SessionLocal  # adjust if your DB session provider differs
from models import AllowedModel, Organization  # adjust import if your model file name differs
from utils.keycloak import verify_admin_role, get_user_id_from_token

router = APIRouter()

# Pydantic models
class ModelResponse(BaseModel):
    id: int
    model_name: str
    provider: str
    creator_id: Optional[str] = None
    is_public: bool
    organization_id: Optional[int] = None

    class Config:
        orm_mode = True

class ModelCreate(BaseModel):
    model_name: str
    provider: str
    api_url: str
    api_key: str
    is_public: bool = False
    organization_id: Optional[int] = None

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/admin/models", response_model=List[ModelResponse], dependencies=[Depends(verify_admin_role)])
def get_models(db: Session = Depends(get_db), decoded_token: dict = Depends(verify_admin_role)):
    user_id = decoded_token['sub']
    
    # Get the organization of the user
    user_org = db.query(Organization).filter(Organization.api_keys.any(keycloak_user_id=user_id)).first()
    
    query = db.query(AllowedModel)
    if user_org:
        # Return models that are public or belong to the user's organization
        query = query.filter(or_(AllowedModel.is_public == True, AllowedModel.organization_id == user_org.id))
    else:
        # If user has no organization, only return public models
        query = query.filter(AllowedModel.is_public == True)
        
    return query.all()

@router.post("/admin/models/create", response_model=ModelResponse, dependencies=[Depends(verify_admin_role)])
def create_model(payload: ModelCreate, db: Session = Depends(get_db), decoded_token: dict = Depends(verify_admin_role)):
    user_id = get_user_id_from_token(decoded_token)
    
    if not payload.is_public and not payload.organization_id:
        raise HTTPException(status_code=400, detail="Organization ID is required for non-public models.")

    db_model = AllowedModel(
        model_name=payload.model_name,
        provider=payload.provider,
        creator_id=user_id,
        is_public=payload.is_public,
        api_url=payload.api_url,
        api_key=payload.api_key,
        organization_id=payload.organization_id if not payload.is_public else None
    )
    try:
        db.add(db_model)
        db.commit()
        db.refresh(db_model)
        return db_model
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create model: {e}")
