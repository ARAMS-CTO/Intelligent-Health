from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session
from ..schemas import User, DoctorProfile, Certification
from ..database import get_db
from ..models import User as UserModel, DoctorProfile as DoctorProfileModel

router = APIRouter()

from typing import List, Optional
from ..schemas import Role

from ..routes.auth import get_current_user

@router.get("/users", response_model=List[User])
async def get_users(role: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(UserModel)
    if role:
        query = query.filter(UserModel.role == role)
    return query.all()

@router.get("/doctors/{profile_id}", response_model=DoctorProfile)
async def get_doctor_profile(profile_id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if profile_id == "me":
        profile = db.query(DoctorProfileModel).filter(DoctorProfileModel.user_id == current_user.id).first()
    else:
        # Try finding by profile id first
        profile = db.query(DoctorProfileModel).filter(DoctorProfileModel.id == profile_id).first()
        # If not found, try finding by user_id
        if not profile:
             profile = db.query(DoctorProfileModel).filter(DoctorProfileModel.user_id == profile_id).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return profile

@router.put("/doctors/{profile_id}", response_model=DoctorProfile)
async def update_doctor_profile(profile_id: str, updates: DoctorProfile, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = None
    if profile_id == "me":
         profile = db.query(DoctorProfileModel).filter(DoctorProfileModel.user_id == current_user.id).first()
    else:
        profile = db.query(DoctorProfileModel).filter(DoctorProfileModel.id == profile_id).first()
        if not profile:
             profile = db.query(DoctorProfileModel).filter(DoctorProfileModel.user_id == profile_id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    # Authorization Check
    # Allow if it's their own profile OR they are Admin
    if profile.user_id != current_user.id and current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
    
    # Update fields
    if updates.specialty: profile.specialty = updates.specialty
    if updates.years_of_experience: profile.years_of_experience = updates.years_of_experience
    if updates.bio: profile.bio = updates.bio
    if updates.certifications: profile.certifications = [c.dict() for c in updates.certifications]
    if updates.profile_picture_url: profile.profile_picture_url = updates.profile_picture_url
    
    db.commit()
    db.refresh(profile)
    db.refresh(profile)
    return profile

from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
from ..schemas import UserUpdate, PasswordReset

@router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, updates: UserUpdate, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "Admin":
         raise HTTPException(status_code=403, detail="Only Admins can update users")
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if updates.name: user.name = updates.name
    if updates.role: user.role = updates.role
    
    db.commit()
    db.refresh(user)
    return user

@router.post("/users/{user_id}/reset-password")
async def reset_password(user_id: str, payload: PasswordReset, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "Admin":
         raise HTTPException(status_code=403, detail="Only Admins can reset passwords")
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = pwd_context.hash(payload.new_password)
    db.commit()
    return {"message": "Password reset successfully"}

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    # Only Admin can delete users
    if current_user.role != "Admin":
         raise HTTPException(status_code=403, detail="Only Admins can delete users")

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


from pydantic import BaseModel
class ConsentUpdate(BaseModel):
    gdpr_consent: bool
    data_sharing_consent: bool
    marketing_consent: bool

@router.post("/users/me/consents")
async def update_consents(consents: ConsentUpdate, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == current_user.id).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")

    user.gdpr_consent = consents.gdpr_consent
    user.data_sharing_consent = consents.data_sharing_consent
    user.marketing_consent = consents.marketing_consent
    
    if consents.gdpr_consent and not user.accepted_privacy_policy_at:
        import datetime
        user.accepted_privacy_policy_at = datetime.datetime.utcnow()
        
    db.commit()
    return {"status": "success", "message": "Consents updated"}
