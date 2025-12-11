import secrets
import hashlib
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models import APIKey, APIKeyType, APIKeyModelRestriction, UsageLog
from config import API_KEY_PREFIX

def generate_api_key(key_type: APIKeyType) -> str:
    """Generate a unique API key with type prefix."""
    prefix_map = {
        APIKeyType.ORGANIZATION: f"{API_KEY_PREFIX}-org",
        APIKeyType.ADMIN: f"{API_KEY_PREFIX}-admin",
        APIKeyType.USER: f"{API_KEY_PREFIX}-user"
    }
    prefix = prefix_map.get(key_type, API_KEY_PREFIX)
    random_part = secrets.token_urlsafe(32)
    return f"{prefix}-{random_part}"

def hash_api_key(api_key: str) -> str:
    """Hash an API key for secure storage (optional)."""
    return hashlib.sha256(api_key.encode()).hexdigest()

def validate_api_key(db: Session, api_key: str) -> APIKey:
    """Validate an API key and return the APIKey object."""
    key_obj = db.query(APIKey).filter(
        APIKey.api_key == api_key,
        APIKey.is_active == True
    ).first()
    
    if not key_obj:
        return None
    
    # Check if organization is active
    if not key_obj.organization.is_active:
        return None
    
    return key_obj

def check_quota(api_key: APIKey, tokens_requested: int = 0) -> dict:
    """Check if the API key has remaining quota."""
    now = datetime.now(timezone.utc)
    
    # Reset daily counter if needed
    if api_key.last_reset_daily:
        last_reset = api_key.last_reset_daily
        if last_reset.tzinfo is None:
            last_reset = last_reset.replace(tzinfo=timezone.utc)
        if (now - last_reset).days >= 1:
            api_key.tokens_used_today = 0
            api_key.last_reset_daily = now
    
    # Reset monthly counter if needed
    if api_key.last_reset_monthly:
        last_reset = api_key.last_reset_monthly
        if last_reset.tzinfo is None:
            last_reset = last_reset.replace(tzinfo=timezone.utc)
        if (now - last_reset).days >= 30:
            api_key.tokens_used_month = 0
            api_key.last_reset_monthly = now
    
    # Check daily limit
    if api_key.daily_token_limit is not None:
        if api_key.tokens_used_today + tokens_requested > api_key.daily_token_limit:
            return {
                "allowed": False,
                "reason": "Daily token limit exceeded",
                "limit": api_key.daily_token_limit,
                "used": api_key.tokens_used_today
            }
    
    # Check monthly limit
    if api_key.monthly_token_limit is not None:
        if api_key.tokens_used_month + tokens_requested > api_key.monthly_token_limit:
            return {
                "allowed": False,
                "reason": "Monthly token limit exceeded",
                "limit": api_key.monthly_token_limit,
                "used": api_key.tokens_used_month
            }
    
    return {"allowed": True}

def get_allowed_models(db: Session, api_key: APIKey) -> list:
    """Get the list of models allowed for this API key."""
    # First check API key specific restrictions
    restrictions = db.query(APIKeyModelRestriction).filter(
        APIKeyModelRestriction.api_key_id == api_key.id
    ).all()
    
    if restrictions:
        return [r.model_name for r in restrictions]
    
    # Fall back to organization-level allowed models
    org_models = api_key.organization.allowed_models
    return [m.model_name for m in org_models if m.is_active]

def log_usage(
    db: Session,
    api_key: APIKey,
    model_name: str,
    prompt_tokens: int,
    completion_tokens: int,
    cost: float = 0.0,
    response_time_ms: int = None,
    status_code: int = None,
    error_message: str = None
):
    """Log API usage and update counters."""
    total_tokens = prompt_tokens + completion_tokens
    
    # Update API key counters
    api_key.tokens_used_today += total_tokens
    api_key.tokens_used_month += total_tokens
    
    # Create usage log
    usage_log = UsageLog(
        api_key_id=api_key.id,
        model_name=model_name,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        cost=cost,
        response_time_ms=response_time_ms,
        status_code=status_code,
        error_message=error_message
    )
    
    db.add(usage_log)
    db.commit()
