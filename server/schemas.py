from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel
from datetime import datetime

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
class User(BaseModel):
    id: str
    name: str
    email: str
    role: str
    level: int
    credits: int
    patientProfileId: Optional[str] = None
    doctorProfileId: Optional[str] = None

class AnonymisedPatientProfile(BaseModel):
    age: int
    sex: Literal['Male', 'Female', 'Other']
    comorbidities: List[str]

class UploadedFile(BaseModel):
    id: str
    name: str
    type: Literal['CT', 'Lab Report', 'ECG', 'Photo', 'Doppler Scan']
    url: str

class LabResult(BaseModel):
    test: str
    value: str
    unit: str
    referenceRange: str
    interpretation: Optional[Literal['Normal', 'Abnormal-High', 'Abnormal-Low', 'Critical']] = None

class Case(BaseModel):
    id: str
    title: str
    creatorId: str
    patientId: str
    createdAt: str
    patientProfile: AnonymisedPatientProfile
    complaint: str
    history: str
    findings: str
    diagnosis: str
    tags: List[str]
    files: List[UploadedFile]
    status: Literal['Open', 'Closed', 'Under Review']
    labResults: Optional[List[LabResult]] = None
    specialistId: Optional[str] = None
    specialistAssignmentTimestamp: Optional[str] = None

class Comment(BaseModel):
    id: str
    caseId: str
    userId: str
    userName: str
    userRole: str
    timestamp: str
    text: str

class CostItem(BaseModel):
    name: str
    category: Literal['Investigation', 'Procedure', 'Consumable', 'Stay', 'Medication']
    cost: float

class TreatmentOption(BaseModel):
    id: str
    name: str
    description: str
    probabilityOfSuccess: float
    costEstimate: float
    costBreakdown: List[CostItem]
    agreementWithGuidelines: Literal['Standard', 'Experimental', 'New']
    postDischargeMeds: Dict[str, Any]
    steps: List[str]
    riskIndicators: List[str]

class DiagnosisSuggestionFeedback(BaseModel):
    rating: Literal['good', 'bad']
    comments: Optional[str] = None

class DiagnosisSuggestion(BaseModel):
    name: str
    probability: float
    rationale: str
    supportingFindings: List[str]
    feedback: Optional[DiagnosisSuggestionFeedback] = None

class AIAgentStats(BaseModel):
    id: str
    userId: str
    accuracy: float
    personalizationLevel: float
    casesAnalyzed: int
    feedbackProvided: int

class AIInsights(BaseModel):
    diagnosisConfidence: float
    patientRisks: List[str]
    keySymptoms: List[str]

class PatientFile(BaseModel):
    id: str
    name: str
    type: Literal['Lab Test', 'Radiology Report', 'Discharge Summary', 'Prescription']
    uploadDate: str
    url: str

class Medication(BaseModel):
    id: str
    name: str
    dosage: str
    frequency: str

class PatientProfile(BaseModel):
    id: str
    identifier: Optional[str] = None
    name: str
    personalDetails: Dict[str, str]
    allergies: List[str]
    baselineIllnesses: List[str]
    medications: List[Medication]
    files: List[PatientFile]

class PatientIntakeData(BaseModel):
    id: str
    fullName: Dict[str, str]
    dob: str
    sex: Literal['Male', 'Female']
    contact: Dict[str, str]
    emergencyContact: Dict[str, str]
    primaryCarePhysician: Dict[str, str]

class AIActionItem(BaseModel):
    caseId: str
    caseTitle: str
    patientInfo: str
    suggestionName: str
    confidence: float

class ExtractedCaseData(BaseModel):
    patientId: Optional[str] = None
    complaint: Optional[str] = None
    history: Optional[str] = None
    findings: Optional[str] = None
    diagnosis: Optional[str] = None
    patient_age: Optional[int] = None
    patient_sex: Optional[Literal['Male', 'Female']] = None
    missing_information: Optional[List[str]] = None

class SymptomAnalysisResult(BaseModel):
    condition: str
    confidence: float
    explanation: str

class AIContextualSuggestion(BaseModel):
    suggestion: str
    rationale: str

class Certification(BaseModel):
    id: str
    name: str
    issuingBody: str
    year: int
    url: str

class DoctorProfile(BaseModel):
    id: str
    userId: str
    specialty: str
    yearsOfExperience: int
    bio: str
    certifications: List[Certification]
    profilePictureUrl: str
