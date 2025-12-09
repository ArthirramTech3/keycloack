from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any

class OrgCreate(BaseModel):
    name: str

class UserCreate(BaseModel):
    email: EmailStr
    full_name: Optional[str]
    role: Optional[str] = "member"
    monthly_quota: Optional[int] = 100000
    rate_limit_per_minute: Optional[int] = 60

class ProviderConfigCreate(BaseModel):
    provider_name: str
    api_key: str
    allowed_models: List[str] = []

class APIKeyRotate(BaseModel):
    user_id: int

class ChatRequest(BaseModel):
    provider: str = Field(..., example="openai")
    model: str = Field(..., example="gpt-4o-mini")
    messages: List[Dict[str, Any]]  # OpenAI style messages
