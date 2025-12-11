from fastapi import APIRouter, Depends
from typing import List, Dict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..schemas import Comment
from ..database import get_db
from ..models import Case as CaseModel, Comment as CommentModel

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    three_days_ago = now - timedelta(days=3)
    twenty_four_hours_ago = now - timedelta(hours=24)
    
    # ISO Format Strings for comparison (Assumes DB stores ISO strings)
    # Note: DB strings might not have timezone info, matching default isoformat()
    three_days_ago_iso = three_days_ago.isoformat()
    twenty_four_hours_ago_iso = twenty_four_hours_ago.isoformat()

    # Calculate Overdue (Open/Under Review & > 3 days old)
    # Using SQL filtering for efficiency
    overdue_count = db.query(CaseModel).filter(
        CaseModel.status.in_(["Open", "Under Review"]),
        CaseModel.created_at < three_days_ago_iso
    ).count()

    # Calculate Updates (Comments > 24h ago... wait, logic says "Updates" usually means RECENT updates)
    # If the user wants "Updates", they likely mean NEW updates (last 24h), not OLD updates.
    # The original logic was `timestamp > twenty_four_hours_ago.timestamp()`, which means NEWER than 24h.
    updates_count = db.query(CommentModel).filter(
        CommentModel.timestamp > twenty_four_hours_ago_iso
    ).count()

    # Assignments (Mock logic for now, or count cases assigned to user if auth user passed)
    assignments_count = 5 

    return {
        "overdue": overdue_count,
        "updates": updates_count,
        "assignments": assignments_count
    }

@router.get("/activity", response_model=List[Comment])
async def get_recent_activity(db: Session = Depends(get_db)):
    # Use SQL Order By and Limit for efficiency
    recent_comments = db.query(CommentModel).order_by(CommentModel.timestamp.desc()).limit(5).all()
    return recent_comments
