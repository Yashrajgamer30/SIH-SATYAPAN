import os
from pydantic_settings import BaseSettings
from typing import List

# Compute stable absolute path to backend/satyapan.db regardless of process CWD
_BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_DEFAULT_DB_PATH = os.path.join(_BASE_DIR, "satyapan.db").replace("\\", "/")


class Settings(BaseSettings):
    PROJECT_NAME: str = "AICTE SATYAPAN"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{_DEFAULT_DB_PATH}")
    SYNC_DATABASE_URL: str = os.getenv("SYNC_DATABASE_URL", f"sqlite:///{_DEFAULT_DB_PATH}")

    # Security & JWT Tokens
    SECRET_KEY: str = os.getenv("SECRET_KEY", "aicte-satyapan-grand-finals-secret-key-2026-prod-grade")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15 # Mandated 15 min access token
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # AES-256-GCM Storage Key (32 bytes = 256 bits, hex-encoded)
    AES_STORAGE_KEY_HEX: str = os.getenv("AES_STORAGE_KEY_HEX", "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0")

    # Operational & Hackathon Flags
    DEMO_MODE: bool = True
    MAX_REQUEST_SIZE_BYTES: int = 15 * 1024 * 1024 # 15MB limit
    RATE_LIMIT_DEFAULT: str = "100/minute"

    # Storage Paths
    STORAGE_DIR: str = os.path.abspath(os.path.join(_BASE_DIR, "storage_vault"))

    # CORS Allow-list
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()

# Ensure encrypted storage directory exists
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
