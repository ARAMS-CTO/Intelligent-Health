"""
FHIR R4 Compatibility Layer

Provides FHIR-compliant endpoints for interoperability with other healthcare systems.
Implements partial FHIR R4 standard for key resources.

Resources implemented:
- Patient
- Practitioner
- Appointment
- Observation (Lab Results)
- MedicationRequest
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import uuid

from ..database import get_db
from ..models import User, Patient, Appointment, LabResult, Prescription
from .auth import get_current_user

router = APIRouter(prefix="/fhir", tags=["FHIR R4"])


# --- FHIR Resource Helpers ---

def to_fhir_patient(patient: Patient, user: User = None) -> dict:
    """Convert internal Patient to FHIR Patient resource."""
    return {
        "resourceType": "Patient",
        "id": patient.id,
        "meta": {
            "versionId": "1",
            "lastUpdated": patient.created_at.isoformat() if patient.created_at else None
        },
        "identifier": [
            {"system": "urn:ih:patient", "value": patient.id}
        ],
        "active": True,
        "name": [
            {
                "use": "official",
                "text": patient.name,
                "family": patient.name.split()[-1] if patient.name else None,
                "given": patient.name.split()[:-1] if patient.name else []
            }
        ],
        "gender": patient.sex.lower() if patient.sex else "unknown",
        "birthDate": patient.dob if hasattr(patient, 'dob') else None,
        "address": [
            {"text": patient.location if hasattr(patient, 'location') else None}
        ] if hasattr(patient, 'location') and patient.location else [],
        "telecom": [
            {"system": "phone", "value": patient.phone} if hasattr(patient, 'phone') and patient.phone else None,
            {"system": "email", "value": user.email} if user else None
        ]
    }


def to_fhir_practitioner(user: User) -> dict:
    """Convert internal User (Doctor) to FHIR Practitioner resource."""
    return {
        "resourceType": "Practitioner",
        "id": user.id,
        "meta": {
            "versionId": "1",
            "lastUpdated": user.created_at.isoformat() if hasattr(user, 'created_at') and user.created_at else None
        },
        "identifier": [
            {"system": "urn:ih:practitioner", "value": user.id}
        ],
        "active": True,
        "name": [
            {
                "use": "official",
                "text": user.name,
                "prefix": ["Dr."] if user.role in ["Doctor", "Specialist"] else []
            }
        ],
        "qualification": [
            {
                "code": {
                    "coding": [{"display": user.role}]
                }
            }
        ]
    }


def to_fhir_appointment(apt: Appointment) -> dict:
    """Convert internal Appointment to FHIR Appointment resource."""
    status_map = {
        "Scheduled": "booked",
        "Confirmed": "booked",
        "Completed": "fulfilled",
        "Cancelled": "cancelled",
        "No-Show": "noshow"
    }
    
    return {
        "resourceType": "Appointment",
        "id": apt.id,
        "meta": {
            "versionId": "1",
            "lastUpdated": apt.updated_at.isoformat() if apt.updated_at else None
        },
        "status": status_map.get(apt.status, "pending"),
        "serviceType": [
            {"coding": [{"display": apt.type}]}
        ],
        "reasonCode": [
            {"text": apt.reason}
        ] if apt.reason else [],
        "start": apt.scheduled_at.isoformat() if apt.scheduled_at else None,
        "minutesDuration": apt.duration_minutes,
        "created": apt.created_at.isoformat() if apt.created_at else None,
        "participant": [
            {
                "actor": {"reference": f"Patient/{apt.patient_id}"},
                "status": "accepted"
            },
            {
                "actor": {"reference": f"Practitioner/{apt.doctor_id}"},
                "status": "accepted"
            }
        ]
    }


def to_fhir_observation(lab: LabResult) -> dict:
    """Convert internal LabResult to FHIR Observation resource."""
    return {
        "resourceType": "Observation",
        "id": lab.id,
        "meta": {
            "versionId": "1",
            "lastUpdated": lab.created_at.isoformat() if hasattr(lab, 'created_at') and lab.created_at else None
        },
        "status": "final" if lab.status == "Completed" else "preliminary",
        "category": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                        "code": "laboratory",
                        "display": "Laboratory"
                    }
                ]
            }
        ],
        "code": {
            "coding": [{"display": lab.test_name}],
            "text": lab.test_name
        },
        "subject": {"reference": f"Patient/{lab.patient_id}"},
        "effectiveDateTime": lab.created_at.isoformat() if hasattr(lab, 'created_at') else None,
        "valueString": lab.result if hasattr(lab, 'result') else None
    }


# --- FHIR Endpoints ---

@router.get("/metadata")
async def get_capability_statement():
    """
    FHIR CapabilityStatement - describes server capabilities.
    """
    return {
        "resourceType": "CapabilityStatement",
        "status": "active",
        "date": datetime.utcnow().isoformat(),
        "kind": "instance",
        "software": {
            "name": "Intelligent Health",
            "version": "1.0.0"
        },
        "fhirVersion": "4.0.1",
        "format": ["json"],
        "rest": [
            {
                "mode": "server",
                "resource": [
                    {"type": "Patient", "interaction": [{"code": "read"}, {"code": "search-type"}]},
                    {"type": "Practitioner", "interaction": [{"code": "read"}, {"code": "search-type"}]},
                    {"type": "Appointment", "interaction": [{"code": "read"}, {"code": "search-type"}]},
                    {"type": "Observation", "interaction": [{"code": "read"}, {"code": "search-type"}]}
                ]
            }
        ]
    }


@router.get("/Patient")
async def search_patients(
    _count: int = Query(20, alias="_count"),
    name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for Patient resources."""
    query = db.query(Patient)
    
    if name:
        query = query.filter(Patient.name.ilike(f"%{name}%"))
    
    patients = query.limit(_count).all()
    
    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": len(patients),
        "entry": [
            {"resource": to_fhir_patient(p)} for p in patients
        ]
    }


