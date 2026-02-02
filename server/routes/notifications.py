from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from ..database import get_db
from ..models import User, Notification, NotificationPreference
from ..schemas import NotificationSchema, NotificationPreferenceSchema, NotificationPreferenceUpdate
from .auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationSchema])
async def get_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notifications for the current user"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    return notifications

@router.get("/count")
async def get_notification_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    return {"unread_count": count}

@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    
    return {"status": "read", "id": notification_id}

@router.post("/read-all")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    
    return {"status": "all_read"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    
    return {"status": "deleted", "id": notification_id}

# --- Preferences ---

@router.get("/preferences", response_model=NotificationPreferenceSchema)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification preferences for the current user"""
    prefs = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == current_user.id
    ).first()
    
    if not prefs:
        # Create defaults
        prefs = NotificationPreference(
            user_id=current_user.id,
            email_enabled=True,
            push_enabled=True,
            sms_enabled=False,
            types_enabled=["case_update", "appointment", "system", "ai", "lab", "prescription"]
        )
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    
    return prefs

@router.put("/preferences", response_model=NotificationPreferenceSchema)
async def update_preferences(
    updates: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update notification preferences"""
    prefs = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == current_user.id
    ).first()
    
    if not prefs:
        prefs = NotificationPreference(user_id=current_user.id)
        db.add(prefs)
    
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(prefs, key, value)
    
    db.commit()
    db.refresh(prefs)
    
    return prefs

# --- Helper function for other modules ---

def send_notification(
    db: Session,
    user_id: str,
    type: str,
    title: str,
    message: str,
    link: str = None,
    metadata: dict = None
):
    """
    Helper function to create a notification.
    Can be imported and used by other modules.
    """
    notification = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link,
        metadata_=metadata
    )
    db.add(notification)
    return notification
