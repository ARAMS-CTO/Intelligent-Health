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
    if updates.clinic_name: profile.clinic_name = updates.clinic_name
    if updates.clinic_address: profile.clinic_address = updates.clinic_address
    if updates.clinic_coordinates: profile.clinic_coordinates = updates.clinic_coordinates
    if updates.service_prices: profile.service_prices = updates.service_prices
    if updates.clinic_logo_url: profile.clinic_logo_url = updates.clinic_logo_url
    if updates.website: profile.website = updates.website
    if updates.opening_hours: profile.opening_hours = updates.opening_hours
    if updates.sub_specialties: profile.sub_specialties = updates.sub_specialties
    
    db.commit()
    db.refresh(profile)
    db.refresh(profile)
    return profile

from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt", "pbkdf2_sha256"], deprecated="auto")
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

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.post("/users/{user_id}/ban")
async def ban_user(user_id: str, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "Admin":
         raise HTTPException(status_code=403, detail="Only Admins can ban users")
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = False
    db.commit()
    return {"message": "User banned"}


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

# --- Family Management ---
from ..models import FamilyGroup, FamilyMember, Patient

@router.get("/users/me/family")
async def get_my_family(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    # Find groups where user is a member
    memberships = db.query(FamilyMember).filter(FamilyMember.user_id == current_user.id).all()
    
    # Also find groups owned by user
    my_group = db.query(FamilyGroup).filter(FamilyGroup.owner_id == current_user.id).first()
    
    if not my_group and not memberships:
         return []
    
    # Use the group owned by user if valid, else the first group they are in
    group_id = my_group.id if my_group else memberships[0].group_id
         
    # Get all members of this group
    members = db.query(FamilyMember).filter(FamilyMember.group_id == group_id).all()
    
    results = []
    for m in members:
        # If member is linked to a user, get user details
        m_user = None
        if m.user_id:
             m_user = db.query(UserModel).filter(UserModel.id == m.user_id).first()
             
        results.append({
            "id": m.user_id or m.patient_id, # Fallback
            "role": m.relationship,
            "name": m.name or (m_user.name if m_user else "Unknown"),
            "access_level": "FULL" if m.relationship in ['Parent', 'Self'] else "READ_ONLY"
        })
    return results

class AddChildRequest(BaseModel):
    name: str
    dob: str
    gender: str

@router.post("/users/me/family")
async def add_child_account(child: AddChildRequest, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Ensure Group Exists
    group = db.query(FamilyGroup).filter(FamilyGroup.owner_id == current_user.id).first()
    if not group:
        import uuid
        group = FamilyGroup(
            id=str(uuid.uuid4()),
            name=f"{current_user.name}'s Family",
            owner_id=current_user.id
        )
        db.add(group)
        db.commit()
        
        # Add self as Parent
        me_mem = FamilyMember(
            id=str(uuid.uuid4()),
            group_id=group.id,
            user_id=current_user.id,
            name=current_user.name,
            relationship="Parent",
            can_view_records=True
        )
        db.add(me_mem)
        db.commit()
        
    # 2. Create Child User and Patient
    import uuid
    child_user_id = str(uuid.uuid4())
    child_patient_id = str(uuid.uuid4())
    
    # Create User
    new_user = UserModel(
        id=child_user_id,
        name=child.name,
        email=f"child-{child_user_id[:8]}@intelligenthealth.ai", 
        role="Child",
        level=1,
        credits=0
    )
    db.add(new_user)
    
    # Create Patient Profile
    new_patient = Patient(
        id=child_patient_id,
        user_id=child_user_id,
        name=child.name,
        dob=child.dob,
        sex=child.gender,
        identifier=f"CHI-{child_user_id[:8].upper()}"
    )
    db.add(new_patient)
    
    # Add to Family
    new_member = FamilyMember(
        id=str(uuid.uuid4()),
        group_id=group.id,
        user_id=child_user_id,
        patient_id=child_patient_id,
        name=child.name,
        relationship="Child",
        can_view_records=False 
    )
    db.add(new_member)
    
    db.commit()
    
    return {"status": "success", "child_id": child_user_id, "name": child.name}
