from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import User, Transaction, SystemConfig
from .auth import get_current_user
from pydantic import BaseModel
import datetime

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/financials/overview")
async def get_financial_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Admin":
         raise HTTPException(status_code=403, detail="Admin Access Only")
         
    transactions = db.query(Transaction).all()
    total_rev = sum(t.amount for t in transactions if t.status == "Paid")
    
    # Mock breakdown
    return {
        "total_revenue": total_rev,
        "monthly_breakdown": {"Jan": 1500, "Feb": 2000}
    }

class AIConfig(BaseModel):
    default_model: str
    fallback_model: str
    vision_model: str

@router.post("/config/ai")
async def update_ai_config(
    config: AIConfig,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Admin":
         raise HTTPException(status_code=403, detail="Admin Access Only")
         
    sc = db.query(SystemConfig).filter(SystemConfig.key == "ai_settings").first()
    if not sc:
        sc = SystemConfig(key="ai_settings", value=config.dict())
        db.add(sc)
    else:
        sc.value = config.dict()
        
    db.commit()
    return sc.value
