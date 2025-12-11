from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Organization, AllowedModel
from schemas import OrganizationCreate, OrganizationUpdate, OrganizationResponse, AllowedModelCreate, AllowedModelResponse


from utils.keycloak import verify_admin_role

router = APIRouter()

@router.get("", response_model=List[OrganizationResponse])
async def list_organizations(
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """List all organizations (admin only)."""
    return db.query(Organization).all()


@router.post("", response_model=OrganizationResponse)
async def create_organization(
    org_data: OrganizationCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """Create a new organization with OpenRouter API key."""
    try:
        # Check if org name exists
        existing = db.query(Organization).filter(Organization.name == org_data.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Organization name already exists")
        
        org = Organization(
            name=org_data.name,
            description=org_data.description,
            openrouter_api_key=org_data.openrouter_api_key
        )
        db.add(org)
        db.commit()
        db.refresh(org)
        return org
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create organization: {str(e)}")

@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """Get organization details."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.put("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: int,
    org_data: OrganizationUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """Update organization details."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    update_data = org_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(org, key, value)
    
    db.commit()
    db.refresh(org)
    return org

@router.delete("/{org_id}")
async def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """Delete an organization and all associated data."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    db.delete(org)
    db.commit()
    return {"message": "Organization deleted successfully"}

# --- Allowed Models Management ---
@router.get("/{org_id}/models", response_model=List[AllowedModelResponse])
async def list_allowed_models(
    org_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """List models allowed for this organization."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org.allowed_models

@router.post("/{org_id}/models", response_model=AllowedModelResponse)
async def add_allowed_model(
    org_id: int,
    model_data: AllowedModelCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """Add a model to organization's allowed list."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Check if model already exists
    existing = db.query(AllowedModel).filter(
        AllowedModel.organization_id == org_id,
        AllowedModel.model_name == model_data.model_name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Model already allowed")
    
    model = AllowedModel(
        organization_id=org_id,
        model_name=model_data.model_name
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model

@router.delete("/{org_id}/models/{model_id}")
async def remove_allowed_model(
    org_id: int,
    model_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """Remove a model from organization's allowed list."""
    model = db.query(AllowedModel).filter(
        AllowedModel.organization_id == org_id,
        AllowedModel.id == model_id
    ).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    db.delete(model)
    db.commit()
    return {"message": "Model removed successfully"}
