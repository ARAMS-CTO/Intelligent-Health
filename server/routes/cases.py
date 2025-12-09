from fastapi import APIRouter, HTTPException, Body, Depends
from typing import List, Optional
from sqlalchemy.orm import Session
from ..schemas import Case as CaseSchema, Comment as CommentSchema, Role
from ..database import get_db
from ..models import Case as CaseModel, Comment as CommentModel, User as UserModel
from datetime import datetime
import uuid

router = APIRouter()

@router.get("", response_model=List[CaseSchema])
async def get_cases(db: Session = Depends(get_db)):
    return db.query(CaseModel).all()

@router.get("/{case_id}", response_model=CaseSchema)
async def get_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.post("", response_model=CaseSchema)
async def create_case(case: CaseSchema, db: Session = Depends(get_db)):
    new_case = CaseModel(
        id=str(uuid.uuid4()),
        title=case.title,
        creator_id=case.creatorId,
        patient_id=case.patientId,
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
    
    for key, value in updates.items():
        setattr(case, key, value)
    
    db.commit()
    return {"message": "Case updated successfully"}

@router.put("/{case_id}/status")
async def update_case_status(case_id: str, status: dict = Body(...), db: Session = Depends(get_db)):
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case.status = status["status"]
    db.commit()
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
async def add_comment(comment: CommentSchema, db: Session = Depends(get_db)):
    new_comment = CommentModel(
        id=str(uuid.uuid4()),
        case_id=comment.caseId,
        user_id=comment.userId,
        user_name=comment.userName,
        user_role=comment.userRole,
        timestamp=datetime.utcnow().isoformat(),
        text=comment.text
    )
    db.add(new_comment)
    db.commit()
    return {"message": "Comment added"}
