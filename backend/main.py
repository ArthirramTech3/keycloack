from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from keycloak import KeycloakOpenID
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr
from typing import Dict, Any, List, Optional
 
import uvicorn
from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
import os
import httpx
import json 
from datetime import datetime

load_dotenv()

# --- Pydantic Models ---
class UserCreate(BaseModel):
    username: str
    password: str
    email: EmailStr
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    groupId: Optional[str] = None 
    status: Optional[str] = "Active"

class UserUpdate(BaseModel):
    # Used for full user update (PUT)
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    enabled: Optional[bool] = None

class UserStatusUpdate(BaseModel):
    enabled: bool

class Group(BaseModel):
    id: str
    name: str

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    
class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None

class AddMembers(BaseModel):
    member_usernames: List[str]
    
class LoginCredentials(BaseModel):
    username: str
    password: str

# --- Database Configuration ---
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("WARNING: DATABASE_URL not set in environment. Using in-memory SQLite for testing.")
    DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Database Model ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)

Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CORS Middleware ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency to get DB session ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Keycloak Configuration ---
KEYCLOAK_SERVER_URL = "http://localhost:8080"
KEYCLOAK_REALM = "cybersecurity-realm"
KEYCLOAK_CLIENT_ID = "cybersecurity-frontend"
KEYCLOAK_ADMIN_USERNAME = os.getenv("KEYCLOAK_ADMIN_USERNAME", "admin")
KEYCLOAK_ADMIN_PASSWORD = os.getenv("KEYCLOAK_ADMIN_PASSWORD", "admin")

# Initialize Keycloak client
keycloak_openid = KeycloakOpenID(
    server_url=KEYCLOAK_SERVER_URL,
    client_id=KEYCLOAK_CLIENT_ID,
    realm_name=KEYCLOAK_REALM,
)

# --- JWT Token Verification ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_keycloak_public_key():
    # Cache this key for better performance in a real app
    return (
        "-----BEGIN PUBLIC KEY-----\n"
        f"{keycloak_openid.public_key()}"
        "\n-----END PUBLIC KEY-----"
    )

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        public_key = get_keycloak_public_key()
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=KEYCLOAK_CLIENT_ID, # Ensure audience matches
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def verify_admin_role(current_user: dict = Depends(get_current_user)):
    """Verify that the current user has admin role"""
    realm_access = current_user.get("realm_access", {})
    roles = realm_access.get("roles", [])
    
    if "admin" not in roles:
        raise HTTPException(
            status_code=403,
            detail="Access denied. Admin role required."
        )
    
    return current_user

