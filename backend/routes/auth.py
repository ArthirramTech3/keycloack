from fastapi import APIRouter, HTTPException
import httpx
from schemas import LoginRequest, TokenResponse
from config import KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Authenticate user with Keycloak using password grant.
    Returns access token for API access.
    """
    token_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
    
    payload = {
        "client_id": KEYCLOAK_CLIENT_ID,
        "client_secret": KEYCLOAK_CLIENT_SECRET,
        "grant_type": "password",
        "username": request.username,
        "password": request.password,
        "scope": "openid",
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(token_url, data=payload)
            response.raise_for_status()
            data = response.json()
            return TokenResponse(
                access_token=data["access_token"],
                id_token=data.get("id_token"),
                refresh_token=data.get("refresh_token"),
                token_type="bearer",
                expires_in=data.get("expires_in")
            )
        except httpx.HTTPStatusError as e:
            detail = e.response.json().get("error_description", "Invalid credentials")
            raise HTTPException(status_code=e.response.status_code, detail=detail)
        except httpx.RequestError:
            raise HTTPException(status_code=500, detail="Could not connect to authentication server")

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """Refresh an access token."""
    token_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
    
    payload = {
        "client_id": KEYCLOAK_CLIENT_ID,
        "client_secret": KEYCLOAK_CLIENT_SECRET,
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(token_url, data=payload)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        except httpx.RequestError:
            raise HTTPException(status_code=500, detail="Could not connect to authentication server")

@router.post("/logout")
async def logout(refresh_token: str):
    """Logout user and invalidate tokens."""
    logout_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/logout"
    
    payload = {
        "client_id": KEYCLOAK_CLIENT_ID,
        "client_secret": KEYCLOAK_CLIENT_SECRET,
        "refresh_token": refresh_token,
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(logout_url, data=payload)
            return {"message": "Logged out successfully"}
        except httpx.RequestError:
            raise HTTPException(status_code=500, detail="Could not connect to authentication server")
