from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session
from ..schemas import Comment as CommentSchema
from ..database import get_db
from ..models import Comment as CommentModel
from datetime import datetime
import uuid

router = APIRouter()

@router.get("", response_model=List[CommentSchema])
async def get_all_comments(db: Session = Depends(get_db)):
    return db.query(CommentModel).all()

@router.post("", response_model=CommentSchema)
async def add_comment(comment: CommentSchema, db: Session = Depends(get_db)):
    new_comment = CommentModel(
        id=str(uuid.uuid4()),
        case_id=comment.caseId,
        user_id=comment.userId,
        user_name=comment.userName,
        user_role=comment.userRole,
        timestamp=datetime.utcnow().isoformat(),
        text=comment.text
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment
