import sys
import os

# We need to run this as a module: python -m server.seed_final
# standard imports
from .database import SessionLocal, engine
from .models import User, DoctorProfile, Base
from passlib.context import CryptContext
import uuid

# Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_marc():
    print("Starting Seed...")
    db = SessionLocal()
    try:
        email = "marc.tournon@happinessclinic.ae"
        password = "Dentist2025*"
        hashed = pwd_context.hash(password)
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Creating User: {email}")
            user = User(
                id=str(uuid.uuid4()),
                name="Dr. Marc Tournon",
                email=email,
                role="Dentist",
                level=5,
                credits=500,
                hashed_password=hashed,
                data_sharing_consent=True,
                gdpr_consent=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            print(f"Updating User password and role for: {email}")
            user.hashed_password = hashed
            user.role = "Dentist"
            db.commit()

        # Profile
        profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
        if not profile:
            print("Creating Doctor Profile")
            profile = DoctorProfile(
                id=str(uuid.uuid4()),
                user_id=user.id
            )
            db.add(profile)
        
        # Update Profile Details
        profile.specialty = "Dentist"
        profile.sub_specialties = ["Implantologist", "General Dentistry", "Cosmetic Dentistry"]
        profile.years_of_experience = 15
        profile.bio = (
            "Dr. Marc Tournon serves as a General Dentist at Happiness Clinic LLC. "
            "He holds a State Diploma of Doctor in Dental Surgery (DDS) and an MD in Implantology. "
            "He specializes in general dentistry, implantology, and teeth cleaning. "
            "Dr. Tournon speaks both English and French."
        )
        profile.clinic_name = "Happiness Clinic LLC"
        profile.clinic_address = "865A, Jumeirah Street, Umm Suqeim 3, Dubai - UAE"
        profile.website = "http://www.happinessclinic.ae/"
        profile.opening_hours = "Mon-Sat: 08:00 - 20:00, Sun: Closed"
        profile.clinic_logo_url = "/artifacts/happiness_clinic_logo_1769440615548.png"
        profile.profile_picture_url = "https://happinessclinic.ae/wp-content/uploads/2020/01/Dr-Marc-Tournon.jpg"
        
        # Prices
        profile.service_prices = {
            "whitening": "AED 1,800",
            "veneers": "AED 2,800",
            "implant": "AED 7,500",
            "cleaning": "AED 500",
            "checkup": "AED 400"
        }

        db.commit()
        print("Marc Tournon Seeded Successfully!")
        
    except Exception as e:
        print(f"Error seeding: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_marc()
