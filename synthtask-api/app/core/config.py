"""
Configurações da aplicação Sintask.
"""
import os
from typing import Optional


class Settings:
    # API Settings
    APP_NAME: str = "Sintask API v2"
    VERSION: str = "2.0.0"
    
    # Google Gemini API
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "SUA_API_KEY_AQUI")
    
    # Database URLs
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    POSTGRES_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/sintask")
    
    # JWT Configuration
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_DAYS: int = 7

    # Encryption secret for credential storage (defaults to JWT_SECRET)
    ENCRYPTION_SECRET: str = os.getenv("ENCRYPTION_SECRET", JWT_SECRET)
    
    # CORS Settings
    CORS_ORIGINS: list = ["http://localhost:3001", "http://localhost:3000"]
    
    # Server Settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Database Names
    MONGODB_DATABASE: str = "sintask_db"
    MONGODB_COLLECTION: str = "meetings"


# Global settings instance
settings = Settings()