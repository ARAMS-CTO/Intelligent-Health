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
    Dentist = "Dentist"

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
    doctor_profile: Optional["DoctorProfile"] = None # Include nested profile
    concordium_address: Optional[str] = None

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
    value: Optional[str] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    interpretation: Optional[Literal['Normal', 'Abnormal-High', 'Abnormal-Low', 'Critical']] = None
    status: Optional[str] = "Pending"
    id: Optional[Any] = None

class CaseBase(BaseSchema):
    title: str
    creator_id: str
    patient_id: str
    complaint: str
    history: Optional[str] = None
    findings: Optional[str] = None
    diagnosis: Optional[str] = None
    tags: List[str] = []

class CaseCreate(CaseBase):
    creator_id: Optional[str] = None
    complaint: Optional[str] = None
    history: Optional[str] = None
    findings: Optional[str] = None
    diagnosis: Optional[str] = None
    tags: Optional[List[str]] = []

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

class Medication(BaseSchema):
    id: str
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None

class Prescription(BaseSchema):
    id: str
    patient_id: str
    case_id: Optional[str] = None
    doctor_id: str
    medication_name: str
    dosage: str
    frequency: str
    duration: str
    notes: Optional[str] = None
    status: str
    dispensed_at: Optional[datetime] = None
    created_at: datetime

class PersonalDetails(BaseSchema):
    dob: Optional[str] = None
    blood_type: Optional[str] = None
    sex: Optional[Literal['Male', 'Female', 'Other']] = None

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
    height: Optional[float] = None
    weight: Optional[float] = None
    concordium_address: Optional[str] = None
    medications: List[Medication]
    files: List[PatientFile]
    medical_records: List[MedicalRecord] = []

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
    personal_details: Optional[PersonalDetails] = None
    height: Optional[float] = None
    weight: Optional[float] = None

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
    profile_picture_url: Optional[str] = None
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    clinic_coordinates: Optional[str] = None
    clinic_logo_url: Optional[str] = None
    website: Optional[str] = None
    opening_hours: Optional[str] = None
    sub_specialties: Optional[List[str]] = []
    service_prices: Optional[Dict[str, str]] = {}
    additional_specialties: Optional[List[str]] = []
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

class AIConfig(BaseModel):
    default_model: str
    fallback_model: str
    vision_model: str

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



class AgentCapability(BaseSchema):
    id: str
    agent_role: str
    capability_name: str
    description: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    is_active: bool

class FeedbackCreate(BaseSchema):
    user_id: str
    user_name: str
    type: str # 'Bug', 'Feature', 'Support'
    title: str
    description: str
    priority: str # 'Low', 'Medium', 'High'
    status: Optional[str] = "Open"

class FeedbackResponse(BaseSchema):
    response: str

class FeedbackTicket(BaseSchema):
    id: str
    user_id: str
    user_name: str
    type: str
    title: str
    description: str
    priority: str
    status: str
    created_at: datetime
    admin_response: Optional[str] = None

# --- Appointments ---

class AppointmentCreate(BaseSchema):
    doctor_id: str
    patient_id: str
    scheduled_at: datetime
    duration_minutes: Optional[int] = 30
    type: Optional[str] = "In-Person"  # 'In-Person', 'Video', 'Phone'
    reason: Optional[str] = None
    notes: Optional[str] = None
    service_id: Optional[str] = None
    cost: Optional[float] = None
    payment_status: Optional[str] = "Pending"

class AppointmentUpdate(BaseSchema):
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    type: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    service_id: Optional[str] = None
    payment_status: Optional[str] = None
    
class AppointmentSchema(BaseSchema):
    id: str
    doctor_id: str
    patient_id: str
    scheduled_at: datetime
    duration_minutes: int
    type: str
    status: str
    reason: Optional[str] = None
    notes: Optional[str] = None
    service_id: Optional[str] = None
    cost: Optional[float] = None
    payment_status: Optional[str] = None
    transaction_hash: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    doctor_name: Optional[str] = None  # Populated from join
    patient_name: Optional[str] = None  # Populated from join

# --- Notifications ---

class NotificationCreate(BaseSchema):
    user_id: str
    type: str
    title: str
    message: str
    link: Optional[str] = None

class NotificationSchema(BaseSchema):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

class NotificationPreferenceSchema(BaseSchema):
    user_id: str
    email_enabled: bool
    push_enabled: bool
    sms_enabled: bool
    types_enabled: List[str]
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None

class NotificationPreferenceUpdate(BaseSchema):
    email_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    types_enabled: Optional[List[str]] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None


# --- Radiology ---

class ImagingStudyBase(BaseSchema):
    modality: str
    body_part: str
    priority: str
    status: str
    indication: Optional[str] = None
    referring_physician: Optional[str] = None
    report_content: Optional[str] = None
    image_url: Optional[str] = None

class ImagingStudyCreate(ImagingStudyBase):
    patient_id: str

class ImagingStudy(ImagingStudyBase):
    id: str
    patient_id: str
    ordered_at: datetime
    patient_name: Optional[str] = None # For convenience

