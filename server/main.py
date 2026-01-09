from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()
from .config import settings
from .routes import init_app
from .database import Base, engine

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Intelligent Health API", version=settings.APP_VERSION)


# CORS Configuration
origins = settings.CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Allow Google Sign-In popup to communicate back
    # Remove COOP to default to unsafe-none effectively
    response.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
    response.headers["Referrer-Policy"] = "no-referrer-when-downgrade"

    # Cache Control
    path = request.url.path
    if path.endswith("service-worker.js"):
         response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    elif path.endswith("index.html") or path == "/":
         response.headers["Cache-Control"] = "no-cache, must-revalidate"

    return response

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Intelligent Health API"}

@app.on_event("startup")
async def startup_event():
    from .database import SessionLocal
    from .seed_data import seed_agents, seed_users
    from .models import User, AgentCapability
    
    db = SessionLocal()
    try:
        # Auto-seed if empty (Ephemeral DB handling)
        if not db.query(User).first():
            print("Startup: Auto-seeding Users...")
            seed_users()
            
        if not db.query(AgentCapability).first():
            print("Startup: Auto-seeding Agents...")
            seed_agents()
    except Exception as e:
        print(f"Startup Seed Error: {e}")
    finally:
        db.close()

# Include Routers via init_app
init_app(app)

from .routes import debug
app.include_router(debug.router, prefix="/api/debug")

from .routes import newsletter
app.include_router(newsletter.router, prefix="/api")

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Serve Static Files (React App)
# Serve Static Files (React App)
os.makedirs("static/assets", exist_ok=True)
os.makedirs("static/uploads", exist_ok=True)

if os.path.exists("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
    app.mount("/uploads", StaticFiles(directory="static/uploads"), name="uploads")
    
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if full_path.startswith("api"):
             raise HTTPException(status_code=404, detail="Not Found")
        
        file_path = f"static/{full_path}"
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        return FileResponse("static/index.html")
else:
    @app.get("/")
    async def root():
        return {"message": "Intelligent Health API is running. Static files not found."}
