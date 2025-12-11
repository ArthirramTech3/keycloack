# backend/routes/admin_groups.py
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from utils.keycloak import (
    get_admin_token,
    kc_list_groups,
    kc_create_group,
    kc_update_group,
    kc_delete_group,
    kc_get_group_members,
    kc_add_user_to_group
)
from utils.keycloak import verify_admin_role

router = APIRouter()

@router.get("/admin/groups", dependencies=[Depends(verify_admin_role)])
async def get_groups():
    admin_token = await get_admin_token()
    resp = await kc_list_groups(admin_token)
    if not resp.get("success"):
        raise HTTPException(status_code=resp.get("status", 500), detail=resp.get("error", "Failed to fetch groups"))
    return resp.get("data", [])

@router.post("/admin/groups/create", dependencies=[Depends(verify_admin_role)])
async def create_group(group_data: Dict[str, Any]):
    admin_token = await get_admin_token()
    resp = await kc_create_group(admin_token, group_data)
    if not resp.get("success"):
        raise HTTPException(status_code=resp.get("status", 500), detail=resp.get("error", "Failed to create group"))
    return {"message": "Group created successfully."}

@router.put("/admin/groups/{group_id}", dependencies=[Depends(verify_admin_role)])
async def update_group(group_id: str, group_data: Dict[str, Any]):
    admin_token = await get_admin_token()
    resp = await kc_update_group(admin_token, group_id, group_data)
    if not resp.get("success"):
        raise HTTPException(status_code=resp.get("status", 500), detail=resp.get("error", "Failed to update group"))
    return {"message": "Group updated successfully."}

@router.delete("/admin/groups/{group_id}", dependencies=[Depends(verify_admin_role)])
async def delete_group(group_id: str):
    admin_token = await get_admin_token()
    resp = await kc_delete_group(admin_token, group_id)
    if not resp.get("success"):
        raise HTTPException(status_code=resp.get("status", 500), detail=resp.get("error", "Failed to delete group"))
    return {"message": "Group deleted successfully."}

@router.get("/admin/groups/{group_id}/members", dependencies=[Depends(verify_admin_role)])
async def get_group_members(group_id: str):
    admin_token = await get_admin_token()
    resp = await kc_get_group_members(admin_token, group_id)
    if not resp.get("success"):
        raise HTTPException(status_code=resp.get("status", 500), detail=resp.get("error", "Failed to fetch group members"))
    return resp.get("data", [])

@router.post("/admin/groups/{group_id}/members", dependencies=[Depends(verify_admin_role)])
async def add_group_member(group_id: str, body: Dict[str, Any]):
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    admin_token = await get_admin_token()
    resp = await kc_add_user_to_group(admin_token, user_id, group_id)
    if not resp.get("success"):
        raise HTTPException(status_code=resp.get("status", 500), detail=resp.get("error", "Failed to add user to group"))
    return {"message": "User added to group successfully."}
