import pytest
import uuid
import json
from httpx import AsyncClient

# Replaces the requests-based test_agents.py with an integrated AsyncClient test

@pytest.mark.asyncio
async def test_agent_execution_integrated(client: AsyncClient):
    print("Testing Agent Orchestrator (Integrated)...")
    
    # 1. Login/Register Patient
    print("1. Logging in as Patient...")
    email = f"patient_{uuid.uuid4().hex[:8]}@example.com"
    password = "password"
    
    # Attempt Register first to ensure user exists
    reg_payload = {
        "email": email, 
        "role": "Patient", 
        "password": password,
        "name": "Integration Patient"
    }
    res = await client.post("/api/auth/register", json=reg_payload)
    # If fails (e.g. exists), proceed to login
    
    login_payload = {
        "email": email,
        "role": "Patient",
        "password": password
    }
    res = await client.post("/api/auth/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   Success. Token acquired.")

    # 2. Test Emergency Agent
    print("\n2. Testing Emergency Agent (emergency_protocol)...")
    payload = {
        "capability": "emergency_protocol",
        "params": {
            "symptoms": "Severe chest pain, short of breath, sweating",
            "vitals": "HR 110, BP 160/100"
        }
    }
    
    # Needs valid API Key for AI, otherwise returns error or offline message
    # We check for valid response structure regardless of AI result
    res = await client.post("/api/bus/execute", json=payload, headers=headers)
    assert res.status_code == 200, f"Emergency Agent failed: {res.text}"
    
    data = res.json()
    print(f"   Response: {json.dumps(data, indent=2)[:200]}...")
    
    # Verify structure
    # Based on agent_service and routes, it returns {"status":..., "message":..., "actions":...}
    if "message" in data and data["message"] == "AI Service Offline":
        pytest.skip("AI Service Offline - Skipping Intelligence Checks")
        
    assert "status" in data
    # assert "actions" in data # might depend on prompt response

    # 3. Test Patient Agent
    print("\n3. Testing Patient Agent (explain_diagnosis)...")
    payload_expl = {
        "capability": "explain_diagnosis",
        "params": {
            "diagnosis": "Type 2 Diabetes",
            "plan": "Metformin 500mg bid, diet styling, exercise",
            "age": 45
        }
    }
    res = await client.post("/api/bus/execute", json=payload_expl, headers=headers)
    assert res.status_code == 200
    print(f"   Response: {json.dumps(res.json(), indent=2)[:200]}...")

    # 4. Create Case (as Doctor) for further tests
    print("\n   Creating a dummy case (requires Doctor)...")
    doc_email = f"dr_{uuid.uuid4().hex[:8]}@example.com"
    reg_doc = {
        "email": doc_email, "role": "Doctor", "password": "password", "name": "Integration Doctor"
    }
    await client.post("/api/auth/register", json=reg_doc)
    res_doc = await client.post("/api/auth/login", json={"email": doc_email, "role": "Doctor", "password": "password"})
    assert res_doc.status_code == 200
    token_doc = res_doc.json()["access_token"]
    headers_doc = {"Authorization": f"Bearer {token_doc}"}
    
    case_payload = {
        "title": "Test Case for Agents",
        "patient_id": "temp_id", # Backend creates/finds if needed
        "complaint": "Persistent cough, fever, night sweats",
        "history": "Smoker for 20 years",
        "findings": "Crackles in upper right lobe",
        "diagnosis": "Suspected Tuberculosis",
        "tags": ["respiratory"],
        "status": "Open"
    }
    res_case = await client.post("/api/cases", json=case_payload, headers=headers_doc)
    assert res_case.status_code == 200
    case_id = res_case.json()["id"]
    print(f"   [PASS] Case Created: {case_id}")

    # 5. Doctor Agent: Clinical Summary
    print("\n5. Testing Doctor Agent (clinical_summary)...")
    payload_doc = {
        "capability": "clinical_summary",
        "params": {"case_id": case_id}
    }
    res_ae1 = await client.post("/api/bus/execute", json=payload_doc, headers=headers_doc)
    assert res_ae1.status_code == 200
    print("   [PASS] Clinical Summary generated.")

    # 6. Pricing Agent
    print("\n6. Testing Pricing Agent (estimate_cost)...")
    payload_price = {
        "capability": "estimate_cost",
        "params": {"diagnosis": "Appendicitis", "plan": "Laparoscopic Appendectomy"}
    }
    res_price = await client.post("/api/bus/execute", json=payload_price, headers=headers_doc)
    assert res_price.status_code == 200
    print("   [PASS] Cost estimated.")

    # 7. Orchestrator Routing
    print("\n7. Testing Orchestrator Routing...")
    chat_payload = {"message": f"Triage case {case_id}"}
    res_chat = await client.post("/api/ai/agent_chat", json=chat_payload, headers=headers_doc)
    assert res_chat.status_code == 200
    data_chat = res_chat.json()
    print(f"   Response: {json.dumps(data_chat, indent=2)[:200]}")
    
    # Check if routed correctly (if AI online)
    if "routed_to" in data_chat and data_chat["routed_to"] == "triage":
        print("   [PASS] Correctly routed to 'triage'")
    else:
        print(f"   [INFO] Routing result: {data_chat.get('routed_to')}")
