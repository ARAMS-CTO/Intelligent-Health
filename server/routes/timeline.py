"""
Health Timeline API Routes
Patient health history timeline events
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import uuid

from ..database import get_db
from ..models import HealthEvent, Patient, User
from ..routes.auth import get_current_user

router = APIRouter(prefix="/api/timeline", tags=["timeline"])

# --- Schemas ---

class HealthEventCreate(BaseModel):
    type: str  # 'appointment', 'lab', 'prescription', 'procedure', 'diagnosis', 'vaccination', 'hospital', 'note'
    title: str
    description: Optional[str] = None
    provider: Optional[str] = None
    location: Optional[str] = None
    event_metadata: Optional[dict] = {}
    is_important: bool = False
    event_date: datetime

class HealthEventResponse(BaseModel):
    id: str
    patient_id: str
    type: str
    title: str
    description: Optional[str]
    provider: Optional[str]
    location: Optional[str]
    event_metadata: Optional[dict]
    is_important: bool
    attachment_count: int
    event_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class TimelineMonth(BaseModel):
    month: str  # 'YYYY-MM'
    events: List[HealthEventResponse]

# --- Endpoints ---

@router.post("/", response_model=HealthEventResponse)
async def create_event(
    event: HealthEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new health timeline event"""
    if not current_user.patient_profile:
        raise HTTPException(status_code=400, detail="No patient profile found")
    
    patient_id = current_user.patient_profile.id
    
    new_event = HealthEvent(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        type=event.type,
        title=event.title,
        description=event.description,
        provider=event.provider,
        location=event.location,
        event_metadata=event.event_metadata or {},
        is_important=event.is_important,
        event_date=event.event_date
    )
    
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    return new_event

@router.get("/", response_model=List[HealthEventResponse])
async def get_timeline(
    event_type: Optional[str] = None,
    months: int = Query(12, ge=1, le=60),
    limit: int = Query(100, ge=1, le=500),
    important_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get health timeline events for the current patient"""
    if not current_user.patient_profile:
        raise HTTPException(status_code=400, detail="No patient profile found")
    
    patient_id = current_user.patient_profile.id
    since_date = datetime.utcnow() - timedelta(days=months * 30)
    
    query = db.query(HealthEvent).filter(
        HealthEvent.patient_id == patient_id,
        HealthEvent.event_date >= since_date
    )
    
    if event_type:
        query = query.filter(HealthEvent.type == event_type)
    
    if important_only:
        query = query.filter(HealthEvent.is_important == True)
    
    events = query.order_by(HealthEvent.event_date.desc()).limit(limit).all()
    
    return events

@router.get("/grouped", response_model=List[TimelineMonth])
async def get_timeline_grouped(
    event_type: Optional[str] = None,
    months: int = Query(12, ge=1, le=60),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get health timeline events grouped by month"""
    if not current_user.patient_profile:
        raise HTTPException(status_code=400, detail="No patient profile found")
    
    patient_id = current_user.patient_profile.id
    since_date = datetime.utcnow() - timedelta(days=months * 30)
    
    query = db.query(HealthEvent).filter(
        HealthEvent.patient_id == patient_id,
        HealthEvent.event_date >= since_date
    )
    
    if event_type:
        query = query.filter(HealthEvent.type == event_type)
    
    events = query.order_by(HealthEvent.event_date.desc()).all()
    
    # Group by month
    grouped = {}
    for event in events:
        month_key = event.event_date.strftime('%Y-%m')
        if month_key not in grouped:
            grouped[month_key] = []
        grouped[month_key].append(event)
    
    return [
        TimelineMonth(month=month, events=events)
        for month, events in sorted(grouped.items(), reverse=True)
    ]

@router.get("/types")
async def get_event_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available event types with counts"""
    if not current_user.patient_profile:
        raise HTTPException(status_code=400, detail="No patient profile found")
    
    patient_id = current_user.patient_profile.id
    
    events = db.query(HealthEvent).filter(
        HealthEvent.patient_id == patient_id
    ).all()
    
    type_counts = {}
    for event in events:
        type_counts[event.type] = type_counts.get(event.type, 0) + 1
    
    return [
        {"type": t, "count": c, "label": t.replace('_', ' ').title()}
        for t, c in sorted(type_counts.items())
    ]

@router.get("/{event_id}", response_model=HealthEventResponse)
async def get_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific timeline event"""
    event = db.query(HealthEvent).filter(HealthEvent.id == event_id).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Verify access
    if current_user.patient_profile and event.patient_id != current_user.patient_profile.id:
        if current_user.role not in ["Doctor", "Admin", "Nurse"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return event

@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a timeline event"""
    if not current_user.patient_profile:
        raise HTTPException(status_code=400, detail="No patient profile found")
    
    patient_id = current_user.patient_profile.id
    
    event = db.query(HealthEvent).filter(
        HealthEvent.id == event_id,
        HealthEvent.patient_id == patient_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    
    return {"message": "Event deleted"}

# --- Doctor/Admin Endpoints ---

@router.get("/patient/{patient_id}", response_model=List[HealthEventResponse])
async def get_patient_timeline(
    patient_id: str,
    event_type: Optional[str] = None,
    months: int = Query(24, ge=1, le=120),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get timeline for a specific patient (doctor/admin only)"""
    if current_user.role not in ["Doctor", "Admin", "Nurse"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    since_date = datetime.utcnow() - timedelta(days=months * 30)
    
    query = db.query(HealthEvent).filter(
        HealthEvent.patient_id == patient_id,
        HealthEvent.event_date >= since_date
    )
    
    if event_type:
        query = query.filter(HealthEvent.type == event_type)
    
    events = query.order_by(HealthEvent.event_date.desc()).all()
    
    return events

@router.post("/patient/{patient_id}", response_model=HealthEventResponse)
async def create_patient_event(
    patient_id: str,
    event: HealthEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a timeline event for a patient (doctor only)"""
    if current_user.role not in ["Doctor", "Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    new_event = HealthEvent(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        type=event.type,
        title=event.title,
        description=event.description,
        provider=event.provider or current_user.name,
        location=event.location,
        event_metadata=event.event_metadata or {},
        is_important=event.is_important,
        event_date=event.event_date
    )
    
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    return new_event
