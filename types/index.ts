
export enum Role {
  Admin = "Admin",
  Doctor = "Doctor",
  Specialist = "Specialist",
  Nurse = "Nurse",
  Trainee = "Trainee",
  Patient = "Patient",
  Radiologist = "Radiologist",
  LabTechnician = "Lab Technician",
  Pharmacist = "Pharmacist",
  Physiotherapist = "Physiotherapist",
  HospitalManager = "Hospital Manager",
  BillingOfficer = "Billing & Insurance Officer",
  ComplianceOfficer = "Data Protection Officer",
  AIEngineer = "AI/IT Engineer",
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  level: number;
  credits: number;
  patientProfileId?: string;
  doctorProfileId?: string;
}

export interface AnonymisedPatientProfile {
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  comorbidities: string[];
}

export interface UploadedFile {
  id: string;
  name: string;
  type: 'CT' | 'Lab Report' | 'ECG' | 'Photo' | 'Doppler Scan';
  url: string;
}

export interface LabResult {
  test: string;
  value: string;
  unit: string;
  referenceRange: string;
  interpretation?: 'Normal' | 'Abnormal-High' | 'Abnormal-Low' | 'Critical';
}

export interface Case {
  id: string;
  title: string;
  creatorId: string;
  patientId: string;
  createdAt: string;
  patientProfile: AnonymisedPatientProfile;
  complaint: string;
  history: string;
  findings: string;
  diagnosis: string;
  icd10Code?: string;
  tags: string[];
  files: UploadedFile[];
  status: 'Open' | 'Closed' | 'Under Review';
  labResults?: LabResult[];
  specialistId?: string; // Added for explicit assignment
  specialistAssignmentTimestamp?: string;
}

export interface Comment {
  id: string;
  caseId: string;
  userId: string;
  userName: string;
  userRole: Role;
  timestamp: string;
  text: string;
}

export interface CostItem {
  name: string;
  category: 'Investigation' | 'Procedure' | 'Consumable' | 'Stay' | 'Medication';
  cost: number;
}

export interface TreatmentOption {
  id:string;
  name: string;
  description: string;
  probabilityOfSuccess: number; // 0-1
  costEstimate: number; // in AED
  costBreakdown: CostItem[];
  agreementWithGuidelines: 'Standard' | 'Experimental' | 'New';
  postDischargeMeds: {
    duration: string;
    cost: number;
  };
  steps: string[];
  riskIndicators: string[];
}

export interface DiagnosisSuggestionFeedback {
  rating: 'good' | 'bad';
  comments?: string;
}

export interface DiagnosisSuggestion {
  name: string;
  probability: number; // 0-1
  rationale: string;
  supportingFindings: string[];
  feedback?: DiagnosisSuggestionFeedback | null;
}

export interface UnratedSuggestion {
    caseId: string;
    caseTitle: string;
    suggestion: DiagnosisSuggestion;
}

export interface AIAgentStats {
  id: string;
  userId: string;
  accuracy: number; // 0-1
  personalizationLevel: number; // 0-1
  casesAnalyzed: number;
  feedbackProvided: number;
}

export interface AIInsights {
  diagnosisConfidence: number; // 0-1
  patientRisks: string[];
  keySymptoms: string[];
}

export interface PatientFile {
    id: string;
    name: string;
    type: 'Lab Test' | 'Radiology Report' | 'Discharge Summary' | 'Prescription';
    uploadDate: string;
    url: string; // placeholder
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}

export interface VisitHistory {
    id: string;
    date: string;
    doctor: string;
    reason: string;
    summary: string;
}

export interface PatientProfile {
    id: string;
    identifier?: string;
    name: string;
    personalDetails: {
        dob: string;
        bloodType: string;
    };
    allergies: string[];
    baselineIllnesses: string[];
    medications: Medication[];
    files: PatientFile[];
    visitHistory: VisitHistory[];
}

export interface PatientIntakeData {
  id: string;
  fullName: {
    firstName: string;
    lastName: string;
  };
  dob: string;
  sex: 'Male' | 'Female' ;
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  primaryCarePhysician: {
    name: string;
    phone: string;
  };
}

export interface AppNotification {
  id?: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
}

export interface AIActionItem {
  caseId: string;
  caseTitle: string;
  patientInfo: string;
  suggestionName: string;
  confidence: number;
}

export interface ExtractedCaseData {
  patientId?: string;
  complaint?: string;
  history?: string;
  findings?: string;
  diagnosis?: string;
  patient_age?: number;
  patient_sex?: 'Male' | 'Female' ;
  missing_information?: string[];
}

export interface SymptomAnalysisResult {
  condition: string;
  confidence: number; // 0-1
  explanation: string;
}

export interface AIContextualSuggestion {
    suggestion: string;
    rationale: string;
}

export interface Certification {
  id: string;
  name: string;
  issuingBody: string;
  year: number;
  url: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  specialty: string;
  yearsOfExperience: number;
  bio: string;
  certifications: Certification[];
  profilePictureUrl: string;
}
