"""
EmotiSound Flask Backend Configuration
Defines server configurations, database paths, CORS origins, and upload limits.
"""

from pathlib import Path
import os

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
INSTANCE_DIR = PROJECT_ROOT / "instance"
INSTANCE_DIR.mkdir(parents=True, exist_ok=True)

UPLOADS_DIR = BACKEND_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


class Config:
    """Base application configuration."""
    SECRET_KEY = os.getenv("SECRET_KEY", "emotisound-development-secret-key-2026")
    DATABASE_PATH = INSTANCE_DIR / "emotisound.db"
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{DATABASE_PATH.as_posix()}"
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024  # 20 MB max payload
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    UPLOAD_FOLDER = str(UPLOADS_DIR)
    DEBUG = False
    TESTING = False


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    DATABASE_PATH = INSTANCE_DIR / "test_emotisound.db"
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{DATABASE_PATH.as_posix()}"
