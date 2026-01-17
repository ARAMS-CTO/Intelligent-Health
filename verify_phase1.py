from server.database import engine, Base, SessionLocal
from server.models import User, UserCredits, Referral, FamilyGroup
from server.services.integrations.fitbit import FitbitClient
from server.services.integrations.google_health import GoogleHealthClient

print("1. Testing Database Tables Creation...")
try:
    Base.metadata.create_all(bind=engine)
    print("   Tables created successfully.")
except Exception as e:
    print(f"   ERROR creating tables: {e}")
    exit(1)

print("2. Testing Model Instantiation...")
try:
    db = SessionLocal()
    # Mock User
    user = User(id="test_user_phase1", email="test@phase1.com", name="Test User")
    # Mock Credits
    credits = UserCredits(user_id="test_user_phase1", balance=100.0, tier="PRO")
    
    db.merge(user) # use merge to avoid duplicate errors if run multiple times
    db.merge(credits)
    db.commit()
    
    retrieved = db.query(UserCredits).filter_by(user_id="test_user_phase1").first()
    print(f"   Retrieved Credits Balance: {retrieved.balance}")
    assert retrieved.balance == 100.0
    print("   Database write/read successful.")
except Exception as e:
    print(f"   ERROR in DB operations: {e}")
    exit(1)
finally:
    db.close()

print("3. Testing Integration Clients...")
try:
    fitbit = FitbitClient()
    url = fitbit.get_auth_url("test_state")
    print(f"   Fitbit Auth URL: {url}")
    assert "fitbit.com" in url
    
    data = fitbit.fetch_data("token", "2025-01-01")
    fhir = fitbit.normalize_to_fhir(data)
    print(f"   Fitbit FHIR Conversion: {len(fhir)} observations found.")
    assert len(fhir) > 0
    
    google = GoogleHealthClient()
    print("   Integration classes instantiated successfully.")
except Exception as e:
    print(f"   ERROR in Integration Clients: {e}")
    exit(1)

print("\nSUCCESS: Phase 1 Verification Complete.")
