from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class PublicEstimateRequest(BaseModel):
    procedure_name: str
    insurance_tier: str # "platinum", "gold", "silver", "none"
    symptoms: Optional[str] = None

class PublicEstimateItem(BaseModel):
    name: str
    category: str
    cost: float

class PublicEstimateResponse(BaseModel):
    min: float
    max: float
    confidence: float
    breakdown: List[PublicEstimateItem]
    currency: str = "USD"
    insurance_coverage_est: float
    patient_responsibility_est: float

class IoTDeviceData(BaseModel):
    device_id: str
    type: str # "Apple Watch", "Fitbit", "Oura"
    metrics: dict # {"heart_rate": 72, "spo2": 98, "steps": 1200}
    timestamp: datetime
    status: str = "Connected"

class SanitizedSystemLog(BaseModel):
    id: int
    timestamp: datetime
    event_type: str
    actor_role: str # 'Patient', 'System', 'Doctor' (No names)
    action_hash: str # simulated hash
