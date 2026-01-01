from fastapi import APIRouter, HTTPException, Body, Depends
from typing import List, Optional
from sqlalchemy.orm import Session
from ..schemas import PatientProfile, PatientIntakeData, Medication as MedicationSchema, PatientFile as PatientFileSchema, MedicalRecord as MedicalRecordSchema
from ..database import get_db
from ..models import Patient as PatientModel, Medication as MedicationModel, PatientFile as PatientFileModel, MedicalRecord as MedicalRecordModel
import uuid

router = APIRouter()

@router.get("/search", response_model=List[PatientProfile])
async def search_patients(q: str, db: Session = Depends(get_db)):
    if not q:
        return []
    query = q.lower()
    # Simple case-insensitive search on name or identifier
    patients = db.query(PatientModel).filter(
        (PatientModel.name.ilike(f"%{query}%")) | 
        (PatientModel.identifier.ilike(f"%{query}%"))
    ).all()
    return patients

@router.get("/{patient_id}", response_model=PatientProfile)
async def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

from ..schemas import PatientUpdate
@router.patch("/{patient_id}", response_model=PatientProfile)
async def update_patient(patient_id: str, update: PatientUpdate, db: Session = Depends(get_db)):
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    if update.contact:
        patient.contact_info = update.contact.dict()
    if update.emergency_contact:
        patient.emergency_contact = update.emergency_contact.dict()
    if update.primary_care_physician:
        patient.primary_care_physician = update.primary_care_physician.dict()
    if update.allergies is not None:
        patient.allergies = update.allergies
    if update.baseline_illnesses is not None:
        patient.baseline_illnesses = update.baseline_illnesses
        
    db.commit()
    db.refresh(patient)
    return patient

@router.post("/{patient_id}/medications")
async def add_medication(patient_id: str, medication: MedicationSchema, db: Session = Depends(get_db)):
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    new_med = MedicationModel(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        name=medication.name,
        dosage=medication.dosage,
        frequency=medication.frequency
    )
    db.add(new_med)
    db.commit()
    return {"message": "Medication added"}

@router.post("/{patient_id}/files")
async def add_file(patient_id: str, file: PatientFileSchema, db: Session = Depends(get_db)):
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    new_file = PatientFileModel(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        name=file.name,
        type=file.type,
        upload_date=file.uploadDate,
        url=file.url
    )
    db.add(new_file)
    db.commit()
    return {"message": "File added"}

@router.get("/{patient_id}/records", response_model=List[MedicalRecordSchema])
async def get_patient_records(patient_id: str, db: Session = Depends(get_db)):
    records = db.query(MedicalRecordModel).filter(MedicalRecordModel.patient_id == patient_id).order_by(MedicalRecordModel.created_at.desc()).all()
    return records

from ..routes.auth import get_current_user
from ..models import User

@router.post("/intake", response_model=PatientIntakeData)
async def add_intake(data: PatientIntakeData, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if user already has a profile
    if current_user.patient_profile:
        raise HTTPException(status_code=400, detail="User already has a patient profile")

    # Map intake data to PatientModel
    new_patient = PatientModel(
        id=f"patient-{uuid.uuid4()}",
        user_id=current_user.id, # Link to user
        identifier=f"MRN-{uuid.uuid4().hex[:8].upper()}",
        name=f"{data.full_name.first_name} {data.full_name.last_name}",
        dob=data.dob,
        blood_type=data.blood_type or "Unknown", 
        allergies=data.allergies,
        baseline_illnesses=data.baseline_illnesses,
        contact_info=data.contact.dict(),
        emergency_contact=data.emergency_contact.dict(),
        primary_care_physician=data.primary_care_physician.dict()
    )
    db.add(new_patient)
    db.flush()
    
    # Update user to point to this profile (redundant if relationship is handled, but good for explicit ID if used)
    # The relationship 'back_populates' on PatientModel handles the Foreign Key 'user_id' we just set.
    # However, if User model has 'patient_profile_id' column distinct from the relationship, we should set it.
    # Looking at User model, it has 'id', 'name', 'email', 'role'... no explicit 'patient_profile_id' column shown in previous view_file of models.py.
    # But wait, schemas.py showed 'patient_profile_id' on User. Let's check models.py again later. 
    # For now, setting user_id on Patient is the Critical relational link.
    
    db.commit()
    db.refresh(new_patient)
    
@router.get("/{patient_id}/ai_summary")
async def get_patient_ai_summary(patient_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Gather data string
    # We can fetch cases too to make it comprehensive
    cases = db.query(CaseModel).filter(CaseModel.patient_id == patient_id).all()
    case_summaries = [f"Case {c.title}: {c.diagnosis} ({c.status})" for c in cases]
    
    profile_text = f"""
    Name: {patient.name}, Age: {patient.age}, Sex: {patient.sex}
    Baseline Illnesses: {', '.join(patient.baseline_illnesses or [])}
    Medications: {', '.join([m.name for m in patient.medications] if patient.medications else [])}
    Recent Cases: {'; '.join(case_summaries[-5:])}
    """
    
    from ..services.agent_service import agent_service
    system_instruction = agent_service.get_system_instruction(current_user.id, current_user.role, db)
    
    from ..routes.ai import API_KEY, DEFAULT_MODEL, genai
    if not API_KEY:
        return {"summary": "AI Service Unavailable"}
        
    try:
        model = genai.GenerativeModel(DEFAULT_MODEL, system_instruction=system_instruction)
        prompt = f"Summarize this patient's medical history and status in 3 concise bullet points for a dashboard view.\n\n{profile_text}"
        response = model.generate_content(prompt)
        return {"summary": response.text}
    except Exception as e:
        return {"summary": "Error generating summary."}
