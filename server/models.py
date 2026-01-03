from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, JSON, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    role = Column(String)
    level = Column(Integer, default=1)
    credits = Column(Integer, default=100)
    hashed_password = Column(String, nullable=True)
    
    # Privacy & Consents
    gdpr_consent = Column(Boolean, default=False)
    data_sharing_consent = Column(Boolean, default=False) # For external agents/partners
    marketing_consent = Column(Boolean, default=False)
    accepted_terms_at = Column(DateTime, nullable=True)
    accepted_privacy_policy_at = Column(DateTime, nullable=True)
    
    # Role-specific associations
    linked_doctor_ids = Column(JSON, default=[]) # For Nurses: list of doctor User IDs they work with
    
    # Relationships
    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False)
    patient_profile = relationship("Patient", back_populates="user", uselist=False)
    comments = relationship("Comment", back_populates="user")
    cases = relationship("Case", back_populates="creator", foreign_keys="[Case.creator_id]")
    assigned_cases = relationship("Case", back_populates="specialist", foreign_keys="[Case.specialist_id]")
    assignments = relationship("NurseAssignment", back_populates="nurse", foreign_keys="[NurseAssignment.nurse_id]")
    knowledge_items = relationship("KnowledgeItem", back_populates="user")
    medical_records_uploaded = relationship("MedicalRecord", back_populates="uploader")

    @property
    def patient_profile_id(self):
        return self.patient_profile.id if self.patient_profile else None

    @property
    def doctor_profile_id(self):
        return self.doctor_profile.id if self.doctor_profile else None


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    specialty = Column(String) # Primary specialty
    additional_specialties = Column(JSON, default=[]) # List[str] e.g. ["Cardiology", "Internal Medicine"]
    years_of_experience = Column(Integer)
    bio = Column(String)
    certifications = Column(JSON) # List of dicts
    profile_picture_url = Column(String)

    user = relationship("User", back_populates="doctor_profile")
    
class KnowledgeItem(Base):
    __tablename__ = "knowledge_items"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    content = Column(String)
    metadata_ = Column(JSON) # 'metadata' is reserved in SQLAlchemy sometimes, using metadata_
    created_at = Column(String, default=datetime.utcnow().isoformat)

    user = relationship("User", back_populates="knowledge_items")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True) # Link to User
    identifier = Column(String, index=True)
    name = Column(String)
    dob = Column(String)
    blood_type = Column(String)
    allergies = Column(JSON) # List of strings
    baseline_illnesses = Column(JSON) # List of strings
    contact_info = Column(JSON) # {phone, email, address}
    emergency_contact = Column(JSON) # {name, relationship, phone}
    sex = Column(String)
    primary_care_physician = Column(JSON) # {name, phone}
    
    ai_preferences = Column(JSON, default={}) # Preferences for Patient Agent
    
    user = relationship("User", back_populates="patient_profile")
    
    medications = relationship("Medication", back_populates="patient")
    files = relationship("PatientFile", back_populates="patient") # Legacy?
    medical_records = relationship("MedicalRecord", back_populates="patient") # New robust records
    cases = relationship("Case", back_populates="patient")

class Medication(Base):
    __tablename__ = "medications"
    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey("patients.id"))
    name = Column(String)
    dosage = Column(String)
    frequency = Column(String)
    
    patient = relationship("Patient", back_populates="medications")

class PatientFile(Base):
    __tablename__ = "patient_files"
    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey("patients.id"))
    name = Column(String)
    type = Column(String)
    upload_date = Column(String)
    url = Column(String)
    
    patient = relationship("Patient", back_populates="files")

class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    creator_id = Column(String, ForeignKey("users.id"))
    patient_id = Column(String, ForeignKey("patients.id"))
    created_at = Column(String, default=datetime.utcnow().isoformat)
    
    # Snapshot of patient profile at time of case creation (optional, or just link)
    # For simplicity, we'll store relevant fields or rely on patient link
    complaint = Column(String)
    history = Column(String)
    findings = Column(String)
    diagnosis = Column(String)
    tags = Column(JSON)
    status = Column(String, default="Open")
    
    specialist_id = Column(String, ForeignKey("users.id"), nullable=True)
    specialist_assignment_timestamp = Column(String, nullable=True)
    
    creator = relationship("User", foreign_keys=[creator_id], back_populates="cases")
    specialist = relationship("User", foreign_keys=[specialist_id], back_populates="assigned_cases")
    patient = relationship("Patient", back_populates="cases")
    comments = relationship("Comment", back_populates="case")
    files = relationship("CaseFile", back_populates="case")
    lab_results = relationship("LabResult", back_populates="case")

class CaseFile(Base):
    __tablename__ = "case_files"
    id = Column(String, primary_key=True)
    case_id = Column(String, ForeignKey("cases.id"))
    name = Column(String)
    type = Column(String)
    url = Column(String)
    
    case = relationship("Case", back_populates="files")

class LabResult(Base):
    __tablename__ = "lab_results"
    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String, ForeignKey("cases.id"))
    test = Column(String)
    value = Column(String)
    unit = Column(String)
    reference_range = Column(String)
    interpretation = Column(String)
    
    case = relationship("Case", back_populates="lab_results")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(String, primary_key=True)
    case_id = Column(String, ForeignKey("cases.id"))
    user_id = Column(String, ForeignKey("users.id"))
    user_name = Column(String) # Cache for easier display
    user_role = Column(String) # Cache
    timestamp = Column(String, default=datetime.utcnow().isoformat)
    text = Column(String)

    case = relationship("Case", back_populates="comments")
    user = relationship("User", back_populates="comments")

