"""
Audit Log Routes for Intelligent Health Platform

Provides API endpoints for accessing audit logs (admin/compliance only).
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List

from ..database import get_db
from ..models import User
from ..routes.auth import get_current_user
from ..services.audit_service import AuditLogService, AuditSeverity

router = APIRouter(prefix="/api/audit", tags=["Audit"])


def require_compliance_access(current_user: User = Depends(get_current_user)):
    """Ensure user has compliance/admin access for audit logs."""
    allowed_roles = ["Admin", "Compliance", "Manager"]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="Audit log access requires Admin, Compliance, or Manager role"
        )
    return current_user


@router.get("/logs")
async def get_audit_logs(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    severity: Optional[str] = Query(None, description="Filter by severity (info, warning, error, critical)"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_compliance_access)
):
    """
    Get audit logs with optional filters.
    
    Requires Admin, Compliance, or Manager role.
    """
    service = AuditLogService(db)
    
    # Parse dates
    parsed_start = None
    parsed_end = None
    if start_date:
        try:
            parsed_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    
    if end_date:
        try:
            parsed_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    
    # Parse severity
    parsed_severity = None
    if severity:
        try:
            parsed_severity = AuditSeverity(severity.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid severity. Use: info, warning, error, critical")
    
    logs = service.get_logs(
        user_id=user_id,
        severity=parsed_severity,
        start_date=parsed_start,
        end_date=parsed_end,
        limit=limit,
        offset=offset
    )
    
    return {
        "logs": [
            {
                "id": log.id,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "level": log.level,
                "source": log.source,
                "message": log.message,
                "user_id": log.user_id,
                "details": log.details
            }
            for log in logs
        ],
        "count": len(logs),
        "offset": offset,
        "limit": limit
    }


@router.get("/logs/user/{user_id}")
async def get_user_activity(
    user_id: str,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_compliance_access)
):
    """Get audit logs for a specific user."""
    service = AuditLogService(db)
    logs = service.get_user_activity(user_id, days=days)
    
    return {
        "user_id": user_id,
        "period_days": days,
        "activity": [
            {
                "id": log.id,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "action": log.source,
                "message": log.message,
                "level": log.level
            }
            for log in logs
        ]
    }


@router.get("/logs/patient/{patient_id}")
async def get_patient_access_log(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_compliance_access)
):
    """
    Get all access logs for a specific patient.
    
    This is important for HIPAA compliance - tracking who accessed patient data.
    """
    service = AuditLogService(db)
    logs = service.get_patient_access_log(patient_id)
    
    return {
        "patient_id": patient_id,
        "access_log": [
            {
                "id": log.id,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "user_id": log.user_id,
                "action": log.source,
                "message": log.message
            }
            for log in logs
        ]
    }


@router.get("/stats")
async def get_audit_stats(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_compliance_access)
):
    """Get audit statistics for the dashboard."""
    from ..models import SystemLog
    from sqlalchemy import func
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Count by severity
    severity_counts = db.query(
        SystemLog.level,
        func.count(SystemLog.id)
    ).filter(
        SystemLog.timestamp >= start_date
    ).group_by(SystemLog.level).all()
    
    # Count by day
    daily_counts = db.query(
        func.date(SystemLog.timestamp),
        func.count(SystemLog.id)
    ).filter(
        SystemLog.timestamp >= start_date
    ).group_by(func.date(SystemLog.timestamp)).all()
    
    return {
        "period_days": days,
        "by_severity": {level: count for level, count in severity_counts},
        "by_day": [
            {"date": str(date), "count": count}
            for date, count in daily_counts
        ],
        "total": sum(count for _, count in severity_counts)
    }


@router.get("/export")
async def export_audit_logs(
    start_date: str = Query(..., description="Start date (ISO format)"),
    end_date: str = Query(..., description="End date (ISO format)"),
    format: str = Query("json", description="Export format (json or csv)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_compliance_access)
):
    """
    Export audit logs for compliance reporting.
    
    Returns logs in JSON or CSV format.
    """
    from fastapi.responses import Response
    import csv
    import io
    
    try:
        parsed_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        parsed_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")
    
    service = AuditLogService(db)
    logs = service.get_logs(
        start_date=parsed_start,
        end_date=parsed_end,
        limit=10000  # Max export size
    )
    
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Timestamp", "Level", "Source", "Message", "User ID", "Details"])
        
        for log in logs:
            writer.writerow([
                log.id,
                log.timestamp.isoformat() if log.timestamp else "",
                log.level,
                log.source,
                log.message,
                log.user_id or "",
                log.details or ""
            ])
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=audit_logs_{start_date}_{end_date}.csv"}
        )
    else:
        return {
            "export_date": datetime.utcnow().isoformat(),
            "period": {"start": start_date, "end": end_date},
            "total_records": len(logs),
            "logs": [
                {
                    "id": log.id,
                    "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                    "level": log.level,
                    "source": log.source,
                    "message": log.message,
                    "user_id": log.user_id,
                    "details": log.details
                }
                for log in logs
            ]
        }
