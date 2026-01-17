from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, JSON, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime
import uuid

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
    cases = relationship("Case", back_populates="creator", foreign_keys="Case.creator_id")
    assigned_cases = relationship("Case", back_populates="specialist", foreign_keys="Case.specialist_id")
    assignments = relationship("NurseAssignment", back_populates="nurse", foreign_keys="NurseAssignment.nurse_id")
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
    height = Column(Float) # cm
    weight = Column(Float) # kg
    allergies = Column(JSON) # List of strings
    baseline_illnesses = Column(JSON) # List of strings
    contact_info = Column(JSON) # {phone, email, address}
    emergency_contact = Column(JSON) # {name, relationship, phone}
    sex = Column(String)
    primary_care_physician = Column(JSON) # {name, phone}
    
    ai_preferences = Column(JSON, default={}) # Preferences for Patient Agent
    privacy_settings = Column(JSON, default={"emergency_enabled": False}) # Emergency Profile Toggle
    
    user = relationship("User", back_populates="patient_profile")
    
    medications = relationship("Medication", back_populates="patient")
    files = relationship("PatientFile", back_populates="patient") # Legacy?
    medical_records = relationship("MedicalRecord", back_populates="patient") # New robust records
    cases = relationship("Case", back_populates="patient")
    share_links = relationship("DataShareLink", back_populates="patient")

class DataShareLink(Base):
    __tablename__ = "data_share_links"
    
    id = Column(String, primary_key=True) # UUID Token
    patient_id = Column(String, ForeignKey("patients.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    permissions = Column(JSON) # {history, meds, records: []}
    access_count = Column(Integer, default=0)
    
    patient = relationship("Patient", back_populates="share_links")

class Medication(Base):
    __tablename__ = "medications"
    id = Column(String, primary_key=True)
    patient_id = Column(String, ForeignKey("patients.id"))
    name = Column(String)
    dosage = Column(String)
    frequency = Column(String)
    
    patient = relationship("Patient", back_populates="medications")

class Prescription(Base):
    __tablename__ = "prescriptions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("cases.id"), nullable=True)
    patient_id = Column(String, ForeignKey("patients.id"))
    doctor_id = Column(String, ForeignKey("users.id"))
    
    medication_name = Column(String)
    dosage = Column(String)
    frequency = Column(String)
    duration = Column(String)
    notes = Column(String)
    
    status = Column(String, default="Pending") # Pending, Ready, Dispensed, Cancelled
    dispensed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient")
    doctor = relationship("User", foreign_keys=[doctor_id])
    case = relationship("Case")

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
    
    comments = relationship("Comment", back_populates="case") # Existing?
    learning_logs = relationship("LearningLog", back_populates="case")
    
    specialist_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    creator = relationship("User", foreign_keys=[creator_id], back_populates="cases")
    specialist = relationship("User", foreign_keys=[specialist_id], back_populates="assigned_cases")
    patient = relationship("Patient", back_populates="cases")
    files = relationship("CaseFile", back_populates="case") # Also missing
    lab_results = relationship("LabResult", back_populates="case") # Also missing
    cost_estimate = relationship("CostEstimate", uselist=False, back_populates="case")

class LearningLog(Base):
    __tablename__ = "learning_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("cases.id"))
    
    state_snapshot = Column(JSON) # Snapshot of relevant patient state
    action_plan = Column(String) # The proposed plan
    
    predicted_outcome = Column(String) # AI Prediction of what will happen
    actual_outcome = Column(String, nullable=True) # What doctor reports later
    lesson_learned = Column(String, nullable=True) # The extracted wisdom
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    case = relationship("Case", back_populates="learning_logs")

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
    
    status = Column(String, default="Pending") # Pending, Processing, Completed
    ordered_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
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

class NewsletterSubscriber(Base):
    __tablename__ = "newsletter_subscribers"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, index=True)
    subscribed_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

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
    transactions = relationship("TokenTransaction", back_populates="wallet")

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
# --- Health Integration Models ---

class HealthIntegration(Base):
    __tablename__ = "health_integrations"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    provider = Column(String) # 'samsung', 'apple', 'google_fit', 'withings'
    status = Column(String) # 'active', 'disconnected', 'error'
    access_token = Column(String, nullable=True) # Encrypted in real app
    refresh_token = Column(String, nullable=True)
    last_sync_timestamp = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="health_integrations")

class HealthData(Base):
    __tablename__ = "health_data"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    integration_id = Column(String, ForeignKey("health_integrations.id"))
    
    data_type = Column(String) # 'steps', 'heart_rate', 'sleep_minutes', 'weight', 'blood_pressure'
    value = Column(Float)
    unit = Column(String) # 'count', 'bpm', 'minutes', 'kg', 'mmHg'
    
    source_timestamp = Column(DateTime) # When it was recorded on the device
    recorded_at = Column(DateTime, default=datetime.utcnow) # When we saved it

    user = relationship("User", back_populates="health_data")
    integration = relationship("HealthIntegration")

User.health_integrations = relationship("HealthIntegration", back_populates="user")
User.health_data = relationship("HealthData", back_populates="user")


class Product(Base):
    __tablename__ = "products"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String)
    description = Column(String)
    price = Column(Float)
    currency = Column(String, default="USD")
    image_url = Column(String)
    stock_quantity = Column(Integer, default=0)
    sku = Column(String, unique=True, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True) # Optional for Guest Checkout
    ucp_session_id = Column(String, unique=True, index=True) # Google Session ID
    status = Column(String, default="PENDING") # PENDING, CONFIRMED, SHIPPED, CANCELLED
    total_amount = Column(Float)
    currency = Column(String, default="USD")
    
    items = Column(JSON) # Snapshot of items: [{product_id, name, quantity, price}]
    shipping_address = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

