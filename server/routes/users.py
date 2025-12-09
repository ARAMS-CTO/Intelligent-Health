from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session
from ..schemas import User, DoctorProfile, Certification
from ..database import get_db
from ..models import User as UserModel

router = APIRouter()

# Mock Data for Doctor Profiles
MOCK_DOCTOR_PROFILES = [
    {
        "id": "doc-profile-1",
        "userId": "user-doc-1",
        "specialty": "Cardiology",
        "yearsOfExperience": 12,
        "bio": "Dr. Evelyn Reed is a board-certified cardiologist with over a decade of experience in managing complex cardiovascular conditions.",
        "certifications": [
            {"id": "cert-1", "name": "Board Certified in Cardiology", "issuingBody": "American Board of Internal Medicine", "year": 2012, "url": "#"},
            {"id": "cert-2", "name": "Advanced Cardiac Life Support (ACLS)", "issuingBody": "American Heart Association", "year": 2023, "url": "#"},
        ],
        "profilePictureUrl": "",
    },
    {
        "id": "doc-profile-sanati",
        "userId": "user-doc-google",
        "specialty": "Cardiology",
        "yearsOfExperience": 18,
        "bio": "Dr. Hamidreza Sanati is a distinguished Cardiologist at Fakeeh University Hospital in Dubai, UAE. He is a leader in interventional cardiology.",
        "certifications": [
            {"id": "cert-3", "name": "Fellow of the American College of Cardiology (FACC)", "issuingBody": "American College of Cardiology", "year": 2008, "url": "#"},
            {"id": "cert-4", "name": "Board Certified in Interventional Cardiology", "issuingBody": "American Board of Internal Medicine", "year": 2006, "url": "#"},
        ],
        "profilePictureUrl": "https://i.pravatar.cc/150?u=doc-profile-sanati",
    }
]

@router.get("/users", response_model=List[User])
async def get_users(db: Session = Depends(get_db)):
    users = db.query(UserModel).all()
    return users

@router.get("/doctors/{profile_id}", response_model=DoctorProfile)
async def get_doctor_profile(profile_id: str):
    profile = next((p for p in MOCK_DOCTOR_PROFILES if p["id"] == profile_id), None)
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return profile

@router.put("/doctors/{profile_id}", response_model=DoctorProfile)
async def update_doctor_profile(profile_id: str, updates: DoctorProfile):
    # In a real app, we would update the DB. Here we just mock it.
    profile_idx = next((i for i, p in enumerate(MOCK_DOCTOR_PROFILES) if p["id"] == profile_id), -1)
    if profile_idx == -1:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    # Update mock data (simplified)
    MOCK_DOCTOR_PROFILES[profile_idx] = updates.dict()
    return MOCK_DOCTOR_PROFILES[profile_idx]
