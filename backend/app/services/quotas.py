
from sqlalchemy import func
from datetime import datetime
from typing import Tuple
from app import models
from sqlalchemy.orm import Session

def check_quota(db: Session, user, estimated_tokens: int) -> Tuple[bool, int]:
    """Check if user has enough monthly quota left. Returns (ok, current_used)"""
    # Current month start
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    total_used = db.query(func.sum(models.UsageLog.total_tokens)).filter(
        models.UsageLog.user_id == user.id,
        models.UsageLog.timestamp >= month_start
    ).scalar() or 0
    
    if total_used + estimated_tokens > user.monthly_quota:
        return False, total_used
    
    return True, total_used
