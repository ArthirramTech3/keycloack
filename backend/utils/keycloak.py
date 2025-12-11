# backend/utils/keycloak.py
import httpx
import jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List, Dict, Any
from config import KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET

security = HTTPBearer()

# --- Existing frontend helpers (unchanged behavior) ---
async def get_admin_token() -> str:
    """Get an admin access token from Keycloak using client credentials.
    NOTE: this raises HTTPException on failure (keeps existing behavior)."""
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
            # keep raising here so routers can stop early if auth fails
            raise HTTPException(status_code=500, detail="Could not authenticate with Keycloak service account.")

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Verify the JWT token with Keycloak introspection for general endpoints."""
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
    """Verify JWT and check for 'admin' role — returns decoded token if ok."""
    token_string = credentials.credentials
    try:
        decoded_token = jwt.decode(token_string, options={"verify_signature": False})
        realm_access = decoded_token.get("realm_access", {})
        if "admin" not in realm_access.get("roles", []):
            raise HTTPException(status_code=403, detail="Admin role required")
        return decoded_token
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_user_id_from_token(decoded_token: Dict[str, Any]) -> str:
    user_id = decoded_token.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: 'sub' missing")
    return user_id

def get_user_roles_from_token(decoded_token: Dict[str, Any]) -> List[str]:
    realm_access = decoded_token.get("realm_access", {})
    return realm_access.get("roles", [])

def get_user_groups_from_token(decoded_token: Dict[str, Any]) -> List[str]:
    return decoded_token.get("groups", [])

# --- New Admin API helpers (return structured results; DO NOT raise) ---
# All helpers return dict: {"success": bool, "status": int, "data": ...} or {"success": False, "status": int, "error": str}

async def kc_list_users(admin_token: str) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users"
    headers = {"Authorization": f"Bearer {admin_token}"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers)
            return {"success": resp.status_code == 200, "status": resp.status_code, "data": resp.json() if resp.status_code == 200 else None, "error": resp.text if resp.status_code != 200 else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}

async def kc_get_user(admin_token: str, user_id: str) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}"
    headers = {"Authorization": f"Bearer {admin_token}"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers)
            return {"success": resp.status_code == 200, "status": resp.status_code, "data": resp.json() if resp.status_code == 200 else None, "error": resp.text if resp.status_code != 200 else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}

async def kc_create_user(admin_token: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users"
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, headers=headers, json=payload)
            return {"success": resp.status_code in (201, 204), "status": resp.status_code, "data": None, "error": resp.text if resp.status_code not in (201, 204) else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}

async def kc_update_user(admin_token: str, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}"
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.put(url, headers=headers, json=payload)
            return {"success": resp.status_code == 204, "status": resp.status_code, "error": resp.text if resp.status_code != 204 else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}

async def kc_set_user_enabled(admin_token: str, user_id: str, enabled: bool) -> Dict[str, Any]:
    # Keycloak uses same update endpoint with {"enabled": true/false}
    return await kc_update_user(admin_token, user_id, {"enabled": enabled})

async def kc_delete_user(admin_token: str, user_id: str) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}"
    headers = {"Authorization": f"Bearer {admin_token}"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.delete(url, headers=headers)
            return {"success": resp.status_code == 204, "status": resp.status_code, "error": resp.text if resp.status_code != 204 else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}

async def kc_get_user_roles(admin_token: str, user_id: str) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}/role-mappings/realm"
    headers = {"Authorization": f"Bearer {admin_token}"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers)
            return {"success": resp.status_code == 200, "status": resp.status_code, "data": resp.json() if resp.status_code == 200 else None, "error": resp.text if resp.status_code != 200 else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}

async def kc_get_user_groups(admin_token: str, user_id: str) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}/groups"
    headers = {"Authorization": f"Bearer {admin_token}"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers)
            return {"success": resp.status_code == 200, "status": resp.status_code, "data": resp.json() if resp.status_code == 200 else None, "error": resp.text if resp.status_code != 200 else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}

async def kc_add_user_to_group(admin_token: str, user_id: str, group_id: str) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}/groups/{group_id}"
    headers = {"Authorization": f"Bearer {admin_token}"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.put(url, headers=headers)
            return {"success": resp.status_code == 204, "status": resp.status_code, "error": resp.text if resp.status_code != 204 else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}

# Group helpers
async def kc_list_groups(admin_token: str) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/groups"
    headers = {"Authorization": f"Bearer {admin_token}"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers)
            return {"success": resp.status_code == 200, "status": resp.status_code, "data": resp.json() if resp.status_code == 200 else None, "error": resp.text if resp.status_code != 200 else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}

async def kc_create_group(admin_token: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/groups"
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, headers=headers, json=payload)
            return {"success": resp.status_code in (201, 204), "status": resp.status_code, "error": resp.text if resp.status_code not in (201, 204) else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}

async def kc_update_group(admin_token: str, group_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/groups/{group_id}"
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.put(url, headers=headers, json=payload)
            return {"success": resp.status_code == 204, "status": resp.status_code, "error": resp.text if resp.status_code != 204 else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}

async def kc_delete_group(admin_token: str, group_id: str) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/groups/{group_id}"
    headers = {"Authorization": f"Bearer {admin_token}"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.delete(url, headers=headers)
            return {"success": resp.status_code == 204, "status": resp.status_code, "error": resp.text if resp.status_code != 204 else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}

async def kc_get_group_members(admin_token: str, group_id: str) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/groups/{group_id}/members"
    headers = {"Authorization": f"Bearer {admin_token}"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers)
            return {"success": resp.status_code == 200, "status": resp.status_code, "data": resp.json() if resp.status_code == 200 else None, "error": resp.text if resp.status_code != 200 else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}

# Role helpers
async def kc_list_roles(admin_token: str) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/roles"
    headers = {"Authorization": f"Bearer {admin_token}"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers)
            return {"success": resp.status_code == 200, "status": resp.status_code, "data": resp.json() if resp.status_code == 200 else None, "error": resp.text if resp.status_code != 200 else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}

async def kc_create_role(admin_token: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/roles"
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, headers=headers, json=payload)
            return {"success": resp.status_code in (201, 204), "status": resp.status_code, "error": resp.text if resp.status_code not in (201, 204) else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}

async def kc_update_role(admin_token: str, role_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/roles/{role_name}"
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.put(url, headers=headers, json=payload)
            return {"success": resp.status_code == 204, "status": resp.status_code, "error": resp.text if resp.status_code != 204 else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}

async def kc_delete_role(admin_token: str, role_name: str) -> Dict[str, Any]:
    url = f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/roles/{role_name}"
    headers = {"Authorization": f"Bearer {admin_token}"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.delete(url, headers=headers)
            return {"success": resp.status_code == 204, "status": resp.status_code, "error": resp.text if resp.status_code != 204 else None}
        except httpx.RequestError as e:
            return {"success": False, "status": 500, "error": str(e)}
