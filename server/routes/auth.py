from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..schemas import User, Role

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    role: str

# Mock Users Database (Moved from frontend)
MOCK_USERS = [
    {"id": "user-doc-1", "name": "Dr. Evelyn Reed", "email": "e.reed@hospital.com", "role": Role.Doctor, "level": 5, "credits": 1250, "doctorProfileId": "doc-profile-1"},
    {"id": "user-doc-google", "name": "Dr. Hamidreza Sanati", "email": "h.sanati@google.com", "role": Role.Doctor, "level": 9, "credits": 4000, "doctorProfileId": "doc-profile-sanati"},
    {"id": "user-spec-1", "name": "Dr. Kenji Tanaka", "email": "k.tanaka@hospital.com", "role": Role.Specialist, "level": 8, "credits": 3400},
    {"id": "user-rad-1", "name": "Dr. Anya Sharma", "email": "a.sharma@hospital.com", "role": Role.Radiologist, "level": 6, "credits": 1500},
    {"id": "user-nurse-1", "name": "Nurse David Chen", "email": "d.chen@hospital.com", "role": Role.Nurse, "level": 4, "credits": 800},
    {"id": "user-patient-1", "name": "John Doe", "email": "j.doe@email.com", "role": Role.Patient, "level": 2, "credits": 150, "patientProfileId": "patient-1"},
    {"id": "user-patient-aram", "name": "Aram Ghannadzadeh", "email": "a.ghannadzadeh@email.com", "role": Role.Patient, "level": 1, "credits": 100, "patientProfileId": "patient-aram-1"},
    {"id": "user-admin-1", "name": "Sarah Jenkins", "email": "s.jenkins@hospital.com", "role": Role.Admin, "level": 10, "credits": 99999},
    {"id": "user-ai-1", "name": "Case Analysis AI", "email": "ai@hospital.com", "role": Role.AIEngineer, "level": 99, "credits": float('inf')},
]

@router.post("/login", response_model=User)
async def login(request: LoginRequest):
    # Special case for specific google user
    if request.email == 'h.sanati@google.com':
        user = next((u for u in MOCK_USERS if u["email"] == 'h.sanati@google.com'), None)
        if user:
            return user
            
    # Find by role for demo purposes if not specific user
    user = next((u for u in MOCK_USERS if u["role"] == request.role), None)
    
    if user:
        # Create a session-like user object with the requested email
        return {**user, "email": request.email, "name": user.get("name") or request.email.split('@')[0]}
    
    # Fallback create new user
    return {
        "id": f"user-{request.email}",
        "name": request.email.split('@')[0],
        "email": request.email,
        "role": request.role,
        "level": 1,
        "credits": 100,
    }
