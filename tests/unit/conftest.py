import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from server.database import Base, get_db
from server.main import app

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """
    Creates a fresh database for each test.
    """
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """
    Test client that uses the override_get_db dependency.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass # Session is closed in fixture
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def db(db_session):
    return db_session

@pytest.fixture(scope="function")
def patient_auth(client, db_session):
    from server.models import User, Patient
    from server.schemas import Role
    from server.routes.auth import get_password_hash, create_access_token
    import uuid
    
    email = "test_patient_qa@example.com"
    user = db_session.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            name="QA Patient",
            role=Role.Patient,
            hashed_password=get_password_hash("password123"),
            credits=100.0,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
    
    # Ensure profile
    if not user.patient_profile:
        patient = Patient(id=str(uuid.uuid4()), user_id=user.id, name=user.name)
        db_session.add(patient)
        db_session.commit()
        
    token = create_access_token({"sub": email, "role": "Patient", "user_id": user.id})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def doctor_auth(client, db_session):
    from server.models import User
    from server.schemas import Role
    from server.routes.auth import get_password_hash, create_access_token
    import uuid
    
    email = "test_doctor_qa@example.com"
    user = db_session.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            name="QA Doctor",
            role=Role.Doctor,
            hashed_password=get_password_hash("password123"),
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        
    token = create_access_token({"sub": email, "role": "Doctor", "user_id": user.id})
    return {"Authorization": f"Bearer {token}"}
