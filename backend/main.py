import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from os import getenv
# Load environment variables from .env file
load_dotenv()
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter
import httpx
import jwt
from passlib.context import CryptContext

# Import SQLAlchemy models from models.py
from backend.models import Base, DBModel, UserAPIKey, UserQuota, UsageLog
   
# --- Configuration ---
# Use an absolute path to ensure the DB is in the project root
DATABASE_URL = getenv("DATABASE_URL", "postgresql://cybersecurity:cybersecurity%40123@localhost/cybersecuritydb")

# Keycloak configuration (replace with your actual public key)
KEYCLOAK_URL = getenv("KEYCLOAK_URL", "http://localhost:8080")
REALM = getenv("KEYCLOAK_REALM", "cybersecurity-realm")
CLIENT_ID = getenv("KEYCLOAK_CLIENT_ID", "cybersecurity-frontend") # This is the public client
CLIENT_SECRET = getenv("KEYCLOAK_CLIENT_SECRET", "0xISuGJ0ZHpQ7DTChfh1BWBd6RCNon0n") # Replace with your actual client secret if different
KEYCLOAK_PUBLIC_KEY = getenv("KEYCLOAK_PUBLIC_KEY", "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtztkdtz+I86FnPXGp9yEC8FOrAaM5fXSe5/ekXfwiCg2VsqzYJNfxjLkU83MUvcow1M9Yu8MyEhgLKorSMpC2TaUmw1UrxBjB2cCNtmvZSlj2tUzFEr11sQd6vL0TT+WaSCwDe6xrbHaJI3bBo9ozA+4FKfZz0CITd2LeQIRgBOEfTrh+su90HyT2R9gpX+2aYVqfDgUUFxWhqioMZT/5hUIBGj78TVPY3ArFoU1AZVoFeVbGjON2j9ndrx+LPO4fayDdry1/6U3EpKR345QkdmUO6IAerCE3mW4V50wkouykGoXMEgrtLeDIFs0zXQc9dyBAIrp6MD553Ot6FJ2wIDAQAB")

# CryptContext for hashing API keys
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Database Setup ---
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all database tables defined in models.py
Base.metadata.create_all(bind=engine)

# Pydantic model for response
class ModelResponse(BaseModel):
    id: int
    model_name: str
    provider: str
    creator_id: Optional[str] = None
    is_public: bool
    api_url: Optional[str] = None # Include for consistency with DBModel
    api_key: Optional[str] = None # Include for consistency with DBModel, handle securely

    class Config:
        from_attributes = True

# Pydantic model for creating a new model
class ModelCreate(BaseModel):
    model_name: str
    provider: str
    api_url: Optional[str] = None # Master API endpoint for this model/provider
    api_key: Optional[str] = None # Master API key for this model/provider (will be encrypted)
    is_public: bool = False

# Pydantic models for User API Keys
class APIKeyCreate(BaseModel):
    user_id: str
    expires_at: Optional[datetime] = None

class APIKeyResponse(BaseModel):
    key_id: str
    user_id: str
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Pydantic models for User Quotas
class QuotaSettings(BaseModel):
    total_tokens_limit: int = Field(default=0, description="Overall token limit (0 for unlimited)")
    daily_tokens_limit: int = Field(default=0, description="Daily token limit (0 for unlimited)")
    monthly_tokens_limit: int = Field(default=0, description="Monthly token limit (0 for unlimited)")
    request_rate_limit_per_minute: int = Field(default=0, description="Requests per minute limit (0 for unlimited)")
    allowed_providers: Optional[str] = Field(default="", description="Comma-separated list of allowed providers")
    allowed_models: Optional[str] = Field(default="", description="Comma-separated list of allowed models")

class QuotaUpdate(QuotaSettings):
    pass # Inherits all fields, ready for partial updates

class UserQuotaResponse(QuotaSettings):
    id: int
    user_id: str
    current_total_tokens: int
    current_daily_tokens: int
    current_monthly_tokens: int
    last_reset_daily: datetime
    last_reset_monthly: datetime

    class Config:
        from_attributes = True

