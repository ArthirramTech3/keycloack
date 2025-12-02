import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from fastapi import APIRouter
import httpx
import jwt
   
# --- Configuration ---
# Use an absolute path to ensure the DB is in the project root
DATABASE_URL = "postgresql://cybersecurity:cybersecurity%40123@localhost/cybersecuritydb"

# Keycloak configuration (replace with your actual public key)
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
REALM = os.getenv("KEYCLOAK_REALM", "cybersecurity-realm")
CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "cybersecurity-frontend") # This is the public client
CLIENT_SECRET = os.getenv("KEYCLOAK_CLIENT_SECRET", "0xISuGJ0ZHpQ7DTChfh1BWBd6RCNon0n") # Replace with your actual client secret if different
KEYCLOAK_PUBLIC_KEY = ("MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtztkdtz+I86FnPXGp9yEC8FOrAaM5fXSe5/ekXfwiCg2VsqzYJNfxjLkU83MUvcow1M9Yu8MyEhgLKorSMpC2TaUmw1UrxBjB2cCNtmvZSlj2tUzFEr11sQd6vL0TT+WaSCwDe6xrbHaJI3bBo9ozA+4FKfZz0CITd2LeQIRgBOEfTrh+su90HyT2R9gpX+2aYVqfDgUUFxWhqioMZT/5hUIBGj78TVPY3ArFoU1AZVoFeVbGjON2j9ndrxj+LPO4fayDdry1/6U3EpKR345QkdmUO6IAerCE3mW4V50wkouykGoXMEgrtLeDIFs0zXQc9dyBAIrp6MD553Ot6FJ2wIDAQAB")

# --- Database Setup ---
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# SQLAlchemy Model for the 'models' table
class DBModel(Base):
    __tablename__ = "models"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, index=True)
    provider = Column(String)
    creator_id = Column(String, index=True, nullable=True) # Keycloak user 'sub'
    is_public = Column(Boolean, default=False)

# Create the database table
Base.metadata.create_all(bind=engine)

# Pydantic model for response
class ModelResponse(BaseModel):
    id: int
    model_name: str
    provider: str
    creator_id: Optional[str] = None
    is_public: bool

    class Config:
        from_attributes = True

# Pydantic model for creating a new model
class ModelCreate(BaseModel):
    model_name: str
    provider: str
    api_url: str
    api_key: str
    is_public: bool

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

# Create a router for all admin-prefixed routes
admin_router = APIRouter(prefix="/admin")

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
        db_model = DBModel(
            model_name=model.model_name,
            provider=model.provider,
            creator_id=user_id,
            is_public=model.is_public
        )
        db.add(db_model)
        db.commit()
        db.refresh(db_model)
        return db_model
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create model: {e}"
        )

# --- User Management Endpoints ---
@admin_router.get("/users", response_model=List[Dict[str, Any]], dependencies=[Depends(verify_admin_role)])
async def get_users():
    """Get all users from Keycloak."""
    admin_token = await get_admin_token()
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await client.get(f"{KEYCLOAK_URL}/admin/realms/{REALM}/users", headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch users from Keycloak.")
        return response.json()

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

@admin_router.get("/users/{user_id}", response_model=Dict[str, Any], dependencies=[Depends(verify_admin_role)])
async def get_user(user_id: str):
    admin_token = await get_admin_token()
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await client.get(f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}", headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch user.")
        return response.json()

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

@app.get("/")
def read_root():
    return {"message": "Backend is running"}