import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./sql_app.db"
    SECRET_KEY: str = "your_12541_super_secret_key_for_dev"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Optional environment override
    VITE_API_BASE_URL: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Print config on import for debugging
print(f"Config loaded - SECRET_KEY: {settings.SECRET_KEY[:10]}...")
print(f"Config loaded - DATABASE_URL: {settings.DATABASE_URL}")