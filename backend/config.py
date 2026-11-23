"""Application configuration for the Authentication backend."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


class Config:
    """Default configuration values for Flask and SQLite."""

    SECRET_KEY = os.environ.get("AUTH_SECRET_KEY", "dev-auth-module-secret-key-2025")
    DB_PATH = os.environ.get("AUTH_DB_PATH", str(BASE_DIR / "auth.db"))
    TOKEN_TTL_SECONDS = int(os.environ.get("AUTH_TOKEN_TTL", "3600"))
    RESET_TOKEN_TTL_SECONDS = int(os.environ.get("AUTH_RESET_TTL", "900"))
