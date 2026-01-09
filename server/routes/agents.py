from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models import AgentCapability, SystemLog, User
from ..schemas import AgentCapability as AgentCapabilitySchema
from ..routes.auth import get_current_user

router = APIRouter()

@router.get("", response_model=List[AgentCapabilitySchema])
async def list_agents(db: Session = Depends(get_db)):
    """List all available agent capabilities/tasks."""
    return db.query(AgentCapability).all()

@router.put("/{agent_id}", response_model=AgentCapabilitySchema)
async def update_agent(agent_id: str, updates: Dict[str, Any], current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update agent configuration (Admin only)."""
    if current_user.role != "Admin": raise HTTPException(403, "Admin only")
    
    agent = db.query(AgentCapability).filter(AgentCapability.id == agent_id).first()
    if not agent: raise HTTPException(404, "Agent not found")
    
    if "is_active" in updates:
        agent.is_active = updates["is_active"]
    if "description" in updates:
        agent.description = updates["description"]
    # Note: input/output_schema updates can be added if schema supports it
    
    db.commit()
    db.refresh(agent)
    return agent

@router.post("/{agent_id}/test")
async def test_agent(agent_id: str, payload: Dict[str, Any] = Body(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Execute an agent task directly for testing."""
    if current_user.role != "Admin": raise HTTPException(403, "Admin only")
    
    agent = db.query(AgentCapability).filter(AgentCapability.id == agent_id).first()
    if not agent: raise HTTPException(404, "Agent not found")
    
    # Execute via Orchestrator
    try:
        from ..agents.orchestrator import orchestrator
        
        context = {"user_id": current_user.id, "user_role": current_user.role}
        task_name = agent.capability_name 
        
        result = await orchestrator.dispatch(task_name, payload, context, db)
        return {"status": "success", "result": result}
    except ImportError:
         return {"status": "error", "message": "Orchestrator not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/{agent_id}/activity")
async def get_agent_activity(agent_id: str, db: Session = Depends(get_db)):
    """Get recent logs relevant to AI/Agents."""
    # Filter for each_query for now. 
    # In future, filter by agent_id in details.
    logs = db.query(SystemLog).filter(SystemLog.event_type == "ai_query").order_by(SystemLog.timestamp.desc()).limit(20).all()
    return logs

@router.post("/seed")
async def seed_agents_endpoint(current_user: User = Depends(get_current_user)):
    """Seed default agent capabilities (Admin only)."""
    if current_user.role != "Admin": raise HTTPException(403, "Admin only")
    try:
        from ..seed_data import seed_agents
        # Create new session for seeding or use db? 
        # seed_agents uses SessionLocal internally.
        seed_agents()
        return {"status": "success", "message": "Agent capabilities seeded."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