@router.get("/Patient/{patient_id}")
async def get_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific Patient resource."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return to_fhir_patient(patient)


@router.get("/Practitioner")
async def search_practitioners(
    _count: int = Query(20, alias="_count"),
    name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for Practitioner resources."""
    query = db.query(User).filter(User.role.in_(["Doctor", "Specialist", "Nurse"]))
    
    if name:
        query = query.filter(User.name.ilike(f"%{name}%"))
    
    practitioners = query.limit(_count).all()
    
    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": len(practitioners),
        "entry": [
            {"resource": to_fhir_practitioner(p)} for p in practitioners
        ]
    }


@router.get("/Practitioner/{practitioner_id}")
async def get_practitioner(
    practitioner_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific Practitioner resource."""
    user = db.query(User).filter(User.id == practitioner_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Practitioner not found")
    
    return to_fhir_practitioner(user)


@router.get("/Appointment")
async def search_appointments(
    _count: int = Query(20, alias="_count"),
    patient: Optional[str] = None,
    practitioner: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for Appointment resources."""
    query = db.query(Appointment)
    
    if patient:
        query = query.filter(Appointment.patient_id == patient)
    if practitioner:
        query = query.filter(Appointment.doctor_id == practitioner)
    if status:
        status_map = {"booked": "Scheduled", "fulfilled": "Completed", "cancelled": "Cancelled"}
        query = query.filter(Appointment.status == status_map.get(status, status))
    
    appointments = query.limit(_count).all()
    
    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": len(appointments),
        "entry": [
            {"resource": to_fhir_appointment(a)} for a in appointments
        ]
    }


@router.get("/Appointment/{appointment_id}")
async def get_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific Appointment resource."""
    apt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return to_fhir_appointment(apt)


@router.get("/Observation")
async def search_observations(
    _count: int = Query(20, alias="_count"),
    patient: Optional[str] = None,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for Observation (lab result) resources."""
    query = db.query(LabResult)
    
    if patient:
        query = query.filter(LabResult.patient_id == patient)
    
    results = query.limit(_count).all()
    
    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": len(results),
        "entry": [
            {"resource": to_fhir_observation(r)} for r in results
        ]
    }


@router.get("/Observation/{observation_id}")
async def get_observation(
    observation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific Observation resource."""
    lab = db.query(LabResult).filter(LabResult.id == observation_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Observation not found")
    
    return to_fhir_observation(lab)
