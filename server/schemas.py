from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

# Utility for camelCase alias
def to_camel(string: str) -> str:
    first, *rest = string.split('_')
    return first + ''.join(word.capitalize() for word in rest)

class BaseSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

# Enums
class Role(str):
    Admin = "Admin"
    Doctor = "Doctor"
    Specialist = "Specialist"
    Nurse = "Nurse"
    Trainee = "Trainee"
    Patient = "Patient"
    Radiologist = "Radiologist"
    LabTechnician = "Lab Technician"
    Pharmacist = "Pharmacist"
    Physiotherapist = "Physiotherapist"
    HospitalManager = "Hospital Manager"
    BillingOfficer = "Billing & Insurance Officer"
    ComplianceOfficer = "Data Protection Officer"
    AIEngineer = "AI/IT Engineer"

# Models
class User(BaseSchema):
    id: str
    name: str
    email: str
    role: str
    level: int
    credits: int
    patient_profile_id: Optional[str] = None
    doctor_profile_id: Optional[str] = None

class AnonymisedPatientProfile(BaseSchema):
    age: int
    sex: Literal['Male', 'Female', 'Other']
    comorbidities: List[str]

class UploadedFile(BaseSchema):
    id: str
    name: str
    type: Literal['CT', 'Lab Report', 'ECG', 'Photo', 'Doppler Scan']
    url: str

class LabResult(BaseSchema):
    test: str
    value: str
    unit: str
    reference_range: str
    interpretation: Optional[Literal['Normal', 'Abnormal-High', 'Abnormal-Low', 'Critical']] = None

class Case(BaseSchema):
    id: str
    title: str
    creator_id: str
    patient_id: str
    created_at: str
    patient_profile: Optional[AnonymisedPatientProfile] = None # Optional because it might not be fully populated in all views
    complaint: str
    history: str
    findings: str
    diagnosis: str
    tags: List[str]
    files: List[UploadedFile] = []
    status: Literal['Open', 'Closed', 'Under Review']
    lab_results: Optional[List[LabResult]] = None
    specialist_id: Optional[str] = None
    specialist_assignment_timestamp: Optional[str] = None

class Comment(BaseSchema):
    id: str
    case_id: str
    user_id: str
    user_name: str
    user_role: str
    timestamp: str
    text: str

class CostItem(BaseSchema):
    name: str
    category: Literal['Investigation', 'Procedure', 'Consumable', 'Stay', 'Medication']
    cost: float

class TreatmentOption(BaseSchema):
    id: str
    name: str
    description: str
    probability_of_success: float
    cost_estimate: float
    cost_breakdown: List[CostItem]
    agreement_with_guidelines: Literal['Standard', 'Experimental', 'New']
    post_discharge_meds: Dict[str, Any]
    steps: List[str]
    risk_indicators: List[str]

class DiagnosisSuggestionFeedback(BaseSchema):
    rating: Literal['good', 'bad']
    comments: Optional[str] = None

class DiagnosisSuggestion(BaseSchema):
    name: str
    probability: float
    rationale: str
    supporting_findings: List[str]
    feedback: Optional[DiagnosisSuggestionFeedback] = None

class AIAgentStats(BaseSchema):
    id: str
    user_id: str
    accuracy: float
    personalization_level: float
    cases_analyzed: int
    feedback_provided: int

class AIInsights(BaseSchema):
    diagnosis_confidence: float
    patient_risks: List[str]
    key_symptoms: List[str]

class PatientFile(BaseSchema):
    id: str
    name: str
    type: Literal['Lab Test', 'Radiology Report', 'Discharge Summary', 'Prescription']
    upload_date: str
    url: str

class Medication(BaseSchema):
    id: str
    name: str
    dosage: str
    frequency: str

class PersonalDetails(BaseSchema):
    dob: str
    blood_type: str

class Contact(BaseSchema):
    phone: str
    email: str
    address: str

class EmergencyContact(BaseSchema):
    name: str
    relationship: str
    phone: str

class PrimaryCarePhysician(BaseSchema):
    name: str
    phone: str

class PatientProfile(BaseSchema):
    id: str
    identifier: Optional[str] = None
    name: str
    personal_details: PersonalDetails
    allergies: List[str]
    baseline_illnesses: List[str]
    contact: Optional[Contact] = None
    emergency_contact: Optional[EmergencyContact] = None
    primary_care_physician: Optional[PrimaryCarePhysician] = None
    medications: List[Medication]
    files: List[PatientFile]

class FullName(BaseSchema):
    first_name: str
    last_name: str

class PatientIntakeData(BaseSchema):
    id: str
    full_name: FullName
    dob: str
    sex: Literal['Male', 'Female']
    blood_type: Optional[str] = None
    allergies: List[str] = []
    baseline_illnesses: List[str] = []
    contact: Contact
    emergency_contact: EmergencyContact
    primary_care_physician: PrimaryCarePhysician

class AIActionItem(BaseSchema):
    case_id: str
    case_title: str
    patient_info: str
    suggestion_name: str
    confidence: float

class ExtractedCaseData(BaseSchema):
    patient_id: Optional[str] = None
    complaint: Optional[str] = None
    history: Optional[str] = None
    findings: Optional[str] = None
    diagnosis: Optional[str] = None
    patient_age: Optional[int] = None
    patient_sex: Optional[Literal['Male', 'Female']] = None
    missing_information: Optional[List[str]] = None

class SymptomAnalysisResult(BaseSchema):
    condition: str
    confidence: float
    explanation: str

class AIContextualSuggestion(BaseSchema):
    suggestion: str
    rationale: str

class Certification(BaseSchema):
    id: str
    name: str
    issuing_body: str
    year: int
    url: str

class DoctorProfile(BaseSchema):
    id: str
    user_id: str
    specialty: str
    years_of_experience: int
    bio: str
    certifications: List[Certification]
    profile_picture_url: str
