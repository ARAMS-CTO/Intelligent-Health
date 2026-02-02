from .database import SessionLocal, engine
import server.models as models
from .schemas import Role
from passlib.context import CryptContext
import datetime
import uuid
import random

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def seed_users(db: SessionLocal = None):
    # Support both passed session and new session
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
        
    try:
        # Admin
        admin_email = "aram.services.pro@gmail.com"
        admin = db.query(models.User).filter(models.User.email == admin_email).first()
        if not admin:
            print(f"Creating Admin: {admin_email}")
            admin = models.User(id="user-admin-real", name="Aram Services Admin", email=admin_email, role="Admin", hashed_password=get_password_hash("AdminPassword123!"), credits=9999)
            db.add(admin)
        
        # Patient (Aram)
        patient_email = "aram.ghannad@gmail.com"
        patient = db.query(models.User).filter(models.User.email == patient_email).first()
        if not patient:
            print(f"Creating Patient: {patient_email}")
            patient = models.User(id="user-patient-real", name="Aram Ghannad", email=patient_email, role="Patient", hashed_password=get_password_hash("PatientPassword123!"), credits=100)
            db.add(patient)
            p_profile = models.Patient(id="profile-patient-real", user_id=patient.id, identifier="MRN-ARAM", name="Aram Ghannad", contact_info={"email": patient_email})
            db.add(p_profile)

        # Doctor
        doctor_email = "m.sonati@intelligent-health.com"
        doctor = db.query(models.User).filter(models.User.email == doctor_email).first()
        if not doctor:
            print(f"Creating Doctor: {doctor_email}")
            doctor = models.User(id="user-doc-real", name="Mohammad Sonati", email=doctor_email, role="Doctor", hashed_password=get_password_hash("DoctorPassword123!"), credits=100)
            db.add(doctor)
            doc_profile = models.DoctorProfile(id="profile-doc-real", user_id=doctor.id, specialty="Cardiology", bio="Senior Cardiologist")
            db.add(doc_profile)

        # Nurse
        nurse_email = "c.redfield@intelligent-health.com"
        nurse = db.query(models.User).filter(models.User.email == nurse_email).first()
        if not nurse:
            print(f"Creating Nurse: {nurse_email}")
            nurse = models.User(id="user-nurse-real", name="Claire Redfield", email=nurse_email, role="Nurse", hashed_password=get_password_hash("NursePassword123!"), credits=100)
            db.add(nurse)

        # Billing Officer
        bill_email = "bill.officer@intelligent-health.com"
        billing = db.query(models.User).filter(models.User.email == bill_email).first()
        if not billing:
             # Use role 'BillingManager' or 'Admin' if 'BillingOfficer' not in simplistic Role enum? 
             # Assuming string role is fine based on User model.
            print(f"Creating Billing Officer: {bill_email}")
            billing = models.User(id="user-bill-real", name="Bill Officer", email=bill_email, role="Billing Manager", hashed_password=get_password_hash("BillingPassword123!"), credits=100)
            db.add(billing)

        # Lab Tech
        lab_email = "l.test@intelligent-health.com"
        lab = db.query(models.User).filter(models.User.email == lab_email).first()
        if not lab:
            print(f"Creating Lab Tech: {lab_email}")
            lab = models.User(id="user-lab-real", name="Lab Tech Larry", email=lab_email, role="Lab Technician", hashed_password=get_password_hash("LabPassword123!"), credits=100)
            db.add(lab)
            
        # Pharmacist
        pharm_email = "pharm@intelligent-health.com"
        pharm = db.query(models.User).filter(models.User.email == pharm_email).first()
        if not pharm:
            print(f"Creating Pharmacist: {pharm_email}")
            pharm = models.User(id="user-pharm-real", name="Pharmer Joe", email=pharm_email, role="Pharmacist", hashed_password=get_password_hash("PharmPassword123!"), credits=100)
            db.add(pharm)

        db.commit()
    except Exception as e:
        print(f"Error seeding users: {e}")
        db.rollback()
    finally:
        if should_close:
            db.close()

