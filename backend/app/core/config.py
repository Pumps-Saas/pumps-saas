from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Pumps SaaS v2.0"
    API_V1_STR: str = "/api/v1"
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
