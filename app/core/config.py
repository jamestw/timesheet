import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./sql_app.db"
    SECRET_KEY: str = "your_12541_super_secret_key_for_dev"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 days

    # PostgreSQL Configuration
    POSTGRES_DB: Optional[str] = None
    POSTGRES_USER: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_HOST: Optional[str] = None

    # Environment Configuration
    ENVIRONMENT: Optional[str] = None
    VPS_IP: Optional[str] = None
    BACKEND_PORT: Optional[str] = None
    FRONTEND_PORT: Optional[str] = None
    DOMAIN: Optional[str] = None
    EMAIL: Optional[str] = None
    SSL_EMAIL: Optional[str] = None
    ADMIN_PASSWORD: Optional[str] = None

    # Optional environment override
    VITE_API_BASE_URL: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # 允許額外的字段

settings = Settings()

# Print config on import for debugging
print(f"Config loaded - SECRET_KEY: {settings.SECRET_KEY[:10]}...")
print(f"Config loaded - DATABASE_URL: {settings.DATABASE_URL}")