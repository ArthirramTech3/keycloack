import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Base
from routes.auth import router as auth_router
from routes.organizations import router as organizations_router
from routes.api_key import router as api_keys_router
from routes.users import router as users_router
from routes.quotas import router as quotas_router
from routes.proxy import router as proxy_router

# --- Configuration ---
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cybersecurity:cybersecurity%40123@localhost/cybersecuritydb")
print(f"--- Connecting to database: {DATABASE_URL} ---")

# --- Database Setup ---
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    yield

# --- FastAPI App Initialization ---
app = FastAPI(
    title="AI Gateway API",
    description="Organization-based API gateway with Keycloak authentication",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include Routers ---
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(organizations_router, prefix="/organizations", tags=["Organizations"])
app.include_router(api_keys_router, prefix="/api-keys", tags=["API Keys"])
app.include_router(users_router, prefix="/admin/users", tags=["User Management"])
app.include_router(quotas_router, prefix="/admin/quotas", tags=["Quota Management"])
app.include_router(proxy_router, prefix="/v1", tags=["AI Proxy"])

@app.get("/")
def read_root():
    return {"message": "AI Gateway Backend is running", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
