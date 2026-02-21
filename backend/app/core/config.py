from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Pumps SaaS"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "1.0.0"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dummy-secret-key-for-dev")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Supabase PostgreSQL URI (IPv4 Transaction Pooler)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres.vuatlnwjhvyfqcguealn:PumpsSaaS2026Master!Secure@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
    )

    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost",
        "http://127.0.0.1",
        "http://PEDRONITRO5:3000",
    ]
    
    FRONTEND_URL: str | None = None

    def get_cors_origins(self) -> List[str]:
        origins = self.BACKEND_CORS_ORIGINS.copy()
        if self.FRONTEND_URL:
            origins.append(self.FRONTEND_URL)
        return origins

    class Config:
        case_sensitive = True

settings = Settings()
