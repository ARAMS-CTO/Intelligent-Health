from fastapi import APIRouter, HTTPException, Body, Depends
from typing import List, Optional
from sqlalchemy.orm import Session
from ..schemas import PatientProfile, PatientIntakeData, Medication as MedicationSchema, PatientFile as PatientFileSchema
from ..database import get_db
from ..models import Patient as PatientModel, Medication as MedicationModel, PatientFile as PatientFileModel
import uuid

router = APIRouter()

@router.get("/{patient_id}", response_model=PatientProfile)
async def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

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

@router.post("/intake", response_model=PatientIntakeData)
async def add_intake(data: PatientIntakeData, db: Session = Depends(get_db)):
    # Map intake data to PatientModel
    new_patient = PatientModel(
        id=f"patient-{uuid.uuid4()}",
        identifier=f"MRN-{uuid.uuid4().hex[:8].upper()}",
        name=f"{data.fullName.firstName} {data.fullName.lastName}",
        dob=data.dob,
        blood_type=data.blood_type or "Unknown", 
        allergies=data.allergies,
        baseline_illnesses=data.baseline_illnesses,
        contact_info=data.contact.dict(),
        emergency_contact=data.emergencyContact.dict(),
        primary_care_physician=data.primaryCarePhysician.dict()
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    
    return {**data.dict(), "id": new_patient.id}
