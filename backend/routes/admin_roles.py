# backend/routes/admin_roles.py
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from utils.keycloak import (
    get_admin_token,
    kc_list_roles,
    kc_create_role,
    kc_update_role,
    kc_delete_role
)
from utils.keycloak import verify_admin_role

router = APIRouter()

@router.get("/admin/roles", dependencies=[Depends(verify_admin_role)])
async def get_roles():
    admin_token = await get_admin_token()
    resp = await kc_list_roles(admin_token)
    if not resp.get("success"):
        raise HTTPException(status_code=resp.get("status", 500), detail=resp.get("error", "Failed to fetch roles"))
    return resp.get("data", [])


@router.post("/admin/roles/create", dependencies=[Depends(verify_admin_role)])
async def create_role(role_data: Dict[str, Any]):
    admin_token = await get_admin_token()
    resp = await kc_create_role(admin_token, role_data)
    if not resp.get("success"):
        raise HTTPException(status_code=resp.get("status", 500), detail=resp.get("error", "Failed to create role"))
    return {"message": "Role created successfully."}

@router.put("/admin/roles/{role_name}", dependencies=[Depends(verify_admin_role)])
async def update_role(role_name: str, role_data: Dict[str, Any]):
    admin_token = await get_admin_token()
    resp = await kc_update_role(admin_token, role_name, role_data)
    if not resp.get("success"):
        raise HTTPException(status_code=resp.get("status", 500), detail=resp.get("error", "Failed to update role"))
    return {"message": "Role updated successfully."}

@router.delete("/admin/roles/{role_name}", dependencies=[Depends(verify_admin_role)])
async def delete_role(role_name: str):
    admin_token = await get_admin_token()
    resp = await kc_delete_role(admin_token, role_name)
    if not resp.get("success"):
        raise HTTPException(status_code=resp.get("status", 500), detail=resp.get("error", "Failed to delete role"))
    return {"message": "Role deleted successfully."}
