from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth_router, cases_router, patients_router, ai_router, comments_router, users_router, dashboard_router

app = FastAPI(title="Intelligent Health API", version="0.1.0")

# CORS Configuration
origins = [
    "http://localhost:5173", # Vite default
    "http://localhost:3000",
    "https://intelligent-hospital.web.app",
    "https://intelligent-hospital.firebaseapp.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for now to avoid issues during dev, restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
# Include Routers
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(cases_router, prefix="/api/cases", tags=["Cases"])
app.include_router(patients_router, prefix="/api/patients", tags=["Patients"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI"])
app.include_router(comments_router, prefix="/api/comments", tags=["Comments"])
app.include_router(users_router, prefix="/api", tags=["Users"]) # Note: prefix is /api because routes are /users and /doctors
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# ... (previous code)

app.include_router(comments.router, prefix="/api/comments", tags=["Comments"])

# Serve Static Files (React App)
# Ensure 'static' directory exists or handle it gracefully
if os.path.exists("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
    # You might need to mount other folders if your build structure differs
    
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # api routes are already handled above because they are more specific (if defined correctly)
        # but to be safe, we can check if it starts with api
        if full_path.startswith("api"):
             raise HTTPException(status_code=404, detail="Not Found")
        
        file_path = f"static/{full_path}"
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Fallback to index.html for SPA routing
        return FileResponse("static/index.html")
else:
    @app.get("/")
    async def root():
        return {"message": "Intelligent Health API is running. Static files not found (dev mode)."}
