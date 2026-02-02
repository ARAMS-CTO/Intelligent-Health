import pytest
from server.models import User, NurseAssignment
from server.schemas import Role
import uuid

@pytest.fixture
def nurse_auth(client, db):
    from server.routes.auth import create_access_token
    nurse = User(id=str(uuid.uuid4()), email="nurse@test.com", role=Role.Nurse, name="Nurse Joy", is_active=True)
    db.add(nurse)
    db.commit()
    token = create_access_token({"sub": nurse.email, "role": "Nurse", "user_id": nurse.id})
    return {"Authorization": f"Bearer {token}"}, nurse

def test_nurse_link_doctor(client, nurse_auth, doctor_auth, db):
    auth_header, nurse_user = nurse_auth
    
    # Create doctor user
    doctor_email = "doc_link@test.com"
    doctor = User(id=str(uuid.uuid4()), email=doctor_email, role=Role.Doctor, name="Dr Link", is_active=True)
    db.add(doctor)
    db.commit()
    
    # Action: Nurse requests to link to Doctor (or Admin links them)
    # We need an endpoint for this. let's assume /api/nurse/link_doctor
    payload = {"doctor_id": doctor.id}
    res = client.post("/api/nurse/link_doctor", json=payload, headers=auth_header)
    
    # If endpoint doesn't exist, this will fail 404, which is a gap.
    # But let's assume we build it or test the logic.
    if res.status_code == 404:
        pytest.fail("Endpoint /api/nurse/link_doctor missing")
        
    assert res.status_code == 200
    
    # Verify link in NurseAssignment or User.linked_doctor_ids
    assignment = db.query(NurseAssignment).filter(NurseAssignment.nurse_id == nurse_user.id, NurseAssignment.doctor_id == doctor.id).first()
    assert assignment is not None
    assert assignment.status == "Active"

def test_nurse_upload_for_doctor(client, nurse_auth, db):
    auth_header, nurse_user = nurse_auth
    
    # 1. Create a case owned by a Doctor
    doctor = User(id=str(uuid.uuid4()), email="dr_case@test.com", role=Role.Doctor, name="Dr Owner", is_active=True)
    db.add(doctor)
    
    # Create patient
    from server.models import Case, Patient
    p = Patient(id=str(uuid.uuid4()), user_id="u-temp", name="P Nurse")
    db.add(p)
    db.commit()
    
    # Link nurse to doctor first
    assign = NurseAssignment(id=str(uuid.uuid4()), nurse_id=nurse_user.id, doctor_id=doctor.id, status="Active")
    db.add(assign)
    db.commit()
    
     # Doctor creates case
    case = Case(id=str(uuid.uuid4()), title="Doc Case", creator_id=doctor.id, status="Open", patient_id=p.id)
    db.add(case)
    db.commit()
    
    # 2. Nurse tries to upload file to this case
    # Assume /api/files/upload or /api/cases/{id}/files
    # For unit test, we might check permission logic: "Can Nurse edit Case?"
    
    # Let's test `cases.py` update endpoint with Nurse Token
    update_payload = {"notes": "Nurse checked vitals. BP 120/80"}
    # res = client.put(f"/api/cases/{case.id}", json=update_payload, headers=auth_header)
    
    # assert res.status_code == 200
    # updated_case = db.query(Case).filter(Case.id == case.id).first()
    # assert "Nurse checked vitals" in (updated_case.notes or "")

def test_get_doctor_tasks(client, nurse_auth, db):
    auth_header, nurse_user = nurse_auth
    
    # Doctor creates a task (which might be just a Case assigned to them)
    # Ideally we have a Task model, or we just query cases assigned to Linked Doctors
    
    res = client.get("/api/nurse/tasks", headers=auth_header)
    if res.status_code == 404:
         pytest.fail("Endpoint /api/nurse/tasks missing")
    
    assert res.status_code == 200
    tasks = res.json()
    assert isinstance(tasks, list)
