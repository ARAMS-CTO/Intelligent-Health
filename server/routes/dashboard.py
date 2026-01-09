from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..schemas import Comment, AdminStats, SystemConfigUpdate, SystemLog as SystemLogSchema, DashboardStats
from ..database import get_db
from ..models import Case as CaseModel, Comment as CommentModel, User as UserModel, SystemLog, SystemConfig, MedicalRecord
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
    overdue_count = db.query(CaseModel).filter(
        CaseModel.status.in_(["Open", "Under Review"]),
        CaseModel.created_at < three_days_ago_iso
    ).count()

    # Updates: Comments in last 24h (system-wide for now, or relevant to user cases)
    updates_count = db.query(CommentModel).filter(
        CommentModel.timestamp > twenty_four_hours_ago_iso
    ).count()

    # Assignments: Cases assigned to THIS user that are Open
    assignments_count = db.query(CaseModel).filter(
        CaseModel.specialist_id == current_user.id,
        CaseModel.status == "Open"
    ).count()

    return {
        "overdue": overdue_count,
        "updates": updates_count,
        "assignments": assignments_count
    }

@router.get("/admin/stats", response_model=AdminStats)
async def get_admin_stats(db: Session = Depends(get_db)):
    total_users = db.query(UserModel).count()
    active_cases = db.query(CaseModel).filter(CaseModel.status != "Closed").count()
    
    # Calculate AI queries in last 24h from SystemLogs
    now = datetime.utcnow()
    day_ago = now - timedelta(hours=24)
    ai_queries = db.query(SystemLog).filter(
        SystemLog.event_type == "ai_query",
        SystemLog.timestamp > day_ago
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
        
        daily_queries = db.query(SystemLog).filter(
            SystemLog.event_type == "ai_query",
            SystemLog.timestamp >= date_start,
            SystemLog.timestamp <= date_end
        ).count()
        
        token_usage_history.append({"date": date_val.strftime("%a"), "tokens": daily_queries * 1000})

    # Storage Stats
    medical_images_count = db.query(MedicalRecord).filter(MedicalRecord.type.in_(["Imaging", "CT", "X-Ray", "MRI"])).count()
    patient_docs_count = db.query(MedicalRecord).filter(MedicalRecord.type.in_(["Report", "Lab", "Prescription", "Discharge Summary"])).count()
    logs_count = db.query(SystemLog).count()
    
    # Estimate Sizes (GB)
    storage_stats = {
        "images_size_gb": round(medical_images_count * 0.005, 4),
        "documents_size_gb": round(patient_docs_count * 0.0005, 4),
        "logs_size_gb": round(logs_count * 0.000001, 6)
    }

    return {
        "total_users": total_users,
        "active_cases": active_cases,
        "ai_queries_today": ai_queries,
        "system_health": "Optimal",
        "gemini_status": gemini_status,
        "db_status": db_status,
        "token_usage_history": token_usage_history,
        "storage_stats": storage_stats
    }

@router.get("/admin/config")
async def get_system_config(db: Session = Depends(get_db)):
    config = db.query(SystemConfig).filter(SystemConfig.key == "features").first()
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
    config = db.query(SystemConfig).filter(SystemConfig.key == "features").first()
    if not config:
        config = SystemConfig(key="features", value=update.features)
        db.add(config)
    else:
        config.value = update.features
    
    db.commit()
    return {"status": "success", "features": config.value}

@router.get("/admin/logs", response_model=List[SystemLogSchema])
async def get_system_logs(db: Session = Depends(get_db)):
    # Import locally or alias to avoid conflict if top-level import is tricky
    # But better to update top level imports.
    # For now, I will use the schema from ..schemas
    return db.query(SystemLog).order_by(SystemLog.timestamp.desc()).limit(20).all()

@router.get("/activity", response_model=List[Comment])
async def get_recent_activity(db: Session = Depends(get_db)):
    recent_comments = db.query(CommentModel).order_by(CommentModel.timestamp.desc()).limit(5).all()
    return recent_comments