# Pydantic model for usage logs
class UsageLogResponse(BaseModel):
    id: int
    user_id: str
    user_api_key_id: int
    model_name: str
    provider: str
    tokens_used: int
    request_count: int
    timestamp: datetime

    class Config:
        from_attributes = True

# Pydantic model for login request
class LoginRequest(BaseModel):
    username: str
    password: str

# --- Pydantic Models for User Management ---
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

class GroupUpdate(BaseModel):
    name: str

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None

class RoleUpdate(BaseModel):
    name: str
    description: Optional[str] = None

# --- FastAPI App Initialization ---
app = FastAPI()

# CORS Middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency Injection ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
security = HTTPBearer()

async def get_admin_token():
    """Get an admin access token from Keycloak using client credentials."""
    token_url = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token"
    payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials",
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(token_url, data=payload)
            response.raise_for_status()
            return response.json()["access_token"]
        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            print(f"Failed to get admin token: {e}")
            raise HTTPException(status_code=500, detail="Could not authenticate with Keycloak service account.")

async def verify_admin_role(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify the JWT token and check if the user has the 'admin' role."""
    token_string = credentials.credentials
    try:
        # In a real app, you'd verify the signature here first using the public key.
        # For this project, we continue to decode without signature verification.
        decoded_token = jwt.decode(token_string, options={"verify_signature": False})
        print(f"Decoded Token for admin role check: {decoded_token}") # Debugging line
        
        # Check for admin role in realm_access
        realm_access = decoded_token.get("realm_access", {})
        print(f"Realm Access Roles: {realm_access.get('roles', [])}") # Debugging line
        if "admin" not in realm_access.get("roles", []):
            raise HTTPException(status_code=403, detail="Admin role required")
            
        # Return the entire decoded token so other dependencies can use it
        return decoded_token 
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user_id(decoded_token: dict = Depends(verify_admin_role)) -> str:
    """
    Extracts the user ID ('sub') from the already-decoded token.
    This function now depends on `verify_admin_role` to provide the token.
    """
    user_id = decoded_token.get("sub")
    if not user_id:
        # This case should ideally not be reached if the token is valid
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: 'sub' missing")
    return user_id

async def get_current_active_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Verifies the JWT token and extracts the user ID ('sub').
    Does not require any specific role, just a valid token.
    """
    token_string = credentials.credentials
    try:
        decoded_token = jwt.decode(token_string, options={"verify_signature": False})
        user_id = decoded_token.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: 'sub' missing")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")

# Create a router for all admin-prefixed routes
admin_router = APIRouter(prefix="/admin")
# Create a router for user-specific routes (e.g., API key management)
user_router = APIRouter(prefix="/users")


# --- API Endpoints ---
@app.post("/custom-login")
async def custom_login(request: LoginRequest):
    """
    Handles ROPC (password) grant flow with Keycloak.
    Exchanges username and password for an access token.
    """
    token_url = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token"
    
    payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "password",
        "username": request.username,
        "password": request.password,
        "scope": "openid",  
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(token_url, data=payload)
            response.raise_for_status()  # Raises an exception for 4XX/5XX responses
            return response.json()
        except httpx.HTTPStatusError as e:
            # Forward the error from Keycloak to the frontend
            detail = e.response.json().get("error_description", "Invalid credentials")
            raise HTTPException(status_code=e.response.status_code, detail=detail)
        except httpx.RequestError:
            raise HTTPException(status_code=500, detail="Could not connect to authentication server")

# --- User API Key Management ---
@user_router.post("/me/api-keys", response_model=Dict[str, str])
async def generate_user_api_key(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_active_user),
    expires_at: Optional[datetime] = None
):
    """Generate a new API key for the current user."""
    # Generate a new random API key
    new_api_key_value = f"sk-{user_id}-{os.urandom(24).hex()}"
    hashed_key = pwd_context.hash(new_api_key_value)

    db_api_key = UserAPIKey(
        user_id=user_id,
        hashed_key=hashed_key,
        expires_at=expires_at
    )
    db.add(db_api_key)
    db.commit()
    db.refresh(db_api_key)

    return {"message": "API key generated successfully", "api_key": new_api_key_value}

