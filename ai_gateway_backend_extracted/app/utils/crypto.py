import os
from dotenv import load_dotenv
from cryptography.fernet import Fernet, InvalidToken

load_dotenv()

MASTER_KEY = os.getenv("MASTER_ENC_KEY")
if not MASTER_KEY:
    raise ValueError("MASTER_ENC_KEY environment variable is required")

f = Fernet(MASTER_KEY.encode())

def encrypt_secret(secret: str) -> str:
    """Encrypt a secret using Fernet symmetric encryption."""
    return f.encrypt(secret.encode()).decode()

def decrypt_secret(encrypted: str) -> str:
    """Decrypt an encrypted secret."""
    try:
        return f.decrypt(encrypted.encode()).decode()
    except InvalidToken:
        raise ValueError("Invalid encrypted token")
