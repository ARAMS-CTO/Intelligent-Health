import pytest
from server.models import Case, User
from server.schemas import Role
import uuid

def test_create_case_patient(client, patient_auth, db):
    # 'auto' is not supported by backend yet, we must pass the patient_id
    # Since patient_auth creates a patient, let's fetch it
    from server.models import User
    # we need the user token decoding or just query the test user
    u = db.query(User).filter(User.email == "test_patient_qa@example.com").first()
    p_id = u.patient_profile.id
    
    payload = {
        "title": "My Headache",
        "complaint": "Severe migraine",
        "diagnosis": "Pending",
        "status": "Open",
        "patient_id": p_id, 
        "tags": ["pain"]
    }
    res = client.post("/api/cases", json=payload, headers=patient_auth)
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "My Headache"
    assert data["creatorId"] is not None
    
    # Verify DB
    case = db.query(Case).filter(Case.id == data["id"]).first()
    assert case is not None
    assert case.complaint == "Severe migraine"

def test_create_case_doctor_for_patient(client, doctor_auth, db):
    # Create a patient first
    patient_user = User(id="p-123", email="pat@test.com", role=Role.Patient, name="Pat", is_active=True)
    db.add(patient_user)
    db.commit()
    
    payload = {
        "title": "Patient X Checkup",
        "complaint": "Fever",
        "patient_id": patient_user.id,
        "status": "In Progress"
    }
    
    res = client.post("/api/cases", json=payload, headers=doctor_auth)
    assert res.status_code == 200
    data = res.json()
    
    # Verify creator is doctor, patient is linked
    # DB models use snake_case, but API response uses camelCase
    case = db.query(Case).filter(Case.id == data["id"]).first()
    assert case.patient_id == patient_user.id
    assert case.creator_id is not None

def test_get_cases_permissions(client, patient_auth, doctor_auth, db):
    # Fetch Patient ID
    from server.models import User
    u = db.query(User).filter(User.email == "test_patient_qa@example.com").first()
    p_id = u.patient_profile.id

    # Patient creates case A
    res1 = client.post("/api/cases", json={"title": "Patient Case", "complaint": "A", "status": "Open", "patient_id": p_id}, headers=patient_auth)
    # If 422/400 happens here, debugging is needed.
    assert res1.status_code == 200
    case_a_id = res1.json()["id"]
    
    # Doctor creates case B (needs a patient id, create dummy)
    p2 = User(id="p-temp", email="p2@test.com", role=Role.Patient, name="P2")
    db.add(p2)
    db.commit()
    res2 = client.post("/api/cases", json={"title": "Doctor Case", "complaint": "B", "status": "Open", "patient_id": "p-temp"}, headers=doctor_auth)
    case_b_id = res2.json()["id"]
    
    # Patient should see Case A, NOT Case B (unless assigned)
    res_p = client.get("/api/cases", headers=patient_auth)
    ids_p = [c["id"] for c in res_p.json()]
    assert case_a_id in ids_p
    assert case_b_id not in ids_p
    
    # Doctor should see Case B. 
    # (Depending on logic, Doctors might see ALL cases or just theirs. Usually just theirs or assigned.)
    res_d = client.get("/api/cases", headers=doctor_auth)
    ids_d = [c["id"] for c in res_d.json()]
    assert case_b_id in ids_d

def test_update_case_status(client, doctor_auth, db):
    # Setup Patient
    from server.models import User
    p = User(id="p-stat", email="pstat@test.com", role=Role.Patient, name="P Stat")
    db.add(p)
    db.commit()

    res = client.post("/api/cases", json={"title": "Status Test", "complaint": "Valid complaint", "status": "Open", "patient_id": "p-stat"}, headers=doctor_auth)
    case_id = res.json()["id"]
    
    update_payload = {"status": "Closed", "diagnosis": "Resolved"}
    res_up = client.put(f"/api/cases/{case_id}", json=update_payload, headers=doctor_auth)
    assert res_up.status_code == 200
    assert res_up.json()["status"] == "Closed"
    
    # Fetch to verify
    case = db.query(Case).filter(Case.id == case_id).first()
    assert case.status == "Closed"
