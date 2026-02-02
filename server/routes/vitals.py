"""
Vitals API Routes
Patient health vitals tracking and monitoring
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import uuid

from ..database import get_db
from ..models import VitalReading, Patient, User
from ..routes.auth import get_current_user

router = APIRouter(prefix="/api/vitals", tags=["vitals"])

# --- Schemas ---

class VitalCreate(BaseModel):
    type: str  # 'blood_pressure', 'heart_rate', 'temperature', 'oxygen', 'weight', 'glucose'
    value: str
    unit: str
    systolic: Optional[float] = None
    diastolic: Optional[float] = None
    notes: Optional[str] = None
    source: str = "Manual"
    device_id: Optional[str] = None
    recorded_at: Optional[datetime] = None

class VitalResponse(BaseModel):
    id: str
    patient_id: str
    type: str
    value: str
    unit: str
    systolic: Optional[float]
    diastolic: Optional[float]
    status: str
    notes: Optional[str]
    source: str
    device_id: Optional[str]
    recorded_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class VitalsSummary(BaseModel):
    type: str
    latest_value: str
    latest_unit: str
    status: str
    trend: str  # 'up', 'down', 'stable'
    change_percent: Optional[float]
    readings_count: int
    recorded_at: datetime

# --- Helper Functions ---

def determine_vital_status(vital_type: str, value: str, systolic: Optional[float] = None, diastolic: Optional[float] = None) -> str:
    """Determine if a vital reading is normal, high, low, or critical"""
    try:
        if vital_type == "blood_pressure" and systolic and diastolic:
            if systolic >= 180 or diastolic >= 120:
                return "Critical"
            elif systolic >= 140 or diastolic >= 90:
                return "High"
            elif systolic < 90 or diastolic < 60:
                return "Low"
            return "Normal"
        
        elif vital_type == "heart_rate":
            hr = float(value)
            if hr > 120 or hr < 40:
                return "Critical"
            elif hr > 100:
                return "High"
            elif hr < 60:
                return "Low"
            return "Normal"
        
        elif vital_type == "temperature":
            temp = float(value)
            if temp >= 103:
                return "Critical"
            elif temp >= 100.4:
                return "High"
            elif temp < 96:
                return "Low"
            return "Normal"
        
        elif vital_type == "oxygen":
            o2 = float(value)
            if o2 < 90:
                return "Critical"
            elif o2 < 94:
                return "Low"
            return "Normal"
        
        elif vital_type == "glucose":
            glucose = float(value)
            if glucose > 300 or glucose < 54:
                return "Critical"
            elif glucose > 180:
                return "High"
            elif glucose < 70:
                return "Low"
            return "Normal"
        
        elif vital_type == "weight":
            return "Normal"  # Weight doesn't have immediate status
            
    except ValueError:
        pass
    
    return "Normal"

def calculate_trend(readings: List[VitalReading]) -> tuple:
    """Calculate trend from recent readings"""
    if len(readings) < 2:
        return "stable", None
    
    try:
        # Get numeric values for comparison
        if readings[0].type == "blood_pressure":
            current = readings[0].systolic
            previous = readings[1].systolic
        else:
            current = float(readings[0].value)
            previous = float(readings[1].value)
        
        if current is None or previous is None:
            return "stable", None
            
        change = ((current - previous) / previous) * 100 if previous != 0 else 0
        
        if change > 5:
            return "up", round(change, 1)
        elif change < -5:
            return "down", round(change, 1)
        return "stable", round(change, 1)
    except (ValueError, TypeError):
        return "stable", None

# --- Endpoints ---

@router.post("/", response_model=VitalResponse)
async def record_vital(
    vital: VitalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a new vital reading for the current patient"""
    if not current_user.patient_profile:
        raise HTTPException(status_code=400, detail="No patient profile found")
    
    patient_id = current_user.patient_profile.id
    
    # Determine status
    status = determine_vital_status(
        vital.type, 
        vital.value, 
        vital.systolic, 
        vital.diastolic
    )
    
    new_vital = VitalReading(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        type=vital.type,
        value=vital.value,
        unit=vital.unit,
        systolic=vital.systolic,
        diastolic=vital.diastolic,
        status=status,
        notes=vital.notes,
        source=vital.source,
        device_id=vital.device_id,
        recorded_at=vital.recorded_at or datetime.utcnow()
    )
    
    db.add(new_vital)
    db.commit()
    db.refresh(new_vital)
    
    return new_vital