@user_router.get("/me/api-keys", response_model=List[APIKeyResponse])
async def get_user_api_keys(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_active_user)
):
    """Get all active API keys for the current user."""
    api_keys = db.query(UserAPIKey).filter(
        UserAPIKey.user_id == user_id,
        UserAPIKey.is_active == True
    ).all()
    return api_keys

@user_router.delete("/me/api-keys/{key_id}")
async def revoke_user_api_key(
    key_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_active_user)
):
    """Revoke an API key for the current user."""
    db_api_key = db.query(UserAPIKey).filter(
        UserAPIKey.user_id == user_id,
        UserAPIKey.key_id == key_id,
        UserAPIKey.is_active == True
    ).first()

    if not db_api_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found or already inactive")

    db_api_key.is_active = False
    db.add(db_api_key)
    db.commit()

    return {"message": "API key revoked successfully"}

# --- LLM Proxy Endpoint ---
# This will be secured by the UserAPIKey authentication
async def verify_user_api_key(api_key: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> UserAPIKey:
    """Verify the provided user API key and return the associated UserAPIKey object."""
    key_value = api_key.credentials
    
    # Extract the key_id from the key_value if it follows the "sk-{user_id}-{key_id_part}" format
    # This helps to quickly narrow down potential matches in the database
    key_id_parts = key_value.split('-')
    if len(key_id_parts) == 3 and key_id_parts[0] == "sk":
        # The key_id in the database is a full UUID. We need to find the UserAPIKey based on a potential match
        # and then verify the full key. Searching by a part of the key_id is not secure.
        # Instead, we will iterate through active keys and verify.
        pass # Fall through to full iteration
    
    # In a real-world scenario, you might want a more efficient lookup if key_id is truly part of the key.
    # For now, we fetch all active keys for a user (if user_id is embeddable or inferable from the key)
    # or all active keys and iterate. Given the structure "sk-{user_id}-{hex}", we can actually try to parse user_id
    # and use it for a more targeted query.
    
    potential_user_id = None
    if len(key_id_parts) == 3 and key_id_parts[0] == "sk":
        potential_user_id = key_id_parts[1]
    
    if potential_user_id:
        active_keys = db.query(UserAPIKey).filter(UserAPIKey.user_id == potential_user_id, UserAPIKey.is_active == True).all()
    else:
        active_keys = db.query(UserAPIKey).filter(UserAPIKey.is_active == True).all()

    for db_key in active_keys:
        if pwd_context.verify(key_value, db_key.hashed_key):
            if db_key.expires_at and db_key.expires_at < datetime.utcnow():
                db_key.is_active = False
                db.add(db_key)
                db.commit()
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API Key expired")
            return db_key
            
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or inactive API Key")


@app.post("/llm/chat/completions")
async def llm_proxy(
    request_body: Dict[str, Any],
    user_api_key: UserAPIKey = Depends(verify_user_api_key),
    db: Session = Depends(get_db)
):
    """
    Proxies LLM requests, enforcing user quotas and access policies.
    Expects 'model' and 'provider' in the request_body for routing and policy checks.
    """
    user_id = user_api_key.user_id
    requested_model_name = request_body.get("model")
    # Assuming the client also sends a 'provider' in the request_body
    requested_provider = request_body.get("provider") 

    if not requested_model_name or not requested_provider:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="'model' and 'provider' must be specified in the request body")

    # Fetch user quota and model configuration
    user_quota = db.query(UserQuota).filter(UserQuota.user_id == user_id).first()
    if not user_quota:
        # Create a default quota for new users if not exists
        user_quota = UserQuota(user_id=user_id)
        db.add(user_quota)
        db.commit()
        db.refresh(user_quota)

    # Policy Enforcement: Check allowed providers/models
    allowed_providers = [p.strip() for p in user_quota.allowed_providers.split(',') if p.strip()]
    allowed_models = [m.strip() for m in user_quota.allowed_models.split(',') if m.strip()]

    if allowed_providers and requested_provider not in allowed_providers:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Access to provider '{requested_provider}' is not allowed for this user.")
    if allowed_models and requested_model_name not in allowed_models:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Access to model '{requested_model_name}' is not allowed for this user.")

    # Find the master model configuration (which contains the actual API key and URL)
    master_model_config = db.query(DBModel).filter(
        DBModel.model_name == requested_model_name,
        DBModel.provider == requested_provider,
        DBModel.api_url.isnot(None),
        DBModel.api_key.isnot(None)
    ).first()

    if not master_model_config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Model '{requested_model_name}' from provider '{requested_provider}' not configured.")

    # --- Rate Limiting (Basic, per minute) ---
    # This is a very basic in-memory rate limit for demonstration.
    # For production, consider Redis or a dedicated rate-limiting library.
    # We'll use the DB for persistent tracking.

    # Update daily/monthly resets if needed
    now = datetime.utcnow()
    if (now - user_quota.last_reset_daily).days >= 1:
        user_quota.current_daily_tokens = 0
        user_quota.last_reset_daily = now
    if (now - user_quota.last_reset_monthly).days >= 30: # Simple monthly reset
        user_quota.current_monthly_tokens = 0
        user_quota.last_reset_monthly = now
    db.add(user_quota) # Commit reset changes
    db.commit()
    db.refresh(user_quota)


    # For simplicity, token calculation is external to this proxy for now,
    # or will be estimated. A real LLM gateway would parse the response
    # to get exact token counts. Here we just log a request.
    estimated_tokens_used = 1 # Placeholder: replace with actual token estimation/counting

    # Check limits BEFORE making the external call
    if user_quota.total_tokens_limit > 0 and (user_quota.current_total_tokens + estimated_tokens_used > user_quota.total_tokens_limit):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Total token quota exceeded")
    if user_quota.daily_tokens_limit > 0 and (user_quota.current_daily_tokens + estimated_tokens_used > user_quota.daily_tokens_limit):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Daily token quota exceeded")
    if user_quota.monthly_tokens_limit > 0 and (user_quota.current_monthly_tokens + estimated_tokens_used > user_quota.monthly_tokens_limit):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Monthly token quota exceeded")

    # Placeholder for actual LLM API call
    headers = {"Authorization": f"Bearer {master_model_config.api_key}"}
    async with httpx.AsyncClient() as client:
        try:
            llm_response = await client.post(master_model_config.api_url, json=request_body, headers=headers, timeout=60.0)
            llm_response.raise_for_status()
            
            # Extract token usage from LLM response if possible, otherwise use estimation
            # This is highly dependent on the LLM provider's API response structure
            # Example for OpenAI:
            # usage = llm_response.json().get("usage")
            # if usage:
            #     prompt_tokens = usage.get("prompt_tokens", 0)
            #     completion_tokens = usage.get("completion_tokens", 0)
            #     estimated_tokens_used = prompt_tokens + completion_tokens
            # else:
            #     estimated_tokens_used = 1 # Fallback estimation

            # Update usage in DB (after successful call)
            user_quota.current_total_tokens += estimated_tokens_used
            user_quota.current_daily_tokens += estimated_tokens_used
            user_quota.current_monthly_tokens += estimated_tokens_used
            
            # Log usage
            usage_log = UsageLog(
                user_id=user_id,
                user_api_key_id=user_api_key.id,
                model_name=requested_model_name,
                provider=requested_provider,
                tokens_used=estimated_tokens_used,
                request_count=1
            )
            db.add(user_quota)
            db.add(usage_log)
            db.commit()
            db.refresh(user_quota)
            db.refresh(usage_log)

            # --- Alerting System (Simple print for now) ---
            if user_quota.total_tokens_limit > 0 and user_quota.current_total_tokens >= user_quota.total_tokens_limit * 0.8:
                print(f"ALERT: User {user_id} reaching total token limit: {user_quota.current_total_tokens}/{user_quota.total_tokens_limit}")
            if user_quota.current_total_tokens >= user_quota.total_tokens_limit:
                print(f"ALERT: User {user_id} exceeded total token limit!")

            return llm_response.json()

        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"LLM Provider error: {e.response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to connect to LLM provider: {e}")


