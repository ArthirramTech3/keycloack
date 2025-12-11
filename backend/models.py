from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, BigInteger, Enum, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class APIKeyType(enum.Enum):
    ORGANIZATION = "organization"
    ADMIN = "admin"
    USER = "user"

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    openrouter_api_key = Column(String(500), nullable=False)  # Parent OpenRouter key
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    api_keys = relationship("APIKey", back_populates="organization", cascade="all, delete-orphan")
    allowed_models = relationship("AllowedModel", back_populates="organization", cascade="all, delete-orphan")

class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    keycloak_user_id = Column(String(255), nullable=True)  # Keycloak user 'sub' claim
    key_type = Column(Enum(APIKeyType), nullable=False)
    api_key = Column(String(500), unique=True, nullable=False)  # Generated unique key
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Token limits
    daily_token_limit = Column(BigInteger, nullable=True)  # NULL = unlimited
    monthly_token_limit = Column(BigInteger, nullable=True)
    
    # Usage tracking
    tokens_used_today = Column(BigInteger, default=0)
    tokens_used_month = Column(BigInteger, default=0)
    last_reset_daily = Column(DateTime(timezone=True), server_default=func.now())
    last_reset_monthly = Column(DateTime(timezone=True), server_default=func.now())
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="api_keys")
    usage_logs = relationship("UsageLog", back_populates="api_key", cascade="all, delete-orphan")
    model_restrictions = relationship("APIKeyModelRestriction", back_populates="api_key", cascade="all, delete-orphan")

class AllowedModel(Base):
    """Models allowed at organization level"""
    __tablename__ = "allowed_models"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    model_id = Column(String(255), nullable=False)  # e.g., "openai/gpt-4o-mini"
    is_active = Column(Boolean, default=True)
    
    organization = relationship("Organization", back_populates="allowed_models")

class APIKeyModelRestriction(Base):
    """Model restrictions per API key (subset of org allowed models)"""
    __tablename__ = "api_key_model_restrictions"
    
    id = Column(Integer, primary_key=True, index=True)
    api_key_id = Column(Integer, ForeignKey("api_keys.id"), nullable=False)
    model_id = Column(String(255), nullable=False)
    
    api_key = relationship("APIKey", back_populates="model_restrictions")

class UsageLog(Base):
    __tablename__ = "usage_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    api_key_id = Column(Integer, ForeignKey("api_keys.id"), nullable=False)
    model_id = Column(String(255), nullable=False)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    cost = Column(Float, default=0.0)
    request_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    response_time_ms = Column(Integer, nullable=True)
    status_code = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    
    api_key = relationship("APIKey", back_populates="usage_logs")
