"""
Telemedicine API Routes
Video consultation management and signaling
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import uuid

from ..database import get_db
from ..models import User
from ..routes.auth import get_current_user

router = APIRouter(prefix="/api/telemedicine", tags=["Telemedicine"])

# In-memory storage for active sessions (replace with Redis/DB in prod)
active_sessions = {}

class TelemedicineSessionCreate(BaseModel):
    doctor_id: str
    appointment_id: Optional[str] = None
    type: str = "video"

class TelemedicineSessionResponse(BaseModel):
    id: str
    doctor_id: str
    patient_id: str
    appointment_id: Optional[str]
    status: str
    created_at: str
    token: str  # For WebRTC signaling
    room_name: str

class EndSessionRequest(BaseModel):
    notes: Optional[str] = None

@router.post("/start", response_model=TelemedicineSessionResponse)
async def start_session(
    session: TelemedicineSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new telemedicine session."""
    
    # Verify doctor exists
    doctor = db.query(User).filter(User.id == session.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    session_id = str(uuid.uuid4())
    room_name = f"room-{session_id}"
    token = str(uuid.uuid4()) # Mock token for video provider
    
    new_session = {
        "id": session_id,
        "doctor_id": session.doctor_id,
        "patient_id": current_user.id,
        "appointment_id": session.appointment_id,
        "status": "active",
        "created_at": datetime.utcnow().isoformat(),
        "token": token,
        "room_name": room_name,
        "notes": None
    }
    
    active_sessions[session_id] = new_session
    
    return TelemedicineSessionResponse(**new_session)

@router.post("/{session_id}/end")
async def end_session(
    session_id: str,
    request: EndSessionRequest,
    current_user: User = Depends(get_current_user)
):
    """End a telemedicine session."""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session = active_sessions[session_id]
    
    # Verify participant
    if current_user.id not in [session["doctor_id"], session["patient_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    session["status"] = "completed"
    session["ended_at"] = datetime.utcnow().isoformat()
    session["notes"] = request.notes
    
    return {"message": "Session ended", "duration": 300} # Mock duration

@router.get("/{session_id}/status")
async def get_session_status(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return active_sessions[session_id]