@admin_router.get("/models", response_model=List[ModelResponse], dependencies=[Depends(verify_admin_role)])
def get_models(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    """
    Fetches models from the database.
    - If the user has created any models, it returns only those.
    - If the user has not created any models, it returns all public models.
    """
    # 1. Check for models created by the current user
    user_models = db.query(DBModel).filter(DBModel.creator_id == user_id).all()

    if user_models:
        return user_models

    # 2. If no user-specific models, return all public models
    public_models = db.query(DBModel).filter(DBModel.is_public == True).all()
    return public_models

@admin_router.post("/models/create", response_model=ModelResponse, dependencies=[Depends(verify_admin_role)])
def create_model(model: ModelCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    """
    Creates a new language model in the database.
    """
    try:
        # NOTE: In a production environment, master API keys should be encrypted at rest,
        # not hashed. For this demonstration, we store it directly for simplicity.
        # A robust solution would involve a secure encryption/decryption mechanism.
        db_model = DBModel(
            model_name=model.model_name,
            provider=model.provider,
            creator_id=user_id,
            is_public=model.is_public,
            api_url=model.api_url,
            api_key=model.api_key # Store plaintext for direct use in proxy (encrypt in production!)
        )
        db.add(db_model)
        db.commit()
        db.refresh(db_model)
        
        # Always strip the API key from the response for security
        db_model.api_key = None 
        return db_model
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create model: {e}"
        )

# --- Admin Quota Management ---
@admin_router.get("/quotas", response_model=List[UserQuotaResponse], dependencies=[Depends(verify_admin_role)])
def get_all_user_quotas(db: Session = Depends(get_db)):
    """Retrieve all user quotas."""
    return db.query(UserQuota).all()

@admin_router.get("/quotas/{user_id}", response_model=UserQuotaResponse, dependencies=[Depends(verify_admin_role)])
def get_user_quota(user_id: str, db: Session = Depends(get_db)):
    """Retrieve a specific user's quota."""
    quota = db.query(UserQuota).filter(UserQuota.user_id == user_id).first()
    if not quota:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User quota not found")
    return quota

@admin_router.post("/quotas/{user_id}", response_model=UserQuotaResponse, dependencies=[Depends(verify_admin_role)])
def create_or_update_user_quota(user_id: str, quota_settings: QuotaSettings, db: Session = Depends(get_db)):
    """Create or update a user's quota settings."""
    quota = db.query(UserQuota).filter(UserQuota.user_id == user_id).first()
    if quota:
        for field, value in quota_settings.dict(exclude_unset=True).items():
            setattr(quota, field, value)
    else:
        quota = UserQuota(user_id=user_id, **quota_settings.dict())
    
    db.add(quota)
    db.commit()
    db.refresh(quota)
    return quota

@admin_router.put("/quotas/{user_id}", response_model=UserQuotaResponse, dependencies=[Depends(verify_admin_role)])
def update_user_quota(user_id: str, quota_update: QuotaUpdate, db: Session = Depends(get_db)):
    """Update a user's quota settings."""
    quota = db.query(UserQuota).filter(UserQuota.user_id == user_id).first()
    if not quota:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User quota not found")
    
    for field, value in quota_update.dict(exclude_unset=True).items():
        setattr(quota, field, value)
    
    db.add(quota)
    db.commit()
    db.refresh(quota)
    return quota

@admin_router.delete("/quotas/{user_id}", dependencies=[Depends(verify_admin_role)])
def delete_user_quota(user_id: str, db: Session = Depends(get_db)):
    """Delete a user's quota."""
    quota = db.query(UserQuota).filter(UserQuota.user_id == user_id).first()
    if not quota:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User quota not found")
    
    db.delete(quota)
    db.commit()
    return {"message": "User quota deleted successfully"}

# --- Admin Usage Logs ---
@admin_router.get("/usage-logs", response_model=List[UsageLogResponse], dependencies=[Depends(verify_admin_role)])
def get_all_usage_logs(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    """Retrieve all usage logs."""
    return db.query(UsageLog).offset(skip).limit(limit).all()

@admin_router.get("/usage-logs/{user_id}", response_model=List[UsageLogResponse], dependencies=[Depends(verify_admin_role)])
def get_user_usage_logs(user_id: str, db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    """Retrieve usage logs for a specific user."""
    return db.query(UsageLog).filter(UsageLog.user_id == user_id).offset(skip).limit(limit).all()

# --- Include the admin and user routers in the main app ---
app.include_router(admin_router)
app.include_router(user_router)

@app.get("/")
def read_root():
    return {"message": "Backend is running"}

# --- User Management Endpoints ---
async def get_user_roles(admin_token: str, user_id: str) -> List[str]:
    """Helper function to get realm roles for a specific user."""
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        try:
            response = await client.get(
                f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}/role-mappings/realm",
                headers=headers,
            )
            response.raise_for_status()
            roles_data = response.json()
            return [role.get("name", "") for role in roles_data]
        except (httpx.HTTPStatusError, httpx.RequestError):
            return []

async def get_user_groups(user_id: str, admin_token: str) -> List[str]:
    """Helper function to get group names for a user."""
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        try:
            response = await client.get(
                f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}/groups",
                headers=headers
            )
            response.raise_for_status()
            groups = response.json()
            # Return a list of group names
            return [group.get("name", "") for group in groups]
        except (httpx.HTTPStatusError, httpx.RequestError):
            # If fetching groups fails, return an empty list
            # to avoid breaking the main user list retrieval.
            return []

@admin_router.get("/users", response_model=List[Dict[str, Any]], dependencies=[Depends(verify_admin_role)])
async def get_users():
    """Get all users from Keycloak, including their groups and roles."""
    admin_token = await get_admin_token()
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        try:
            response = await client.get(f"{KEYCLOAK_URL}/admin/realms/{REALM}/users", headers=headers)
            response.raise_for_status()
            users_from_keycloak = response.json()

            enriched_users = []
            for user_data in users_from_keycloak:
                user_id = user_data["id"]
                # Fetch groups and roles for each user
                groups = await get_user_groups(user_id, admin_token)
                roles = await get_user_roles(admin_token, user_id)
                
                user_data["groups"] = groups
                user_data["roles"] = roles
                enriched_users.append(user_data)

            return enriched_users
        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch users from Keycloak: {str(e)}")

@admin_router.post("/users/create", dependencies=[Depends(verify_admin_role)])
async def create_user(user_data: UserCreate):
    """Create a new user in Keycloak."""
    payload = {
        "username": user_data.username,
        "email": user_data.email,
        "firstName": user_data.firstName,
        "lastName": user_data.lastName,
        "enabled": True,
        "credentials": [{"type": "password", "value": user_data.password, "temporary": False}],
    }
    admin_token = await get_admin_token()
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        response = await client.post(f"{KEYCLOAK_URL}/admin/realms/{REALM}/users", headers=headers, json=payload)
        if response.status_code == 201:
            return {"message": "User created successfully."}
        else:
            raise HTTPException(status_code=response.status_code, detail=response.json())

@admin_router.put("/users/{user_id}", dependencies=[Depends(verify_admin_role)])
async def update_user(user_id: str, user_data: UserUpdate):
    payload = user_data.dict(exclude_unset=True)
    admin_token = await get_admin_token()
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        response = await client.put(f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}", headers=headers, json=payload)
        if response.status_code == 204:
            return {"message": "User updated successfully."}
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to update user.")

@admin_router.put("/users/{user_id}/status", dependencies=[Depends(verify_admin_role)])
async def update_user_status(user_id: str, status_data: UserStatusUpdate):
    """Updates a user's enabled status in Keycloak."""
    payload = {"enabled": status_data.enabled}
    admin_token = await get_admin_token()
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        response = await client.put(f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}", headers=headers, json=payload)
        if response.status_code == 204:
            return {"message": "User status updated successfully."}
        raise HTTPException(status_code=response.status_code, detail="Failed to update user status.")

@admin_router.delete("/users/{user_id}", dependencies=[Depends(verify_admin_role)])
async def delete_user(user_id: str):
    admin_token = await get_admin_token()
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await client.delete(f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}", headers=headers)
        if response.status_code == 204:
            return {"message": "User deleted successfully."}
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to delete user.")

# --- Group Management Endpoints ---
@admin_router.get("/groups", response_model=List[Dict[str, Any]], dependencies=[Depends(verify_admin_role)])
async def get_groups():
    admin_token = await get_admin_token()
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await client.get(f"{KEYCLOAK_URL}/admin/realms/{REALM}/groups", headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch groups from Keycloak.")
        return response.json()

@admin_router.post("/groups/create", dependencies=[Depends(verify_admin_role)])
async def create_group(group_data: GroupCreate):
    admin_token = await get_admin_token()
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        response = await client.post(f"{KEYCLOAK_URL}/admin/realms/{REALM}/groups", headers=headers, json=group_data.dict())
        if response.status_code == 201:
            return {"message": "Group created successfully."}
        else:
            raise HTTPException(status_code=response.status_code, detail=response.json())

@admin_router.put("/groups/{group_id}", dependencies=[Depends(verify_admin_role)])
async def update_group(group_id: str, group_data: GroupUpdate):
    admin_token = await get_admin_token()
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        response = await client.put(f"{KEYCLOAK_URL}/admin/realms/{REALM}/groups/{group_id}", headers=headers, json=group_data.dict())
        if response.status_code == 204:
            return {"message": "Group updated successfully."}
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to update group.")

@admin_router.delete("/groups/{group_id}", dependencies=[Depends(verify_admin_role)])
async def delete_group(group_id: str):
    admin_token = await get_admin_token()
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await client.delete(f"{KEYCLOAK_URL}/admin/realms/{REALM}/groups/{group_id}", headers=headers)
        if response.status_code == 204:
            return {"message": "Group deleted successfully."}
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to delete group.")

@admin_router.get("/groups/{group_id}/members", response_model=List[Dict[str, Any]], dependencies=[Depends(verify_admin_role)])
async def get_group_members(group_id: str):
    admin_token = await get_admin_token()
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await client.get(f"{KEYCLOAK_URL}/admin/realms/{REALM}/groups/{group_id}/members", headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch group members.")
        return response.json()

@admin_router.post("/groups/{group_id}/members", dependencies=[Depends(verify_admin_role)])
async def add_group_members(group_id: str, member_data: Dict[str, List[str]]):
    admin_token = await get_admin_token()
    user_id = member_data.get("user_id") # Assuming the frontend sends a user_id
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required.")
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        # Keycloak adds a user to a group via the user's endpoint, not the group's
        response = await client.put(f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}/groups/{group_id}", headers=headers)
        if response.status_code == 204:
            return {"message": "User added to group successfully."}
        raise HTTPException(status_code=response.status_code, detail="Failed to add user to group.")

# --- Role Management Endpoints ---
@admin_router.get("/roles", response_model=List[Dict[str, Any]], dependencies=[Depends(verify_admin_role)])
async def get_roles():
    admin_token = await get_admin_token()
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await client.get(f"{KEYCLOAK_URL}/admin/realms/{REALM}/roles", headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch roles from Keycloak.")
        return response.json()

@admin_router.post("/roles/create", dependencies=[Depends(verify_admin_role)])
async def create_role(role_data: RoleCreate):
    admin_token = await get_admin_token()
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        response = await client.post(f"{KEYCLOAK_URL}/admin/realms/{REALM}/roles", headers=headers, json=role_data.dict())
        if response.status_code == 201:
            return {"message": "Role created successfully."}
        else:
            raise HTTPException(status_code=response.status_code, detail=response.json())

@admin_router.put("/roles/{role_name}", dependencies=[Depends(verify_admin_role)])
async def update_role(role_name: str, role_data: RoleUpdate):
    admin_token = await get_admin_token()
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        # Keycloak updates roles by name
        response = await client.put(f"{KEYCLOAK_URL}/admin/realms/{REALM}/roles/{role_name}", headers=headers, json=role_data.dict())
        if response.status_code == 204:
            return {"message": "Role updated successfully."}
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to update role.")

@admin_router.delete("/roles/{role_name}", dependencies=[Depends(verify_admin_role)])
async def delete_role(role_name: str):
    admin_token = await get_admin_token()
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await client.delete(f"{KEYCLOAK_URL}/admin/realms/{REALM}/roles/{role_name}", headers=headers)
        if response.status_code == 204:
            return {"message": "Role deleted successfully."}
        else:
            raise HTTPException(status_code=response.status_code, detail="Failed to delete role.")

# --- Include the admin router in the main app ---
app.include_router(admin_router)
app.include_router(user_router)

@app.get("/")
def read_root():
    return {"message": "Backend is running"}
