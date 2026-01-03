from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()
from .routes import init_app
from .database import Base, engine

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Intelligent Health API", version="0.1.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "unsafe-none"
    return response

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Intelligent Health API"}

# Include Routers via init_app
init_app(app)

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
