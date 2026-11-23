import os
import sys
from pathlib import Path

# Ensure both project root and backend dir are in sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.db import init_db
from app.api.endpoints import router as api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("rackvision.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing RackVision AI backend services...")
    init_db()
    logger.info("RackVision AI Database ready at %s", settings.DATABASE_PATH)
    yield
    logger.info("Shutting down RackVision AI backend services...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Data Center Design, 3D Visualization & Construction Planning Platform",
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

# Mount outputs directory for generated assets (sketches, designs, reports)
app.mount("/outputs/sketches", StaticFiles(directory=str(settings.SKETCHES_DIR)), name="sketches")
app.mount("/outputs/designs", StaticFiles(directory=str(settings.DESIGNS_DIR)), name="designs")
app.mount("/outputs/reports", StaticFiles(directory=str(settings.REPORTS_DIR)), name="reports")

# Include Core API Router
app.include_router(api_router, prefix=settings.API_PREFIX)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": str(settings.DATABASE_PATH.name)
    }

@app.get("/")
def root():
    return {
        "project": "RackVision AI",
        "description": "Intelligent Data Center Design, 3D Visualization & Construction Planning Platform",
        "docs_url": "/docs",
        "health_url": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
