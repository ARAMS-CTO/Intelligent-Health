from fastapi import APIRouter, HTTPException
from typing import List
from ..schemas import Comment

router = APIRouter()

# Shared mock comments (in a real app, this would be a DB)
# We need to import MOCK_COMMENTS from cases to share state if we want consistency in this mock setup
# For now, I'll just define a list here, but in a real DB this isn't an issue.
# To make it work with the 'cases' route mock data, we should probably move MOCK_DATA to a shared module.
# But for this step, I'll just create a simple endpoint.

MOCK_COMMENTS_STORE = []

@router.get("", response_model=List[Comment])
async def get_all_comments():
    return MOCK_COMMENTS_STORE

@router.post("", response_model=Comment)
async def add_comment(comment: Comment):
    MOCK_COMMENTS_STORE.append(comment.dict())
    return comment
