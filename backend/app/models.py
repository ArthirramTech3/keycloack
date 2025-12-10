from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization")
    providers = relationship("ProviderConfig", back_populates="organization")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    email = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="member")  # admin | member
    api_key_hash = Column(String, nullable=False)  # store hashed internal API key
    monthly_quota = Column(Integer, default=100000)  # tokens per month
    rate_limit_per_minute = Column(Integer, default=60)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
    usages = relationship("UsageLog", back_populates="user")

class ProviderConfig(Base):
    __tablename__ = "provider_configs"
    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    provider_name = Column(String, nullable=False)  # openai, anthropic, google
    # encrypted_api_key should store encrypted master key (we will encrypt/decrypt in code)
    encrypted_api_key = Column(Text, nullable=False)
    allowed_models = Column(JSON, default=[])  # list of allowed model names
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="providers")

    __table_args__ = (UniqueConstraint('organization_id', 'provider_name', name='_org_provider_uc'),)

class UsageLog(Base):
    __tablename__ = "usage_logs"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    provider = Column(String, nullable=False)
    model = Column(String, nullable=False)
    tokens_in = Column(Integer, default=0)
    tokens_out = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="usages")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    alert_type = Column(String, nullable=False)  # soft_limit | hard_limit | other
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)