@router.get("/", response_model=List[VitalResponse])
async def get_vitals(
    vital_type: Optional[str] = None,
    days: int = Query(7, ge=1, le=365),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get vital readings for the current patient"""
    if not current_user.patient_profile:
        raise HTTPException(status_code=400, detail="No patient profile found")
    
    patient_id = current_user.patient_profile.id
    since_date = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(VitalReading).filter(
        VitalReading.patient_id == patient_id,
        VitalReading.recorded_at >= since_date
    )
    
    if vital_type:
        query = query.filter(VitalReading.type == vital_type)
    
    readings = query.order_by(VitalReading.recorded_at.desc()).limit(limit).all()
    
    return readings

@router.get("/summary", response_model=List[VitalsSummary])
async def get_vitals_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get summary of all vital types for the current patient"""
    if not current_user.patient_profile:
        raise HTTPException(status_code=400, detail="No patient profile found")
    
    patient_id = current_user.patient_profile.id
    vital_types = ['blood_pressure', 'heart_rate', 'temperature', 'oxygen', 'weight', 'glucose']
    summaries = []
    
    for vtype in vital_types:
        readings = db.query(VitalReading).filter(
            VitalReading.patient_id == patient_id,
            VitalReading.type == vtype
        ).order_by(VitalReading.recorded_at.desc()).limit(10).all()
        
        if readings:
            trend, change = calculate_trend(readings)
            summaries.append(VitalsSummary(
                type=vtype,
                latest_value=readings[0].value,
                latest_unit=readings[0].unit,
                status=readings[0].status,
                trend=trend,
                change_percent=change,
                readings_count=len(readings),
                recorded_at=readings[0].recorded_at
            ))
    
    return summaries

@router.get("/latest/{vital_type}", response_model=Optional[VitalResponse])
async def get_latest_vital(
    vital_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the latest reading for a specific vital type"""
    if not current_user.patient_profile:
        raise HTTPException(status_code=400, detail="No patient profile found")
    
    patient_id = current_user.patient_profile.id
    
    reading = db.query(VitalReading).filter(
        VitalReading.patient_id == patient_id,
        VitalReading.type == vital_type
    ).order_by(VitalReading.recorded_at.desc()).first()
    
    return reading

@router.delete("/{vital_id}")
async def delete_vital(
    vital_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a vital reading"""
    if not current_user.patient_profile:
        raise HTTPException(status_code=400, detail="No patient profile found")
    
    patient_id = current_user.patient_profile.id
    
    reading = db.query(VitalReading).filter(
        VitalReading.id == vital_id,
        VitalReading.patient_id == patient_id
    ).first()
    
    if not reading:
        raise HTTPException(status_code=404, detail="Vital reading not found")
    
    db.delete(reading)
    db.commit()
    
    return {"message": "Vital reading deleted"}

# --- Doctor/Admin Endpoints ---

@router.get("/patient/{patient_id}", response_model=List[VitalResponse])
async def get_patient_vitals(
    patient_id: str,
    vital_type: Optional[str] = None,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get vital readings for a specific patient (doctor/admin only)"""
    if current_user.role not in ["Doctor", "Admin", "Nurse"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    since_date = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(VitalReading).filter(
        VitalReading.patient_id == patient_id,
        VitalReading.recorded_at >= since_date
    )
    
    if vital_type:
        query = query.filter(VitalReading.type == vital_type)
    
    readings = query.order_by(VitalReading.recorded_at.desc()).all()
    
    return readings

@router.get("/alerts")
async def get_vital_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get patients with abnormal vitals (doctor/admin only)"""
    if current_user.role not in ["Doctor", "Admin", "Nurse"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get critical/abnormal readings from last 24 hours
    since = datetime.utcnow() - timedelta(hours=24)
    
    alerts = db.query(VitalReading).filter(
        VitalReading.recorded_at >= since,
        VitalReading.status.in_(["Critical", "High", "Low"])
    ).order_by(VitalReading.recorded_at.desc()).all()
    
    return [
        {
            "id": a.id,
            "patient_id": a.patient_id,
            "type": a.type,
            "value": a.value,
            "unit": a.unit,
            "status": a.status,
            "recorded_at": a.recorded_at.isoformat()
        }
        for a in alerts
    ]
