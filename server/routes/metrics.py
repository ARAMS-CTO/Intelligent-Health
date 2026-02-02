
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from ..database import get_db
from ..models import User, MedicalRecord
from .auth import get_current_user
from ..agents.ingestion_agent import ingestion_agent

router = APIRouter()

@router.get("/history")
async def get_health_history(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    types: Optional[str] = "steps,hr,calories,sleep", # csv
    sources: Optional[str] = None, # csv: google_health,apple_health
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get aggregated health history from persisted Medical Records.
    Uses JSONB metadata_ query for flexible metric extraction.
    NO MOCK DATA.
    """
    
    # 1. Date Targets
    if not end_date:
        end_date_dt = datetime.utcnow()
    else:
        end_date_dt = datetime.fromisoformat(end_date.replace("Z", ""))
        
    if not start_date:
        start_date_dt = end_date_dt - timedelta(days=30) # Default 30 days
    else:
        start_date_dt = datetime.fromisoformat(start_date.replace("Z", ""))

    # 2. Build Query
    # We look for records of type "Vitals" or specific Integration types
    query = db.query(MedicalRecord).filter(
        MedicalRecord.uploader_id == current_user.id,
        MedicalRecord.created_at >= start_date_dt,
        MedicalRecord.created_at <= end_date_dt
    )
    
    # Filter by source if requested
    if sources:
        source_list = sources.split(",")
        # This assumes metadata_ is queryable via JSON operators in Postgres
        # For SQLite (POC), we might need to filter manually in Python if JSON extension not enabled
        # We will do hybrid approach: Filter generic Types then process metadata in python for safety
        pass

    records = query.all()
    
    # 3. Aggregate / Transform
    response = {
        "steps": [],
        "heart_rate": [],
        "calories": [],
        "sleep": []
    }
    
    requested_types = types.split(",")
    
    for rec in records:
        # Check metadata first (Preferred source of truth for synced data)
        meta = rec.metadata_ or {}
        source = meta.get("source", "unknown")
        
        if sources and source not in sources:
            continue
            
        # Extract Standardized Metric
        # Code: "Steps", "Heart Rate", "Calories" (Case insensitive mostly)
        code = meta.get("code", "").lower()
        val = meta.get("value", 0)
        unit = meta.get("unit", "")
        # Use effectiveDateTime from sync, or created_at
        ts = meta.get("effectiveDateTime")
        if not ts:
            ts = rec.created_at.isoformat()
            
        # Helper to push
        datum = {
            "date": ts[:10], # YYYY-MM-DD
            "timestamp": ts,
            "value": val,
            "unit": unit,
            "source": source
        }
        
        if "step" in code and "steps" in requested_types:
            response["steps"].append(datum)
        elif "heart" in code and "hr" in requested_types:
            response["heart_rate"].append(datum)
        elif "calor" in code and "calories" in requested_types:
            response["calories"].append(datum)
        elif "sleep" in code and "sleep" in requested_types:
            response["sleep"].append(datum)
            
    # 4. Sort
    for k in response:
        response[k].sort(key=lambda x: x["timestamp"])
        
    return response

@router.get("/latest")
async def get_latest_vitals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the absolute latest single value for key metrics.
    Used for Dashboard Widgets.
    """
    def get_latest(metric_code):
        # Inefficient scan for SQLite, indexed JSONB in Postgres would be better
        # Since usage is low volume for patient, this is acceptable
        # We search specifically for records with this code in metadata
        
        # Note: In SQLite doing .filter(MedicalRecord.metadata_['code'] == ...) is tricky without extensions
        # So we grab latest 50 Vitals and parse
        recs = db.query(MedicalRecord).filter(
            MedicalRecord.uploader_id == current_user.id,
            (MedicalRecord.type == "Vitals") | (MedicalRecord.type.like("External AI%"))
        ).order_by(MedicalRecord.created_at.desc()).limit(50).all()
        
        for r in recs:
            meta = r.metadata_ or {}
            if metric_code.lower() in meta.get("code", "").lower():
                return {
                    "value": meta.get("value"),
                    "unit": meta.get("unit"),
                    "timestamp": meta.get("effectiveDateTime", r.created_at.isoformat()),
                    "source": meta.get("source")
                }
        return None

    return {
        "heart_rate": get_latest("Heart Rate"),
        "steps": get_latest("Steps"),
        "calories": get_latest("Calories"),
        "sleep": get_latest("Sleep")
    }
