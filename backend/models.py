from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class DBModel(Base):
    __tablename__ = "models"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, index=True)
    provider = Column(String)
    creator_id = Column(String, index=True, nullable=True) # Keycloak user 'sub'
    is_public = Column(Boolean, default=False)
    api_url = Column(String, nullable=True) # URL for the specific model's API endpoint
    api_key = Column(String, nullable=True) # Master API key for this model/provider (encrypted)

class UserAPIKey(Base):
    __tablename__ = "user_api_keys"
    id = Column(Integer, primary_key=True, index=True)
    key_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    hashed_key = Column(String, nullable=False)
    user_id = Column(String, index=True, nullable=False) # Keycloak 'sub'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    usage_logs = relationship("UsageLog", back_populates="user_api_key")

class UserQuota(Base):
    __tablename__ = "user_quotas"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, nullable=False) # Keycloak 'sub'
    total_tokens_limit = Column(Integer, default=0) # 0 means unlimited
    daily_tokens_limit = Column(Integer, default=0)
    monthly_tokens_limit = Column(Integer, default=0)
    request_rate_limit_per_minute = Column(Integer, default=0) # 0 means unlimited

    # Access control for providers/models
    allowed_providers = Column(String, default="") # Comma-separated list of providers
    allowed_models = Column(String, default="") # Comma-separated list of model names

    current_total_tokens = Column(Integer, default=0)
    current_daily_tokens = Column(Integer, default=0)
    current_monthly_tokens = Column(Integer, default=0)
    last_reset_daily = Column(DateTime, default=datetime.utcnow)
    last_reset_monthly = Column(DateTime, default=datetime.utcnow)

    usage_logs = relationship("UsageLog", back_populates="user_quota", primaryjoin="UserQuota.user_id == UsageLog.user_id")

class UsageLog(Base):
    __tablename__ = "usage_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("user_quotas.user_id"), index=True, nullable=False) # Keycloak 'sub'
    user_api_key_id = Column(Integer, ForeignKey("user_api_keys.id"), nullable=False)
    model_name = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    tokens_used = Column(Integer, default=0)
    request_count = Column(Integer, default=1)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user_api_key = relationship("UserAPIKey", back_populates="usage_logs")
    user_quota = relationship("UserQuota", back_populates="usage_logs", primaryjoin="UsageLog.user_id == UserQuota.user_id")
