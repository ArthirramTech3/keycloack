from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
import httpx
from schemas import UserCreate, UserUpdate, UserStatusUpdate, GroupCreate, RoleCreate


from utils.keycloak import verify_admin_role, get_admin_token
from config import KEYCLOAK_URL, KEYCLOAK_REALM

router = APIRouter()

# --- User Management Endpoints ---
@router.get("/", response_model=List[Dict[str, Any]])
async def get_users(_: dict = Depends(verify_admin_role)):
    """Get all users from Keycloak with their roles and groups."""
    admin_token = await get_admin_token()
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        try:
            response = await client.get(
                f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users",
                headers=headers
            )
            response.raise_for_status()
            users = response.json()
            
            # Enrich users with roles and groups
            enriched_users = []
            for user in users:
                user_id = user["id"]
                roles = await _get_user_roles(admin_token, user_id)
                groups = await _get_user_groups(admin_token, user_id)
                
                enriched_users.append({
                    **user,
                    "roles": roles,
                    "groups": groups
                })
            
            return enriched_users
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail="Failed to fetch users")

@router.post("/")
async def create_user(user_data: UserCreate, _: dict = Depends(verify_admin_role)):
    """Create a new user in Keycloak."""
    admin_token = await get_admin_token()
    
    payload = {
        "username": user_data.username,
        "email": user_data.email,
        "firstName": user_data.firstName,
        "lastName": user_data.lastName,
        "enabled": True,
        "credentials": [{"type": "password", "value": user_data.password, "temporary": False}],
    }
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        response = await client.post(
            f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users",
            headers=headers,
            json=payload
        )
        
        if response.status_code == 201:
            return {"message": "User created successfully"}
        else:
            raise HTTPException(status_code=response.status_code, detail=response.json())

@router.get("/{user_id}", response_model=Dict[str, Any])
async def get_user(user_id: str, _: dict = Depends(verify_admin_role)):
    """Get a specific user by ID."""
    admin_token = await get_admin_token()
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await client.get(
            f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}",
            headers=headers
        )
        
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="User not found")
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch user")
        
        user = response.json()
        roles = await _get_user_roles(admin_token, user_id)
        groups = await _get_user_groups(admin_token, user_id)
        
        return {**user, "roles": roles, "groups": groups}

@router.put("/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate, _: dict = Depends(verify_admin_role)):
    """Update user details."""
    admin_token = await get_admin_token()
    payload = user_data.model_dump(exclude_unset=True)
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        response = await client.put(
            f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}",
            headers=headers,
            json=payload
        )
        
        if response.status_code == 204:
            return {"message": "User updated successfully"}
        raise HTTPException(status_code=response.status_code, detail="Failed to update user")

@router.put("/{user_id}/status")
async def update_user_status(user_id: str, status_data: UserStatusUpdate, _: dict = Depends(verify_admin_role)):
    """Enable or disable a user."""
    admin_token = await get_admin_token()
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        response = await client.put(
            f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}",
            headers=headers,
            json={"enabled": status_data.enabled}
        )
        
        if response.status_code == 204:
            return {"message": "User status updated successfully"}
        raise HTTPException(status_code=response.status_code, detail="Failed to update user status")

@router.delete("/{user_id}")
async def delete_user(user_id: str, _: dict = Depends(verify_admin_role)):
    """Delete a user."""
    admin_token = await get_admin_token()
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await client.delete(
            f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}",
            headers=headers
        )
        
        if response.status_code == 204:
            return {"message": "User deleted successfully"}
        raise HTTPException(status_code=response.status_code, detail="Failed to delete user")

# --- Role Management ---
@router.get("/{user_id}/roles", response_model=List[str])
async def get_user_roles_endpoint(user_id: str, _: dict = Depends(verify_admin_role)):
    """Get roles for a specific user."""
    admin_token = await get_admin_token()
    return await _get_user_roles(admin_token, user_id)

@router.post("/{user_id}/roles/{role_name}")
async def assign_role_to_user(user_id: str, role_name: str, _: dict = Depends(verify_admin_role)):
    """Assign a role to a user."""
    admin_token = await get_admin_token()
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        
        # First get the role
        role_response = await client.get(
            f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/roles/{role_name}",
            headers=headers
        )
        if role_response.status_code != 200:
            raise HTTPException(status_code=404, detail="Role not found")
        
        role = role_response.json()
        
        # Assign role to user
        response = await client.post(
            f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}/role-mappings/realm",
            headers=headers,
            json=[role]
        )
        
        if response.status_code == 204:
            return {"message": f"Role '{role_name}' assigned to user"}
        raise HTTPException(status_code=response.status_code, detail="Failed to assign role")

@router.delete("/{user_id}/roles/{role_name}")
async def remove_role_from_user(user_id: str, role_name: str, _: dict = Depends(verify_admin_role)):
    """Remove a role from a user."""
    admin_token = await get_admin_token()
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        
        # Get the role
        role_response = await client.get(
            f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/roles/{role_name}",
            headers=headers
        )
        if role_response.status_code != 200:
            raise HTTPException(status_code=404, detail="Role not found")
        
        role = role_response.json()
        
        # Remove role from user
        response = await client.request(
            "DELETE",
            f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}/role-mappings/realm",
            headers=headers,
            json=[role]
        )
        
        if response.status_code == 204:
            return {"message": f"Role '{role_name}' removed from user"}
        raise HTTPException(status_code=response.status_code, detail="Failed to remove role")

# --- Group Management ---
@router.get("/{user_id}/groups", response_model=List[str])
async def get_user_groups_endpoint(user_id: str, _: dict = Depends(verify_admin_role)):
    """Get groups for a specific user."""
    admin_token = await get_admin_token()
    return await _get_user_groups(admin_token, user_id)

@router.post("/{user_id}/groups/{group_id}")
async def add_user_to_group(user_id: str, group_id: str, _: dict = Depends(verify_admin_role)):
    """Add a user to a group."""
    admin_token = await get_admin_token()
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await client.put(
            f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}/groups/{group_id}",
            headers=headers
        )
        
        if response.status_code == 204:
            return {"message": "User added to group successfully"}
        raise HTTPException(status_code=response.status_code, detail="Failed to add user to group")

@router.delete("/{user_id}/groups/{group_id}")
async def remove_user_from_group(user_id: str, group_id: str, _: dict = Depends(verify_admin_role)):
    """Remove a user from a group."""
    admin_token = await get_admin_token()
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await client.delete(
            f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}/groups/{group_id}",
            headers=headers
        )
        
        if response.status_code == 204:
            return {"message": "User removed from group successfully"}
        raise HTTPException(status_code=response.status_code, detail="Failed to remove user from group")

# --- Helper Functions ---
async def _get_user_roles(admin_token: str, user_id: str) -> List[str]:
    """Get realm roles for a user."""
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        try:
            response = await client.get(
                f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}/role-mappings/realm",
                headers=headers
            )
            if response.status_code == 200:
                return [role["name"] for role in response.json()]
        except httpx.RequestError:
            pass
    return []

async def _get_user_groups(admin_token: str, user_id: str) -> List[str]:
    """Get groups for a user."""
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {admin_token}"}
        try:
            response = await client.get(
                f"{KEYCLOAK_URL}/admin/realms/{KEYCLOAK_REALM}/users/{user_id}/groups",
                headers=headers
            )
            if response.status_code == 200:
                return [group["name"] for group in response.json()]
        except httpx.RequestError:
            pass
    return []
