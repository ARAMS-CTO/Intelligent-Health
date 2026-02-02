"""
Dentistry API Routes
Manages dental charts, tooth status, and procedure history.
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from ..database import get_db
from ..models import User, DentalChart, ToothStatus, DentalProcedure, Patient
from ..routes.auth import get_current_user

router = APIRouter()

# --- Pydantic Models ---

class ToothStatusUpdate(BaseModel):
    tooth_number: int
    condition: str
    surface: Optional[str] = None
    notes: Optional[str] = None

class ToothStatusResponse(BaseModel):
    id: str
    tooth_number: int
    condition: str
    surface: Optional[str]
    notes: Optional[str]
    last_treated: Optional[datetime]

class DentalChartResponse(BaseModel):
    id: str
    patient_id: str
    updated_at: datetime
    teeth: List[ToothStatusResponse]

class ProcedureCreate(BaseModel):
    patient_id: str
    tooth_number: Optional[int]
    procedure_code: str
    description: str
    notes: Optional[str]

class ProcedureResponse(BaseModel):
    id: str
    procedure_code: str
    description: str
    date: datetime
    dentist_name: Optional[str]
    tooth_number: Optional[int]
    notes: Optional[str]

# --- Routes ---

@router.get("/chart/{patient_id}", response_model=DentalChartResponse)
async def get_dental_chart(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the dental chart for a patient. Creates one if not exists."""
    chart = db.query(DentalChart).filter(DentalChart.patient_id == patient_id).first()
    
    if not chart:
        # Create new blank chart
        chart = DentalChart(patient_id=patient_id)
        db.add(chart)
        db.commit()
        db.refresh(chart)
        
        # Initialize 32 teeth as 'healthy'? Or leave empty (implied healthy)?
        # Let's leave empty to save space, assuming missing record = healthy/unknown.
    
    return chart

@router.post("/chart/{patient_id}/tooth")
async def update_tooth_status(
    patient_id: str,
    update: ToothStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update status of a specific tooth."""
    if current_user.role not in ["Dentist", "Admin"]:
        raise HTTPException(status_code=403, detail="Only dentists can update charts")

    chart = db.query(DentalChart).filter(DentalChart.patient_id == patient_id).first()
    if not chart:
        chart = DentalChart(patient_id=patient_id)
        db.add(chart)
        db.commit()
        db.refresh(chart)
    
    # Check if tooth record exists
    tooth = db.query(ToothStatus).filter(
        ToothStatus.chart_id == chart.id,
        ToothStatus.tooth_number == update.tooth_number
    ).first()
    
    if tooth:
        tooth.condition = update.condition
        tooth.surface = update.surface
        tooth.notes = update.notes
        tooth.last_treated = datetime.utcnow()
    else:
        tooth = ToothStatus(
            chart_id=chart.id,
            tooth_number=update.tooth_number,
            condition=update.condition,
            surface=update.surface,
            notes=update.notes,
            last_treated=datetime.utcnow()
        )
        db.add(tooth)
    
    chart.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Tooth updated", "tooth_number": update.tooth_number}

@router.get("/history/{patient_id}", response_model=List[ProcedureResponse])
async def get_dental_history(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dental procedure history."""
    procedures = db.query(DentalProcedure).options(joinedload(DentalProcedure.dentist)).filter(DentalProcedure.patient_id == patient_id).all()
    
    response = []
    for p in procedures:
        dentist_name = "Unknown"
        if p.dentist:
            dentist_name = f"Dr. {p.dentist.name}"
            
        response.append({
            "id": p.id,
            "procedure_code": p.procedure_code,
            "description": p.description,
            "date": p.date,
            "dentist_name": dentist_name,
            "tooth_number": p.tooth_number,
            "notes": p.notes
        })
        
    return response

@router.post("/procedure")
async def log_procedure(
    procedure: ProcedureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log a dental procedure."""
    if current_user.role not in ["Dentist", "Admin"]:
        raise HTTPException(status_code=403, detail="Only dentists can log procedures")
        
    new_proc = DentalProcedure(
        patient_id=procedure.patient_id,
        dentist_id=current_user.id,
        tooth_number=procedure.tooth_number,
        procedure_code=procedure.procedure_code,
        description=procedure.description,
        notes=procedure.notes
    )
    
    db.add(new_proc)
    
    # Also update chart if implied? Let's keep them separate for now but often procedure updates chart state.
    # E.g. Extraction -> missing.
    
    if "extract" in procedure.description.lower():
         # Logic to auto-update chart to missing
         pass

    db.commit()
    return {"message": "Procedure logged", "id": new_proc.id}