def seed_clinical_data(db: SessionLocal = None):
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
        
    try:
        print("Seeding Clinical Data...")
        
        # Ensure Users exist first (relies on IDs from seed_users)
        patient_id = "user-patient-real"
        doctor_id = "user-doc-real"
        
        # 1. Active Case: Hypertension
        case_id_1 = "case-htn-001"
        existing_case = db.query(models.Case).filter(models.Case.id == case_id_1).first()
        if not existing_case:
            case1 = models.Case(
                id=case_id_1,
                title="Uncontrolled Hypertension",
                creator_id=doctor_id,
                patient_id="profile-patient-real", # Links to Patient Profile ID
                status="Open",
                complaint="Headaches and dizziness",
                history="Diagnosed 5 years ago, non-compliant with meds",
                findings="BP 160/100, HR 88",
                diagnosis="Hypertension Stage 2",
                created_at=(datetime.datetime.utcnow() - datetime.timedelta(days=2)).isoformat()
            )
            db.add(case1)
            
            # Add Comment
            comment1 = models.Comment(
                id=str(uuid.uuid4()),
                case_id=case_id_1,
                user_id=doctor_id,
                user_name="Dr. Mohammad Sonati",
                user_role="Doctor",
                text="Patient requires immediate medication adjustment. Ordering labs to check kidney function.",
                timestamp=(datetime.datetime.utcnow() - datetime.timedelta(days=2)).isoformat()
            )
            db.add(comment1)
            
            # Lab Order (Pending)
            lab1 = models.LabResult(
                case_id=case_id_1,
                test="Basic Metabolic Panel",
                status="Pending",
                ordered_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
            )
            db.add(lab1)
            
            # Prescription (Pending)
            rx1 = models.Prescription(
                id=f"rx-{uuid.uuid4()}",
                patient_id="profile-patient-real",
                case_id=case_id_1,
                doctor_id=doctor_id,
                medication_name="Lisinopril",
                dosage="10mg",
                frequency="Daily",
                duration="30 days",
                status="Pending",
                created_at=datetime.datetime.utcnow()
            )
            db.add(rx1)

        # 2. Case needing Billing Approval: Arrhythmia
        case_id_2 = "case-arr-002"
        existing_case_2 = db.query(models.Case).filter(models.Case.id == case_id_2).first()
        if not existing_case_2:
            case2 = models.Case(
                id=case_id_2,
                title="Cardiac Arrhythmia Evaluation",
                creator_id=doctor_id,
                patient_id="profile-patient-real",
                status="Under Review",
                complaint="Palpitations",
                created_at=(datetime.datetime.utcnow() - datetime.timedelta(days=5)).isoformat()
            )
            db.add(case2)
            
            # Lab Result (Completed)
            lab2 = models.LabResult(
                case_id=case_id_2,
                test="ECG",
                value="Atrial Fibrillation",
                unit="",
                status="Completed",
                interpretation="Abnormal",
                ordered_at=datetime.datetime.utcnow() - datetime.timedelta(days=5),
                completed_at=datetime.datetime.utcnow() - datetime.timedelta(days=4)
            )
            db.add(lab2)
            
            # Cost Estimate (Pending)
            est1 = models.CostEstimate(
                id=str(uuid.uuid4()),
                case_id=case_id_2,
                total_cost=2500.00,
                insurance_coverage=1800.00,
                patient_responsibility=700.00,
                status="Pending",
                breakdown=[{"item": "ECG", "cost": 500}, {"item": "Cardiology Consult", "cost": 2000}]
            )
            db.add(est1)
            
        print("Seeding Clinical Data Completed.")
        db.commit()

    except Exception as e:
        print(f"Error seeding clinical data: {e}")
        db.rollback()
    finally:
        if should_close:
            db.close()

