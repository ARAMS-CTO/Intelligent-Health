from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .auth import get_current_user
from ..models import ImagingStudy, Patient, User
from ..schemas import ImagingStudy as ImagingStudySchema, ImagingStudyCreate
from typing import List, Optional

router = APIRouter()

@router.get("/studies", response_model=List[ImagingStudySchema])
def get_studies(
    skip: int = 0, 
    limit: int = 100, 
    modality: Optional[str] = None,
    study_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ImagingStudy)
    
    if modality and modality != "All":
        query = query.filter(ImagingStudy.modality == modality)
    
    if study_status and study_status != "All":
        query = query.filter(ImagingStudy.status == study_status)
    
    # Order by priority (STAT first) then date
    # In real app, we'd have a priority mapping. Here simplest is text.
    # Actually, let's just sort by ordered_at desc
    query = query.order_by(ImagingStudy.ordered_at.desc())
        
    studies = query.offset(skip).limit(limit).all()
    
    # Enrich with patient name
    results = []
    for study in studies:
        study_data = ImagingStudySchema.from_orm(study)
        if study.patient:
            study_data.patient_name = study.patient.name
        results.append(study_data)
        
    return results

@router.post("/studies", response_model=ImagingStudySchema)
def create_study(study: ImagingStudyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_study = ImagingStudy(**study.dict())
    db.add(db_study)
    db.commit()
    db.refresh(db_study)
    return db_study

@router.get("/studies/{study_id}", response_model=ImagingStudySchema)
def get_study(study_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    study = db.query(ImagingStudy).filter(ImagingStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
        
    study_data = ImagingStudySchema.from_orm(study)
    if study.patient:
        study_data.patient_name = study.patient.name
        
    return study_data

@router.patch("/studies/{study_id}", response_model=ImagingStudySchema)
def update_study(study_id: str, content: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    study = db.query(ImagingStudy).filter(ImagingStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
        
    for key, value in content.items():
        if hasattr(study, key):
            setattr(study, key, value)
            
    db.commit()
    db.refresh(study)
    
    study_data = ImagingStudySchema.from_orm(study)
    if study.patient:
        study_data.patient_name = study.patient.name
        
    return study_data

from ..services.radiology_service import radiology_ai

@router.post("/studies/{study_id}/report")
async def draft_report(study_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    study = db.query(ImagingStudy).filter(ImagingStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
        
    study_data = {
        "patient_name": study.patient.name if study.patient else "Unknown",
        "modality": study.modality,
        "body_part": study.body_part,
        "indication": study.indication
    }
    
    report_text = await radiology_ai.draft_report(study_data)
    
    # Optionally save draft
    # study.report_content = report_text 
    # db.commit()
    
    return {"report": report_text}

@router.post("/studies/{study_id}/detect")
async def detect_abnormalities(study_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    study = db.query(ImagingStudy).filter(ImagingStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
        
    study_data = {
        "modality": study.modality,
        "body_part": study.body_part,
        "indication": study.indication
    }
    
    findings = await radiology_ai.detect_abnormalities(study_data)
    
    return {"findings": findings}
