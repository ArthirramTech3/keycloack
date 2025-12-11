# backend/routes/admin_users.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from utils.keycloak import (
    get_admin_token,
    kc_list_users,
    kc_create_user,
    kc_update_user,
    kc_delete_user,
    kc_get_user_groups,
    kc_get_user_roles
)
from utils.keycloak import verify_admin_role

router = APIRouter()

@router.get("/admin/users", dependencies=[Depends(verify_admin_role)])
async def get_users():
    admin_token = await get_admin_token()
    users_resp = await kc_list_users(admin_token)
    if not users_resp.get("success"):
        raise HTTPException(status_code=users_resp.get("status", 500), detail=users_resp.get("error", "Failed to list users"))
    users = users_resp.get("data", [])
    # Enrich with groups & roles
    enriched = []
    for u in users:
        uid = u.get("id")
        groups_resp = await kc_get_user_groups(admin_token, uid)
        roles_resp = await kc_get_user_roles(admin_token, uid)
        u["groups"] = groups_resp.get("data", []) if groups_resp.get("success") else []
        # kc_get_user_roles returns list of role objects; map to names if present
        u["roles"] = [r.get("name") for r in roles_resp.get("data", [])] if roles_resp.get("success") else []
        enriched.append(u)
    return enriched

@router.post("/admin/users/create", dependencies=[Depends(verify_admin_role)])
async def create_user(user_data: Dict[str, Any]):
    # Expect keys: username, email, firstName, lastName, password
    payload = {
        "username": user_data.get("username"),
        "email": user_data.get("email"),
        "firstName": user_data.get("firstName"),
        "lastName": user_data.get("lastName"),
        "enabled": True,
        "credentials": [{"type": "password", "value": user_data.get("password"), "temporary": False}],
    }
    admin_token = await get_admin_token()
    resp = await kc_create_user(admin_token, payload)
    if not resp.get("success"):
        raise HTTPException(status_code=resp.get("status", 500), detail=resp.get("error", "Failed to create user"))
    return {"message": "User created successfully."}

@router.put("/admin/users/{user_id}", dependencies=[Depends(verify_admin_role)])
async def update_user(user_id: str, user_data: Dict[str, Any]):
    admin_token = await get_admin_token()
    resp = await kc_update_user(admin_token, user_id, user_data)
    if not resp.get("success"):
        raise HTTPException(status_code=resp.get("status", 500), detail=resp.get("error", "Failed to update user"))
    return {"message": "User updated successfully."}

@router.put("/admin/users/{user_id}/status", dependencies=[Depends(verify_admin_role)])
async def update_user_status(user_id: str, status_payload: Dict[str, Any]):
    enabled = status_payload.get("enabled")
    if enabled is None:
        raise HTTPException(status_code=400, detail="enabled boolean is required.")
    admin_token = await get_admin_token()
    resp = await kc_update_user(admin_token, user_id, {"enabled": enabled})
    if not resp.get("success"):
        raise HTTPException(status_code=resp.get("status", 500), detail=resp.get("error", "Failed to update user status"))
    return {"message": "User status updated successfully."}

@router.delete("/admin/users/{user_id}", dependencies=[Depends(verify_admin_role)])
async def delete_user(user_id: str):
    admin_token = await get_admin_token()
    resp = await kc_delete_user(admin_token, user_id)
    if not resp.get("success"):
        raise HTTPException(status_code=resp.get("status", 500), detail=resp.get("error", "Failed to delete user"))
    return {"message": "User deleted successfully."}