def seed_agents(db: SessionLocal = None):
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
        
    try:
        print("Seeding Agents...")
        agents = [
            {
                "id": "agent-doctor-clinical",
                "agent_role": "Doctor",
                "capability_name": "clinical_summary",
                "description": "Generates clinical summaries and insights from case data.",
                "input_schema": {"case_id": "string"},
                "output_schema": {"diagnosisConfidence": "float", "primaryDiagnosis": "string"},
                "is_active": True
            },
            {
                "id": "agent-doctor-treatment",
                "agent_role": "Doctor",
                "capability_name": "treatment_plan",
                "description": "Generates detailed, personalized treatment plans.",
                "input_schema": {"case_id": "string"},
                "output_schema": {"plan": "string"},
                "is_active": True
            },
            {
                "id": "agent-nurse-triage",
                "agent_role": "Nurse",
                "capability_name": "triage",
                "description": "Prioritizes cases based on vital signs and urgency.",
                "input_schema": {"criteria": "string"},
                "output_schema": {"priority": "string"},
                "is_active": True
            },
            {
                "id": "agent-billing-estimate",
                "agent_role": "Billing",
                "capability_name": "generate_estimate",
                "description": "Calculates procedure costs and insurance coverage.",
                "input_schema": {"case_id": "string"},
                "output_schema": {"total_cost": "float"},
                "is_active": True
            },
            {
                "id": "agent-researcher-augment",
                "agent_role": "Researcher",
                "capability_name": "augment_case",
                "description": "Augments cases with latest medical research and papers.",
                "input_schema": {"extracted_data": "json"},
                "output_schema": {"suggestions": "list"},
                "is_active": True
            },
            {
                "id": "agent-ocr-docs",
                "agent_role": "OpticalCharacterRecognition",
                "capability_name": "extract_text",
                "description": "Extracts text and structured data from medical documents and prescriptions.",
                "input_schema": {"file_url": "string"},
                "output_schema": {"text": "string", "entities": "list"},
                "is_active": True
            },
            {
                "id": "agent-patient-support",
                "agent_role": "Patient",
                "capability_name": "support_chat",
                "description": "24/7 AI Health Assistant for symptom checks and medication reminders.",
                "input_schema": {"message": "string"},
                "output_schema": {"reply": "string"},
                "is_active": True
            }
        ]
        
        for agent_data in agents:
            existing = db.query(models.AgentCapability).filter(models.AgentCapability.id == agent_data["id"]).first()
            if not existing:
                db.add(models.AgentCapability(**agent_data))
                print(f"Created Agent Capability: {agent_data['capability_name']}")
            else:
                # Update basic info
                existing.description = agent_data["description"]
                existing.input_schema = agent_data["input_schema"]
                existing.output_schema = agent_data["output_schema"]
                print(f"Updated Agent Capability: {agent_data['capability_name']}")
                
        db.commit()
    except Exception as e:
        print(f"Error seeding agents: {e}")
        db.rollback()
    finally:
        if should_close:
            db.close()

def seed_specialized_data(db: SessionLocal = None):
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True
        
    try:
        print("Seeding Specialized (Cardio/Eye) Data...")
        
        patient_id = "profile-patient-real" # Aram's profile ID
        
        # Check if already seeded (simple check)
        existing = db.query(models.VitalReading).filter(models.VitalReading.patient_id == patient_id).first()
        if existing:
            print("Specialized Data already exists.")
            return

        # 1. Cardiology Vitals
        vitals = [
            models.VitalReading(
                id=str(uuid.uuid4()), patient_id=patient_id, type="blood_pressure", 
                value="120/80", unit="mmHg", systolic=120, diastolic=80, status="Normal", source="Device"
            ),
            models.VitalReading(
                id=str(uuid.uuid4()), patient_id=patient_id, type="heart_rate", 
                value="72", unit="bpm", status="Normal", source="Device"
            ),
            models.VitalReading(
                id=str(uuid.uuid4()), patient_id=patient_id, type="oxygen_saturation", 
                value="98%", unit="%", status="Normal", source="Device"
            ),
            # 2. Ophthalmology Vitals
            models.VitalReading(
                id=str(uuid.uuid4()), patient_id=patient_id, type="visual_acuity_od", 
                value="20/20", unit="", status="Normal", source="Manual"
            ),
            models.VitalReading(
                id=str(uuid.uuid4()), patient_id=patient_id, type="visual_acuity_os", 
                value="20/25", unit="", status="Minor Correction", source="Manual"
            ),
             models.VitalReading(
                id=str(uuid.uuid4()), patient_id=patient_id, type="iop", 
                value="16", unit="mmHg", status="Normal", source="Tonometer"
            ),
             models.VitalReading(
                id=str(uuid.uuid4()), patient_id=patient_id, type="cup_disc_ratio", 
                value="0.3", unit="", status="Normal", source="Manual"
            )
        ]
        
        db.add_all(vitals)
        db.commit()
        print("Seeded Specialized Data.")

    except Exception as e:
        print(f"Error seeding specialized data: {e}")
        db.rollback()
    finally:
        if should_close:
            db.close()

if __name__ == "__main__":
    db = SessionLocal()
    seed_users(db)
    seed_clinical_data(db)
    seed_agents(db)
    seed_specialized_data(db)
    db.close()
