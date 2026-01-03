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
        # Doctor
        doctor_email = "m.sonati@intelligent-health.com"
        doctor = db.query(User).filter(User.email == doctor_email).first()
        if not doctor:
            print(f"Creating Doctor: {doctor_email}")
            doctor = User(
                id="user-doctor-001",
                name="Dr. Mario Sonati",
                email=doctor_email,
                role=Role.Doctor,
                hashed_password=get_password_hash("password"),
                credits=100
            )
            db.add(doctor)
            db.flush()
            
            profile = DoctorProfile(
                id="profile-doctor-001",
                user_id=doctor.id,
                specialty="Cardiology",
                years_of_experience=15,
                bio="Senior Cardiologist with focus on AI diagnostics."
            )
            db.add(profile)
        else:
            print(f"Doctor exists: {doctor_email}")
            # Ensure password is verified (resetting it just in case)
            doctor.hashed_password = get_password_hash("password")

        # Patient
        patient_email = "a.ghannad@intelligent-health.com"
        patient = db.query(User).filter(User.email == patient_email).first()
        if not patient:
            print(f"Creating Patient: {patient_email}")
            patient = User(
                id="user-patient-001",
                name="Aram Ghannad",
                email=patient_email,
                role=Role.Patient,
                hashed_password=get_password_hash("password"),
                credits=50
            )
            db.add(patient)
            db.flush()
            
            p_profile = Patient(
                 id="profile-patient-001",
                 user_id=patient.id,
                 name="Aram Ghannad",
                 identifier="MRN-2025-001",
                 dob="1985-05-20",
                 blood_type="O+",
                 contact_info={"phone": "+97150000000", "address": "Dubai, UAE"},
                 emergency_contact={"name": "Sarah", "phone": "+97150111111"},
                 allergies=["Penicillin"],
                 medications=[],
                 baseline_illnesses=["Hypertension"]
            )
            db.add(p_profile)
        else:
            print(f"Patient exists: {patient_email}")
            patient.hashed_password = get_password_hash("password")

        # Admin
        admin_email = "admin@intelligent-health.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            print(f"Creating Admin: {admin_email}")
            admin = User(
                id="user-admin-001",
                name="System Admin",
                email=admin_email,
                role=Role.Admin,
                hashed_password=get_password_hash("password"),
                credits=9999
            )
            db.add(admin)
        else:
             print(f"Admin exists: {admin_email}")
             admin.hashed_password = get_password_hash("password")

        # Pharmacist
        pharm_email = "mina.pharmacist@intelligent-health.com"
        pharmacist = db.query(User).filter(User.email == pharm_email).first()
        if not pharmacist:
            print(f"Creating Pharmacist: {pharm_email}")
            pharmacist = User(
                id="user-pharm-001",
                name="Mina Pharmacist",
                email=pharm_email,
                role=Role.Pharmacist,
                hashed_password=get_password_hash("password"),
                credits=100
            )
            db.add(pharmacist)
        else:
            print(f"Pharmacist exists: {pharm_email}")
            pharmacist.hashed_password = get_password_hash("password")

        # Billing Officer
        bill_email = "bill.officer@intelligent-health.com"
        billing_officer = db.query(User).filter(User.email == bill_email).first()
        if not billing_officer:
            print(f"Creating Billing Officer: {bill_email}")
            billing_officer = User(
                id="user-bill-001",
                name="Bill Officer",
                email=bill_email,
                role=Role.BillingOfficer,
                hashed_password=get_password_hash("password"),
                credits=100
            )
            db.add(billing_officer)
        else:
            print(f"Billing Officer exists: {bill_email}")
            billing_officer.hashed_password = get_password_hash("password")

        db.commit()
        print("Seeding completed successfully.")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
