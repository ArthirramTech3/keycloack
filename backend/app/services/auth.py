import secrets
import hashlib

def generate_api_key():
    return secrets.token_hex(32)

def hash_api_key(key: str):
    return hashlib.sha256(key.encode()).hexdigest()

def verify_api_key(key: str, hashed_key: str):
    return hash_api_key(key) == hashed_key
