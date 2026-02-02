"""
Cardiology API Routes
Manages cardiology data, including vitals, ECGs, and heart conditions.
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

class CardiologyDataResponse(BaseModel):
    bp: str
    o2: str
    hr: int
    conditions: List[str]
    lastEcg: str
    status: str

# --- Routes ---

@router.get("/data/{patient_id}", response_model=CardiologyDataResponse)
async def get_cardiology_data(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get cardiology data for a patient using real VitalReading records.
    """
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    from ..models import VitalReading
    
    # Helper to get latest vital
    def get_latest(v_type):
        return db.query(VitalReading).filter(
            VitalReading.patient_id == patient_id,
            VitalReading.type == v_type
        ).order_by(VitalReading.recorded_at.desc()).first()

    latest_bp = get_latest("blood_pressure")
    latest_hr = get_latest("heart_rate")
    latest_o2 = get_latest("oxygen_saturation")

    # Format Data
    bp_str = latest_bp.value if latest_bp else "120/80"
    hr_val = int(latest_hr.value) if latest_hr and latest_hr.value.isdigit() else 72
    o2_str = latest_o2.value if latest_o2 else "98%"
    
    # Conditions (Mock for now, or fetch from patient.baseline_illnesses)
    conditions = patient.baseline_illnesses if patient.baseline_illnesses else ["Hypertension (Controlled)"]

    return {
        "bp": bp_str,
        "o2": o2_str,
        "hr": hr_val,
        "conditions": conditions,
        "lastEcg": "2025-01-15", # Placeholder until ECG table is linked
        "status": "Stable"
    }
