import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "FitConnect Backend"
    VERSION: str = "1.0.0"
    ENV: str = os.getenv("ENV", "development")

    # ── Auth ──────────────────────────────────────────────────────────────
    # Single source of truth for JWT secrets across the entire app.
    # Set SECRET_KEY in your .env for production — never ship the default.
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretfitconnectkey")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    # ── CORS ─────────────────────────────────────────────────────────────
    # Comma-separated list of allowed origins, e.g.:
    # ALLOWED_ORIGINS=https://app.fitconnect.in,https://www.fitconnect.in
    ALLOWED_ORIGINS: list = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")

settings = Settings()
