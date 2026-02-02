from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...models import User, Feedback, FeedbackResponse
from ...schemas import FeedbackCreate, FeedbackTicket, FeedbackResponse as FeedbackResponseSchema
from ..auth import get_current_user
import uuid
from datetime import datetime

router = APIRouter(prefix="/support", tags=["Support & Feedback"])

@router.post("/tickets", response_model=FeedbackTicket)
async def create_feedback_ticket(
    ticket: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify user matches
    if ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot create ticket for another user")
        
    db_feedback = Feedback(
        id=str(uuid.uuid4()),
        user_id=ticket.user_id,
        user_name=ticket.user_name,
        type=ticket.type,
        title=ticket.title,
        description=ticket.description,
        priority=ticket.priority,
        status="Open",
        created_at=datetime.utcnow()
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

@router.get("/tickets", response_model=List[FeedbackTicket])
async def get_feedback_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # If Admin, return all. If User, return own.
    if current_user.role == "Admin":
        feedbacks = db.query(Feedback).all()
    else:
        feedbacks = db.query(Feedback).filter(Feedback.user_id == current_user.id).all()
        
    # Map responses if any (simple logic for now)
    results = []
    for f in feedbacks:
        resp = db.query(FeedbackResponse).filter(FeedbackResponse.feedback_id == f.id).first()
        f_dict = f.__dict__
        f_dict['admin_response'] = resp.response_text if resp else None
        results.append(f_dict)
        
    return results

@router.post("/tickets/{ticket_id}/respond", response_model=FeedbackTicket)
async def respond_to_ticket(
    ticket_id: str,
    resp: FeedbackResponseSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admins can respond")
        
    feedback = db.query(Feedback).filter(Feedback.id == ticket_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    # Create response
    db_resp = FeedbackResponse(
        id=str(uuid.uuid4()),
        feedback_id=ticket_id,
        responder_id=current_user.id,
        response_text=resp.response,
        created_at=datetime.utcnow()
    )
    db.add(db_resp)
    
    # Update status
    feedback.status = "Resolved"
    
    db.commit()
    db.refresh(feedback)
    
    f_dict = feedback.__dict__
    f_dict['admin_response'] = resp.response
    return f_dict
