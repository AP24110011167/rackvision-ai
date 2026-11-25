import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
OUTPUTS_DIR = BASE_DIR / "outputs"
SKETCHES_DIR = OUTPUTS_DIR / "sketches"
DESIGNS_DIR = OUTPUTS_DIR / "designs"
REPORTS_DIR = OUTPUTS_DIR / "reports"
DATABASE_PATH = OUTPUTS_DIR / "rackvision.db"

# Create directories if they do not exist
for d in [OUTPUTS_DIR, SKETCHES_DIR, DESIGNS_DIR, REPORTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    PROJECT_NAME: str = "RackVision AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    BASE_DIR: Path = BASE_DIR
    DATABASE_PATH: Path = DATABASE_PATH
    SKETCHES_DIR: Path = SKETCHES_DIR
    DESIGNS_DIR: Path = DESIGNS_DIR
    REPORTS_DIR: Path = REPORTS_DIR
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    # AI settings
    DEFAULT_CONTROLNET_MODEL: str = "lllyasviel/control_v11p_sd15_canny"
    DEFAULT_BASE_MODEL: str = "runwayml/stable-diffusion-v1-5"
    ALLOW_DEMO_FALLBACK: bool = True

settings = Settings()
