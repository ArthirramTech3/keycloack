from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from keycloak import KeycloakOpenID
from jose import jwt, JWTError
from pydantic import BaseModel
import uvicorn
from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
import os

load_dotenv()

# --- Database Configuration ---
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Database Model ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)

Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CORS Middleware ---
origins = [
    "http://localhost:5173",
    "http://localhost:5174", # In case the port changes again
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency to get DB session ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Keycloak Configuration ---
# IMPORTANT: Replace these with your actual Keycloak server details.
KEYCLOAK_SERVER_URL = "http://localhost:8080"
KEYCLOAK_REALM = "cybersecurity-realm"
KEYCLOAK_CLIENT_ID = "cybersecurity-frontend"

# Initialize Keycloak client
keycloak_openid = KeycloakOpenID(
    server_url=KEYCLOAK_SERVER_URL,
    client_id=KEYCLOAK_CLIENT_ID,
    realm_name=KEYCLOAK_REALM,
)

# --- JWT Token Verification ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Function to get the public key from Keycloak to verify the token signature
def get_keycloak_public_key():
    return (
        "-----BEGIN PUBLIC KEY-----\n"
        f"{keycloak_openid.public_key()}"
        "\n-----END PUBLIC KEY-----"
    )

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        public_key = get_keycloak_public_key()
        # Decode the token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=KEYCLOAK_CLIENT_ID,
        )
        # You can add more validation here if needed, e.g., checking roles
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the Python backend!"}

@app.get("/protected")
async def read_protected_data(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    # This endpoint is protected. Only authenticated users can access it.
    username = current_user.get('preferred_username')
    email = current_user.get('email')

    # Check if user already exists
    db_user = db.query(User).filter(User.username == username).first()

    if not db_user:
        new_user = User(username=username, email=email)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    return {"message": f"Hello, {username}! This is protected data. Your information has been saved to the database."}

if __name__ == "__main__":
    # Note: For production, you would use a proper ASGI server like Gunicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
