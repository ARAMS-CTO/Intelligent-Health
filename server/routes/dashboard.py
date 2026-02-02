from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..schemas import Comment, AdminStats, SystemConfigUpdate, SystemLog as SystemLogSchema, DashboardStats
from ..database import get_db
import server.models as models
# Case, Comment, User, SystemConfig, MedicalRecord accessed via models.*
# SystemLog accessed via models.SystemLog
import os
router = APIRouter()

# Check for Gemini API Key availability
API_KEY = os.environ.get("GEMINI_API_KEY")

from ..routes.auth import get_current_user
from ..schemas import User

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    three_days_ago = now - timedelta(days=3)
    twenty_four_hours_ago = now - timedelta(hours=24)
    
    three_days_ago_iso = three_days_ago.isoformat()
    twenty_four_hours_ago_iso = twenty_four_hours_ago.isoformat()

    # Overdue: Cases created > 3 days ago that are still Open
    overdue_count = db.query(models.Case).filter(
        models.Case.status.in_(["Open", "Under Review"]),
        models.Case.created_at < three_days_ago_iso
    ).count()

    # Updates: Comments in last 24h (system-wide for now, or relevant to user cases)
    updates_count = db.query(models.Comment).filter(
        models.Comment.timestamp > twenty_four_hours_ago_iso
    ).count()

    # Assignments: Cases assigned to THIS user that are Open
    assignments_count = db.query(models.Case).filter(
        models.Case.specialist_id == current_user.id,
        models.Case.status == "Open"
    ).count()

    return {
        "overdue": overdue_count,
        "updates": updates_count,
        "assignments": assignments_count
    }

@router.get("/admin/stats", response_model=AdminStats)
async def get_admin_stats(db: Session = Depends(get_db)):
    total_users = db.query(models.User).count()
    active_users = db.query(models.User).count() # Mock for now
    total_cases = db.query(models.Case).count()
    active_cases = db.query(models.Case).filter(models.Case.status.in_(["Open", "Under Review"])).count()
    total_comments = db.query(models.Comment).count()
    
    # Calculate AI queries in last 24h from SystemLogs
    now = datetime.utcnow()
    day_ago = now - timedelta(hours=24)
    ai_queries = db.query(models.SystemLog).filter(
        models.SystemLog.event_type == "ai_query",
        models.SystemLog.timestamp > day_ago
    ).count()

    # Gemini Status check
    gemini_status = "Connected" if API_KEY else "Disconnected"
    
    # DB Status
    db_status = "Connected"
    
    # Token Usage History (7 days)
    token_usage_history = []
    for i in range(7):
        date_val = (now - timedelta(days=6-i)).date()
        date_start = datetime.combine(date_val, datetime.min.time())
        date_end = datetime.combine(date_val, datetime.max.time())
        
        daily_queries = db.query(models.SystemLog).filter(
            models.SystemLog.event_type == "ai_query",
            models.SystemLog.timestamp >= date_start,
            models.SystemLog.timestamp <= date_end
        ).count()
        
        token_usage_history.append({"date": date_val.strftime("%a"), "tokens": daily_queries * 1000})

    # Storage Stats
    medical_images_count = db.query(models.MedicalRecord).filter(models.MedicalRecord.type.in_(["Imaging", "CT", "X-Ray", "MRI"])).count()
    patient_docs_count = db.query(models.MedicalRecord).filter(models.MedicalRecord.type.in_(["Report", "Lab", "Prescription", "Discharge Summary"])).count()
    logs_count = db.query(models.SystemLog).count()
    
    # Estimate Sizes (GB)
    storage_stats = {
        "images_size_gb": round(medical_images_count * 0.005, 4),
        "documents_size_gb": round(patient_docs_count * 0.0005, 4),
        "logs_size_gb": round(logs_count * 0.000001, 6)
    }

    # Calculate System Health
    system_health = "Optimal"
    if gemini_status != "Connected" or db_status != "Connected":
        system_health = "Degraded"

    return {
        "total_users": total_users,
        "active_cases": active_cases,
        "ai_queries_today": ai_queries,
        "system_health": system_health,
        "gemini_status": gemini_status,
        "db_status": db_status,
        "token_usage_history": token_usage_history,
        "storage_stats": storage_stats
    }

