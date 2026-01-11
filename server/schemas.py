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

class UserUpdate(BaseSchema):
    name: Optional[str] = None
    role: Optional[str] = None

class PasswordReset(BaseModel):
    new_password: str

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

class CaseBase(BaseSchema):
    title: str
    creator_id: str
    patient_id: str
    complaint: str
    history: str
    findings: str
    diagnosis: str
    tags: List[str] = []

class CaseCreate(CaseBase):
    pass

class Case(CaseBase):
    id: str
    created_at: str
    patient_profile: Optional[AnonymisedPatientProfile] = None 
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
    primary_diagnosis: Optional[str] = None

class PatientFile(BaseSchema):
    id: str
    name: str
    type: str # Relaxed from Literal to support legacy data
    upload_date: Optional[str] = None
    url: str

class Medication(BaseSchema):
    id: str
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None

class PersonalDetails(BaseSchema):
    dob: Optional[str] = None
    blood_type: Optional[str] = None

class Contact(BaseSchema):
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class EmergencyContact(BaseSchema):
    name: Optional[str] = None
    relationship: Optional[str] = None
    phone: Optional[str] = None

class PrimaryCarePhysician(BaseSchema):
    name: Optional[str] = None
    phone: Optional[str] = None

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

class PatientUpdate(BaseSchema):
    contact: Optional[Contact] = None
    emergency_contact: Optional[EmergencyContact] = None
    primary_care_physician: Optional[PrimaryCarePhysician] = None
    allergies: Optional[List[str]] = None
    baseline_illnesses: Optional[List[str]] = None

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

class TokenUsage(BaseModel):
    date: str
    tokens: int

class StorageStats(BaseModel):
    images_size_gb: float
    documents_size_gb: float
    logs_size_gb: float

class AdminStats(BaseSchema):
    total_users: int
    active_cases: int
    ai_queries_today: int
    system_health: str # 'Optimal', 'Degraded', 'Critical'
    gemini_status: str
    db_status: str
    token_usage_history: List[TokenUsage]
    storage_stats: StorageStats

class DashboardStats(BaseSchema):
    overdue: int
    updates: int
    assignments: int

class SystemConfigUpdate(BaseSchema):
    features: Dict[str, bool]

class CostEstimate(BaseSchema):
    id: str
    case_id: str
    total_cost: float
    currency: str
    breakdown: List[CostItem]
    insurance_coverage: float
    patient_responsibility: float
    status: Literal['Estimated', 'Approved', 'Pending']
    created_at: datetime

class SystemLog(BaseSchema):
    id: int
    event_type: str
    user_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime

class Transaction(BaseSchema):
    id: str
    user_id: str
    user_name: str
    amount: float
    type: Literal['Subscription', 'Consultation', 'AI Analysis']
    status: Literal['Paid', 'Pending', 'Failed']
    date: datetime

class AIFeedbackBase(BaseSchema):
    user_id: Optional[str] = None
    case_id: Optional[str] = None
    suggestion_name: str
    rating: Literal['good', 'bad']
    comments: Optional[str] = None

class AIFeedbackCreate(AIFeedbackBase):
    pass

class AIFeedback(AIFeedbackBase):
    id: int
    timestamp: datetime

class UnratedSuggestion(BaseSchema):
    case_id: str
    case_title: str
    suggestion: DiagnosisSuggestion

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    model: Optional[str] = None
    context: Optional[str] = None
    userId: Optional[str] = None
    userRole: Optional[str] = None

class MedicalRecord(BaseSchema):
    id: str
    patient_id: Optional[str] = None
    uploader_id: str
    type: str
    title: str
    file_url: str
    content_text: str
    ai_summary: str
    created_at: datetime

class AgentCapability(BaseSchema):
    id: str
    agent_role: str
    capability_name: str
    description: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    is_active: bool
