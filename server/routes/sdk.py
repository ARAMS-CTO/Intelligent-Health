from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from server.database import get_db
from server.database import get_db
import server.models as models
# PartnerAPIKey, RegisteredDevice, DeviceDataSubmission, Patient, HealthData accessed via models.*
# SystemLog accessed via models.SystemLog to avoid circular import issues
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import hashlib
import secrets

router = APIRouter(prefix="/api/sdk/v1", tags=["Hardware SDK"])

# ============== Authentication ==============

def verify_api_key(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Verify API key from Authorization header"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    api_key = authorization.replace("Bearer ", "")
    api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    key_record = db.query(models.PartnerAPIKey).filter(
        models.PartnerAPIKey.api_key == api_key_hash,
        models.PartnerAPIKey.is_active == True
    ).first()
    
    if not key_record:
        raise HTTPException(status_code=401, detail="Invalid or inactive API key")
    
    # Update last used timestamp
    key_record.last_used_at = datetime.utcnow()
    db.commit()
    
    return key_record

# ============== Request/Response Models ==============

class DeviceRegistrationRequest(BaseModel):
    device_id: str
    device_type: str
    manufacturer: str
    model: str
    firmware_version: str
    serial_number: Optional[str] = None
    capabilities: List[str] = []

class DeviceRegistrationResponse(BaseModel):
    device_token: str
    device_id: str
    status: str
    message: str

class MeasurementValue(BaseModel):
    type: str  # "systolic", "diastolic", "glucose", etc.
    value: float
    unit: str

class DataSubmissionRequest(BaseModel):
    patient_id: Optional[str] = None  # Optional if device already linked
    measurements: List[Dict[str, Any]]

class FHIRObservation(BaseModel):
    resourceType: str = "Observation"
    status: str = "final"
    category: Optional[List[Dict]] = None
    code: Dict
    effectiveDateTime: str
    component: Optional[List[Dict]] = None
    valueQuantity: Optional[Dict] = None

# ============== Endpoints ==============

@router.post("/devices/register")
async def register_device(
    request: DeviceRegistrationRequest,
    api_key: models.PartnerAPIKey = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """
    Register a new device with the platform.
    Returns a device token for future data submissions.
    """
    # Check if device already registered
    existing = db.query(models.RegisteredDevice).filter(
        models.RegisteredDevice.device_id == request.device_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Device already registered. Use device token for data submission."
        )
    
    # Create device record
    device = models.RegisteredDevice(
        device_id=request.device_id,
        api_key_id=api_key.id,
        device_type=request.device_type,
        manufacturer=request.manufacturer,
        model=request.model,
        firmware_version=request.firmware_version,
        serial_number=request.serial_number,
        capabilities=request.capabilities,
        status="active"
    )
    
    db.add(device)
    db.commit()
    db.refresh(device)
    
    # Generate device token (in production, use JWT)
    device_token = secrets.token_urlsafe(32)
    
    # Audit Log
    try:
        db.add(models.SystemLog(
             event_type="device_registration",
             user_id=api_key.id[:8],
             details={
                 "device_id": device.device_id,
                 "device_type": device.device_type,
                 "manufacturer": device.manufacturer
             }
        ))
        db.commit()
    except Exception:
        pass

    return DeviceRegistrationResponse(
        device_token=device_token,
        device_id=device.device_id,
        status="registered",
        message="Device registered successfully"
    )

@router.post("/data/submit")
async def submit_health_data(
    request: DataSubmissionRequest,
    api_key: models.PartnerAPIKey = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """
    Submit health measurements from a device.
    Supports FHIR-compliant data format.
    Automatically syncs valid clinical data to the main HealthData table.
    """
    submissions_created = []
    health_data_created = 0
    
    for measurement in request.measurements:
        # Extract basic fields
        device_id = measurement.get("device_id")
        patient_id = request.patient_id or measurement.get("patient_id")
        
        if not device_id or not patient_id:
            continue  # Skip invalid measurements
        
        # Verify device exists
        device = db.query(models.RegisteredDevice).filter(
            models.RegisteredDevice.device_id == device_id
        ).first()
        
        if not device:
            continue
        
        # Verify patient exists
        patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
        if not patient:
            continue
        
        # Create submission record
        ts_str = measurement.get("timestamp", datetime.utcnow().isoformat())
        try:
            submission_timestamp = datetime.fromisoformat(ts_str)
        except:
            submission_timestamp = datetime.utcnow()
            
        submission = models.DeviceDataSubmission(
            device_id=device_id,
            patient_id=patient_id,
            data_type=measurement.get("type", "unknown"),
            timestamp=submission_timestamp,
            fhir_observation=measurement.get("fhir_observation"),
            values=measurement.get("values", {}),
            unit=measurement.get("unit", ""),
            device_metadata=measurement.get("device_metadata"),
            received_at=datetime.utcnow(),
            processed=True
        )
        
        db.add(submission)
        submissions_created.append(submission.id)
        
        # --- DATA UNIFICATION: SYNC TO HEALTH_DATA ---
        
        data_type = measurement.get("type")
        value = measurement.get("value")
        # Check for complex values first
        if measurement.get("values"):
             vals = measurement.get("values")
             if "systolic" in vals:
                 db.add(models.HealthData(
                     user_id=patient.user_id,
                     data_type="systolic_bp",
                     value=float(vals["systolic"]),
                     unit="mmHg",
                     source_timestamp=submission_timestamp,
                     recorded_at=datetime.utcnow()
                 ))
                 health_data_created += 1
             if "diastolic" in vals:
                 db.add(models.HealthData(
                     user_id=patient.user_id,
                     data_type="diastolic_bp",
                     value=float(vals["diastolic"]),
                     unit="mmHg",
                     source_timestamp=submission_timestamp,
                     recorded_at=datetime.utcnow()
                 ))
                 health_data_created += 1
        elif value is not None and patient.user_id:
            db.add(models.HealthData(
                user_id=patient.user_id,
                data_type=data_type,
                value=float(value),
                unit=measurement.get("unit", ""),
                source_timestamp=submission_timestamp,
                recorded_at=datetime.utcnow()
            ))
            health_data_created += 1

        # Update device last_seen_at
        device.last_seen_at = datetime.utcnow()
    
    # Audit Log
    try:
        db.add(models.SystemLog(
             event_type="sdk_data_submission",
             user_id=api_key.id[:8], # Partial Key ID
             details={
                 "submissions": len(submissions_created), 
                 "synced": health_data_created
             }
        ))
    except Exception:
        pass # Don't fail request on log error

    db.commit()
    
    return {
        "status": "success",
        "submissions_created": len(submissions_created),
        "health_data_synced": health_data_created,
        "submission_ids": submissions_created
    }

@router.get("/devices/{device_id}/status")
async def get_device_status(
    device_id: str,
    api_key: models.PartnerAPIKey = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """
    Get current status and info for a registered device.
    """
    device = db.query(models.RegisteredDevice).filter(
        models.RegisteredDevice.device_id == device_id
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {
        "device_id": device.device_id,
        "status": device.status,
        "device_type": device.device_type,
        "manufacturer": device.manufacturer,
        "model": device.model,
        "firmware_version": device.firmware_version,
        "patient_linked": device.patient_id is not None,
        "registered_at": device.registered_at,
        "last_seen_at": device.last_seen_at
    }

@router.patch("/devices/{device_id}")
async def update_device(
    device_id: str,
    firmware_version: Optional[str] = None,
    status: Optional[str] = None,
    api_key: models.PartnerAPIKey = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """
    Update device information (firmware version, status, etc.)
    """
    device = db.query(models.RegisteredDevice).filter(
        models.RegisteredDevice.device_id == device_id
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if firmware_version:
        device.firmware_version = firmware_version
    
    if status:
        device.status = status
    
    db.commit()
    
    return {"status": "success", "message": "Device updated"}

@router.get("/devices/{device_id}/data")
async def get_device_data_history(
    device_id: str,
    limit: int = 100,
    api_key: models.PartnerAPIKey = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """
    Get recent data submissions from a device.
    """
    submissions = db.query(models.DeviceDataSubmission).filter(
        models.DeviceDataSubmission.device_id == device_id
    ).order_by(models.DeviceDataSubmission.timestamp.desc()).limit(limit).all()
    
    return {
        "device_id": device_id,
        "total_records": len(submissions),
        "data": [
            {
                "id": s.id,
                "timestamp": s.timestamp.isoformat(),
                "data_type": s.data_type,
                "values": s.values,
                "unit": s.unit
            }
            for s in submissions
        ]
    }

@router.get("/firmware/check")
async def check_firmware_update(
    device_id: str,
    current_version: str,
    api_key: models.PartnerAPIKey = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """
    Check if firmware update is available for device.
    In production, this would query a firmware repository.
    """
    # Placeholder implementation
    return {
        "update_available": False,
        "current_version": current_version,
        "latest_version": current_version,
        "message": "Your device is up to date"
    }
