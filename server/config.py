from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Security
    SECRET_KEY: str = "supersecretkey" # Default for dev, override in env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://intelligent-health-app-jsc5mqgzua-uc.a.run.app", # Actual Deployed URL
        "https://intelligent-health-ai.web.app"
    ]
    
    # External Services
    GOOGLE_CLIENT_ID: Optional[str] = None
    STRIPE_PUBLIC_KEY: Optional[str] = None
    STRIPE_PRIVATE_KEY: Optional[str] = None
    FRONTEND_URL: str = "http://localhost:5173"
    
    # App Info
    APP_VERSION: str = "0.1.4"
    
    # AI / Gemini
    GEMINI_API_KEY: Optional[str] = None
    GOOGLE_CLOUD_PROJECT: str = "intelligent-health-ai"
    VERTEX_AI_INDEX_ENDPOINT: Optional[str] = None

    # Database
    DB_USER: str = "postgres"
    DB_PASS: str = "YourStrongPassword123!"
    DB_NAME: str = "postgres"
    INSTANCE_CONNECTION_NAME: Optional[str] = None
    DATABASE_URL: Optional[str] = None
    
    # Stripe
    # Note: STRIPE_PRIVATE_KEY is aliased to STRIPE_SECRET_KEY for backward compat if needed, 
    # but we'll stick to one naming convention in the class.
    STRIPE_SECRET_KEY: Optional[str] = None

    # PayPal
    PAYPAL_CLIENT_ID: Optional[str] = None
    PAYPAL_CLIENT_SECRET: Optional[str] = None
    
    # Storage
    GCS_BUCKET_NAME: Optional[str] = None

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"
    }
    
    # Validation Hook to ensure critical keys exist or warn?
    # Pydantic validates on instantiation.

settings = Settings()
