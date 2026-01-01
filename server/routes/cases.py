from fastapi import APIRouter, HTTPException, Body, Depends
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from ..schemas import Case as CaseSchema, CaseCreate, Comment as CommentSchema, Role
from ..database import get_db
from ..models import Case as CaseModel, Comment as CommentModel, User as UserModel
from ..routes.auth import get_current_user
from datetime import datetime
import uuid

router = APIRouter()

@router.get("", response_model=List[CaseSchema])
async def get_cases(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    query = db.query(CaseModel).options(joinedload(CaseModel.patient))
    
    if current_user.role == Role.Patient or current_user.role == "Patient":
        if current_user.patient_profile:
            query = query.filter(CaseModel.patient_id == current_user.patient_profile.id)
        else:
            return []
            
    return query.order_by(CaseModel.created_at.desc()).limit(100).all()

@router.get("/{case_id}", response_model=CaseSchema)
async def get_case(case_id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    case = db.query(CaseModel).options(joinedload(CaseModel.patient)).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    # Security Check for Patients
    if current_user.role == Role.Patient or current_user.role == "Patient":
        if not current_user.patient_profile or case.patient_id != current_user.patient_profile.id:
            # Mask existence of unauthorized cases
            raise HTTPException(status_code=404, detail="Case not found")
            
    return case

@router.post("", response_model=CaseSchema)
async def create_case(case: CaseCreate, db: Session = Depends(get_db)):
    new_case = CaseModel(
        id=str(uuid.uuid4()),
        title=case.title,
        creator_id=case.creator_id,
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
    db.commit()
    db.refresh(new_case)
    return new_case

@router.patch("/{case_id}")
async def update_case(case_id: str, updates: dict = Body(...), db: Session = Depends(get_db)):
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    keys_to_ignore = ["files", "lab_results", "labResults", "comments", "patient", "creator", "specialist"]
    for key, value in updates.items():
        if key not in keys_to_ignore and hasattr(case, key):
            setattr(case, key, value)
    
    db.commit()
    return {"message": "Case updated successfully"}

@router.put("/{case_id}/status")
async def update_case_status(case_id: str, status: dict = Body(...), db: Session = Depends(get_db)):
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
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
        except Exception as e:
            print(f"RAG Indexing Error: {e}")
            
    return {"message": "Status updated"}

@router.post("/{case_id}/assign")
async def assign_specialist(case_id: str, data: dict = Body(...), db: Session = Depends(get_db)):
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case.specialist_id = data["specialistId"]
    case.specialist_assignment_timestamp = datetime.utcnow().isoformat()
    db.commit()
    return {"message": "Specialist assigned"}

@router.get("/{case_id}/comments", response_model=List[CommentSchema])
async def get_case_comments(case_id: str, db: Session = Depends(get_db)):
    return db.query(CommentModel).filter(CommentModel.case_id == case_id).all()

@router.post("/comments")
async def add_comment(comment: CommentSchema, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    new_comment = CommentModel(
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
from ..models import CaseFile as CaseFileModel, LabResult as LabResultModel

@router.post("/{case_id}/files", response_model=UploadedFileSchema)
async def add_case_file(case_id: str, file: UploadedFileSchema, db: Session = Depends(get_db)):
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    new_file = CaseFileModel(
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
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    new_result = LabResultModel(
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
