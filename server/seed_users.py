import sys
import os
from sqlalchemy.orm import Session, sessionmaker
from passlib.context import CryptContext

# Add the project root to sys.path to allow absolute imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from server.database import SessionLocal, engine
from server.models import User, DoctorProfile, Base, SystemConfig
from sqlalchemy import create_engine

# Override engine for remote seeding
DB_URL = "postgresql://postgres:YourStrongPassword123!@34.55.103.0/intelligent_health"
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def seed_users():
    db: Session = SessionLocal()
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    users_to_create = [
        {
            "id": "user-aram-admin",
            "name": "Aram Services Admin",
            "email": "aram.services.pro@gmail.com",
            "role": "Admin",
            "password": "AdminPassword123!"
        },
        {
            "id": "user-aram-patient",
            "name": "Aram Ghannad",
            "email": "aram.ghannad@gmail.com",
            "role": "Patient",
            "password": "PatientPassword123!"
        },
        {
            "id": "user-sonati-doctor",
            "name": "Mohammad Sonati",
            "email": "m.sonati@intelligent-health.com",
            "role": "Doctor",
            "password": "DoctorPassword123!",
            "specialty": "Cardiology"
        },
        {
            "id": "user-claire-nurse",
            "name": "Claire Redfield",
            "email": "c.redfield@intelligent-health.com",
            "role": "Nurse",
            "password": "NursePassword123!"
        }
    ]
    
    for u_data in users_to_create:
        # Check if user already exists
        existing = db.query(User).filter(User.email == u_data["email"]).first()
        if existing:
            print(f"User {u_data['email']} already exists. Skipping.")
            continue
        
        new_user = User(
            id=u_data["id"],
            name=u_data["name"],
            email=u_data["email"],
            role=u_data["role"],
            level=1,
            credits=100,
            hashed_password=get_password_hash(u_data["password"])
        )
        db.add(new_user)
        db.flush()
        
        if u_data["role"] == "Doctor":
            profile = DoctorProfile(
                id=f"profile-{new_user.id}",
                user_id=new_user.id,
                specialty=u_data.get("specialty", "General Practice"),
                years_of_experience=10,
                bio="Experienced clinical professional.",
                certifications=[],
                profile_picture_url=""
            )
            db.add(profile)
            
        print(f"Created user: {u_data['email']} with role {u_data['role']}")
        
    # Seed System Config
    if not db.query(SystemConfig).filter(SystemConfig.key == "features").first():
        config = SystemConfig(
            key="features",
            value={
                "medLM": True,
                "voiceAssistant": True,
                "ragKnowledge": True,
                "autoTriage": True
            }
        )
        db.add(config)
        print("Created default system configuration.")

    db.commit()
    db.close()
    print("Seeding completed.")

if __name__ == "__main__":
    seed_users()
