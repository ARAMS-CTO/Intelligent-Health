from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from ..database import get_db
from ..database import get_db
import server.models as models
from ..schemas import Role, LabResult as LabResultSchema
# LabResult, Case, User accessed via models.*
# SystemLog accessed via models.SystemLog
from ..routes.auth import get_current_user

router = APIRouter()

# Schemas
# ... imports ...
from server.agents.orchestrator import orchestrator

class LabOrderCreate(BaseModel):
    case_id: str
    test_name: str
    notes: Optional[str] = None

class LabRecommendationRequest(BaseModel):
    case_id: str

class LabResultUpdate(BaseModel):
    value: str
    unit: str
    reference_range: Optional[str] = None
    interpretation: Optional[str] = None

# Routes

@router.post("/recommend")
async def recommend_labs(
    request: LabRecommendationRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case = db.query(models.Case).filter(models.Case.id == request.case_id).first()
    if not case: return {"error": "Case not found"}
    
    # Check if we should route to a specialist for this recommendation
    context = {"user_id": current_user.id}
    payload = {
        "query": "Recommend necessary lab tests for this case. Return JSON: { \"tests\": [{\"name\": \"...\", \"reason\": \"...\"}] }", 
        "case_data": f"Complaint: {case.complaint}. Findings: {case.findings}",
        "case_id": case.id
    }
    
    # We use 'specialist_consult' which auto-routes to best domain expert
    result = await orchestrator.dispatch("specialist_consult", payload, context, db)
    return result

@router.post("/order")
async def order_lab_test(
    request: LabOrderCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["Doctor", "Nurse", "Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to order labs")
        
    case = db.query(models.Case).filter(models.Case.id == request.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    new_lab = models.LabResult(
        case_id=request.case_id,
        test=request.test_name,
        status="Pending",
        ordered_at=datetime.utcnow()
    )
    
    db.add(new_lab)
    
    # Audit
    try:
        db.add(models.SystemLog(
            event_type="lab_ordered",
            user_id=current_user.id,
            details={"case_id": case.id, "test": request.test_name}
        ))
    except:
        pass
        
    db.commit()
    db.refresh(new_lab)
    return new_lab

@router.get("/pending")
async def get_pending_labs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Nurses/Doctors see pending for their patients (or all for simple triage)
    # Lab Techs see all
    if current_user.role not in ["Nurse", "Doctor", "Lab Technician", "Admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    labs = db.query(models.LabResult).options(
        joinedload(models.LabResult.case)
    ).filter(models.LabResult.status == "Pending").all()
    
    return labs

@router.patch("/{lab_id}/result", response_model=LabResultSchema)
async def record_lab_result(
    lab_id: int,
    result: LabResultUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["Lab Technician", "Admin"]:
        raise HTTPException(status_code=403, detail="Only Lab Techs can record results")
        
    lab = db.query(models.LabResult).filter(models.LabResult.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab order not found")
        
    lab.value = result.value
    lab.unit = result.unit
    lab.reference_range = result.reference_range
    lab.interpretation = result.interpretation
    lab.status = "Completed"
    lab.completed_at = datetime.utcnow()
    
    # Audit
    try:
        db.add(models.SystemLog(
            event_type="lab_completed",
            user_id=current_user.id,
            details={"lab_id": lab.id, "result": result.value}
        ))
    except:
        pass
        
    db.commit()
    return lab
