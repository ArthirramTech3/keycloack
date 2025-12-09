from fastapi import FastAPI
from app.routers import admin_router, proxy_router
from app.db import init_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Gateway")

@app.on_event("startup")
async def startup():
    init_db()
    logger.info("Database initialized")

app.include_router(admin_router, prefix="/admin", tags=["admin"])
app.include_router(proxy_router, prefix="/v1", tags=["proxy"])