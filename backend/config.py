import os

# Keycloak Configuration
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "cybersecurity-realm")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "cybersecurity-frontend")
KEYCLOAK_CLIENT_SECRET = os.getenv("KEYCLOAK_CLIENT_SECRET", "0xISuGJ0ZHpQ7DTChfh1BWBd6RCNon0n")

# OpenRouter Configuration
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cybersecurity:cybersecurity%40123@localhost/cybersecuritydb")

# API Key Generation
API_KEY_PREFIX = os.getenv("API_KEY_PREFIX", "sk-org")
