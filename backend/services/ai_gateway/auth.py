# Authentication utilities: API key generation, hashing and verification
import secrets
from passlib.context import CryptContext

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_api_key():
    # 40+ char key
    return "sk_" + secrets.token_urlsafe(32)

def hash_api_key(raw: str) -> str:
    return pwd_ctx.hash(raw)

def verify_api_key(raw: str, hashed: str) -> bool:
    return pwd_ctx.verify(raw, hashed)