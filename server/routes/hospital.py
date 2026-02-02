from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from pydantic import BaseModel
import random
from datetime import datetime, timedelta

router = APIRouter()

# Stub Models
class BedAvailability(BaseModel):
    department: str
    total_beds: int
    available_beds: int
    last_updated: str

class ClinicSlot(BaseModel):
    doctor_name: str
    specialty: str
    time: str
    status: str # 'Available', 'Booked'

@router.get("/hospital/beds", response_model=List[BedAvailability])
async def get_bed_availability():
    """
    Simulates fetching real-time bed capacity from Hospital Information System (HIS/HL7).
    """
    departments = ["Emergency", "ICU", "General Ward", "Pediatrics", "Maternity"]
    results = []
    
    for dept in departments:
        total = random.randint(10, 50)
        available = random.randint(0, total // 2) # Simulate busy hospital
        results.append({
            "department": dept,
            "total_beds": total,
            "available_beds": available,
            "last_updated": datetime.utcnow().isoformat()
        })
    return results

@router.get("/hospital/slots", response_model=List[ClinicSlot])
async def get_clinic_slots(specialty: str = "General"):
    """
    Simulates fetching appointment slots from scheduling system.
    """
    slots = []
    base_time = datetime.utcnow().replace(minute=0, second=0, microsecond=0) + timedelta(days=1, hours=9)
    
    doctors = ["Dr. Smith", "Dr. Jones", "Dr. Patel", "Dr. Lee"]
    
    for i in range(5): # 5 slots
        slot_time = base_time + timedelta(hours=i)
        slots.append({
            "doctor_name": random.choice(doctors),
            "specialty": specialty,
            "time": slot_time.isoformat(),
            "status": "Available" if random.random() > 0.3 else "Booked"
        })
        
    return slots

@router.post("/hospital/webhook/admit")
async def receive_admission_event(patient_id: str, reason: str):
    """
    Webhook endpoint for Hospital System to notify platform of a new admission.
    """
    # Logic to update Patient status in our DB would go here
    return {"status": "received", "action": "patient_status_updated_to_admitted"}
