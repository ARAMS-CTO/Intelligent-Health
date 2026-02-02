from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from dotenv import load_dotenv

load_dotenv()
from .config import settings
from .routes import init_app
from .database import Base, engine
from .middleware.rate_limiter import RateLimitMiddleware, default_rate_limiter
from .middleware.compression import CompressionMiddleware

# Import all models to register them with Base before create_all
from . import models  # noqa: F401

# Create tables - DEFERRED to startup_event
# Base.metadata.create_all(bind=engine)

# Custom OpenAPI schema for better Swagger docs
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Intelligent Health API",
        version=settings.APP_VERSION,
        description="""
# Intelligent Health Platform API

## Overview
AI-powered healthcare platform with blockchain-secured medical records, 
FHIR R4 compliance, and real-time collaboration features.

## Authentication
Most endpoints require JWT authentication. Include the token in the `Authorization` header:
```
Authorization: Bearer <your_token>
```

## Rate Limiting
- **Standard endpoints**: 100 requests/minute, 2000 requests/hour
- **Auth endpoints**: 10 requests/minute, 50 requests/hour
- Rate limit headers are included in all responses

## Key Features
- 🏥 **Patient Management** - Complete medical records and health data
- 🤖 **AI Agents** - 10+ specialized healthcare AI agents
- 🔐 **Blockchain** - Concordium integration for secure data sharing
- 📊 **FHIR R4** - Healthcare interoperability standard support
- 📹 **Telemedicine** - Video consultation support
- 🔔 **Real-time** - WebSocket notifications and updates

## API Modules
| Module | Description |
|--------|-------------|
| `/api/auth` | Authentication, registration, OAuth |
| `/api/patients` | Patient profiles and health records |
| `/api/cases` | Clinical case management |
| `/api/ai` | AI analysis, agents, chat |
| `/api/appointments` | Scheduling and calendar |
| `/api/notifications` | User notifications |
| `/api/fhir` | FHIR R4 compatibility layer |
| `/api/concordium` | Blockchain wallet and ZKP |
| `/api/billing` | Payments and subscriptions |
| `/api/integrations` | Health device connections |
        """,
        routes=app.routes,
        tags=[
            {"name": "Authentication", "description": "User auth, OAuth, JWT tokens"},
            {"name": "Patients", "description": "Patient profiles and medical records"},
            {"name": "Cases", "description": "Clinical case management"},
            {"name": "AI", "description": "AI analysis, agents, and chat"},
            {"name": "Appointments", "description": "Scheduling and calendar"},
            {"name": "Notifications", "description": "User notifications"},
            {"name": "FHIR", "description": "FHIR R4 interoperability"},
            {"name": "Concordium", "description": "Blockchain and ZKP"},
            {"name": "Billing", "description": "Payments and credits"},
            {"name": "Integrations", "description": "Device and service integrations"},
            {"name": "WebSocket", "description": "Real-time connections"},
        ],
    )
    
    openapi_schema["info"]["x-logo"] = {
        "url": "/assets/logo.png"
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app = FastAPI(
    title="Intelligent Health API", 
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)
app.openapi = custom_openapi


# CORS Configuration
origins = settings.CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Rate Limiting Middleware
app.add_middleware(RateLimitMiddleware, rate_limiter=default_rate_limiter)

# Add Response Compression Middleware
app.add_middleware(CompressionMiddleware, min_size=500, compression_level=6)

# Add RBAC Middleware
from .middleware.rbac import RBACMiddleware
# Define protected routes and roles
role_permissions = {
    "/api/admin": ["Admin"],
    "/api/doctor": ["Doctor", "Admin"],
    "/api/patient": ["Patient", "Admin"],
    "/api/files/upload": ["Patient", "Doctor", "Admin"]
}
app.add_middleware(RBACMiddleware, role_map=role_permissions)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Google Sign-In compatibility
    response.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
    response.headers["Cross-Origin-Opener-Policy"] = "unsafe-none"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Content Security Policy - balanced for healthcare app with external integrations
    csp_directives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://www.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https: http:",
        "connect-src 'self' https://accounts.google.com https://apis.google.com https://*.googleapis.com wss: ws:",
        "frame-src 'self' https://accounts.google.com",
        "frame-ancestors 'self'",
        "form-action 'self'",
        "base-uri 'self'",
    ]
    response.headers["Content-Security-Policy"] = "; ".join(csp_directives)
    
    # Additional security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self)"

    # Cache Control
    path = request.url.path
    if path.endswith("service-worker.js"):
         response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    elif path.endswith("index.html") or path == "/":
         response.headers["Cache-Control"] = "no-cache, must-revalidate"

    return response


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "ok", 
        "service": "Intelligent Health API",
        "version": settings.APP_VERSION
    }


@app.on_event("startup")
async def startup_event():
    from .database import SessionLocal, engine
    from .seed_data import seed_agents, seed_users, seed_specialized_data
    from .models import User, AgentCapability
    
    # Create tables (deferred)
    try:
        print("Startup: Creating Tables...")
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Startup Table Creation Error: {e}")
    
    db = SessionLocal()
    try:
        # Auto-seed if empty (Ephemeral DB handling)
        if not db.query(User).first():
            print("Startup: Auto-seeding Users...")
            seed_users()
            
        # Always check/update agents on startup
        print("Startup: Checking Agents...")
        seed_agents(db)
        seed_specialized_data(db)
        
        # Start Background Scheduler
        from .services.scheduler import start_scheduler
        import asyncio
        asyncio.create_task(start_scheduler())
        
    except Exception as e:
        print(f"Startup Seed/Scheduler Error: {e}")
    finally:
        db.close()


# Include Routers via init_app
init_app(app)

from .routes import debug
app.include_router(debug.router, prefix="/api/debug", tags=["Debug"])

from .routes import newsletter
app.include_router(newsletter.router, prefix="/api", tags=["Newsletter"])

from .routes import hospital
app.include_router(hospital.router, prefix="/api", tags=["Hospital Integration"])

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Serve Static Files (React App)
try:
    os.makedirs("static/assets", exist_ok=True)
    os.makedirs("static/uploads", exist_ok=True)
except OSError:
    print("Warning: Could not create static directories (likely read-only filesystem)")

if os.path.exists("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
    app.mount("/uploads", StaticFiles(directory="static/uploads"), name="uploads")
    
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_react_app(full_path: str):
        if full_path.startswith("api"):
             raise HTTPException(status_code=404, detail="Not Found")
        
        file_path = f"static/{full_path}"
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        return FileResponse("static/index.html")
else:
    @app.get("/", include_in_schema=False)
    async def root():
        return {"message": "Intelligent Health API is running. Static files not found."}
