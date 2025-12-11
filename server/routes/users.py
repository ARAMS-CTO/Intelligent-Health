from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session
from ..schemas import User, DoctorProfile, Certification
from ..database import get_db
from ..models import User as UserModel, DoctorProfile as DoctorProfileModel

router = APIRouter()

# Mock Data for Doctor Profiles
@router.get("/users", response_model=List[User])
async def get_users(db: Session = Depends(get_db)):
    users = db.query(UserModel).all()
    return users

@router.get("/doctors/{profile_id}", response_model=DoctorProfile)
async def get_doctor_profile(profile_id: str, db: Session = Depends(get_db)):
    # Try finding by profile id first
    profile = db.query(DoctorProfileModel).filter(DoctorProfileModel.id == profile_id).first()
    
    # If not found, try finding by user_id (since frontend might be passing user_id as profile_id in some contexts)
    if not profile:
         profile = db.query(DoctorProfileModel).filter(DoctorProfileModel.user_id == profile_id).first()

    if not profile:
        # Check if user exists but has no profile, maybe create empty one?
        # For now, return 404
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return profile

@router.put("/doctors/{profile_id}", response_model=DoctorProfile)
async def update_doctor_profile(profile_id: str, updates: DoctorProfile, db: Session = Depends(get_db)):
    profile = db.query(DoctorProfileModel).filter(DoctorProfileModel.id == profile_id).first()
    if not profile:
         profile = db.query(DoctorProfileModel).filter(DoctorProfileModel.user_id == profile_id).first()
         
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    # Update fields
    profile.specialty = updates.specialty
    profile.years_of_experience = updates.years_of_experience
    profile.bio = updates.bio
    profile.certifications = [c.dict() for c in updates.certifications]
    profile.profile_picture_url = updates.profile_picture_url
    
    db.commit()
    db.refresh(profile)
    return profile
