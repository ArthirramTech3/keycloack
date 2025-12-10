# Dependency helpers for FastAPI routes: DB session, auth by API key, admin checks
from fastapi import Header, HTTPException, Depends
from app.db import SessionLocal
from app.services.auth import verify_api_key
from app import models
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_user_by_api_key(x_api_key: str = Header(...), db: Session = Depends(get_db)):
    # Map internal API key to user; we store hashed API keys in DB
    # Iterate users and verify - in production use a lookup table (api_key_id) to avoid O(n) verifies
    users = db.query(models.User).filter(models.User.is_active == True).all()
    for u in users:
        try:
            if verify_api_key(x_api_key, u.api_key_hash):
                return u
        except Exception:
            continue
    raise HTTPException(status_code=401, detail="Invalid API key")

def require_org_admin(user: models.User = Depends(get_user_by_api_key)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return user