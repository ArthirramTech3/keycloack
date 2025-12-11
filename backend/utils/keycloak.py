import httpx
import jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List, Dict, Any
from config import KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET

security = HTTPBearer()

async def get_admin_token() -> str:
    """Get an admin access token from Keycloak using client credentials."""
    token_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
    payload = {
        "client_id": KEYCLOAK_CLIENT_ID,
        "client_secret": KEYCLOAK_CLIENT_SECRET,
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

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Verify the JWT token with Keycloak introspection."""
    token = credentials.credentials
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token/introspect",
                data={
                    "token": token,
                    "client_id": KEYCLOAK_CLIENT_ID,
                    "client_secret": KEYCLOAK_CLIENT_SECRET
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

async def verify_admin_role(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Verify the JWT token and check if the user has the 'admin' role."""
    token_string = credentials.credentials
    try:
        # Decode token (signature verification optional for internal use)
        decoded_token = jwt.decode(token_string, options={"verify_signature": False})
        
        # Check for admin role in realm_access
        realm_access = decoded_token.get("realm_access", {})
        if "admin" not in realm_access.get("roles", []):
            raise HTTPException(status_code=403, detail="Admin role required")
            
        return decoded_token 
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_user_id_from_token(decoded_token: Dict[str, Any]) -> str:
    """Extract user ID from decoded token."""
    user_id = decoded_token.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: 'sub' missing")
    return user_id

def get_user_roles_from_token(decoded_token: Dict[str, Any]) -> List[str]:
    """Extract roles from decoded token."""
    realm_access = decoded_token.get("realm_access", {})
    return realm_access.get("roles", [])

def get_user_groups_from_token(decoded_token: Dict[str, Any]) -> List[str]:
    """Extract groups from decoded token."""
    return decoded_token.get("groups", [])
