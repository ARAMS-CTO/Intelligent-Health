"""
Family Group Management Routes

Allows users to:
- Create family groups
- Add/remove family members
- Manage permissions for viewing records and booking appointments
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from ..database import get_db
from ..models import User, Patient, FamilyGroup, FamilyMember
from .auth import get_current_user

router = APIRouter(prefix="/family", tags=["Family Groups"])


# --- Request/Response Models ---

class FamilyGroupCreate(BaseModel):
    name: str

class FamilyMemberAdd(BaseModel):
    name: str
    relationship: str  # 'Self', 'Spouse', 'Child', 'Parent', 'Dependent'
    patient_id: Optional[str] = None
    user_id: Optional[str] = None
    can_view_records: bool = True
    can_book_appointments: bool = True
    can_receive_notifications: bool = True

class FamilyMemberUpdate(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None
    can_view_records: Optional[bool] = None
    can_book_appointments: Optional[bool] = None
    can_receive_notifications: Optional[bool] = None


# --- Group Endpoints ---

@router.get("/groups")
async def get_my_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all family groups the user owns or is a member of."""
    # Groups I own
    owned = db.query(FamilyGroup).filter(FamilyGroup.owner_id == current_user.id).all()
    
    # Groups I'm a member of
    memberships = db.query(FamilyMember).filter(FamilyMember.user_id == current_user.id).all()
    member_group_ids = [m.group_id for m in memberships]
    member_groups = db.query(FamilyGroup).filter(FamilyGroup.id.in_(member_group_ids)).all() if member_group_ids else []
    
    # Combine and dedupe
    all_groups = {g.id: g for g in owned + member_groups}
    
    result = []
    for group in all_groups.values():
        result.append({
            "id": group.id,
            "name": group.name,
            "owner_id": group.owner_id,
            "is_owner": group.owner_id == current_user.id,
            "member_count": len(group.members),
            "created_at": group.created_at.isoformat() if group.created_at else None
        })
    
    return {"groups": result}


@router.post("/groups")
async def create_group(
    data: FamilyGroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new family group."""
    group = FamilyGroup(
        id=str(uuid.uuid4()),
        name=data.name,
        owner_id=current_user.id
    )
    db.add(group)
    
    # Automatically add owner as first member
    self_member = FamilyMember(
        id=str(uuid.uuid4()),
        group_id=group.id,
        user_id=current_user.id,
        name=current_user.name,
        relationship="Self",
        can_view_records=True,
        can_book_appointments=True,
        can_receive_notifications=True
    )
    db.add(self_member)
    
    db.commit()
    db.refresh(group)
    
    return {
        "id": group.id,
        "name": group.name,
        "message": "Family group created successfully"
    }


@router.get("/groups/{group_id}")
async def get_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific family group with all members."""
    group = db.query(FamilyGroup).filter(FamilyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check permission
    is_member = any(m.user_id == current_user.id for m in group.members)
    if group.owner_id != current_user.id and not is_member:
        raise HTTPException(status_code=403, detail="Access denied")
    
    members = []
    for m in group.members:
        members.append({
            "id": m.id,
            "name": m.name,
            "relationship": m.relationship,
            "user_id": m.user_id,
            "patient_id": m.patient_id,
            "can_view_records": m.can_view_records,
            "can_book_appointments": m.can_book_appointments,
            "can_receive_notifications": m.can_receive_notifications,
            "added_at": m.added_at.isoformat() if m.added_at else None
        })
    
    return {
        "id": group.id,
        "name": group.name,
        "owner_id": group.owner_id,
        "is_owner": group.owner_id == current_user.id,
        "members": members,
        "created_at": group.created_at.isoformat() if group.created_at else None
    }


@router.delete("/groups/{group_id}")
async def delete_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a family group (owner only)."""
    group = db.query(FamilyGroup).filter(FamilyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can delete the group")
    
    # Delete all members first
    db.query(FamilyMember).filter(FamilyMember.group_id == group_id).delete()
    db.delete(group)
    db.commit()
    
    return {"status": "deleted", "id": group_id}


# --- Member Endpoints ---

@router.post("/groups/{group_id}/members")
async def add_member(
    group_id: str,
    data: FamilyMemberAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a family member to a group."""
    group = db.query(FamilyGroup).filter(FamilyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can add members")
    
    member = FamilyMember(
        id=str(uuid.uuid4()),
        group_id=group_id,
        user_id=data.user_id,
        patient_id=data.patient_id,
        name=data.name,
        relationship=data.relationship,
        can_view_records=data.can_view_records,
        can_book_appointments=data.can_book_appointments,
        can_receive_notifications=data.can_receive_notifications
    )
    
    db.add(member)
    db.commit()
    db.refresh(member)
    
    return {
        "id": member.id,
        "name": member.name,
        "message": "Member added successfully"
    }


@router.put("/groups/{group_id}/members/{member_id}")
async def update_member(
    group_id: str,
    member_id: str,
    data: FamilyMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a family member's details or permissions."""
    group = db.query(FamilyGroup).filter(FamilyGroup.id == group_id).first()
    if not group or group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id,
        FamilyMember.group_id == group_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(member, key, value)
    
    db.commit()
    
    return {"status": "updated", "id": member_id}


@router.delete("/groups/{group_id}/members/{member_id}")
async def remove_member(
    group_id: str,
    member_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a family member from a group."""
    group = db.query(FamilyGroup).filter(FamilyGroup.id == group_id).first()
    if not group or group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id,
        FamilyMember.group_id == group_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Can't remove yourself if you're the owner
    if member.user_id == current_user.id and member.relationship == "Self":
        raise HTTPException(status_code=400, detail="Cannot remove yourself from the group")
    
    db.delete(member)
    db.commit()
    
    return {"status": "removed", "id": member_id}


# --- Utility Endpoints ---

@router.get("/members/patients")
async def get_family_patients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all patients the current user can access through family groups.
    Useful for appointment booking dropdowns.
    """
    # Get all groups user is a member of
    memberships = db.query(FamilyMember).filter(FamilyMember.user_id == current_user.id).all()
    group_ids = [m.group_id for m in memberships]
    
    # Get all members with can_view_records or can_book_appointments
    accessible_members = db.query(FamilyMember).filter(
        FamilyMember.group_id.in_(group_ids),
        FamilyMember.patient_id.isnot(None)
    ).all()
    
    result = []
    seen_patients = set()
    
    for member in accessible_members:
        if member.patient_id not in seen_patients:
            seen_patients.add(member.patient_id)
            result.append({
                "patient_id": member.patient_id,
                "name": member.name,
                "relationship": member.relationship,
                "can_book": member.can_book_appointments
            })
    
    return {"patients": result}
