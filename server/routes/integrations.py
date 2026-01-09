from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from pydantic import BaseModel

from ..database import get_db
from ..models import User, HealthIntegration
from .auth import get_current_user
from ..agents.orchestrator import orchestrator

router = APIRouter()

class ConnectRequest(BaseModel):
    provider: str # 'samsung_health', 'apple_health', 'withings', 'chatgpt_health'

class DisconnectRequest(BaseModel):
    provider: str

class SyncRequest(BaseModel):
    pass

@router.get("/status")
async def get_integration_status(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Delegate to Integration Agent
    context = {"user_id": current_user.id}
    res = await orchestrator.dispatch("get_status", {}, context, db)
    return res

@router.post("/connect")
async def connect_provider(
    request: ConnectRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    context = {"user_id": current_user.id}
    payload = {"provider": request.provider}
    res = await orchestrator.dispatch("connect_provider", payload, context, db)
    return res

@router.post("/disconnect")
async def disconnect_provider(
    request: DisconnectRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    context = {"user_id": current_user.id}
    payload = {"provider": request.provider}
    res = await orchestrator.dispatch("disconnect_provider", payload, context, db)
    return res

@router.post("/sync")
async def sync_integrations(
    request: SyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    context = {"user_id": current_user.id}
    res = await orchestrator.dispatch("sync_data", {}, context, db)
    return res
