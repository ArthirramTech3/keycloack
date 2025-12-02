from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import os
from typing import List, Dict, Any

router = APIRouter(prefix="/admin", tags=["admin"])
security = HTTPBearer()

# Keycloak configuration
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
REALM = os.getenv("KEYCLOAK_REALM", "cybersecurity-realm")
CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "cybersecurity-frontend")
CLIENT_SECRET = os.getenv("KEYCLOAK_CLIENT_SECRET", "0xISuGJ0ZHpQ7DTChfh1BWBd6RCNon0n")

async def verify_admin_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify the JWT token and check if user has admin role"""
    token = credentials.credentials
    
    try:
        # Verify token with Keycloak introspection endpoint
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token/introspect",
                data={
                    "token": token,
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            token_data = response.json()
            
            if not token_data.get("active"):
                raise HTTPException(status_code=401, detail="Token is not active")
            
            
            return token_data
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Error verifying token: {str(e)}")


async def get_admin_token():
    """Get an admin access token from Keycloak"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token",
                data={
                    "grant_type": "client_credentials",
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=500, 
                    detail="Failed to get admin token"
                )
            
            return response.json()["access_token"]
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error getting admin token: {str(e)}"
        )


@router.get("/users")
async def get_users(token_data: dict = Depends(verify_admin_token)) -> List[Dict[str, Any]]:
    """
    Get all users from Keycloak (Admin only)
    """
    try:
        # Get admin token to query Keycloak Admin API
        admin_token = await get_admin_token()
        
        async with httpx.AsyncClient() as client:
            # Fetch users from Keycloak Admin API
            response = await client.get(
                f"{KEYCLOAK_URL}/admin/realms/{REALM}/users",
                headers={
                    "Authorization": f"Bearer {admin_token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to fetch users from Keycloak: {response.text}"
                )
            
            users = response.json()
            
            # Format user data for frontend
            formatted_users = []
            for user in users:
                # Fetch roles for each user
                user_roles = await get_user_roles(admin_token, user["id"])
                
                formatted_users.append({
                    "id": user.get("id"),
                    "username": user.get("username"),
                    "email": user.get("email"),
                    "firstName": user.get("firstName"),
                    "lastName": user.get("lastName"),
                    "enabled": user.get("enabled", False),
                    "emailVerified": user.get("emailVerified", False),
                    "createdTimestamp": user.get("createdTimestamp"),
                    "roles": user_roles
                })
            
            return formatted_users
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error communicating with Keycloak: {str(e)}"
        )


async def get_user_roles(admin_token: str, user_id: str) -> List[str]:
    """Get realm roles for a specific user"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}/role-mappings/realm",
                headers={
                    "Authorization": f"Bearer {admin_token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                roles_data = response.json()
                return [role["name"] for role in roles_data]
            else:
                return []
                
    except httpx.RequestError:
        return []


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    token_data: dict = Depends(verify_admin_token)
) -> Dict[str, Any]:
    """Get a specific user by ID (Admin only)"""
    try:
        admin_token = await get_admin_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}",
                headers={
                    "Authorization": f"Bearer {admin_token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="User not found")
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to fetch user"
                )
            
            user = response.json()
            user_roles = await get_user_roles(admin_token, user["id"])
            
            return {
                "id": user.get("id"),
                "username": user.get("username"),
                "email": user.get("email"),
                "firstName": user.get("firstName"),
                "lastName": user.get("lastName"),
                "enabled": user.get("enabled", False),
                "emailVerified": user.get("emailVerified", False),
                "createdTimestamp": user.get("createdTimestamp"),
                "roles": user_roles
            }
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error communicating with Keycloak: {str(e)}"
        )
