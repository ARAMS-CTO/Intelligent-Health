"""
Messaging Routes for Intelligent Health Platform

Provides secure messaging between doctors, patients, and staff.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
import uuid

from ..database import get_db
from ..models import User, Patient
from ..routes.auth import get_current_user

router = APIRouter(prefix="/api/messages", tags=["Messaging"])


# Pydantic Models
class MessageCreate(BaseModel):
    recipient_id: str
    subject: Optional[str] = None
    content: str
    related_case_id: Optional[str] = None
    priority: str = "normal"  # normal, urgent, routine


class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    sender_role: str
    recipient_id: str
    recipient_name: str
    subject: Optional[str]
    content: str
    related_case_id: Optional[str]
    priority: str
    is_read: bool
    created_at: str
    read_at: Optional[str]


class ConversationSummary(BaseModel):
    participant_id: str
    participant_name: str
    participant_role: str
    last_message: str
    last_message_time: str
    unread_count: int


# In-memory message storage (replace with database model in production)
_messages: List[dict] = []


def get_user_display_name(user: User) -> str:
    """Get display name with appropriate title."""
    if user.role in ["Doctor", "Specialist"]:
        return f"Dr. {user.name}"
    return user.name


@router.post("/send", response_model=MessageResponse)
async def send_message(
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message to another user."""
    # Verify recipient exists
    recipient = db.query(User).filter(User.id == message.recipient_id).first()
    if not recipient:
        # Check if it's a patient ID
        patient = db.query(Patient).filter(Patient.id == message.recipient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        recipient_name = patient.name
        recipient_role = "Patient"
    else:
        recipient_name = recipient.name
        recipient_role = recipient.role
    
    msg_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    new_message = {
        "id": msg_id,
        "sender_id": current_user.id,
        "sender_name": get_user_display_name(current_user),
        "sender_role": current_user.role,
        "recipient_id": message.recipient_id,
        "recipient_name": recipient_name,
        "subject": message.subject,
        "content": message.content,
        "related_case_id": message.related_case_id,
        "priority": message.priority,
        "is_read": False,
        "created_at": now.isoformat(),
        "read_at": None
    }
    
    _messages.append(new_message)
    
    # TODO: Trigger notification via WebSocket
    # await notify_user(message.recipient_id, "new_message", new_message)
    
    return MessageResponse(**new_message)


@router.get("/inbox", response_model=List[MessageResponse])
async def get_inbox(
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get messages received by the current user."""
    user_messages = [
        m for m in _messages 
        if m["recipient_id"] == current_user.id
    ]
    
    if unread_only:
        user_messages = [m for m in user_messages if not m["is_read"]]
    
    # Sort by date, newest first
    user_messages.sort(key=lambda x: x["created_at"], reverse=True)
    
    return [MessageResponse(**m) for m in user_messages[offset:offset + limit]]


@router.get("/sent", response_model=List[MessageResponse])
async def get_sent_messages(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get messages sent by the current user."""
    sent = [m for m in _messages if m["sender_id"] == current_user.id]
    sent.sort(key=lambda x: x["created_at"], reverse=True)
    return [MessageResponse(**m) for m in sent[offset:offset + limit]]


@router.get("/conversation/{user_id}", response_model=List[MessageResponse])
async def get_conversation(
    user_id: str,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get conversation thread between current user and another user."""
    conversation = [
        m for m in _messages
        if (m["sender_id"] == current_user.id and m["recipient_id"] == user_id) or
           (m["sender_id"] == user_id and m["recipient_id"] == current_user.id)
    ]
    
    # Sort by date, oldest first for conversation flow
    conversation.sort(key=lambda x: x["created_at"])
    
    # Mark received messages as read
    for msg in conversation:
        if msg["recipient_id"] == current_user.id and not msg["is_read"]:
            msg["is_read"] = True
            msg["read_at"] = datetime.utcnow().isoformat()
    
    return [MessageResponse(**m) for m in conversation[-limit:]]


@router.post("/{message_id}/read")
async def mark_as_read(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a message as read."""
    for msg in _messages:
        if msg["id"] == message_id and msg["recipient_id"] == current_user.id:
            msg["is_read"] = True
            msg["read_at"] = datetime.utcnow().isoformat()
            return {"status": "ok", "message_id": message_id}
    
    raise HTTPException(status_code=404, detail="Message not found")


@router.get("/unread-count")
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread messages."""
    count = sum(
        1 for m in _messages 
        if m["recipient_id"] == current_user.id and not m["is_read"]
    )
    return {"unread_count": count}


@router.get("/conversations", response_model=List[ConversationSummary])
async def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of conversations with summary."""
    # Get all users the current user has messaged with
    participants = {}
    
    for msg in _messages:
        if msg["sender_id"] == current_user.id:
            pid = msg["recipient_id"]
            pname = msg["recipient_name"]
            # Infer role from recipient (simplified)
            prole = "User"
        elif msg["recipient_id"] == current_user.id:
            pid = msg["sender_id"]
            pname = msg["sender_name"]
            prole = msg["sender_role"]
        else:
            continue
        
        if pid not in participants:
            participants[pid] = {
                "participant_id": pid,
                "participant_name": pname,
                "participant_role": prole,
                "messages": []
            }
        participants[pid]["messages"].append(msg)
    
    # Build summaries
    summaries = []
    for pid, data in participants.items():
        messages = sorted(data["messages"], key=lambda x: x["created_at"], reverse=True)
        last_msg = messages[0]
        unread = sum(
            1 for m in messages 
            if m["recipient_id"] == current_user.id and not m["is_read"]
        )
        
        summaries.append(ConversationSummary(
            participant_id=pid,
            participant_name=data["participant_name"],
            participant_role=data["participant_role"],
            last_message=last_msg["content"][:100] + ("..." if len(last_msg["content"]) > 100 else ""),
            last_message_time=last_msg["created_at"],
            unread_count=unread
        ))
    
    # Sort by last message time
    summaries.sort(key=lambda x: x.last_message_time, reverse=True)
    
    return summaries


@router.delete("/{message_id}")
async def delete_message(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a message (soft delete for sender only)."""
    global _messages
    
    for i, msg in enumerate(_messages):
        if msg["id"] == message_id and msg["sender_id"] == current_user.id:
            _messages.pop(i)
            return {"status": "ok", "message": "Message deleted"}
    
    raise HTTPException(status_code=404, detail="Message not found or access denied")
