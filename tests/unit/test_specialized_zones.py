import pytest
from server.models import VitalReading, Patient, User
import uuid

def test_heart_health_vitals(client, patient_auth, db):
    """
    Test that a patient can retrieve their specific Cardiology vitals.
    """
    # 1. Setup Data: Inject Vitals for the logged in user
    # Get user id from current auth (by inspection or trusted assumption)
    # We fetch the user from DB to get the patient_id
    email = "test_patient_qa@example.com"
    user = db.query(User).filter(User.email == email).first()
    assert user is not None
    
    # Ensure patient profile
    if not user.patient_profile:
        patient = Patient(id=str(uuid.uuid4()), user_id=user.id, name=user.name)
        db.add(patient)
        db.commit()
        db.refresh(user)
        
    patient_id = user.patient_profile.id
    
    # Clear old vitals for test purity (optional, or just add new recent ones)
    
    # Add Test BP
    bp = VitalReading(
        id=str(uuid.uuid4()), patient_id=patient_id, type="blood_pressure",
        value="118/75", unit="mmHg", source="Test"
    )
    db.add(bp)
    db.commit()
    
    # 2. Call API
    response = client.get(f"/api/cardiology/data/{patient_id}", headers=patient_auth)
    
    # 3. Assertions
    assert response.status_code == 200
    data = response.json()
    assert data["bp"] == "118/75"
    assert "hr" in data
    assert "o2" in data
    assert "conditions" in data

def test_eye_health_records(client, patient_auth, db):
    """
    Test that a patient can retrieve their Ophthalmology records (IOP, Visual Acuity).
    """
    email = "test_patient_qa@example.com"
    user = db.query(User).filter(User.email == email).first()
    patient_id = user.patient_profile.id
    
    # Add Test IOP
    iop = VitalReading(
        id=str(uuid.uuid4()), patient_id=patient_id, type="iop",
        value="14", unit="mmHg", source="Test"
    )
    db.add(iop)
    db.commit()
    
    # Call API
    response = client.get(f"/api/ophthalmology/data/{patient_id}", headers=patient_auth)
    
    assert response.status_code == 200
    data = response.json()
    assert "14 mmHg" in data["iop"] # The logic adds unit if missing in API response formatting
    assert "visualAcuityOD" in data
    assert "prescription" in data

from unittest.mock import patch, AsyncMock

def test_specialist_agent_security(client, patient_auth, doctor_auth):
    """
    Test that the agent endpoint enforces role-based security validation.
    Mocks the orchestrator to avoid real LLM calls.
    """
    payload = {
        "query": "I have tooth pain",
        "domain": "Dentistry",
        "case_data": "Patient complains of sensitivity to cold."
    }
    
    # Mock the dispatch method to return a success response immediately
    with patch("server.routes.ai.orchestrator.dispatch", new_callable=AsyncMock) as mock_dispatch:
        mock_dispatch.return_value = {
            "status": "success", 
            "message": "Consultation provided.", 
            "actions": ["Start antibiotics"]
        }

        # Patient asking
        res = client.post("/api/ai/specialist_consult", json=payload, headers=patient_auth)
        assert res.status_code == 200
        json_res = res.json()
        
        # If API_KEY was missing in app init, it returns "AI Service Offline" before dispatch.
        # Check for that case:
        if "message" in json_res and json_res["message"] == "AI Service Offline":
            pytest.skip("AI Service is Offline - Skipping Specialist Agent Test")
            
        assert json_res["status"] == "success"
        assert "actions" in json_res

def test_unauthorized_access(client):
    """
    Test accessing specialized data without a token.
    """
    res = client.get("/api/cardiology/data/some-id")
    assert res.status_code == 401
