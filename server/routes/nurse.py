from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
import server.models as models
from .auth import get_current_user
from ..schemas import MedicalRecord as MedicalRecordSchema

router = APIRouter()

class NurseTaskUpdate(BaseModel):
    notes: Optional[str] = None
    vitals: Optional[dict] = None # {systolic, diastolic, heart_rate...}
    file_url: Optional[str] = None
    file_type: Optional[str] = "Document" # 'ECG', 'Vitals', 'Lab'

class LinkDoctorRequest(BaseModel):
    doctor_id: str

@router.post("/link_doctor")
async def link_doctor(
    request: LinkDoctorRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["Nurse", "Admin"]:
         raise HTTPException(403, "Nurse access only")
         
    # Create or update assignment
    # Check if already linked
    existing = db.query(models.NurseAssignment).filter(
        models.NurseAssignment.nurse_id == current_user.id,
        models.NurseAssignment.doctor_id == request.doctor_id
    ).first()
    
    if existing:
        return {"message": "Already linked"}
        
    import uuid
    new_assign = models.NurseAssignment(
        id=str(uuid.uuid4()),
        nurse_id=current_user.id,
        doctor_id=request.doctor_id,
        status="Active",
        start_date=datetime.utcnow()
    )
    db.add(new_assign)
    db.commit()
    return {"message": "Linked successfully"}

@router.get("/tasks")
async def get_nurse_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get list of pending tasks for nurses. 
    In a real system, filters by ward or assigned doctor.
    Here we return all pending CarePlanTasks for demo.
    """
    if current_user.role not in ["Nurse", "Admin"]:
        raise HTTPException(403, "Nurse access only")
        
    # Join with Patient to get name
    tasks = db.query(models.CarePlanTask).join(models.CarePlanGoal).join(models.CarePlan).join(models.Patient)\
        .filter(models.CarePlanTask.is_completed == False)\
        .all()
        
    # Serialize manually for quick mapping (or use Schema)
    res = []
    for t in tasks:
        patient = t.goal.care_plan.patient
        res.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "patient_name": patient.name,
            "patient_id": patient.id,
            "due_date": t.due_date,
            "priority": t.goal.priority
        })
    
    return res

@router.post("/tasks/{task_id}/execute")
async def execute_task(
    task_id: str,
    payload: NurseTaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Mark task as done and log resulting data (Vitals/Files).
    """
    if current_user.role not in ["Nurse", "Admin"]:
        raise HTTPException(403, "Nurse access only")
        
    task = db.query(models.CarePlanTask).filter(models.CarePlanTask.id == task_id).first()
    if not task:
         raise HTTPException(404, "Task not found")
         
    # 1. Update Task
    task.is_completed = True
    task.last_completed_at = datetime.utcnow()
    
    patient_id = task.goal.care_plan.patient_id
    
    # 2. Record Vitals if present
    if payload.vitals:
        # Create VitalReading
        # We handle 'systolic'/'diastolic' specially
        value_str = ""
        if "systolic" in payload.vitals and "diastolic" in payload.vitals:
            value_str = f"{payload.vitals['systolic']}/{payload.vitals['diastolic']}"
            
            # Save Sys/Dia individually too? Yes, usually.
            db.add(models.VitalReading(
                patient_id=patient_id,
                type="blood_pressure",
                value=value_str,
                unit="mmHg",
                systolic=payload.vitals['systolic'],
                diastolic=payload.vitals['diastolic'],
                source="Nurse Entry",
                notes=payload.notes
            ))
            
        # Generic handling for others
        for k, v in payload.vitals.items():
            if k not in ["systolic", "diastolic"]:
                db.add(models.VitalReading(
                    patient_id=patient_id,
                    type=k,
                    value=str(v),
                    unit="", # simplified
                    source="Nurse Entry"
                ))
    
    # 3. Save File/Medical Record if present
    if payload.file_url:
        import uuid
        rec = models.MedicalRecord(
             id=f"nurse-{uuid.uuid4()}",
             patient_id=patient_id,
             uploader_id=current_user.id,
             type=payload.file_type,
             title=f"Nurse Task: {task.title}",
             file_url=payload.file_url,
             content_text=payload.notes or "Nurse Upload",
             ai_summary="Pending AI Analysis",
             created_at=datetime.utcnow()
        )
        db.add(rec)
        
    db.commit()
    return {"status": "success", "message": "Task executed"}
