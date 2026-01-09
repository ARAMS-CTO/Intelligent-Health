from .database import SessionLocal, engine
from .models import Base, User, DoctorProfile, Patient
from .database import SessionLocal, engine
from .models import Base, User, DoctorProfile, Patient
# from .routes.auth import get_password_hash # Removing to avoid import cycles/errors
from .schemas import Role
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

Base.metadata.create_all(bind=engine)

def seed_users():
    db: Session = SessionLocal()
    try:
        # Admin
        admin_email = "aram.services.pro@gmail.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            print(f"Creating Admin: {admin_email}")
            admin = User(id="user-admin-real", name="Aram Services Admin", email=admin_email, role="Admin", hashed_password=get_password_hash("AdminPassword123!"), credits=9999)
            db.add(admin)
        else:
            admin.role = "Admin"
            admin.hashed_password = get_password_hash("AdminPassword123!")
            print(f"Updated Admin: {admin_email}")

        # Patient
        patient_email = "aram.ghannad@gmail.com"
        patient = db.query(User).filter(User.email == patient_email).first()
        if not patient:
            print(f"Creating Patient: {patient_email}")
            patient = User(id="user-patient-real", name="Aram Ghannad", email=patient_email, role="Patient", hashed_password=get_password_hash("PatientPassword123!"), credits=100)
            db.add(patient)
            
            p_profile = Patient(id="profile-patient-real", user_id=patient.id, identifier="MRN-ARAM", name="Aram Ghannad", contact_info={"email": patient_email})
            db.add(p_profile)
        else:
            patient.role = "Patient"
            patient.hashed_password = get_password_hash("PatientPassword123!")
            print(f"Updated Patient: {patient_email}")

        # Doctor
        doctor_email = "m.sonati@intelligent-health.com"
        doctor = db.query(User).filter(User.email == doctor_email).first()
        if not doctor:
            print(f"Creating Doctor: {doctor_email}")
            doctor = User(id="user-doc-real", name="Mohammad Sonati", email=doctor_email, role="Doctor", hashed_password=get_password_hash("DoctorPassword123!"), credits=100)
            db.add(doctor)
            doc_profile = DoctorProfile(id="profile-doc-real", user_id=doctor.id, specialty="Cardiology", bio="Senior Cardiologist")
            db.add(doc_profile)
        else:
            doctor.hashed_password = get_password_hash("DoctorPassword123!")
            print(f"Updated Doctor: {doctor_email}")

        # Nurse (Pharmacist mapped to Nurse/Pharmacist role)
        nurse_email = "c.redfield@intelligent-health.com"
        nurse = db.query(User).filter(User.email == nurse_email).first()
        if not nurse:
            print(f"Creating Nurse: {nurse_email}")
            nurse = User(id="user-nurse-real", name="Claire Redfield", email=nurse_email, role="Nurse", hashed_password=get_password_hash("NursePassword123!"), credits=100)
            db.add(nurse)
        else:
            nurse.hashed_password = get_password_hash("NursePassword123!")
            print(f"Updated Nurse: {nurse_email}")

        # Billing Officer
        bill_email = "bill.officer@intelligent-health.com"
        billing_officer = db.query(User).filter(User.email == bill_email).first()
        if not billing_officer:
            print(f"Creating Billing Officer: {bill_email}")
            billing_officer = User(
                id="user-bill-real",
                name="Bill Officer",
                email=bill_email,
                role=Role.BillingOfficer,
                hashed_password=get_password_hash("BillingPassword123!"),
                credits=100
            )
            db.add(billing_officer)
        else:
            print(f"Billing Officer exists: {bill_email}")
            billing_officer.hashed_password = get_password_hash("BillingPassword123!")

        # Radiologist
        rad_email = "r.scan@intelligent-health.com"
        radiologist = db.query(User).filter(User.email == rad_email).first()
        if not radiologist:
            print(f"Creating Radiologist: {rad_email}")
            radiologist = User(
                id="user-rad-real",
                name="Dr. Rad Scan",
                email=rad_email,
                role=Role.Radiologist,
                hashed_password=get_password_hash("RadiologyPassword123!"),
                credits=100
            )
            db.add(radiologist)
        else:
            print(f"Radiologist exists: {rad_email}")
            radiologist.hashed_password = get_password_hash("RadiologyPassword123!")

        # Lab Technician
        lab_email = "l.test@intelligent-health.com"
        lab_tech = db.query(User).filter(User.email == lab_email).first()
        if not lab_tech:
            print(f"Creating Lab Tech: {lab_email}")
            lab_tech = User(
                id="user-lab-real",
                name="Lab Tech Larry",
                email=lab_email,
                role=Role.LabTechnician,
                hashed_password=get_password_hash("LabPassword123!"),
                credits=100
            )
            db.add(lab_tech)
        else:
            print(f"Lab Tech exists: {lab_email}")
            lab_tech.hashed_password = get_password_hash("LabPassword123!")
            
        # Hospital Manager (Admin/Manager role)
        manager_email = "h.manager@intelligent-health.com"
        manager = db.query(User).filter(User.email == manager_email).first()
        if not manager:
            print(f"Creating Hospital Manager: {manager_email}")
            manager = User(
                id="user-manager-real",
                name="Hospital Manager",
                email=manager_email,
                role=Role.HospitalManager,
                hashed_password=get_password_hash("ManagerPassword123!"),
                credits=500
            )
            db.add(manager)
        else:
            print(f"Manager exists: {manager_email}")
            manager.hashed_password = get_password_hash("ManagerPassword123!")

        # Insurance Representative (External/Approver)
        ins_email = "insurance@intelligent-health.com"
        insurer = db.query(User).filter(User.email == ins_email).first()
        if not insurer:
            print(f"Creating Insurance Rep: {ins_email}")
            insurer = User(
                id="user-insurance-real",
                name="Global Health Insurance",
                email=ins_email,
                role=Role.BillingOfficer, # Using Billing Officer permissions for claims/approvals
                hashed_password=get_password_hash("InsurancePassword123!"),
                credits=0
            )
            db.add(insurer)
        else:
            print(f"Insurance Rep exists: {ins_email}")
            insurer.hashed_password = get_password_hash("InsurancePassword123!")

        # Finance Director (Internal)
        fin_email = "finance@intelligent-health.com"
        finance = db.query(User).filter(User.email == fin_email).first()
        if not finance:
            print(f"Creating Finance Director: {fin_email}")
            finance = User(
                id="user-finance-real",
                name="Finance Director",
                email=fin_email,
                role=Role.HospitalManager, # Management view
                hashed_password=get_password_hash("FinancePassword123!"),
                credits=1000
            )
            db.add(finance)
        else:
            print(f"Finance Director exists: {fin_email}")
            finance.hashed_password = get_password_hash("FinancePassword123!")

        db.commit()
        print("Seeding completed successfully with ALL Real Users (Inc. Finance & Insurance).")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

