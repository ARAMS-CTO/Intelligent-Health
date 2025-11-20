from fastapi import APIRouter, HTTPException, Body
from typing import List, Optional
from ..schemas import Case, Comment, Role
from datetime import datetime

router = APIRouter()

# Mock Data Storage
MOCK_CASES = [
    {
        "id": "case-1", "title": "Acute DVT in Left Leg", "creatorId": "user-doc-1", "patientId": "patient-1", "createdAt": "2024-07-28T10:00:00Z",
        "patientProfile": {"age": 68, "sex": "Male", "comorbidities": ["Hypertension", "Type 2 Diabetes"]},
        "complaint": "Patient presents with a swollen, painful, and reddened left calf for the past 3 days.",
        "history": "Recent long-haul flight (14 hours). No prior history of VTE. Takes Metformin and Lisinopril.",
        "findings": "Positive Homans' sign, significant calf tenderness. Wells score: 3. D-dimer elevated.",
        "diagnosis": "Confirmed Acute Deep Vein Thrombosis (DVT) of the left lower limb, provoked by recent travel.",
        "tags": ["DVT", "Vascular", "Emergency", "Ultrasound"],
        "files": [
            {"id": "file-1", "name": "duplex_scan.pdf", "type": "Doppler Scan", "url": "#"},
            {"id": "file-lab-1", "name": "cbc_coag_profile.pdf", "type": "Lab Report", "url": "#"}
        ],
        "labResults": [
            {"test": "D-dimer", "value": "2.5", "unit": "μg/mL", "referenceRange": "< 0.5", "interpretation": "Abnormal-High"},
            {"test": "Hemoglobin", "value": "14.2", "unit": "g/dL", "referenceRange": "13.5-17.5", "interpretation": "Normal"},
            {"test": "Platelets", "value": "250", "unit": "x10^9/L", "referenceRange": "150-450", "interpretation": "Normal"},
            {"test": "INR", "value": "1.1", "unit": "", "referenceRange": "0.8-1.2", "interpretation": "Normal"},
        ],
        "status": "Under Review",
    },
    {
        "id": "case-2", "title": "Acute Bilateral Pulmonary Embolism", "creatorId": "user-doc-google", "patientId": "patient-aram-1", "createdAt": "2024-07-29T09:00:00Z",
        "patientProfile": {"age": 41, "sex": "Male", "comorbidities": ["Mildly elevated cholesterol"]},
        "complaint": "A 41-year-old male presented to the Emergency Department with a one-hour history of acute, severe shortness of breath.",
        "history": "No significant past medical history. No recent surgeries or long-distance travel. Reports a more sedentary lifestyle recently.",
        "findings": "On arrival: Tachycardic (115 bpm), Tachypneic (24/min), SpO2 92% on room air. Lungs clear on auscultation. D-dimer markedly elevated. ECG shows sinus tachycardia with S1Q3T3 pattern.",
        "diagnosis": "High clinical suspicion for acute Pulmonary Embolism (PE). Patient started on therapeutic anticoagulation.",
        "tags": ["PE", "Cardiology", "Pulmonology", "CTPA", "Emergency"],
        "files": [{"id": "file-2", "name": "ctpa_report.pdf", "type": "CT", "url": "#"}, {"id": "file-3", "name": "ecg.jpg", "type": "ECG", "url": "#"}],
        "status": "Open",
        "specialistId": "user-spec-1",
        "specialistAssignmentTimestamp": "2024-11-20T10:00:00Z", 
    }
]

MOCK_COMMENTS = [
    {"id": "comment-1", "caseId": "case-1", "userId": "user-spec-1", "userName": "Dr. Kenji Tanaka", "userRole": Role.Specialist, "timestamp": "2024-07-28T11:00:00Z", "text": "Classic presentation. Given the Wells score and D-dimer, I agree with proceeding to duplex ultrasound."},
    {"id": "comment-2", "caseId": "case-1", "userId": "user-nurse-1", "userName": "Nurse David Chen", "userRole": Role.Nurse, "timestamp": "2024-07-28T11:15:00Z", "text": "Patient is comfortable and has been advised to keep the leg elevated."},
    {"id": "comment-3", "caseId": "case-2", "userId": "user-doc-1", "userName": "Dr. Evelyn Reed", "userRole": Role.Doctor, "timestamp": "2024-07-29T09:30:00Z", "text": "High suspicion for PE based on presentation and vitals. D-dimer is back and it's > 4.0. Starting patient on a heparin drip now."},
]

@router.get("", response_model=List[Case])
async def get_cases():
    return MOCK_CASES

@router.get("/{case_id}", response_model=Case)
async def get_case(case_id: str):
    case = next((c for c in MOCK_CASES if c["id"] == case_id), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.post("", response_model=Case)
async def create_case(case: Case):
    # In a real app, we'd generate ID and timestamp here if not provided
    # For now, we accept what's sent or mock it
    new_case = case.dict()
    MOCK_CASES.insert(0, new_case)
    return new_case

@router.patch("/{case_id}")
async def update_case(case_id: str, updates: dict = Body(...)):
    case_idx = next((i for i, c in enumerate(MOCK_CASES) if c["id"] == case_id), -1)
    if case_idx == -1:
        raise HTTPException(status_code=404, detail="Case not found")
    
    MOCK_CASES[case_idx].update(updates)
    return {"message": "Case updated successfully"}

@router.put("/{case_id}/status")
async def update_case_status(case_id: str, status: dict = Body(...)):
    case_idx = next((i for i, c in enumerate(MOCK_CASES) if c["id"] == case_id), -1)
    if case_idx == -1:
        raise HTTPException(status_code=404, detail="Case not found")
    
    MOCK_CASES[case_idx]["status"] = status["status"]
    return {"message": "Status updated"}

@router.post("/{case_id}/assign")
async def assign_specialist(case_id: str, data: dict = Body(...)):
    case_idx = next((i for i, c in enumerate(MOCK_CASES) if c["id"] == case_id), -1)
    if case_idx == -1:
        raise HTTPException(status_code=404, detail="Case not found")
    
    MOCK_CASES[case_idx]["specialistId"] = data["specialistId"]
    MOCK_CASES[case_idx]["specialistAssignmentTimestamp"] = datetime.now().isoformat()
    return {"message": "Specialist assigned"}

@router.get("/{case_id}/comments", response_model=List[Comment])
async def get_case_comments(case_id: str):
    return [c for c in MOCK_COMMENTS if c["caseId"] == case_id]

@router.post("/comments")
async def add_comment(comment: Comment):
    MOCK_COMMENTS.append(comment.dict())
    return {"message": "Comment added"}
