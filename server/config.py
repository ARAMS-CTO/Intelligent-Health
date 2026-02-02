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
        "https://intelligent-health-ai.web.app",
        "https://intelligenthealth.world",
        "https://www.intelligenthealth.world"
    ]
    
    # External Services
    GOOGLE_CLIENT_ID: Optional[str] = None
    STRIPE_PUBLIC_KEY: Optional[str] = None
    STRIPE_PRIVATE_KEY: Optional[str] = None
    FRONTEND_URL: str = "http://localhost:5173"
    
    # App Info
    APP_VERSION: str = "2.2.0"
    
    # AI / Gemini
    GEMINI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # Feature Flags
    GOOGLE_CLOUD_PROJECT: str = "intelligent-health-ai"
    VERTEX_AI_INDEX_ENDPOINT: Optional[str] = None

    # Database
    DB_USER: str = "postgres"
    DB_PASS: str = "YourStrongPassword123!"
    DB_NAME: str = "postgres"
    INSTANCE_CONNECTION_NAME: Optional[str] = None
    DATABASE_URL: Optional[str] = None
    
    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None

    # PayPal
    PAYPAL_CLIENT_ID: Optional[str] = None
    PAYPAL_CLIENT_SECRET: Optional[str] = None
    
    # Storage
    GCS_BUCKET_NAME: Optional[str] = None
    
    # Concordium Blockchain
    CONCORDIUM_NODE_URL: str = "https://grpc.testnet.concordium.com:20000"
    CONCORDIUM_CONTRACT_ADDRESS: Optional[str] = None
    CONCORDIUM_CONTRACT_INDEX: Optional[int] = None
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 100
    RATE_LIMIT_REQUESTS_PER_HOUR: int = 2000
    RATE_LIMIT_BURST_ALLOWANCE: int = 20

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"
    }

settings = Settings()