class PartnerApplication(Base):
    __tablename__ = "partner_applications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_name = Column(String)
    contact_name = Column(String)
    email = Column(String, index=True)
    phone = Column(String)
    website = Column(String)
    device_category = Column(String) # 'vital_signs', 'metabolic', 'activity', 'specialized'
    device_description = Column(String)
    api_experience = Column(String) # 'beginner', 'intermediate', 'advanced'
    expected_volume = Column(String) # 'small', 'medium', 'large'
    message = Column(String)
    status = Column(String, default="pending") # pending, approved, rejected
    reviewed_by = Column(String, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    reviewer = relationship("User")

class PartnerAPIKey(Base):
    """API Keys for approved hardware partners"""
    __tablename__ = "partner_api_keys"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String, ForeignKey("partner_applications.id"))
    api_key = Column(String, unique=True, index=True) # Hashed
    api_secret = Column(String) # Hashed
    key_name = Column(String) # e.g., "Production Key", "Testing Key"
    is_active = Column(Boolean, default=True)
    rate_limit = Column(Integer, default=1000) # Requests per hour
    scopes = Column(JSON, default=["device:register", "data:write"]) # Permissions
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    
class RegisteredDevice(Base):
    """Devices registered by partners via SDK"""
    __tablename__ = "registered_devices"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = Column(String, unique=True, index=True) # Partner's unique device ID
    api_key_id = Column(String, ForeignKey("partner_api_keys.id"))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=True) # Linked patient
    
    device_type = Column(String) # "blood_pressure_monitor", "glucometer", etc.
    manufacturer = Column(String)
    model = Column(String)
    firmware_version = Column(String)
    serial_number = Column(String, nullable=True)
    
    capabilities = Column(JSON, default=[]) # ["bluetooth", "wifi", "offline_storage"]
    status = Column(String, default="active") # active, inactive, maintenance
    
    registered_at = Column(DateTime, default=datetime.utcnow)
    last_seen_at = Column(DateTime, nullable=True)
    
    patient = relationship("Patient")

class DeviceDataSubmission(Base):
    """Health data submitted by devices"""
    __tablename__ = "device_data_submissions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    device_id = Column(String, ForeignKey("registered_devices.device_id"))
    patient_id = Column(String, ForeignKey("patients.id"))
    
    data_type = Column(String) # "blood_pressure", "glucose", "heart_rate", etc.
    timestamp = Column(DateTime) # When measurement was taken
    
    # FHIR-compliant data structure
    fhir_observation = Column(JSON) # Full FHIR Observation resource
    
    # Simplified values for quick access
    values = Column(JSON) # {"systolic": 120, "diastolic": 80}
    unit = Column(String) # "mmHg", "mg/dL", "bpm"
    
    device_metadata = Column(JSON, nullable=True) # Battery, signal strength, etc.
    
    received_at = Column(DateTime, default=datetime.utcnow)
    processed = Column(Boolean, default=False)
    
    patient = relationship("Patient")


# --- B2C Growth Models (Credits, Referrals, Family) ---

class UserCredits(Base):
    __tablename__ = "user_credits"
    
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    balance = Column(Float, default=0.0) # Float for precise API cost tracking
    tier = Column(String, default="FREE") # FREE, PRO, FAMILY
    subscription_status = Column(String, default="ACTIVE")
    next_billing_date = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="credits_profile")
    transactions = relationship("CreditTransaction", back_populates="credit_account")

class CreditTransaction(Base):
    __tablename__ = "credit_transactions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("user_credits.user_id"))
    amount = Column(Float) # Negative for usage, positive for purchase/reward
    reason = Column(String) # "AI_CHAT", "REFERRAL_REWARD", "MONTHLY_ALLOWANCE"
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    credit_account = relationship("UserCredits", back_populates="transactions")

class Referral(Base):
    __tablename__ = "referrals"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    referrer_id = Column(String, ForeignKey("users.id"))
    referred_user_id = Column(String, ForeignKey("users.id"), nullable=True) # Linked after signup
    invite_code = Column(String, index=True) # Non-unique to allow reusable codes
    invite_email = Column(String, nullable=True) # If invited via email
    
    status = Column(String, default="PENDING") # PENDING, VERIFIED, COMPLETED
    reward_claimed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    referrer = relationship("User", foreign_keys=[referrer_id], back_populates="sent_referrals")
    referred_user = relationship("User", foreign_keys=[referred_user_id], back_populates="received_referral")

class FamilyGroup(Base):
    __tablename__ = "family_groups"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String) # e.g. "The Smith Family"
    created_by_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    members = relationship("FamilyMember", back_populates="group")

class FamilyMember(Base):
    __tablename__ = "family_members"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id = Column(String, ForeignKey("family_groups.id"))
    user_id = Column(String, ForeignKey("users.id"))
    
    role = Column(String) # PARENT, CHILD, DEPENDENT
    access_level = Column(String) # FULL, READ_ONLY
    data_sharing_enabled = Column(Boolean, default=True)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    group = relationship("FamilyGroup", back_populates="members")
    user = relationship("User")

# Add relationships to User model
User.credits_profile = relationship("UserCredits", uselist=False, back_populates="user")
User.sent_referrals = relationship("Referral", foreign_keys=[Referral.referrer_id], back_populates="referrer")
User.received_referral = relationship("Referral", foreign_keys=[Referral.referred_user_id], back_populates="referred_user", uselist=False)





