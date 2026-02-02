"""
Telemedicine Consultation Routes

Handles:
- Video/Audio/Chat consultations
- Room management
- Consultation lifecycle
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
import uuid
import secrets

from ..database import get_db
from ..models import User, Patient, Appointment, Consultation
from .auth import get_current_user
from .notifications import send_notification

router = APIRouter(prefix="/consultations", tags=["Telemedicine"])


# --- Request Models ---

class ConsultationCreate(BaseModel):
    appointment_id: Optional[str] = None
    patient_id: str
    type: str = "Video"  # 'Video', 'Audio', 'Chat'

class ConsultationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


# --- Endpoints ---

@router.get("/")
async def get_consultations(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get consultations for the current user (doctor or patient)."""
    query = db.query(Consultation)
    
    if current_user.role in ["Doctor", "Specialist"]:
        query = query.filter(Consultation.doctor_id == current_user.id)
    elif current_user.role == "Patient":
        patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(Consultation.patient_id == patient.id)
        else:
            return {"consultations": []}
    
    if status:
        query = query.filter(Consultation.status == status)
    
    consultations = query.order_by(Consultation.created_at.desc()).all()
    
    result = []
    for c in consultations:
        result.append({
            "id": c.id,
            "appointment_id": c.appointment_id,
            "doctor_id": c.doctor_id,
            "doctor_name": c.doctor.name if c.doctor else None,
            "patient_id": c.patient_id,
            "patient_name": c.patient.name if c.patient else None,
            "type": c.type,
            "status": c.status,
            "room_id": c.room_id,
            "started_at": c.started_at.isoformat() if c.started_at else None,
            "ended_at": c.ended_at.isoformat() if c.ended_at else None,
            "duration_minutes": c.duration_minutes,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })
    
    return {"consultations": result}


@router.post("/")
async def create_consultation(
    data: ConsultationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new consultation.
    
    Can be created from an existing appointment or as a standalone session.
    """
    if current_user.role not in ["Doctor", "Specialist", "Admin"]:
        raise HTTPException(status_code=403, detail="Only doctors can create consultations")
    
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Generate room ID
    room_id = f"ih-{secrets.token_hex(6)}"
    
    consultation = Consultation(
        id=str(uuid.uuid4()),
        appointment_id=data.appointment_id,
        doctor_id=current_user.id,
        patient_id=data.patient_id,
        type=data.type,
        room_id=room_id
    )
    
    db.add(consultation)
    
    # Notify patient
    if patient.user_id:
        send_notification(
            db=db,
            user_id=patient.user_id,
            type="telemedicine",
            title="Consultation Room Ready",
            message=f"Dr. {current_user.name} has started a {data.type.lower()} consultation. Click to join.",
            link=f"/consultation/{consultation.id}"
        )
    
    db.commit()
    db.refresh(consultation)
    
    return {
        "id": consultation.id,
        "room_id": room_id,
        "join_url": f"/consultation/{consultation.id}",
        "message": "Consultation created"
    }


@router.get("/{consultation_id}")
async def get_consultation(
    consultation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get consultation details and room info."""
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    return {
        "id": consultation.id,
        "appointment_id": consultation.appointment_id,
        "doctor": {"id": consultation.doctor_id, "name": consultation.doctor.name if consultation.doctor else None},
        "patient": {"id": consultation.patient_id, "name": consultation.patient.name if consultation.patient else None},
        "type": consultation.type,
        "status": consultation.status,
        "room_id": consultation.room_id,
        "started_at": consultation.started_at.isoformat() if consultation.started_at else None,
        "ended_at": consultation.ended_at.isoformat() if consultation.ended_at else None,
        "duration_minutes": consultation.duration_minutes,
        "notes": consultation.notes
    }


@router.post("/{consultation_id}/start")
async def start_consultation(
    consultation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a consultation (changes status to 'In Progress')."""
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    if consultation.status != "Scheduled":
        raise HTTPException(status_code=400, detail="Consultation already started or completed")
    
    consultation.status = "In Progress"
    consultation.started_at = datetime.utcnow()
    db.commit()
    
    return {"status": "started", "started_at": consultation.started_at.isoformat()}


@router.post("/{consultation_id}/end")
async def end_consultation(
    consultation_id: str,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """End a consultation and calculate duration."""
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    if consultation.status != "In Progress":
        raise HTTPException(status_code=400, detail="Consultation not in progress")
    
    consultation.status = "Completed"
    consultation.ended_at = datetime.utcnow()
    if consultation.started_at:
        duration = (consultation.ended_at - consultation.started_at).total_seconds() / 60
        consultation.duration_minutes = int(duration)
    
    if notes:
        consultation.notes = notes
    
    db.commit()
    
    return {
        "status": "completed",
        "ended_at": consultation.ended_at.isoformat(),
        "duration_minutes": consultation.duration_minutes
    }


@router.delete("/{consultation_id}")
async def cancel_consultation(
    consultation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a scheduled consultation."""
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    if consultation.status not in ["Scheduled", "In Progress"]:
        raise HTTPException(status_code=400, detail="Cannot cancel completed consultation")
    
    consultation.status = "Cancelled"
    db.commit()
    
    return {"status": "cancelled"}


@router.get("/{consultation_id}/join")
async def get_join_info(
    consultation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get information needed to join a consultation.
    
    Returns room ID and token for video SDK integration.
    In production, this would generate actual video room credentials.
    """
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    # Generate join token (mock - in production, generate actual video SDK token)
    join_token = secrets.token_urlsafe(32)
    
    return {
        "room_id": consultation.room_id,
        "join_token": join_token,
        "type": consultation.type,
        "can_start": consultation.doctor_id == current_user.id,
        "status": consultation.status,
        "sdk_config": {
            "provider": "jitsi",  # or "twilio", "daily", etc.
            "server": "meet.jit.si",  # example
            "room_name": consultation.room_id
        }
    }
