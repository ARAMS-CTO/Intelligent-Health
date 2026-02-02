from fastapi import APIRouter, HTTPException, Body, Depends
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from ..schemas import Case as CaseSchema, CaseCreate, Comment as CommentSchema, Role
from ..database import get_db
import server.models as models
# Case, Comment, User, SystemLog accessed via models.*
from ..routes.auth import get_current_user
from datetime import datetime
import uuid

router = APIRouter()

@router.get("", response_model=List[CaseSchema])
async def get_cases(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Case).options(joinedload(models.Case.patient))
    
    if current_user.role == Role.Patient or current_user.role == "Patient":
        if current_user.patient_profile:
            query = query.filter(models.Case.patient_id == current_user.patient_profile.id)
        else:
            return []
            
    return query.order_by(models.Case.created_at.desc()).limit(100).all()

@router.get("/{case_id}", response_model=CaseSchema)
async def get_case(case_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    case = db.query(models.Case).options(joinedload(models.Case.patient)).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    # Security Check forPatients
    if current_user.role == Role.Patient or current_user.role == "Patient":
        if not current_user.patient_profile or case.patient_id != current_user.patient_profile.id:
            # Mask existence of unauthorized cases
            raise HTTPException(status_code=404, detail="Case not found")
            
    return case

@router.post("", response_model=CaseSchema)
async def create_case(case: CaseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_case = models.Case(
        id=str(uuid.uuid4()),
        title=case.title,
        creator_id=current_user.id, # Use authenticated user
        patient_id=case.patient_id,
        created_at=datetime.utcnow().isoformat(),
        complaint=case.complaint,
        history=case.history,
        findings=case.findings,
        diagnosis=case.diagnosis,
        tags=case.tags,
        status="Open"
    )
    db.add(new_case)
    
    # Audit Log
    try:
        db.add(models.SystemLog(
            event_type="create_case",
            user_id=current_user.id if hasattr(current_user, 'id') else case.creator_id,
            details={"case_id": new_case.id, "title": new_case.title}
        ))
    except Exception:
        pass
        
    db.commit()
    db.refresh(new_case)
    return new_case

@router.put("/{case_id}")
@router.patch("/{case_id}")
async def update_case(case_id: str, updates: dict = Body(...), db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    keys_to_ignore = ["files", "lab_results", "labResults", "comments", "patient", "creator", "specialist", "id"]
    for key, value in updates.items():
        if key not in keys_to_ignore and hasattr(case, key):
            setattr(case, key, value)
    
    db.commit()
    db.refresh(case)
    return case

@router.put("/{case_id}/status")
async def update_case_status(case_id: str, status: dict = Body(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    new_status = status["status"]
    case.status = new_status
    db.commit()
    
    
    # RAG Integration: Index closed cases
    if new_status == "Closed":
        try:
            summary = f"Case {case.title}: Diagnosis: {case.diagnosis}. Findings: {case.findings}. History: {case.history}."
            from ..services.agent_service import agent_service
            # Add to creator's knowledge base
            agent_service.add_knowledge(case.creator_id, summary, {
                "type": "clinical_case",
                "case_id": case.id, 
                "diagnosis": case.diagnosis
            })
            
            # Agent Learning Log
            # Record that the case was successfully closed
            if hasattr(case, 'learning_logs'):
                 # Could update existing log or create new one confirming outcome
                 pass
                 
        except Exception as e:
            print(f"RAG Indexing Error: {e}")
            
    # Audit Log
    try:
        db.add(models.SystemLog(
             event_type="case_status_update",
             user_id=current_user.id, 
             details={"case_id": case_id, "old_status": case.status, "new_status": new_status}
        ))
        db.commit()
    except Exception:
        pass
            
    return {"message": "Status updated"}

@router.post("/{case_id}/assign")
async def assign_specialist(case_id: str, data: dict = Body(...), db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case.specialist_id = data["specialistId"]
    case.specialist_assignment_timestamp = datetime.utcnow().isoformat()
    db.commit()
    return {"message": "Specialist assigned"}

@router.get("/{case_id}/comments", response_model=List[CommentSchema])
async def get_case_comments(case_id: str, db: Session = Depends(get_db)):
    return db.query(models.Comment).filter(models.Comment.case_id == case_id).all()

@router.post("/comments")
async def add_comment(comment: CommentSchema, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_comment = models.Comment(
        id=str(uuid.uuid4()),
        case_id=comment.caseId,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        timestamp=datetime.utcnow().isoformat(),
        text=comment.text
    )
    db.add(new_comment)
    db.commit()
    return {"message": "Comment added"}

from ..schemas import UploadedFile as UploadedFileSchema, LabResult as LabResultSchema


@router.post("/{case_id}/files", response_model=UploadedFileSchema)
async def add_case_file(case_id: str, file: UploadedFileSchema, db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    new_file = models.CaseFile(
        id=file.id or str(uuid.uuid4()),
        case_id=case_id,
        name=file.name,
        type=file.type,
        url=file.url
    )
    db.add(new_file)
    db.commit()
    # Return as schema
    return file

@router.post("/{case_id}/results", response_model=LabResultSchema)
async def add_lab_result(case_id: str, result: LabResultSchema, db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    new_result = models.LabResult(
        case_id=case_id,
        test=result.test,
        value=result.value,
        unit=result.unit,
        reference_range=result.reference_range,
        interpretation=result.interpretation
    )
    db.add(new_result)
    db.commit()
    # Manually map back since ID is autogenerated
    return result
