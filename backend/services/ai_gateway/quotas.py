# Quota checking and alert generation
from main import SessionLocal
from ai_gateway_models import UsageLog, Alert, User as AIGatewayUser # Alias User to AIGatewayUser
from sqlalchemy import func
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def get_user_monthly_usage(user_id: int):
    db = SessionLocal()
    try:
        # sum total_tokens for current month
        from datetime import datetime
        now = datetime.utcnow()
        start = datetime(now.year, now.month, 1)
        s = db.query(func.coalesce(func.sum(UsageLog.total_tokens), 0)).filter(
            UsageLog.user_id == user_id,
            UsageLog.timestamp >= start
        ).scalar()
        return int(s or 0)
    finally:
        db.close()

def check_and_record_quota(user, tokens_to_add: int):
    db = SessionLocal()
    try:
        used = get_user_monthly_usage(user.id)
        quota = user.monthly_quota or 0
        projected = used + tokens_to_add
        # Soft alert 80%
        if quota > 0 and used < 0.8 * quota <= projected:
            alert = Alert(user_id=user.id, organization_id=user.organization_id,
                          alert_type="soft_limit", message=f"user reached 80% quota ({projected}/{quota})")
            db.add(alert); db.commit()
            logger.warning("Soft quota alert for user %s", user.id)
        # Hard limit - if projected exceeds quota, reject
        if quota > 0 and projected > quota:
            alert = Alert(user_id=user.id, organization_id=user.organization_id,
                          alert_type="hard_limit", message=f"user exceeded quota ({projected}/{quota})")
            db.add(alert); db.commit()
            logger.warning("Hard quota alert for user %s", user.id)
            return False, used
        return True, used
    finally:
        db.close()
