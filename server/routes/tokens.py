from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..services.token_service import TokenService
from ..routes.auth import get_current_user
from pydantic import BaseModel
from typing import List

router = APIRouter()

class CreateGroupRequest(BaseModel):
    name: str
    topic: str
    members: List[str]

@router.get("/balance")
async def get_balance(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = TokenService(db)
    wallet = service.get_wallet(current_user.id)
    return {"balance": wallet.balance, "total_earned": wallet.total_earned}

@router.post("/groups")
async def create_research_group(req: CreateGroupRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = TokenService(db)
    try:
        group = service.create_research_group(current_user.id, req.name, req.topic, req.members)
        return {"status": "success", "group_id": group.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/groups")
async def get_research_groups(db: Session = Depends(get_db)):
    from ..models import ResearchGroup
    groups = db.query(ResearchGroup).order_by(ResearchGroup.created_at.desc()).all()
    return groups

@router.post("/groups/{group_id}/join")
async def join_group(group_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = TokenService(db)
    try:
        service.join_research_group(group_id, current_user.id)
        return {"status": "success"}
    except ValueError as e:
         raise HTTPException(status_code=404, detail="Group not found")

@router.get("/history")
async def get_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Simple fetch via relationship (would usually be paginated)
    return current_user.token_wallet.transactions if current_user.token_wallet else []

class ContributionRequest(BaseModel):
    group_id: str
    data_type: str # 'Case', 'File'
    data_id: str

@router.post("/contribute")
async def contribute_data(req: ContributionRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = TokenService(db)
    # 1. Verify user is in group (Skipped for MVP - ANYONE can contribute to public research)
    
    # 2. Calculate Quality (Mock AI check)
    import random
    quality = random.uniform(0.7, 1.0) 
    
    contribution = service.log_contribution(req.group_id, current_user.id, req.data_type, req.data_id, quality)
    
    return {
        "status": "success", 
        "tokens_earned": contribution.tokens_awarded,
        "quality_score": contribution.quality_score
    }
