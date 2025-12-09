# Simple encryption helpers using Fernet (symmetric). In production use a KMS or HSM.
from cryptography.fernet import Fernet
import os
from base64 import urlsafe_b64encode, urlsafe_b64decode

MASTER_KEY = os.getenv("MASTER_ENC_KEY")  # expected as 32 urlsafe base64 bytes or None

def get_fernet():
    if not MASTER_KEY:
        raise RuntimeError("MASTER_ENC_KEY is required for encrypting provider keys")
    return Fernet(MASTER_KEY)

def encrypt_secret(secret: str) -> str:
    f = get_fernet()
    return f.encrypt(secret.encode()).decode()

def decrypt_secret(token: str) -> str:
    f = get_fernet()
    return f.decrypt(token.encode()).decode()