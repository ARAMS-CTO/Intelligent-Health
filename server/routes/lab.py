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
    
    # Check if value is critical (if reference range provided)
    is_critical = False
    if result.reference_range and result.value:
        try:
            # Simple critical check - value outside range by >50%
            # In production, use proper reference range parsing
            is_critical = "CRITICAL" in (result.interpretation or "").upper()
        except:
            pass
    
    # Audit
    try:
        db.add(models.SystemLog(
            event_type="lab_completed",
            user_id=current_user.id,
            details={"lab_id": lab.id, "result": result.value, "is_critical": is_critical}
        ))
    except:
        pass
    
    # Create notification for ordering doctor
    try:
        case = db.query(models.Case).filter(models.Case.id == lab.case_id).first()
        if case:
            # Notify the case creator/specialist
            doctor_id = case.specialistId or case.creatorId
            if doctor_id:
                notification = models.Notification(
                    user_id=doctor_id,
                    type="lab_result" if not is_critical else "critical_lab",
                    title=f"{'⚠️ CRITICAL: ' if is_critical else ''}Lab Result Ready",
                    message=f"{lab.test}: {result.value} {result.unit}",
                    data={"lab_id": lab.id, "case_id": case.id, "is_critical": is_critical},
                    created_at=datetime.utcnow()
                )
                db.add(notification)
    except Exception as e:
        print(f"Failed to create lab notification: {e}")
        
    db.commit()
    return lab


@router.get("/critical")
async def get_critical_results(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all critical lab results that need attention."""
    if current_user.role not in ["Doctor", "Nurse", "Lab Technician", "Admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Find labs with CRITICAL in interpretation
    critical_labs = db.query(models.LabResult).options(
        joinedload(models.LabResult.case)
    ).filter(
        models.LabResult.status == "Completed",
        models.LabResult.interpretation.ilike("%critical%")
    ).order_by(models.LabResult.completed_at.desc()).limit(20).all()
    
    return critical_labs


@router.get("/case/{case_id}")
async def get_labs_for_case(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all lab results for a specific case."""
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    labs = db.query(models.LabResult).filter(
        models.LabResult.case_id == case_id
    ).order_by(models.LabResult.ordered_at.desc()).all()
    
    return labs


@router.get("/stats")
async def get_lab_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get lab statistics for dashboard."""
    if current_user.role not in ["Lab Technician", "Admin", "Manager"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    from sqlalchemy import func
    from datetime import timedelta
    
    today = datetime.utcnow().date()
    
    pending = db.query(func.count(models.LabResult.id)).filter(
        models.LabResult.status == "Pending"
    ).scalar()
    
    completed_today = db.query(func.count(models.LabResult.id)).filter(
        models.LabResult.status == "Completed",
        func.date(models.LabResult.completed_at) == today
    ).scalar()
    
    critical = db.query(func.count(models.LabResult.id)).filter(
        models.LabResult.status == "Completed",
        models.LabResult.interpretation.ilike("%critical%")
    ).scalar()
    
    return {
        "pending": pending or 0,
        "completed_today": completed_today or 0,
        "critical": critical or 0
    }

