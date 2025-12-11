from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import APIKey, APIKeyModelRestriction
from schemas import QuotaUpdate, QuotaResponse


from utils.keycloak import verify_admin_role

from utils.api_key_utils import get_allowed_models

router = APIRouter()

@router.get("/", response_model=List[QuotaResponse])
async def list_all_quotas(
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """List quotas for all API keys (admin only)."""
    api_keys = db.query(APIKey).all()
    
    result = []
    for key in api_keys:
        allowed_models = get_allowed_models(db, key)
        
        usage_pct_daily = None
        if key.daily_token_limit and key.daily_token_limit > 0:
            usage_pct_daily = (key.tokens_used_today / key.daily_token_limit) * 100
        
        usage_pct_monthly = None
        if key.monthly_token_limit and key.monthly_token_limit > 0:
            usage_pct_monthly = (key.tokens_used_month / key.monthly_token_limit) * 100
        
        result.append(QuotaResponse(
            api_key_id=key.id,
            name=key.name,
            key_type=key.key_type.value,
            daily_token_limit=key.daily_token_limit,
            monthly_token_limit=key.monthly_token_limit,
            tokens_used_today=key.tokens_used_today,
            tokens_used_month=key.tokens_used_month,
            allowed_models=allowed_models,
            usage_percentage_daily=usage_pct_daily,
            usage_percentage_monthly=usage_pct_monthly
        ))
    
    return result

@router.get("/{key_id}", response_model=QuotaResponse)
async def get_quota(
    key_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """Get quota details for a specific API key."""
    key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    allowed_models = get_allowed_models(db, key)
    
    usage_pct_daily = None
    if key.daily_token_limit and key.daily_token_limit > 0:
        usage_pct_daily = (key.tokens_used_today / key.daily_token_limit) * 100
    
    usage_pct_monthly = None
    if key.monthly_token_limit and key.monthly_token_limit > 0:
        usage_pct_monthly = (key.tokens_used_month / key.monthly_token_limit) * 100
    
    return QuotaResponse(
        api_key_id=key.id,
        name=key.name,
        key_type=key.key_type.value,
        daily_token_limit=key.daily_token_limit,
        monthly_token_limit=key.monthly_token_limit,
        tokens_used_today=key.tokens_used_today,
        tokens_used_month=key.tokens_used_month,
        allowed_models=allowed_models,
        usage_percentage_daily=usage_pct_daily,
        usage_percentage_monthly=usage_pct_monthly
    )

@router.put("/{key_id}", response_model=QuotaResponse)
async def update_quota(
    key_id: int,
    quota_data: QuotaUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """Update quota settings for an API key (admin only)."""
    key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    # Update token limits
    if quota_data.daily_token_limit is not None:
        key.daily_token_limit = quota_data.daily_token_limit
    if quota_data.monthly_token_limit is not None:
        key.monthly_token_limit = quota_data.monthly_token_limit
    
    # Update allowed models if provided
    if quota_data.allowed_models is not None:
        # Remove existing restrictions
        db.query(APIKeyModelRestriction).filter(
            APIKeyModelRestriction.api_key_id == key_id
        ).delete()
        
        # Add new restrictions
        for model_name in quota_data.allowed_models:
            restriction = APIKeyModelRestriction(
                api_key_id=key_id,
                model_name=model_name
            )
            db.add(restriction)
    
    db.commit()
    db.refresh(key)
    
    allowed_models = get_allowed_models(db, key)
    
    usage_pct_daily = None
    if key.daily_token_limit and key.daily_token_limit > 0:
        usage_pct_daily = (key.tokens_used_today / key.daily_token_limit) * 100
    
    usage_pct_monthly = None
    if key.monthly_token_limit and key.monthly_token_limit > 0:
        usage_pct_monthly = (key.tokens_used_month / key.monthly_token_limit) * 100
    
    return QuotaResponse(
        api_key_id=key.id,
        name=key.name,
        key_type=key.key_type.value,
        daily_token_limit=key.daily_token_limit,
        monthly_token_limit=key.monthly_token_limit,
        tokens_used_today=key.tokens_used_today,
        tokens_used_month=key.tokens_used_month,
        allowed_models=allowed_models,
        usage_percentage_daily=usage_pct_daily,
        usage_percentage_monthly=usage_pct_monthly
    )

@router.post("/{key_id}/reset-daily")
async def reset_daily_usage(
    key_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """Reset daily token usage for an API key."""
    key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    key.tokens_used_today = 0
    db.commit()
    
    return {"message": "Daily usage reset successfully"}

@router.post("/{key_id}/reset-monthly")
async def reset_monthly_usage(
    key_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_role)
):
    """Reset monthly token usage for an API key."""
    key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    key.tokens_used_month = 0
    db.commit()
    
    return {"message": "Monthly usage reset successfully"}
