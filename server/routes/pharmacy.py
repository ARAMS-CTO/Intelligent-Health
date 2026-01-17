from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid
from ..database import get_db
from ..database import get_db
import server.models as models
from ..schemas import Role, Prescription as PrescriptionSchema
# Prescription, User, Patient accessed via models.*
# SystemLog accessed via models.SystemLog
from ..routes.auth import get_current_user

router = APIRouter()

# Schemas
class PrescriptionCreate(BaseModel):
    patient_id: str
    case_id: Optional[str] = None
    medication_name: str
    dosage: str
    frequency: str
    duration: str
    notes: Optional[str] = None

# ... imports ...
from server.agents.orchestrator import orchestrator

class PrescriptionUpdate(BaseModel):
    status: str

class InteractionCheckRequest(BaseModel):
    patient_id: str
    medication_name: str
    dosage: str

@router.post("/check_interaction")
async def check_interaction(
    request: InteractionCheckRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uses the AI Agent to check for drug-drug or drug-condition interactions.
    """
    # 1. Fetch Patient Context
    patient = db.query(models.Patient).filter(models.Patient.id == request.patient_id).first()
    if not patient:
         return {"status": "unknown", "message": "Patient not found"}
         
    # 2. Construct Payload for Agent
    existing_meds = [m.name for m in patient.medications]
    conditions = patient.baseline_illnesses or []
    
    payload = {
        "query": f"Check interactions for {request.medication_name} ({request.dosage})",
        "case_data": f"Patient Meds: {existing_meds}. Conditions: {conditions}. Allergies: {patient.allergies}",
        "medication": request.medication_name
    }
    
    # 3. Dispatch to Nurse or Doctor Agent
    context = {"user_id": current_user.id}
    result = await orchestrator.dispatch("check_drug_interaction", payload, context, db)
    
    return result

@router.post("/prescribe", response_model=PrescriptionSchema)
async def create_prescription(
    request: PrescriptionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["Doctor", "Admin"]:
        raise HTTPException(status_code=403, detail="Only doctors can prescribe medication")
        
    new_rx = models.Prescription(
        id=f"rx-{uuid.uuid4()}",
        patient_id=request.patient_id,
        case_id=request.case_id,
        doctor_id=current_user.id,
        medication_name=request.medication_name,
        dosage=request.dosage,
        frequency=request.frequency,
        duration=request.duration,
        notes=request.notes,
        status="Pending"
    )
    
    db.add(new_rx)
    
    # Audit
    try:
        db.add(models.SystemLog(
            event_type="prescription_created",
            user_id=current_user.id,
            details={"rx_id": new_rx.id, "medication": new_rx.medication_name}
        ))
    except:
        pass
        
    db.commit()
    db.refresh(new_rx)
    return new_rx

@router.get("/queue", response_model=List[PrescriptionSchema])
async def get_pharmacy_queue(
    status: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["Pharmacist", "Admin", "Doctor"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    prescriptions = db.query(models.Prescription).options(
        joinedload(models.Prescription.patient), 
        joinedload(models.Prescription.doctor)
    ).filter(models.Prescription.status == "Pending").all()
        
    return prescriptions

@router.patch("/{rx_id}/status", response_model=PrescriptionSchema)
async def update_prescription_status(
    rx_id: str,
    update: PrescriptionUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["Pharmacist", "Admin"]:
        raise HTTPException(status_code=403, detail="Only pharmacists can update status")
        
    rx = db.query(models.Prescription).filter(models.Prescription.id == rx_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
        
    rx.status = update.status
    if update.status == "Dispensed":
        rx.dispensed_at = datetime.utcnow()
        
    # Audit
    try:
        db.add(models.SystemLog(
            event_type="prescription_status_update",
            user_id=current_user.id,
            details={"rx_id": rx.id, "new_status": update.status}
        ))
    except:
        pass
        
    db.commit()
    return rx
