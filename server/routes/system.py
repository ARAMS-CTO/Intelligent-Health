from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_db, get_pool_status
from ..config import settings
import server.models as models
from ..schemas_public import SanitizedSystemLog
import psutil
import os
from datetime import datetime

router = APIRouter()


@router.get("/health/detailed")
async def get_detailed_health(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Detailed health check endpoint for monitoring systems.
    Returns database connectivity, memory usage, and system status.
    """
    health = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.APP_VERSION,
        "checks": {}
    }
    
    # Database check
    try:
        db.execute(text("SELECT 1"))
        health["checks"]["database"] = {"status": "ok", "latency_ms": None}
    except Exception as e:
        health["status"] = "degraded"
        health["checks"]["database"] = {"status": "error", "error": str(e)}
    
    # Memory check
    try:
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        health["checks"]["memory"] = {
            "status": "ok",
            "rss_mb": round(memory_info.rss / 1024 / 1024, 2),
            "vms_mb": round(memory_info.vms / 1024 / 1024, 2),
            "percent": round(process.memory_percent(), 2)
        }
    except Exception as e:
        health["checks"]["memory"] = {"status": "error", "error": str(e)}
    
    # Connection pool check
    try:
        pool_status = get_pool_status()
        health["checks"]["connection_pool"] = {
            "status": "ok",
            **pool_status
        }
    except Exception as e:
        health["checks"]["connection_pool"] = {"status": "error", "error": str(e)}
    
    return health


@router.get("/metrics")
async def get_system_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    System metrics endpoint for dashboards and monitoring.
    """
    # Get counts from database
    user_count = db.query(models.User).count()
    patient_count = db.query(models.Patient).count()
    case_count = db.query(models.Case).count()
    
    # Get memory info
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    
    # Get CPU info
    cpu_percent = process.cpu_percent(interval=0.1)
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.APP_VERSION,
        "database": {
            "users": user_count,
            "patients": patient_count,
            "cases": case_count,
        },
        "process": {
            "memory_rss_mb": round(memory_info.rss / 1024 / 1024, 2),
            "memory_percent": round(process.memory_percent(), 2),
            "cpu_percent": round(cpu_percent, 2),
            "threads": process.num_threads(),
        },
        "pool": get_pool_status(),
    }


@router.get("/cache/stats")
async def get_cache_stats() -> Dict[str, Any]:
    """Get cache statistics."""
    try:
        from ..services.cache_service import cache
        return {
            "status": "ok",
            "stats": cache.get_stats()
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


@router.post("/cache/clear")
async def clear_cache(pattern: str = None) -> Dict[str, Any]:
    """Clear cache entries (admin only in production)."""
    try:
        from ..services.cache_service import cache
        if pattern:
            count = await cache.clear_pattern(pattern)
            return {"status": "ok", "cleared": count, "pattern": pattern}
        else:
            await cache.clear()
            return {"status": "ok", "message": "All cache cleared"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@router.get("/public/logs", response_model=List[SanitizedSystemLog])
async def get_public_audit_logs(db: Session = Depends(get_db)):
    """
    Returns anonymized system logs for the public transparency page.
    """
    # Fetch recent logs
    logs = db.query(models.SystemLog).order_by(models.SystemLog.timestamp.desc()).limit(20).all()
    
    sanitized = []
    for log in logs:
        role = "System"
        if log.user_id:
             user = db.query(models.User).filter(models.User.id == log.user_id).first()
             if user:
                 role = user.role
        
        # Create a fake hash for visual "blockchain" feel
        import hashlib
        fake_hash = hashlib.sha256(f"{log.id}-{log.timestamp}".encode()).hexdigest()[:16]
        
        sanitized.append(SanitizedSystemLog(
            id=log.id,
            timestamp=log.timestamp,
            event_type=log.event_type,
            actor_role=role,
            action_hash=f"0x{fake_hash}..."
        ))
        
    return sanitized

