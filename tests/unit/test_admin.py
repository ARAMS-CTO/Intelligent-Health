import pytest
from server.models import User, Transaction, SystemConfig
from server.schemas import Role
import uuid
import datetime

@pytest.fixture
def admin_auth(client, db):
    from server.routes.auth import create_access_token
    admin = User(id=str(uuid.uuid4()), email="admin@test.com", role=Role.Admin, name="Admin User", is_active=True)
    db.add(admin)
    db.commit()
    token = create_access_token({"sub": admin.email, "role": "Admin", "user_id": admin.id})
    return {"Authorization": f"Bearer {token}"}

def test_get_financial_overview(client, admin_auth, db):
    # Seed transactions
    t1 = Transaction(id="t1", user_id="u1", amount=100.0, status="Paid", date=datetime.datetime.utcnow())
    t2 = Transaction(id="t2", user_id="u2", amount=50.0, status="Paid", date=datetime.datetime.utcnow())
    db.add(t1)
    db.add(t2)
    db.commit()
    
    res = client.get("/api/admin/financials/overview", headers=admin_auth)
    
    if res.status_code == 404:
        pytest.fail("Endpoint /api/admin/financials/overview missing")
        
    assert res.status_code == 200
    data = res.json()
    assert data["total_revenue"] == 150.0
    assert "monthly_breakdown" in data

def test_ai_model_config(client, admin_auth, db):
    payload = {
        "default_model": "gemini-1.5-pro",
        "fallback_model": "gemini-1.5-flash",
        "vision_model": "gemini-pro-vision"
    }
    
    res = client.post("/api/admin/config/ai", json=payload, headers=admin_auth)
    
    if res.status_code == 404:
         pytest.fail("Endpoint /api/admin/config/ai missing")
         
    assert res.status_code == 200
    
    # Verify DB
    config = db.query(SystemConfig).filter(SystemConfig.key == "ai_settings").first()
    assert config is not None
    assert config.value["default_model"] == "gemini-1.5-pro"

def test_user_management(client, admin_auth, db):
    # Create target user
    user = User(id="u-ban", email="bad@guy.com", role=Role.Patient, is_active=True)
    db.add(user)
    db.commit()
    
    # Ban
    res = client.post(f"/api/users/{user.id}/ban", headers=admin_auth)
    assert res.status_code == 200
    
    # Verify
    db.refresh(user)
    assert user.is_active is False
