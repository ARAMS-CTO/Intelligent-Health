from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import DataShareLink, Patient, User, MedicalRecord
from ..schemas import MedicalRecord as MedicalRecordSchema
from ..routes.auth import get_current_user
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

router = APIRouter()

class ShareConfig(BaseModel):
    duration_minutes: int
    permissions: Dict[str, Any] # {history: bool, meds: bool, records: List[str]}

class ShareLinkResponse(BaseModel):
    link: str
    qr_code_url: str
    expires_at: datetime

class SharedDataView(BaseModel):
    patient_name: str
    generated_at: datetime
    expires_at: datetime
    sections: Dict[str, Any] # Dynamic content based on permissions

@router.post("/generate", response_model=ShareLinkResponse)
def generate_share_link(config: ShareConfig, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "Patient" or not current_user.patient_profile_id:
        raise HTTPException(status_code=403, detail="Only patients can share data.")
    
    expires = datetime.utcnow() + timedelta(minutes=config.duration_minutes)
    token = str(uuid.uuid4())
    
    link = DataShareLink(
        id=token,
        patient_id=current_user.patient_profile_id,
        permissions=config.permissions,
        expires_at=expires,
        created_at=datetime.utcnow()
    )
    db.add(link)
    db.commit()
    
    # In a real app, use the actual frontend URL from config
    # For now, we construct relative or assumed URL
    base_url = "https://intelligent-health-app-jsc5mqgzua-uc.a.run.app" 
    full_link = f"{base_url}/shared/{token}"
    
    # Simple QR API (Google Charts is deprecated but reliable for demos, or use frontend rendering)
    # We return the link, frontend renders QR.
    
    return {
        "link": full_link,
        "qr_code_url": "", # Frontend will generate
        "expires_at": expires
    }

@router.get("/view/{token}", response_model=SharedDataView)
def view_shared_data(token: str, db: Session = Depends(get_db)):
    link = db.query(DataShareLink).filter(DataShareLink.id == token).first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
        
    if link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="link expired")
        
    # Track access (optional)
    link.access_count += 1
    db.commit()
    
    patient = db.query(Patient).filter(Patient.id == link.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient data unavailable")
        
    perms = link.permissions or {}
    
    data = {
        "patient_name": patient.name,
        "generated_at": link.created_at,
        "expires_at": link.expires_at,
        "sections": {}
    }
    
    # Populate based on permissions
    if perms.get("history"):
        data["sections"]["history"] = {
            "baseline_illnesses": patient.baseline_illnesses,
            "allergies": patient.allergies
        }
        
    if perms.get("medications"):
        data["sections"]["medications"] = [
            {"name": m.name, "dosage": m.dosage, "frequency": m.frequency} 
            for m in patient.medications
        ]
        
    if perms.get("records") and isinstance(perms["records"], list):
        # Fetch specific records
        records = db.query(MedicalRecord).filter(
            MedicalRecord.id.in_(perms["records"]),
            MedicalRecord.patient_id == patient.id
        ).all()
        
        data["sections"]["records"] = [
            {
                "title": r.title,
                "type": r.type,
                "summary": r.ai_summary,
                "date": r.created_at,
                "url": r.file_url 
             } for r in records
        ]

class EmergencyDataResponse(BaseModel):
    name: str
    dob: str
    blood_type: str
    allergies: List[str]
    baseline_illnesses: List[str]
    emergency_contacts: List[Dict[str, str]]
    primary_care_physician: Dict[str, str]

@router.get("/emergency/{patient_id}", response_model=EmergencyDataResponse)
def get_emergency_profile(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    if not patient:
         raise HTTPException(status_code=404, detail="Patient not found")
         
    settings = patient.privacy_settings or {}
    if not settings.get("emergency_enabled", False):
         raise HTTPException(status_code=403, detail="Emergency Access Disabled")
         
    return {
        "name": patient.name,
        "dob": patient.dob,
        "blood_type": patient.blood_type,
        "allergies": patient.allergies or [],
        "baseline_illnesses": patient.baseline_illnesses or [],
        "emergency_contacts": patient.emergency_contact or [], # Assuming list of dicts or single dict? Model says JSON.
        # Frontend EXPECTS LIST. Backend model `emergency_contact` is JSON.
        # Let's verify `models.py` structure or standardize. 
        # `models.py`: `emergency_contact = Column(JSON) # {name, relationship, phone}` -> Singular object or list?
        # Use `[patient.emergency_contact]` if it's a dict, or pass if list.
        # Safer: ensure list.
        # But wait, frontend `EmergencyView` expects list: `data.emergency_contacts.map`.
        # I'll wrap in list if dict.
        "emergency_contacts": [patient.emergency_contact] if isinstance(patient.emergency_contact, dict) else (patient.emergency_contact or []),
        "primary_care_physician": patient.primary_care_physician or {"name": "Unknown", "phone": ""}
    }