from .models import AgentCapability

def seed_agents():
    db: Session = SessionLocal()
    try:
        agents = [
            {
                "id": "agent-doctor-clinical",
                "agent_role": "Doctor",
                "capability_name": "clinical_summary",
                "description": "Generates clinical summaries from case data.",
                "input_schema": {"case_id": "string"},
                "output_schema": {"diagnosisConfidence": "float", "primaryDiagnosis": "string"},
                "is_active": True
            },
            {
                "id": "agent-doctor-treatment",
                "agent_role": "Doctor",
                "capability_name": "treatment_plan",
                "description": "Generates detailed treatment plans.",
                "input_schema": {"case_id": "string"},
                "output_schema": {"plan": "string"},
                "is_active": True
            },
            {
                "id": "agent-nurse-triage",
                "agent_role": "Nurse",
                "capability_name": "triage",
                "description": "Triages cases based on urgency.",
                "input_schema": {"criteria": "string"},
                "output_schema": {"priority": "string"},
                "is_active": True
            },
            {
                "id": "agent-billing-estimate",
                "agent_role": "Billing",
                "capability_name": "generate_estimate",
                "description": "Generates cost estimates for cases.",
                "input_schema": {"case_id": "string"},
                "output_schema": {"total_cost": "float"},
                "is_active": True
            },
            {
                "id": "agent-researcher-augment",
                "agent_role": "Researcher",
                "capability_name": "augment_case",
                "description": "Augments case data with medical knowledge.",
                "input_schema": {"extracted_data": "json"},
                "output_schema": {"suggestions": "list"},
                "is_active": True
            }
        ]
        
        for agent_data in agents:
            existing = db.query(AgentCapability).filter(AgentCapability.id == agent_data["id"]).first()
            if not existing:
                db.add(AgentCapability(**agent_data))
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
        db.close()

if __name__ == "__main__":
    seed_users()
    seed_agents()
