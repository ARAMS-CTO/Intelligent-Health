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

    # Calculate Overdue (Open/Under Review & > 3 days old)
    cases = db.query(CaseModel).filter(CaseModel.status.in_(["Open", "Under Review"])).all()
    overdue_count = 0
    for c in cases:
        try:
            # created_at is string ISO. Handle potential Z or no Z.
            # Ideally use a robust parser or store as datetime in DB.
            ts_str = c.created_at.replace("Z", "+00:00")
            # If no timezone, assume UTC
            created_at = datetime.fromisoformat(ts_str)
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=None) # Compare naive-to-naive or aware-to-aware
                # actually three_days_ago is naive (utcnow). So let's make created_at naive if needed or both aware.
                # utcnow returns naive.
            
            # Simplest: compare timestamps
            if created_at.timestamp() < three_days_ago.timestamp():
                overdue_count += 1
        except ValueError:
            pass 

    # Calculate Updates (Comments > 24h ago)
    comments = db.query(CommentModel).all()
    updates_count = 0
    for c in comments:
        try:
            ts_str = c.timestamp.replace("Z", "+00:00")
            timestamp = datetime.fromisoformat(ts_str)
            if timestamp.timestamp() > twenty_four_hours_ago.timestamp():
                updates_count += 1
        except ValueError:
            pass

    # Assignments (Mock logic)
    assignments_count = 5 

    return {
        "overdue": overdue_count,
        "updates": updates_count,
        "assignments": assignments_count
    }

@router.get("/activity", response_model=List[Comment])
async def get_recent_activity(db: Session = Depends(get_db)):
    comments = db.query(CommentModel).all()
    # Sort by timestamp desc
    sorted_comments = sorted(comments, key=lambda x: x.timestamp, reverse=True)
    return sorted_comments[:5]
