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
    hashed_password = Column(String, nullable=True) # Nullable for now to support existing users or social auth later
    
    # Relationships
    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False)
    comments = relationship("Comment", back_populates="user")
    cases = relationship("Case", back_populates="creator", foreign_keys="[Case.creator_id]")
    assigned_cases = relationship("Case", back_populates="specialist", foreign_keys="[Case.specialist_id]")
    knowledge_items = relationship("KnowledgeItem", back_populates="user")

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    specialty = Column(String)
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
    identifier = Column(String, index=True)
    name = Column(String)
    dob = Column(String)
    blood_type = Column(String)
    allergies = Column(JSON) # List of strings
    baseline_illnesses = Column(JSON) # List of strings
    contact_info = Column(JSON) # {phone, email, address}
    emergency_contact = Column(JSON) # {name, relationship, phone}
    primary_care_physician = Column(JSON) # {name, phone}
    
    medications = relationship("Medication", back_populates="patient")
    files = relationship("PatientFile", back_populates="patient")
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

class AgentState(Base):
    __tablename__ = "agent_states"
    
    user_id = Column(String, primary_key=True)
    preferences = Column(JSON, default={})
    interaction_history_summary = Column(String, default="")
    learning_points = Column(JSON, default=[])