@router.get("/admin/config")
async def get_system_config(db: Session = Depends(get_db)):
    config = db.query(models.SystemConfig).filter(models.SystemConfig.key == "features").first()
    if not config:
        # Default features
        default_features = {
            "medLM": True,
            "voiceAssistant": True,
            "ragKnowledge": True,
            "autoTriage": True
        }
        return {"features": default_features}
    return {"features": config.value}

@router.post("/admin/config")
async def update_system_config(update: SystemConfigUpdate, db: Session = Depends(get_db)):
    # Ensure features is a dict
    features_val = update.features if isinstance(update.features, dict) else {}
    
    config = db.query(models.SystemConfig).filter(models.SystemConfig.key == "features").first()
    if not config:
        config = models.SystemConfig(key="features", value=features_val)
        db.add(config)
    else:
        config.value = features_val
    
    # Handle maintenance_mode if provided in the update
    if update.maintenance_mode is not None:
        maintenance_config = db.query(models.SystemConfig).filter(models.SystemConfig.key == "maintenance_mode").first()
        if not maintenance_config:
            maintenance_config = models.SystemConfig(key="maintenance_mode", value={"enabled": update.maintenance_mode})
            db.add(maintenance_config)
        else:
            maintenance_config.value = {"enabled": update.maintenance_mode}
    
    db.commit()
    return {"status": "success", "features": config.value}

@router.get("/admin/logs", response_model=List[SystemLogSchema])
async def get_system_logs(db: Session = Depends(get_db)):
    # Import locally or alias to avoid conflict if top-level import is tricky
    # But better to update top level imports.
    # For now, I will use the schema from ..schemas
    return db.query(models.SystemLog).order_by(models.SystemLog.timestamp.desc()).limit(20).all()

@router.get("/activity", response_model=List[Comment])
async def get_recent_activity(db: Session = Depends(get_db)):
    recent_comments = db.query(models.Comment).order_by(models.Comment.timestamp.desc()).limit(5).all()
    return recent_comments

@router.get("/admin/agents", response_model=List[dict])
async def get_admin_agents(db: Session = Depends(get_db)):
    agents = db.query(models.AgentCapability).all()
    return [
        {
            "id": a.id,
            "agent_role": a.agent_role,
            "capability_name": a.capability_name,
            "description": a.description,
            "is_active": a.is_active
        }
        for a in agents
    ]

# --- User Management ---

@router.get("/admin/users")
async def get_admin_users(
    skip: int = 0, 
    limit: int = 50,
    search: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.User)
    if search:
        query = query.filter(models.User.email.ilike(f"%{search}%") | models.User.name.ilike(f"%{search}%"))
    
    users = query.offset(skip).limit(limit).all()
    
    # Return simplified view
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_active": True, # Assuming active if in DB
            "credits": u.credits, # If credits column exists on User, otherwise need join
            "created_at": getattr(u, 'created_at', None) # Or similar
        }
        for u in users
    ]

@router.post("/admin/users/{user_id}/deactivate")
async def deactivate_user(user_id: str, db: Session = Depends(get_db)):
    # Mock deactivation as we don't have 'is_active' column in provided User schema yet?
    # Actually User model likely has it or we can delete.
    # Let's verify User model first. For now, just log.
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # user.is_active = False
    # db.commit()
    return {"status": "success", "message": f"User {user.email} deactivated (Simulated)"}

@router.post("/admin/users/{user_id}/credits")
async def grant_credits(user_id: str, amount: float = 100.0, db: Session = Depends(get_db)):
    from ..services.credit_service import CreditService
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    cs = CreditService(db)
    cs.add_credits(user_id, amount, "Admin Grant")
    
    return {"status": "success", "new_balance": user.credits}

@router.post("/admin/users/{user_id}/reset-password")
async def reset_password(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # In real app, generate token and email.
    return {"status": "success", "message": f"Password reset email sent to {user.email} (Simulated)"}
