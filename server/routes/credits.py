from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from server.database import get_db
import server.models as models
from server.routes.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter()

class CreditBalanceResponse(BaseModel):
    balance: float
    tier: str

class DeductRequest(BaseModel):
    amount: float
    reason: str

@router.get("/balance", response_model=CreditBalanceResponse)
def get_credit_balance(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    from ..services.credit_service import CreditService
    service = CreditService(db)
    wallet = service.get_wallet(current_user.id)
    return {"balance": wallet.balance, "tier": wallet.tier or "FREE"}

@router.post("/deduct")
def deduct_credits(
    request: DeductRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    from ..services.credit_service import CreditService
    service = CreditService(db)
    try:
        wallet = service.deduct_credits(current_user.id, request.amount, request.reason)
        return {"status": "success", "new_balance": wallet.balance}
    except ValueError as e:
        raise HTTPException(status_code=402, detail=str(e))
