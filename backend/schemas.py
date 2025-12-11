from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    id_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: Optional[int] = None

# --- Organization Schemas ---
class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    openrouter_api_key: str = Field(..., min_length=10)

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    openrouter_api_key: Optional[str] = None
    is_active: Optional[bool] = None

class OrganizationResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- API Key Schemas ---
class APIKeyTypeEnum(str, Enum):
    organization = "organization"
    admin = "admin"
    user = "user"

class APIKeyCreate(BaseModel):
    organization_id: int
    keycloak_user_id: Optional[str] = None
    key_type: APIKeyTypeEnum
    name: str = Field(..., min_length=1, max_length=255)
    daily_token_limit: Optional[int] = None
    monthly_token_limit: Optional[int] = None
    allowed_models: Optional[List[str]] = None  # Model IDs user can access

class APIKeyUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    daily_token_limit: Optional[int] = None
    monthly_token_limit: Optional[int] = None

class APIKeyResponse(BaseModel):
    id: int
    organization_id: int
    keycloak_user_id: Optional[str]
    key_type: str
    api_key: str
    name: str
    is_active: bool
    daily_token_limit: Optional[int]
    monthly_token_limit: Optional[int]
    tokens_used_today: int
    tokens_used_month: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Quota Schemas ---
class QuotaUpdate(BaseModel):
    daily_token_limit: Optional[int] = None
    monthly_token_limit: Optional[int] = None
    allowed_models: Optional[List[str]] = None

class QuotaResponse(BaseModel):
    api_key_id: int
    name: str
    key_type: str
    daily_token_limit: Optional[int]
    monthly_token_limit: Optional[int]
    tokens_used_today: int
    tokens_used_month: int
    allowed_models: List[str]
    usage_percentage_daily: Optional[float]
    usage_percentage_monthly: Optional[float]

# --- Usage Schemas ---
class UsageLogResponse(BaseModel):
    id: int
    model_name: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost: float
    request_timestamp: datetime
    response_time_ms: Optional[int]
    status_code: Optional[int]
    
    class Config:
        from_attributes = True

class UsageSummary(BaseModel):
    total_requests: int
    total_tokens: int
    total_cost: float
    tokens_today: int
    tokens_this_month: int
    models_used: List[str]

# --- Model Schemas ---
class AllowedModelCreate(BaseModel):
    model_name: str


class AllowedModelResponse(BaseModel):
    id: int
    model_name: str
    is_active: bool
    
    class Config:
        from_attributes = True
        protected_namespaces = ()

# --- Keycloak User Schemas ---
class UserCreate(BaseModel):
    username: str
    password: str
    email: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None

class UserStatusUpdate(BaseModel):
    enabled: bool

class GroupCreate(BaseModel):
    name: str

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