async def get_admin_token():
    """Get admin access token from Keycloak using admin credentials (Master Realm)"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{KEYCLOAK_SERVER_URL}/realms/master/protocol/openid-connect/token", 
                data={
                    "grant_type": "password",
                    "client_id": "admin-cli", 
                    "username": KEYCLOAK_ADMIN_USERNAME,
                    "password": KEYCLOAK_ADMIN_PASSWORD
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=10.0
            )
            
            if response.status_code != 200:
                print(f"Failed to get admin token: {response.text}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to authenticate with Keycloak admin. Check credentials. HTTP: {response.status_code}"
                )
            
            return response.json()["access_token"]
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error connecting to Keycloak Master Realm: {str(e)}"
        )

# --- UTILITY FUNCTIONS for Keycloak API Calls ---
async def fetch_keycloak_data(url: str, admin_token: str) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
            timeout=10.0
        )
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            raise HTTPException(status_code=404, detail="Resource not found in Keycloak.")
        else:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to fetch data from Keycloak. HTTP {response.status_code}: {response.text}"
            )
            
# --- ENDPOINTS (User/Auth) ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the Cybersecurity Backend API!"}

@app.get("/protected")
async def read_protected_data(
    current_user: dict = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    username = current_user.get('preferred_username')
    email = current_user.get('email')

    db_user = db.query(User).filter(User.username == username).first()

    if not db_user:
        new_user = User(username=username, email=email)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    return {
        "message": f"Hello, {username}! This is protected data.",
        "user_info": {
            "username": username,
            "email": email,
            "roles": current_user.get("realm_access", {}).get("roles", [])
        }
    }
    
@app.get("/admin/me")
async def get_admin_info(current_user: dict = Depends(get_current_user)):
    """
    Get current user info
    """
    return {
        "username": current_user.get("preferred_username"),
        "email": current_user.get("email"),
        "roles": current_user.get("realm_access", {}).get("roles", []),
        "name": current_user.get("name"),
        "sub": current_user.get("sub")
    }

# --- USER MANAGEMENT ENDPOINTS ---

@app.get("/admin/users", response_model=List[Dict[str, Any]])
async def get_all_users(
    current_user: dict = Depends(verify_admin_role)
):
    """
    Get all users from Keycloak and their associated group/role info (Admin only).
    """
    admin_token = await get_admin_token()
    
    # 1. Get ALL users
    users_data = await fetch_keycloak_data(
        f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/users", admin_token
    )
    
    # 2. Get ALL groups to map user groups
    groups_data = await fetch_keycloak_data(
        f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/groups", admin_token
    )
    group_map = {group["id"]: group["name"] for group in groups_data}
    
    # 3. Format output
    formatted_users = []
    async with httpx.AsyncClient() as client:
        for user in users_data:
            user_id = user.get("id")
            
            # Fetch groups for the user
            groups_response = await client.get(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}/groups",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            groups = groups_response.json() if groups_response.status_code == 200 else []
            
            # Fetch realm roles for the user
            roles_response = await client.get(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}/role-mappings/realm",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            roles = roles_response.json() if roles_response.status_code == 200 else []
            
            createdBy = user.get("attributes", {}).get("createdBy", [current_user.get("preferred_username")])[0] 

            formatted_users.append({
                "id": user_id,
                "username": user.get("username"),
                "email": user.get("email"),
                "firstName": user.get("firstName"),
                "lastName": user.get("lastName"),
                "enabled": user.get("enabled", False),
                "addedGroups": ", ".join([group_map.get(g["id"], g["name"]) for g in groups]),
                "roles": ", ".join([r["name"] for r in roles]),
                "createdTimestamp": user.get("createdTimestamp"),
                "createdBy": createdBy
            })
            
    return formatted_users

@app.get("/admin/users/{user_id}")
async def get_user_by_id(
    user_id: str,
    current_user: dict = Depends(verify_admin_role)
) -> Dict[str, Any]:
    try:
        admin_token = await get_admin_token()
        
        async with httpx.AsyncClient() as client:
            # Get user details
            response = await client.get(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}",
                headers={
                    "Authorization": f"Bearer {admin_token}",
                    "Content-Type": "application/json"
                },
                timeout=10.0
            )
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="User not found")
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to fetch user: {response.text}"
                )
            
            user = response.json()
            
            # Get user's roles
            roles_response = await client.get(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}/role-mappings/realm",
                headers={
                    "Authorization": f"Bearer {admin_token}",
                    "Content-Type": "application/json"
                },
                timeout=10.0
            )
            
            role_names = []
            if roles_response.status_code == 200:
                user_roles = roles_response.json()
                role_names = [role["name"] for role in user_roles]
            
            return {
                "id": user.get("id"),
                "username": user.get("username"),
                "email": user.get("email"),
                "firstName": user.get("firstName"),
                "lastName": user.get("lastName"),
                "enabled": user.get("enabled", False),
                "emailVerified": user.get("emailVerified", False),
                "createdTimestamp": user.get("createdTimestamp"),
                "roles": role_names
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching user: {str(e)}"
        )


@app.post("/admin/users/create")
async def create_user_with_group(
    user_data: UserCreate,
    current_user: dict = Depends(verify_admin_role)
):
    """
    Creates a user in Keycloak and optionally assigns them to a group (Admin only).
    """
    try:
        admin_token = await get_admin_token()
        
        # 1. Construct Keycloak user object
        kc_user = {
            "username": user_data.username,
            "email": user_data.email,
            "firstName": user_data.firstName,
            "lastName": user_data.lastName,
            "enabled": user_data.status == "Active",
            "attributes": {
                "createdBy": [current_user.get("preferred_username")]
            },
            "credentials": [
                {
                    "type": "password",
                    "value": user_data.password,
                    "temporary": False
                }
            ]
        }
        
        async with httpx.AsyncClient() as client:
            # 2. Create the user
            create_response = await client.post(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/users",
                headers={
                    "Authorization": f"Bearer {admin_token}",
                    "Content-Type": "application/json"
                },
                json=kc_user,
                timeout=10.0
            )
            
            if create_response.status_code == 409:
                 raise HTTPException(status_code=409, detail="User with this username or email already exists in Keycloak.")
            
            if create_response.status_code != 201:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to create user in Keycloak. HTTP {create_response.status_code}: {create_response.text}"
                )

            location_url = create_response.headers.get("Location")
            if not location_url:
                 raise HTTPException(status_code=500, detail="Keycloak did not return the location of the new user.")
                 
            user_id = location_url.split("/")[-1]

            # 3. Assign user to group (if groupId is provided)
            if user_data.groupId:
                group_response = await client.put(
                    f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}/groups/{user_data.groupId}",
                    headers={"Authorization": f"Bearer {admin_token}"},
                    timeout=10.0
                )

                if group_response.status_code not in [204, 200]:
                    print(f"Warning: Failed to assign user {user_id} to group {user_data.groupId}. Status: {group_response.status_code}")

            return {"message": "User created and group assigned successfully", "user_id": user_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during user creation: {str(e)}"
        )


@app.put("/admin/users/{user_id}")
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: dict = Depends(verify_admin_role)
):
    """
    Updates an existing user in Keycloak (Admin only).
    """
    try:
        admin_token = await get_admin_token()

        # 1. Get current user data from Keycloak to ensure we don't overwrite required fields
        async with httpx.AsyncClient() as client:
            get_response = await client.get(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=5.0
            )
            if get_response.status_code == 404:
                raise HTTPException(status_code=404, detail="User not found in Keycloak.")
            if get_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch user before update.")

            existing_user = get_response.json()

            # 2. Merge existing data with new data, excluding unset fields
            update_data = user_data.model_dump(exclude_unset=True) 
            
            updated_payload = {**existing_user, **update_data}

            # 3. Send the PUT request to Keycloak
            update_response = await client.put(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}",
                headers={
                    "Authorization": f"Bearer {admin_token}",
                    "Content-Type": "application/json"
                },
                json=updated_payload,
                timeout=10.0
            )

            if update_response.status_code == 409:
                raise HTTPException(status_code=409, detail="Update failed: Username or email already exists.")
            
            if update_response.status_code not in [204, 200]:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to update user in Keycloak. HTTP {update_response.status_code}: {update_response.text}"
                )

            return {"message": f"User {user_id} updated successfully."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during user update: {str(e)}"
        )


@app.put("/admin/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    status_update: UserStatusUpdate,
    current_user: dict = Depends(verify_admin_role)
):
    """
    Updates only the enabled status of a user in Keycloak (Admin only).
    """
    try:
        admin_token = await get_admin_token()
        
        async with httpx.AsyncClient() as client:
            # PUT to update the user with only the enabled field
            update_response = await client.put(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}",
                headers={
                    "Authorization": f"Bearer {admin_token}",
                    "Content-Type": "application/json"
                },
                json={"enabled": status_update.enabled},
                timeout=10.0
            )

            if update_response.status_code not in [204, 200]:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to update user status in Keycloak. HTTP {update_response.status_code}: {update_response.text}"
                )

            return {"message": f"User {user_id} status updated to {status_update.enabled}."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during user status update: {str(e)}"
        )


@app.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(verify_admin_role)
):
    """
    Deletes a user from Keycloak (Admin only).
    """
    try:
        admin_token = await get_admin_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=10.0
            )

            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="User not found in Keycloak.")

            if response.status_code not in [204]: # Keycloak typically returns 204 No Content for success
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to delete user in Keycloak. HTTP {response.status_code}: {response.text}"
                )

            return {"message": f"User {user_id} deleted successfully."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during user deletion: {str(e)}"
        )


# --- GROUP MANAGEMENT ENDPOINTS ---

@app.get("/admin/groups", response_model=List[Dict[str, Any]])
async def get_all_groups(
    current_user: dict = Depends(verify_admin_role)
):
    """
    Get all groups from Keycloak with member count and description (Admin only).
    """
    admin_token = await get_admin_token()
    groups_data = await fetch_keycloak_data(
        f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/groups", admin_token
    )
    
    formatted_groups = []
    async with httpx.AsyncClient() as client:
        for group in groups_data:
            group_id = group["id"]
            
            # Fetch group details to get description and members count
            detail_response = await client.get(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/groups/{group_id}",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            
            member_count = 0
            description = ""
            if detail_response.status_code == 200:
                detail = detail_response.json()
                # Fetch members list to get accurate count
                members_response = await client.get(
                    f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/groups/{group_id}/members",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                if members_response.status_code == 200:
                    member_count = len(members_response.json())
                
                description = detail.get("attributes", {}).get("description", [""])[0]
            
            formatted_groups.append({
                "id": group_id,
                "name": group.get("name"),
                "memberCount": member_count,
                "description": description,
                "path": group.get("path"),
                "createdBy": "Admin/System" 
            })
            
    return formatted_groups

@app.post("/admin/groups/create")
async def create_group(
    group_data: GroupCreate,
    current_user: dict = Depends(verify_admin_role)
):
    """
    Creates a new group in Keycloak and sets its description (Admin only).
    """
    try:
        admin_token = await get_admin_token()
        
        async with httpx.AsyncClient() as client:
            # 1. Create the Group
            create_response = await client.post(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/groups",
                headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
                json={"name": group_data.name},
                timeout=10.0
            )
            
            if create_response.status_code == 409:
                raise HTTPException(status_code=409, detail="Group with this name already exists.")
            
            if create_response.status_code != 201:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to create group in Keycloak. HTTP {create_response.status_code}: {create_response.text}"
                )
            
            location_url = create_response.headers.get("Location")
            group_id = location_url.split("/")[-1]

            # 2. Set description attribute (Optional)
            if group_data.description:
                # Keycloak PUT is used to update details including attributes
                await client.put(
                    f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/groups/{group_id}",
                    headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
                    json={"attributes": {"description": [group_data.description]}},
                    timeout=5.0
                )
            
            return {"message": f"Group '{group_data.name}' created successfully.", "group_id": group_id}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during group creation: {str(e)}"
        )


@app.put("/admin/groups/{group_id}")
async def update_group(
    group_id: str,
    group_data: GroupCreate, 
    current_user: dict = Depends(verify_admin_role)
):
    """
    Updates an existing group's name and/or description (Admin only).
    """
    try:
        admin_token = await get_admin_token()
        
        update_payload = {
            "name": group_data.name,
            "attributes": {
                "description": [group_data.description or ""] 
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/groups/{group_id}",
                headers={
                    "Authorization": f"Bearer {admin_token}",
                    "Content-Type": "application/json"
                },
                json=update_payload,
                timeout=10.0
            )
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Group not found.")
            if response.status_code == 409:
                raise HTTPException(status_code=409, detail=f"Group with name '{group_data.name}' already exists.")
                
            if response.status_code not in [204, 200]:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to update group in Keycloak. HTTP {response.status_code}: {response.text}"
                )

            return {"message": f"Group '{group_data.name}' updated successfully."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during group update: {str(e)}"
        )


@app.delete("/admin/groups/{group_id}")
async def delete_group(
    group_id: str,
    current_user: dict = Depends(verify_admin_role)
):
    """
    Deletes a group from Keycloak (Admin only).
    """
    try:
        admin_token = await get_admin_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/groups/{group_id}",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=10.0
            )

            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Group not found.")
                
            if response.status_code not in [204]:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to delete group in Keycloak. HTTP {response.status_code}: {response.text}"
                )

            return {"message": f"Group {group_id} deleted successfully."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during group deletion: {str(e)}"
        )


@app.get("/admin/groups/{group_id}/members")
async def get_group_members(
    group_id: str,
    current_user: dict = Depends(verify_admin_role)
) -> List[Dict[str, Any]]:
    """
    Gets members of a specific group (Admin only).
    """
    admin_token = await get_admin_token()
    
    members_data = await fetch_keycloak_data(
        f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/groups/{group_id}/members", admin_token
    )
    
    return [
        {"id": member["id"], "username": member["username"], "email": member.get("email")}
        for member in members_data
    ]

@app.post("/admin/groups/{group_id}/members")
async def add_members_to_group(
    group_id: str,
    members_data: AddMembers,
    current_user: dict = Depends(verify_admin_role)
):
    """
    Adds multiple users to a group. Requires member_usernames list (Admin only).
    """
    admin_token = await get_admin_token()
    
    async with httpx.AsyncClient() as client:
        success_count = 0
        for username in members_data.member_usernames:
            try:
                # 1. Find the user ID by username
                users = await fetch_keycloak_data(
                    f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/users?username={username}", 
                    admin_token
                )
                if not users:
                    print(f"Warning: User {username} not found.")
                    continue
                
                user_id = users[0]["id"]
                
                # 2. Add user to the group
                response = await client.put(
                    f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}/groups/{group_id}",
                    headers={"Authorization": f"Bearer {admin_token}"},
                    timeout=5.0
                )
                
                if response.status_code in [204, 200]:
                    success_count += 1
                else:
                    print(f"Warning: Failed to add user {username} to group. HTTP {response.status_code}")

            except HTTPException as e:
                print(f"Error adding user {username}: {e.detail}")
            except Exception as e:
                print(f"Unexpected error adding user {username}: {str(e)}")
                
    if success_count == 0:
        raise HTTPException(status_code=400, detail="Failed to add any members. Check usernames or Keycloak connection.")

    return {"message": f"Successfully added {success_count} member(s) to group {group_id}."}


# --- ROLE MANAGEMENT ENDPOINTS ---

@app.get("/admin/roles", response_model=List[Dict[str, Any]])
async def get_all_realm_roles(
    current_user: dict = Depends(verify_admin_role)
) -> List[Dict[str, Any]]:
    """
    Gets all available realm roles from Keycloak with details and user count (Admin only).
    """
    try:
        admin_token = await get_admin_token()
        
        roles = await fetch_keycloak_data(
            f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/roles", admin_token
        )
        
        formatted_roles = []
        async with httpx.AsyncClient() as client:
            for role in roles:
                # Fetch the actual number of users who have this role
                user_count_response = await client.get(
                    f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/roles/{role['name']}/users",
                    headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
                    timeout=5.0
                )
                
                user_count = 0
                if user_count_response.status_code == 200:
                    user_count_data = user_count_response.json()
                    user_count = len(user_count_data)
                
                formatted_roles.append({
                    "id": role["id"],
                    "name": role["name"],
                    "description": role.get("description", "No description provided"),
                    "composite": role.get("composite", False),
                    "usersCount": user_count,
                    "status": True
                })
        return formatted_roles
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while fetching roles: {str(e)}"
        )


@app.post("/admin/roles/create")
async def create_realm_role(
    role_data: RoleCreate,
    current_user: dict = Depends(verify_admin_role)
):
    """
    Creates a new realm role in Keycloak (Admin only).
    """
    try:
        admin_token = await get_admin_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/roles",
                headers={
                    "Authorization": f"Bearer {admin_token}",
                    "Content-Type": "application/json"
                },
                json={"name": role_data.name, "description": role_data.description},
                timeout=10.0
            )
            
            if response.status_code == 409:
                raise HTTPException(status_code=409, detail="Role with this name already exists.")
            
            if response.status_code != 201:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to create role in Keycloak. HTTP {response.status_code}: {response.text}"
                )
            
            return {"message": f"Role '{role_data.name}' created successfully."}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during role creation: {str(e)}"
        )


@app.put("/admin/roles/{current_role_name}")
async def update_realm_role(
    current_role_name: str,
    role_data: RoleCreate, 
    current_user: dict = Depends(verify_admin_role)
):
    """
    Updates an existing realm role's name and/or description (Admin only).
    """
    try:
        admin_token = await get_admin_token()
        
        async with httpx.AsyncClient() as client:
            # 1. Fetch existing role details (needed to get the ID and other metadata)
            get_response = await client.get(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/roles/{current_role_name}",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=5.0
            )
            if get_response.status_code == 404:
                raise HTTPException(status_code=404, detail="Role not found.")
            if get_response.status_code != 200:
                 raise HTTPException(status_code=500, detail="Failed to fetch role before update.")
                 
            existing_role = get_response.json()
            
            # 2. Merge data for PUT payload
            updated_payload = {
                **existing_role,
                "name": role_data.name, # New name
                "description": role_data.description or existing_role.get("description", "")
            }

            # 3. Send the PUT request to Keycloak using the existing name in the path
            response = await client.put(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/roles/{current_role_name}",
                headers={
                    "Authorization": f"Bearer {admin_token}",
                    "Content-Type": "application/json"
                },
                json=updated_payload,
                timeout=10.0
            )

            if response.status_code == 409:
                raise HTTPException(status_code=409, detail=f"Role with new name '{role_data.name}' already exists.")
                
            if response.status_code not in [204, 200]:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to update role in Keycloak. HTTP {response.status_code}: {response.text}"
                )

            return {"message": f"Role '{current_role_name}' updated to '{role_data.name}' successfully."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during role update: {str(e)}"
        )


@app.delete("/admin/roles/{role_name}")
async def delete_realm_role(
    role_name: str,
    current_user: dict = Depends(verify_admin_role)
):
    """
    Deletes a realm role from Keycloak (Admin only).
    """
    try:
        admin_token = await get_admin_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/roles/{role_name}",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=10.0
            )

            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Role not found.")
                
            if response.status_code not in [204]:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to delete role in Keycloak. HTTP {response.status_code}: {response.text}"
                )

            return {"message": f"Role {role_name} deleted successfully."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during role deletion: {str(e)}"
        )


@app.post("/admin/groups/{group_id}/roles/assign")
async def assign_role_to_group(
    group_id: str,
    role_name: str, # Role name passed as a query parameter
    current_user: dict = Depends(verify_admin_role)
):
    """
    Assigns a realm role to a specific group (Admin only).
    """
    try:
        admin_token = await get_admin_token()
        
        async with httpx.AsyncClient() as client:
            # 1. Get the Role details (need the ID and name for the payload)
            role_response = await client.get(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/roles/{role_name}",
                headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
                timeout=5.0
            )
            
            if role_response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"Role '{role_name}' not found.")
            if role_response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Failed to fetch role details: {role_response.text}")

            role_details = role_response.json()
            
            # Keycloak uses a list containing the role object for assignment
            payload = [
                {
                    "id": role_details["id"],
                    "name": role_details["name"]
                }
            ]

            # 2. Assign the role to the group
            assign_response = await client.post(
                f"{KEYCLOAK_SERVER_URL}/admin/realms/{KEYCLOAK_REALM}/groups/{group_id}/role-mappings/realm",
                headers={
                    "Authorization": f"Bearer {admin_token}",
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=10.0
            )

            if assign_response.status_code in [204]:
                return {"message": f"Role '{role_name}' assigned to group {group_id} successfully."}
            else:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to assign role. HTTP {assign_response.status_code}: {assign_response.text}"
                )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during role assignment: {str(e)}"
        )

# --- Custom Login Endpoint ---
@app.post("/custom-login")
async def custom_login(credentials: LoginCredentials):
    """
    Authenticates a user against Keycloak using Resource Owner Password Credentials (ROPC) flow.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{KEYCLOAK_SERVER_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token",
                data={
                    "grant_type": "password",
                    "client_id": KEYCLOAK_CLIENT_ID,
                    "username": credentials.username,
                    "password": credentials.password,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=10.0
            )

            if response.status_code == 200:
                token_data = response.json()
                return {
                    "access_token": token_data["access_token"],
                    "refresh_token": token_data.get("refresh_token"),
                    "expires_in": token_data["expires_in"],
                    "token_type": token_data["token_type"],
                }

            if response.status_code == 401:
                error_detail = response.json().get("error_description", "Invalid credentials")
                raise HTTPException(status_code=401, detail=error_detail)

            raise HTTPException(
                status_code=500,
                detail=f"Keycloak authentication failed: HTTP {response.status_code} {response.text}"
            )

    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error connecting to Keycloak server: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)