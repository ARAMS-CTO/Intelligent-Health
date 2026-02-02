
import pytest
from httpx import AsyncClient
from server.main import app
from server.database import Base, engine, SessionLocal
from server.models import User
# from server.models import Role # This might fail if Role is not in models
from server.schemas import Role 
from server.routes.auth import get_password_hash, create_access_token
import pytest_asyncio

# Use Test DB
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from server.database import get_db

# Use in-memory SQLite for isolation
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session")
def db_engine():
    return test_engine

@pytest.fixture(scope="function")
def db_session():
    # Create tables for each test function (clean slate)
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Drop tables after test to ensure isolation
        Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
async def client(db_session):
    # Override the get_db dependency to use our test session
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    
    from httpx import ASGITransport
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    
    del app.dependency_overrides[get_db]

@pytest.fixture
def auth_token(db_session):
    # Create test user
    email = "test@example.com"
    # Ensure role is committed
    user = db_session.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            id="test-user-id",
            email=email,
            name="Test User", 
            role=Role.Patient,
            hashed_password=get_password_hash("password123"),
            credits=100
        )
        # Add profile to avoid joinedload errors if queried
        from server.models import Patient
        profile = Patient(id="profile-test-user-id", user_id=user.id, name=user.name, identifier="PAT-TEST")
        db_session.add(user)
        db_session.add(profile)
        db_session.commit()
    
    # Generate token
    token = create_access_token({"sub": email, "role": "Patient", "user_id": user.id})
    return token
