from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from typing import List
from ..schemas import AgentCapability as AgentCapabilitySchema, User
from ..database import get_db
from ..services.agent_bus import agent_bus
from ..routes.auth import get_current_user

router = APIRouter()

@router.post("/register")
async def register_capability(
    capability: AgentCapabilitySchema,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user) # Disabled for dev/seed ease, enable later
):
    return agent_bus.register_capability(db, capability)

@router.post("/find")
async def find_capability(
    query: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = agent_bus.find_capability(db, query)
    return results

@router.post("/seed")
async def seed_capabilities(
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
):
    return agent_bus.seed_defaults(db)

from ..agents.orchestrator import orchestrator

@router.post("/execute")
async def execute_capability(
    capability: str = Body(..., embed=True),
    params: dict = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Context for the agent
    context = {
        "user_id": current_user.id,
        "user_role": current_user.role,
        "user_name": current_user.name
    }
    
    # Delegate to Orchestrator
    # Note: 'capability' here maps to 'task' in the orchestrator
    return await orchestrator.dispatch(capability, params, context, db)
