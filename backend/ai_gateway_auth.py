import os
import jwt
import httpx
from datetime import datetime
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import secrets
from passlib.context import CryptContext

from main import get_db, KEYCLOAK_PUBLIC_KEY, REALM, KEYCLOAK_URL, CLIENT_ID, CLIENT_SECRET
from ai_gateway_models import User as AIGatewayUser, Organization # Import User and alias it
from main import get_admin_token # Assuming get_admin_token is in main.py

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def generate_api_key():
    return "sk_" + secrets.token_urlsafe(32)

def hash_api_key(raw: str) -> str:
    return pwd_ctx.hash(raw)

def verify_api_key(raw: str, hashed: str) -> bool:
    return pwd_ctx.verify(raw, hashed)

async def get_current_keycloak_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Decodes and verifies the Keycloak JWT token and returns the Keycloak user ID ('sub').
    """
    token_string = credentials.credentials
    try:
        # Verify the signature using the public key
        decoded_token = jwt.decode(token_string, KEYCLOAK_PUBLIC_KEY, algorithms=["RS256"], audience=CLIENT_ID, issuer=f"{KEYCLOAK_URL}/realms/{REALM}")
        
        user_id = decoded_token.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: 'sub' missing")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Authentication error: {e}")

async def get_ai_gateway_user(keycloak_user_id: str = Depends(get_current_keycloak_user_id), db: Session = Depends(get_db)):
    """
    Retrieves or creates an AI Gateway user entry for a given Keycloak user ID.
    """
    ai_user = db.query(AIGatewayUser).filter(AIGatewayUser.keycloak_user_id == keycloak_user_id).first()

    if ai_user:
        return ai_user
    else:
        # If user doesn't exist in AI Gateway DB, create a new one
        # For simplicity, we'll assign to a default organization or create one if none exists.
        # In a real-world scenario, you might have an organization onboarding flow.
        organization = db.query(Organization).filter_by(name="default_org").first()
        if not organization:
            organization = Organization(name="default_org")
            db.add(organization)
            db.commit()
            db.refresh(organization)

        # Get user details from Keycloak to populate email/full_name (requires admin token)
        admin_token = await get_admin_token() # get_admin_token should be accessible
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {admin_token}"}
            user_info_response = await client.get(f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{keycloak_user_id}", headers=headers)
            user_info_response.raise_for_status()
            user_info = user_info_response.json()

        email = user_info.get("email", f"{keycloak_user_id}@example.com")
        full_name = f"{user_info.get('firstName', '')} {user_info.get('lastName', '')}".strip() or None

        new_api_key = generate_api_key()
        hashed_api_key = hash_api_key(new_api_key)

        new_ai_user = AIGatewayUser(
            organization_id=organization.id,
            keycloak_user_id=keycloak_user_id,
            email=email,
            full_name=full_name,
            api_key_hash=hashed_api_key,
            created_at=datetime.utcnow()
        )
        db.add(new_ai_user)
        db.commit()
        db.refresh(new_ai_user)
        # In a real scenario, you'd securely return the new_api_key to the user once here, not store it plain
        return new_ai_user

async def require_ai_gateway_admin(ai_user: AIGatewayUser = Depends(get_ai_gateway_user)):
    """
    Dependency to check if the authenticated AI Gateway user has the 'admin' role.
    This role is stored in the AI Gateway's user table, not Keycloak roles directly.
    """
    if ai_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="AI Gateway Admin role required")
    return ai_user
