"""
Case Collaboration Routes for Intelligent Health Platform

Enables doctors to refer cases, request consultations, and collaborate on complex cases.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from enum import Enum
import uuid

from ..database import get_db
from ..models import User, Case
from ..routes.auth import get_current_user

router = APIRouter(prefix="/api/collaboration", tags=["Collaboration"])


class CollaborationType(str, Enum):
    REFERRAL = "referral"           # Full transfer to another doctor
    CONSULTATION = "consultation"   # Request opinion
    COMANAGEMENT = "comanagement"   # Shared care
    SECOND_OPINION = "second_opinion"


class CollaborationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ReferralCreate(BaseModel):
    case_id: str
    to_doctor_id: str
    collaboration_type: CollaborationType = CollaborationType.CONSULTATION
    reason: str
    priority: str = "normal"  # normal, urgent, stat
    notes: Optional[str] = None


class ReferralResponse(BaseModel):
    id: str
    case_id: str
    case_title: str
    from_doctor_id: str
    from_doctor_name: str
    to_doctor_id: str
    to_doctor_name: str
    collaboration_type: str
    reason: str
    priority: str
    notes: Optional[str]
    status: str
    created_at: str
    responded_at: Optional[str]
    response_notes: Optional[str]


class ReferralAccept(BaseModel):
    notes: Optional[str] = None


# In-memory storage (replace with database model)
_referrals: List[dict] = []


@router.post("/refer", response_model=ReferralResponse)
async def create_referral(
    referral: ReferralCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a referral or consultation request."""
    # Verify the case exists and user has access
    case = db.query(Case).filter(Case.id == referral.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Allow doctor who created case or is assigned to refer
    if case.creatorId != current_user.id and case.specialistId != current_user.id:
        if current_user.role != "Admin":
            raise HTTPException(status_code=403, detail="Not authorized to refer this case")
    
    # Verify the target doctor exists
    to_doctor = db.query(User).filter(
        User.id == referral.to_doctor_id,
        User.role.in_(["Doctor", "Specialist"])
    ).first()
    if not to_doctor:
        raise HTTPException(status_code=404, detail="Target doctor not found")
    
    ref_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    new_referral = {
        "id": ref_id,
        "case_id": referral.case_id,
        "case_title": case.title,
        "from_doctor_id": current_user.id,
        "from_doctor_name": f"Dr. {current_user.name}",
        "to_doctor_id": referral.to_doctor_id,
        "to_doctor_name": f"Dr. {to_doctor.name}",
        "collaboration_type": referral.collaboration_type.value,
        "reason": referral.reason,
        "priority": referral.priority,
        "notes": referral.notes,
        "status": CollaborationStatus.PENDING.value,
        "created_at": now.isoformat(),
        "responded_at": None,
        "response_notes": None
    }
    
    _referrals.append(new_referral)
    
    # TODO: Send notification to target doctor
    # await notify_user(referral.to_doctor_id, "new_referral", new_referral)
    
    return ReferralResponse(**new_referral)


@router.get("/incoming", response_model=List[ReferralResponse])
async def get_incoming_referrals(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get referrals/consultations sent TO the current user."""
    referrals = [r for r in _referrals if r["to_doctor_id"] == current_user.id]
    
    if status:
        referrals = [r for r in referrals if r["status"] == status]
    
    referrals.sort(key=lambda x: x["created_at"], reverse=True)
    return [ReferralResponse(**r) for r in referrals]


@router.get("/outgoing", response_model=List[ReferralResponse])
async def get_outgoing_referrals(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get referrals/consultations sent BY the current user."""
    referrals = [r for r in _referrals if r["from_doctor_id"] == current_user.id]
    
    if status:
        referrals = [r for r in referrals if r["status"] == status]
    
    referrals.sort(key=lambda x: x["created_at"], reverse=True)
    return [ReferralResponse(**r) for r in referrals]


@router.post("/{referral_id}/accept", response_model=ReferralResponse)
async def accept_referral(
    referral_id: str,
    accept_data: ReferralAccept,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept a referral or consultation request."""
    for ref in _referrals:
        if ref["id"] == referral_id and ref["to_doctor_id"] == current_user.id:
            if ref["status"] != CollaborationStatus.PENDING.value:
                raise HTTPException(status_code=400, detail="Referral is not pending")
            
            ref["status"] = CollaborationStatus.ACCEPTED.value
            ref["responded_at"] = datetime.utcnow().isoformat()
            ref["response_notes"] = accept_data.notes
            
            # If it's a full referral, update the case assignment
            if ref["collaboration_type"] == CollaborationType.REFERRAL.value:
                case = db.query(Case).filter(Case.id == ref["case_id"]).first()
                if case:
                    case.specialistId = current_user.id
                    db.commit()
            
            # TODO: Notify referring doctor
            return ReferralResponse(**ref)
    
    raise HTTPException(status_code=404, detail="Referral not found or access denied")


@router.post("/{referral_id}/decline", response_model=ReferralResponse)
async def decline_referral(
    referral_id: str,
    reason: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Decline a referral or consultation request."""
    for ref in _referrals:
        if ref["id"] == referral_id and ref["to_doctor_id"] == current_user.id:
            if ref["status"] != CollaborationStatus.PENDING.value:
                raise HTTPException(status_code=400, detail="Referral is not pending")
            
            ref["status"] = CollaborationStatus.DECLINED.value
            ref["responded_at"] = datetime.utcnow().isoformat()
            ref["response_notes"] = reason
            
            # TODO: Notify referring doctor
            return ReferralResponse(**ref)
    
    raise HTTPException(status_code=404, detail="Referral not found or access denied")


@router.post("/{referral_id}/complete", response_model=ReferralResponse)
async def complete_referral(
    referral_id: str,
    notes: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a consultation as completed."""
    for ref in _referrals:
        if ref["id"] == referral_id and ref["to_doctor_id"] == current_user.id:
            if ref["status"] != CollaborationStatus.ACCEPTED.value:
                raise HTTPException(status_code=400, detail="Referral is not accepted")
            
            ref["status"] = CollaborationStatus.COMPLETED.value
            if notes:
                ref["response_notes"] = (ref["response_notes"] or "") + f"\n[Completed] {notes}"
            
            return ReferralResponse(**ref)
    
    raise HTTPException(status_code=404, detail="Referral not found or access denied")


@router.get("/case/{case_id}", response_model=List[ReferralResponse])
async def get_case_collaborations(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all collaboration requests for a specific case."""
    # Verify user has access to the case
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Check access (involved in the case or admin)
    has_access = (
        case.creatorId == current_user.id or 
        case.specialistId == current_user.id or
        current_user.role == "Admin" or
        any(r["to_doctor_id"] == current_user.id for r in _referrals if r["case_id"] == case_id)
    )
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Access denied")
    
    referrals = [r for r in _referrals if r["case_id"] == case_id]
    referrals.sort(key=lambda x: x["created_at"], reverse=True)
    
    return [ReferralResponse(**r) for r in referrals]


@router.get("/pending-count")
async def get_pending_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of pending referrals for the current user."""
    count = sum(
        1 for r in _referrals
        if r["to_doctor_id"] == current_user.id and r["status"] == CollaborationStatus.PENDING.value
    )
    return {"pending_count": count}


@router.get("/specialists")
async def get_available_specialists(
    specialty: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of specialists available for referrals."""
    query = db.query(User).filter(User.role.in_(["Doctor", "Specialist"]))
    
    if specialty:
        query = query.filter(User.specialty.ilike(f"%{specialty}%"))
    
    # Exclude current user
    query = query.filter(User.id != current_user.id)
    
    doctors = query.all()
    
    return [
        {
            "id": d.id,
            "name": f"Dr. {d.name}",
            "role": d.role,
            "specialty": getattr(d, 'specialty', 'General'),
            "email": d.email
        }
        for d in doctors
    ]
