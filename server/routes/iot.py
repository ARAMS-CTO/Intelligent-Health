from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
import random
import uuid
from sqlalchemy.orm import Session
from ..database import get_db
# Import Public Schemas (assuming they are viewable)
# If schemas_public.py is not in python path, we might need to adjust import
# For simplicity, re-defining logic or importing if possible.
# Assuming server.schemas_public is available or I'll define here if imports fail.
from server.schemas_public import IoTDeviceData

router = APIRouter()

@router.get("/vitals/{patient_id}", response_model=List[IoTDeviceData])
async def get_patient_vitals(patient_id: str, db: Session = Depends(get_db)):
    """
    Returns latest REAL telemetry from synced devices (Google/Samsung/Apple).
    """
    from ..models import MedicalRecord, User, Patient
    
    # 1. Resolve Patient -> User
    # Assuming patient_id is the PatientProfile ID. 
    # We need the User ID to filter MedicalRecord as uploader_id usually links to User
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        # Fallback: check if the ID passed IS the user ID (dashboard might pass user ID)
        user = db.query(User).filter(User.id == patient_id).first()
    else:
         user = db.query(User).filter(User.id == patient.user_id).first()
         
    if not user:
         # If no user found, return empty list (No connection)
         return []
         
    # 2. Query Latest Vitals by Source
    # We want grouped by Source
    records = db.query(MedicalRecord).filter(
        MedicalRecord.uploader_id == user.id,
        MedicalRecord.type == "Vitals"
    ).order_by(MedicalRecord.created_at.desc()).limit(100).all()
    
    # Group by Device/Source
    device_map = {}
    
    for rec in records:
        meta = rec.metadata_ or {}
        source = meta.get("source", "Unknown Source")
        
        # Normalize Source Name
        device_name = "Health Device"
        if "google" in source: device_name = "Google/Samsung Health"
        elif "apple" in source: device_name = "Apple Health"
        elif "oura" in source: device_name = "Oura Ring"
        
        if source not in device_map:
            device_map[source] = {
                "device_id": f"dev_{source}",
                "type": device_name,
                "metrics": {},
                "timestamp": rec.created_at,
                "status": "Synced"
            }
            
        # Parse Metric
        code = meta.get("code", "").lower()
        val = meta.get("value", 0)
        
        if "heart" in code: device_map[source]["metrics"]["heart_rate"] = val
        elif "step" in code: device_map[source]["metrics"]["steps"] = val
        elif "calor" in code: device_map[source]["metrics"]["calories"] = val
        
    return list(device_map.values())
