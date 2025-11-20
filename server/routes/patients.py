from fastapi import APIRouter, HTTPException, Body
from typing import List, Optional
from ..schemas import PatientProfile, PatientIntakeData, Medication, PatientFile

router = APIRouter()

MOCK_PATIENTS = [
    {
        "id": "patient-1",
        "identifier": "MRN-123456789",
        "name": "John Doe",
        "personalDetails": {"dob": "1956-05-15", "bloodType": "O+"},
        "allergies": ["Penicillin"],
        "baselineIllnesses": ["Hypertension", "Type 2 Diabetes", "Seasonal Allergies"],
        "medications": [
            {"id": "med-1", "name": "Lisinopril", "dosage": "10mg", "frequency": "Once daily"},
            {"id": "med-2", "name": "Metformin", "dosage": "500mg", "frequency": "Twice daily with meals"},
        ],
        "files": [
            {"id": "pfile-1", "name": "Complete Blood Count - Jan 2024", "type": "Lab Test", "uploadDate": "2024-07-20", "url": "#"},
            {"id": "pfile-2", "name": "Chest X-Ray Report - Dec 2023", "type": "Radiology Report", "uploadDate": "2024-07-20", "url": "#"},
            {"id": "pfile-3", "name": "Discharge Summary (Knee Surgery) - 2022", "type": "Discharge Summary", "uploadDate": "2024-07-20", "url": "#"},
        ],
    },
    {
        "id": "patient-aram-1",
        "identifier": "MRN-AG-1984",
        "name": "Aram Ghannadzadeh",
        "personalDetails": {"dob": "1984-05-04", "bloodType": "A+"},
        "allergies": ["None known"],
        "baselineIllnesses": ["Mildly elevated cholesterol"],
        "medications": [
            {"id": "med-5", "name": "Atorvastatin", "dosage": "10mg", "frequency": "Once daily"}
        ],
        "files": [],
    }
]

MOCK_INTAKE_DATA = []

@router.get("/{patient_id}", response_model=PatientProfile)
async def get_patient(patient_id: str):
    patient = next((p for p in MOCK_PATIENTS if p["id"] == patient_id), None)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/search", response_model=List[PatientProfile])
async def search_patients(q: str):
    if not q:
        return []
    query = q.lower()
    return [p for p in MOCK_PATIENTS if query in p["name"].lower() or (p.get("identifier") and query in p["identifier"].lower())]

@router.post("/{patient_id}/medications")
async def add_medication(patient_id: str, medication: Medication):
    patient = next((p for p in MOCK_PATIENTS if p["id"] == patient_id), None)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient["medications"].append(medication.dict())
    return {"message": "Medication added"}

@router.post("/{patient_id}/files")
async def add_file(patient_id: str, file: PatientFile):
    patient = next((p for p in MOCK_PATIENTS if p["id"] == patient_id), None)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient["files"].append(file.dict())
    return {"message": "File added"}

@router.post("/intake", response_model=PatientIntakeData)
async def add_intake(data: PatientIntakeData):
    new_intake = data.dict()
    new_intake["id"] = f"patient-{len(MOCK_INTAKE_DATA) + len(MOCK_PATIENTS) + 1}"
    MOCK_INTAKE_DATA.append(new_intake)
    return new_intake