class AgentState(Base) :
    __tablename__ = "agent_states"
    
    user_id = Column(String, primary_key=True)
    preferences = Column(JSON, default={})
    interaction_history_summary = Column(String, default="")
    learning_points = Column(JSON, default=[])

class SystemConfig(Base):
    __tablename__ = "system_config"
    key = Column(String, primary_key=True)
    value = Column(JSON)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SystemLog(Base):
    __tablename__ = "system_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String) # 'ai_query', 'login', 'error'
    user_id = Column(String, nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class CostEstimate(Base):
    __tablename__ = "cost_estimates"
    id = Column(String, primary_key=True)
    case_id = Column(String, ForeignKey("cases.id"))
    total_cost = Column(Float)
    currency = Column(String, default="USD")
    breakdown = Column(JSON) # List of {item: str, cost: float, category: str}
    insurance_coverage = Column(Float) # Estimated coverage amount
    patient_responsibility = Column(Float)
    status = Column(String) # 'Estimated', 'Approved', 'Pending'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    case = relationship("Case", back_populates="cost_estimate")

# Add back-populate to Case model
Case.cost_estimate = relationship("CostEstimate", uselist=False, back_populates="case")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    user_name = Column(String)
    amount = Column(Float)
    type = Column(String) # 'Subscription', 'Consultation', 'AI Analysis'
    status = Column(String) # 'Paid', 'Pending'
    date = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")

User.transactions = relationship("Transaction", back_populates="user")

class AIFeedback(Base):
    __tablename__ = "ai_feedback"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    case_id = Column(String, ForeignKey("cases.id"), nullable=True)
    suggestion_name = Column(String)
    rating = Column(String) # 'good', 'bad'
    comments = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class MedicalRecord(Base):
    __tablename__ = "medical_records"
    
    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey("patients.id"))
    uploader_id = Column(String, ForeignKey("users.id"))
    
    type = Column(String) # 'Lab', 'Prescription', 'Imaging', 'Report'
    title = Column(String)
    file_url = Column(String)
    content_text = Column(String) # OCR extracted text
    ai_summary = Column(String) # AI generated summary
    metadata_ = Column(JSON, default={}) # Extra analysis data
    
    # Vector embedding for RAG (stored as list of floats in JSON for SQLite/Simple DBs, or pgvector for Postgres)
    embedding = Column(JSON, nullable=True) 
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="medical_records")
    uploader = relationship("User", back_populates="medical_records_uploaded")

class AgentCapability(Base):
    """Registry for Internal MCP Agent Capabilities"""
    __tablename__ = "agent_capabilities"
    
    id = Column(String, primary_key=True)
    agent_role = Column(String) # 'BillingAgent', 'NurseAgent', 'LabAgent'
    capability_name = Column(String) # 'check_coverage', 'triage_patient'
    description = Column(String)
    input_schema = Column(JSON) # JSON Schema for input
    output_schema = Column(JSON) # JSON Schema for output
    is_active = Column(Boolean, default=True)

class NurseAssignment(Base):
    """Links Nurses to Doctors"""
    __tablename__ = "nurse_assignments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    nurse_id = Column(String, ForeignKey("users.id"))
    doctor_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    nurse = relationship("User", foreign_keys=[nurse_id], back_populates="assignments")
    # doctor relationship can be added if needed

# --- ARAMS Token Ecosystem Models ---

class TokenWallet(Base):
    __tablename__ = "token_wallets"
    
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    balance = Column(Float, default=0.0)
    total_earned = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="token_wallet")

class TokenTransaction(Base):
    __tablename__ = "token_transactions"
    
    id = Column(String, primary_key=True) # UUID
    wallet_id = Column(String, ForeignKey("token_wallets.user_id"))
    amount = Column(Float)
    type = Column(String) # 'Reward', 'Transfer', 'PlatformFee', 'Redemption'
    description = Column(String)
    related_entity_id = Column(String, nullable=True) # e.g., Case ID, Contribution ID
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    wallet = relationship("TokenWallet", back_populates="transactions")

class ResearchGroup(Base):
    __tablename__ = "research_groups"
    
    id = Column(String, primary_key=True)
    name = Column(String)
    topic = Column(String)
    creator_id = Column(String, ForeignKey("users.id"))
    members = Column(JSON) # List of User IDs
    total_tokens_generated = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    creator = relationship("User")

class ResearchContribution(Base):
    __tablename__ = "research_contributions"
    
    id = Column(String, primary_key=True)
    group_id = Column(String, ForeignKey("research_groups.id"))
    contributor_id = Column(String, ForeignKey("users.id"))
    data_type = Column(String) # 'Case', 'LabResult', 'Feedback'
    data_id = Column(String)
    quality_score = Column(Float) # AI or Peer reviewed score (0.0 - 1.0)
    tokens_awarded = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

User.token_wallet = relationship("TokenWallet", uselist=False, back_populates="user")
TokenWallet.transactions = relationship("TokenTransaction", back_populates="wallet")

