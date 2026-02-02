"""
Ophthalmology API Routes
Manages eye health data, prescriptions, and visual acuity records.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models import User, Patient
from ..routes.auth import get_current_user

router = APIRouter()

# --- Pydantic Models ---

class Prescription(BaseModel):
    sphere: str
    cylinder: str
    axis: int

class OphthalmologyDataResponse(BaseModel):
    visualAcuityOD: str
    visualAcuityOS: str
    iop: str
    cupDiscRatio: str
    lastExam: str
    prescription: Prescription

# --- Routes ---

@router.get("/data/{patient_id}", response_model=OphthalmologyDataResponse)
async def get_ophthalmology_data(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get ophthalmology data for a patient.
    Currently returns simulated data.
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    from ..models import VitalReading
    
    def get_latest(v_type):
        return db.query(VitalReading).filter(
            VitalReading.patient_id == patient_id,
            VitalReading.type == v_type
        ).order_by(VitalReading.recorded_at.desc()).first()

    va_od = get_latest("visual_acuity_od")
    va_os = get_latest("visual_acuity_os")
    iop = get_latest("iop")
    cdr = get_latest("cup_disc_ratio")

    return {
        "visualAcuityOD": va_od.value if va_od else "20/20",
        "visualAcuityOS": va_os.value if va_os else "20/25",
        "iop": f"{iop.value} {iop.unit}" if iop else "16 mmHg",
        "cupDiscRatio": cdr.value if cdr else "0.3",
        "lastExam": datetime.utcnow().strftime("%Y-%m-%d"), # Should fetch from Appointment/Event
        "prescription": {
            "sphere": "-1.25",
            "cylinder": "-0.50",
            "axis": 90
        }
    }
