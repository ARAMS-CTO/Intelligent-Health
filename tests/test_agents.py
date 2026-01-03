import requests
import json
import sys
import uuid

BASE_URL = "http://localhost:8000/api"

def test_agent_execution():
    print("Testing Agent Orchestrator...")
    
    # 1. Login to get token (Patient)
    print("1. Logging in as Patient...")
    email = f"patient_{uuid.uuid4().hex[:8]}@example.com"
    login_payload = {
        "email": email,
        "role": "Patient",
        "password": "password"
    }
    
    try:
        res = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
        if res.status_code != 200:
            # Try registering if login fails
            print("   Login failed, trying registration...")
            reg_payload = {
                "email": email, 
                "role": "Patient", 
                "password": "password",
                "name": "Test Patient"
            }
            res = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
            
        if res.status_code != 200:
            print(f"FAILED: Could not login or register. {res.text}")
            return

        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("   Success. Token acquired.")
    except Exception as e:
        print(f"FAILED: Connection failure. {e}")
        return

    # 2. Test Emergency Agent
    print("\n2. Testing Emergency Agent (emergency_protocol)...")
    payload = {
        "capability": "emergency_protocol",
        "params": {
            "symptoms": "Severe chest pain, short of breath, sweating",
            "vitals": "HR 110, BP 160/100"
        }
    }
    
    try:
        res = requests.post(f"{BASE_URL}/bus/execute", json=payload, headers=headers)
        if res.status_code == 200:
            print("   Response:", json.dumps(res.json(), indent=2)[:200] + "...")
            print("   [PASS] Emergency Agent responded.")
        else:
            print(f"   [FAIL] Status {res.status_code}: {res.text}")
    except Exception as e:
        print(f"   [FAIL] Error: {e}")

    # 3. Test Patient Agent
    print("\n3. Testing Patient Agent (explain_diagnosis)...")
    payload = {
        "capability": "explain_diagnosis",
        "params": {
            "diagnosis": "Type 2 Diabetes",
            "plan": "Metformin 500mg bid, diet styling, exercise",
            "age": 45
        }
    }
    
    try:
        res = requests.post(f"{BASE_URL}/bus/execute", json=payload, headers=headers)
        if res.status_code == 200:
            print("   Response:", json.dumps(res.json(), indent=2)[:200] + "...")
            print("   [PASS] Patient Agent responded.")
        else:
            print(f"   [FAIL] Status {res.status_code}: {res.text}")
    except Exception as e:
        print(f"   [FAIL] Error: {e}")

    # Create a Case for Doctor Agent interactions
    print("\n   Creating a dummy case...")
    case_payload = {
        "title": "Test Case for Agents",
        "creator_id": "temp_id_will_be_replaced",
        "patient_id": "temp_id",
        "complaint": "Persistent cough, fever, night sweats",
        "history": "Smoker for 20 years",
        "findings": "Crackles in upper right lobe",
        "diagnosis": "Suspected Tuberculosis",
        "tags": ["respiratory"],
        "status": "Open"
    }
    
    # We need a creator ID. The logged in user is Patient. Usually Doctors create cases.
    # But for testing, let's see if Patient has permissions or if we need a Doctor login.
    # The `CaseCreate` endpoint might require Doctor role?
    # Let's try registering a Doctor if we want to be proper, OR
    # Just generic user. `server/routes/cases.py` usually enforces role?
    # Let's try creating as the current logged in user (Patient).
    # If permission fails, we'll know.
    
    try:
        # Create user (Creator)
        # Actually the login above is Patient. Patients might not be allowed to create cases in this system.
        # Let's quickly register a doctor user.
        doc_email = f"dr_{uuid.uuid4().hex[:8]}@example.com"
        reg_doc = {
            "email": doc_email, "role": "Doctor", "password": "password", "name": "Test Doctor"
        }
        requests.post(f"{BASE_URL}/auth/register", json=reg_doc) # might fail if exists
        res_doc = requests.post(f"{BASE_URL}/auth/login", json={"email": doc_email, "role": "Doctor", "password": "password"})
        token_doc = res_doc.json()["access_token"]
        headers_doc = {"Authorization": f"Bearer {token_doc}"}
        
        # Create Case
        res_case = requests.post(f"{BASE_URL}/cases", json=case_payload, headers=headers_doc)
        if res_case.status_code == 200:
            case_data = res_case.json()
            case_id = case_data["id"]
            print(f"   [PASS] Case Created: {case_id}")
            
            # 4. Doctor Agent: Clinical Summary
            print("\n4. Testing Doctor Agent (clinical_summary)...")
            payload_doc1 = {
                "capability": "clinical_summary",
                "params": {"case_id": case_id}
            }
            res_ae1 = requests.post(f"{BASE_URL}/bus/execute", json=payload_doc1, headers=headers_doc)
            if res_ae1.status_code == 200:
                 print("   Response:", json.dumps(res_ae1.json(), indent=2)[:300] + "...")
                 print("   [PASS] Clinical Summary generated.")
            else:
                 print(f"   [FAIL] {res_ae1.status_code}: {res_ae1.text}")

            # 5. Doctor Agent: Treatment Plan
            print("\n5. Testing Doctor Agent (treatment_plan)...")
            payload_doc2 = {
                "capability": "treatment_plan",
                "params": {"case_id": case_id}
            }
            res_ae2 = requests.post(f"{BASE_URL}/bus/execute", json=payload_doc2, headers=headers_doc)
            if res_ae2.status_code == 200:
                 print("   Response:", json.dumps(res_ae2.json(), indent=2)[:300] + "...")
                 print("   [PASS] Treatment Plan generated.")
            else:
                 print(f"   [FAIL] {res_ae2.status_code}: {res_ae2.text}")
                 
            # 6. Doctor Agent: Augment Case
            print("\n6. Testing Doctor Agent (augment_case)...")
            payload_doc3 = {
                "capability": "augment_case",
                "params": {
                    "extracted_data": {"complaint": "Cough", "findings": "Crackles"},
                    "baseline_illnesses": ["Asthma"]
                }
            }
            res_ae3 = requests.post(f"{BASE_URL}/bus/execute", json=payload_doc3, headers=headers_doc)
            if res_ae3.status_code == 200:
                 print("   Response:", json.dumps(res_ae3.json(), indent=2)[:300] + "...")
                 print("   [PASS] Case Augmented.")
            else:
                 print(f"   [FAIL] {res_ae3.status_code}: {res_ae3.text}")

            # 7. Insurance Agent: Check Eligibility
            print("\n7. Testing Insurance Agent (check_eligibility)...")
            payload_ins = {
                "capability": "check_eligibility",
                "params": {"diagnosis": "Fractured wrist", "plan": "Casting and X-Ray"}
            }
            res_ins = requests.post(f"{BASE_URL}/bus/execute", json=payload_ins, headers=headers_doc)
            if res_ins.status_code == 200:
                 print("   Response:", json.dumps(res_ins.json(), indent=2)[:300] + "...")
                 print("   [PASS] Eligibility checked.")
            else:
                 print(f"   [FAIL] {res_ins.status_code}: {res_ins.text}")

            # 8. Pricing Agent: Estimate Cost
            print("\n8. Testing Pricing Agent (estimate_cost)...")
            payload_price = {
                "capability": "estimate_cost",
                "params": {"diagnosis": "Appendicitis", "plan": "Laparoscopic Appendectomy"}
            }
            res_price = requests.post(f"{BASE_URL}/bus/execute", json=payload_price, headers=headers_doc)
            if res_price.status_code == 200:
                 print("   Response:", json.dumps(res_price.json(), indent=2)[:300] + "...")
                 print("   [PASS] Cost estimated.")
            else:
                 print(f"   [FAIL] {res_price.status_code}: {res_price.text}")

            # 9. Psychology Agent: Coping Strategies
            print("\n9. Testing Psychology Agent (coping_strategies)...")
            payload_psych = {
                "capability": "coping_strategies",
                "params": {"diagnosis": "Chronic Anxiety"}
            }
            res_psych = requests.post(f"{BASE_URL}/bus/execute", json=payload_psych, headers=headers_doc)
            if res_psych.status_code == 200:
                 print("   Response:", json.dumps(res_psych.json(), indent=2)[:300] + "...")
                 print("   [PASS] Coping strategies generated.")
            else:
                 print(f"   [FAIL] {res_psych.status_code}: {res_psych.text}")

            
            # --- Seed Data for Lab/Radiology Agents ---
            print("\n   Seeding data for Lab/Radiology...")
            
            # A. Upload Image
            # 1. Create dummy bytes
            with open("dummy_xray.jpg", "wb") as f:
                f.write(b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00\x48\x00\x48\x00\x00\xFF\xDB\x00\x43\x00\xFF\xC0\x00\x11\x08\x00\x10\x00\x10\x03\x01\x22\x00\x02\x11\x01\x03\x11\x01\xFF\xC4\x00\x1F\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\xFF\xDA\x00\x0C\x03\x01\x00\x02\x11\x03\x11\x00\x3F\x00\xBF\xFD\xFC")
            
            # 2. Upload to file server
            try:
                files_upload = {"file": ("dummy_xray.jpg", open("dummy_xray.jpg", "rb"), "image/jpeg")}
                data_upload = {"case_id": case_id}
                res_u = requests.post(f"{BASE_URL}/files/upload", files=files_upload, data=data_upload) # headers usually not needed for public upload or if using token pass it
                
                if res_u.status_code == 200:
                    file_info = res_u.json()
                    file_url = file_info["url"]
                    print(f"   [PASS] File uploaded to {file_url}")
                    
                    # 3. Manually link to case to be sure (avoid racing bg task)
                    link_payload = {
                        "id": str(uuid.uuid4()),
                        "name": "dummy_xray.jpg",
                        "type": "image/jpeg",
                        "url": file_url
                    }
                    requests.post(f"{BASE_URL}/cases/{case_id}/files", json=link_payload, headers=headers_doc)
                else:
                    print(f"   [WARN] Upload failed: {res_u.status_code} {res_u.text}")
            except Exception as e:
                print(f"   [WARN] Upload error: {e}")

            # 10. Radiology Agent: Analyze Image
            print("\n10. Testing Radiology Agent (analyze_image)...")
            payload_rad = {
                "capability": "analyze_image",
                "params": {"case_id": case_id} 
            }
            res_rad = requests.post(f"{BASE_URL}/bus/execute", json=payload_rad, headers=headers_doc)
            if res_rad.status_code == 200:
                 print("   Response:", json.dumps(res_rad.json(), indent=2)[:300] + "...")
                 print("   [PASS] Radiology analysis executed.")
            else:
                 print(f"   [FAIL] {res_rad.status_code}: {res_rad.text}")

            # B. Seed Lab Results
            lab_payload = {
                "test": "Hemoglobin A1c",
                "value": 8.5,
                "unit": "%",
                "reference_range": "< 5.7",
                "interpretation": "High"
            }
            requests.post(f"{BASE_URL}/cases/{case_id}/results", json=lab_payload, headers=headers_doc)

            # 11. Lab Agent: Analyze Labs
            print("\n11. Testing Laboratory Agent (analyze_labs)...")
            payload_lab = {
                "capability": "analyze_labs",
                "params": {"case_id": case_id}
            }
            res_lab = requests.post(f"{BASE_URL}/bus/execute", json=payload_lab, headers=headers_doc)
            if res_lab.status_code == 200:
                 print("   Response:", json.dumps(res_lab.json(), indent=2)[:300] + "...")
                 print("   [PASS] Lab analysis executed.")
            else:
                 print(f"   [FAIL] {res_lab.status_code}: {res_lab.text}")
            
            # 12. Rehab Agent: Recovery Plan
            print("\n12. Testing Rehab Specialist (generate_rehab_plan)...")
            payload_rehab = {
                "capability": "generate_rehab_plan",
                "params": {
                    "condition": "ACL Reconstruction",
                    "age": 25, 
                    "severity": "Post-Op"
                }
            }
            res_rehab = requests.post(f"{BASE_URL}/bus/execute", json=payload_rehab, headers=headers_doc)
            if res_rehab.status_code == 200:
                 resp_json = res_rehab.json()
                 print("   Response:", json.dumps(resp_json, indent=2)[:300] + "...")
                 if "timeline" in resp_json:
                     print("   [PASS] Rehab plan generated with timeline.")
                 else:
                     print("   [WARN] Rehab plan missing timeline.")
            else:
                 print(f"   [FAIL] {res_rehab.status_code}: {res_rehab.text}")

            # 13. Orchestrator Routing: /ai/agent_chat
            print("\n13. Testing Orchestrator Routing (Agent Chat)...")
            chat_payload = {"message": f"Triage case {case_id}"}
            res_chat = requests.post(f"{BASE_URL}/ai/agent_chat", json=chat_payload, headers=headers_doc)
            
            if res_chat.status_code == 200:
                print("   [PASS] Endpoint reached.")
                r_chat = res_chat.json()
                print("   Response:", json.dumps(r_chat, indent=2)[:300])
                
                if r_chat.get("routed_to") == "triage":
                    print("   [PASS] Correctly routed to 'triage' task.")
                else:
                    print(f"   [FAIL] Routing mismatch. Expected 'triage', got '{r_chat.get('routed_to')}'")
            else:
                print(f"   [FAIL] {res_chat.status_code}: {res_chat.text}")
                
            # 14. Orchestrator Fallback: General Chat
            print("\n14. Testing Orchestrator Fallback...")
            fallback_payload = {"message": "Tell me a joke about doctors."}
            res_fallback = requests.post(f"{BASE_URL}/ai/agent_chat", json=fallback_payload, headers=headers_doc)
            
            if res_fallback.status_code == 200:
                r_fallback = res_fallback.json()
                # Expecting standard chat response structure or the wrapper?
                # The code wraps fallback result too? No, it returns await chat() which returns {"response": "..."} 
                # OR it wraps it? Logic says `return await chat(...)`
                if "response" in r_fallback and "routed_to" not in r_fallback:
                     print("   [PASS] Fallback to general chat successful (no 'routed_to' field).")
                     print(f"   Reply: {r_fallback['response'][:50]}...")
                elif r_fallback.get("routed_to") is None:
                     print("   [PASS] Handled as chat.")
                else:
                     print(f"   [WARN] Strange behavior: {r_fallback}")
            else:
                print(f"   [FAIL] {res_fallback.status_code}: {res_fallback.text}")

            # 14b. Move Estimate to Pending
            print("   Creating persisted estimate via Billing API...")
            res_bill = requests.post(f"{BASE_URL}/billing/estimate/{case_id}", headers=headers_doc)
            if res_bill.status_code != 200:
                print(f"   [WARN] Failed to create estimate: {res_bill.status_code}")

            print("   Approved estimate to move to Pending Nurse Review...")
            res_approve = requests.post(f"{BASE_URL}/billing/estimate/{case_id}/approve", headers=headers_doc)
            if res_approve.status_code != 200:
                 print(f"   [WARN] Failed to approve estimate: {res_approve.status_code} {res_approve.text}")

            # 15. Billing: Pending Estimates (Admin/Nurse)
            print("\n15. Testing Billing Pending Estimates...")
            
            res_pending = requests.get(f"{BASE_URL}/billing/admin/estimates/pending?role=Nurse", headers=headers_doc)
            if res_pending.status_code == 200:
                pending_list = res_pending.json()
                print(f"   [PASS] Fetched {len(pending_list)} pending estimates.")
                if len(pending_list) > 0:
                    found = False
                    for item in pending_list:
                         if item.get("case_id") == case_id:
                             found = True
                             if "case_title" in item:
                                 print(f"   [PASS] Found target case '{item['case_title']}' with enriched data.")
                             break
                    if not found:
                        print("   [WARN] Target case not in pending list (maybe status mismatch?)")
                else:
                     print("   [FAIL] List empty despite approval.")
            else:
                print(f"   [FAIL] {res_pending.status_code}: {res_pending.text}")

        else:
            print(f"   [FAIL] Could not create case. {res_case.status_code} {res_case.text}")

            # 16. Research Agent Integration
            print("\n16. Testing Research Agent Routing & Execution...")
            research_queries = [
                ("Find clinical guidelines for Sepsis", "find_guidelines"),
                ("Research recent treatments for multiple sclerosis", "research_condition")
            ]
            
            for query, expected_task in research_queries:
                print(f"   Query: '{query}'")
                r_payload = {"message": query}
                res_research = requests.post(f"{BASE_URL}/ai/agent_chat", json=r_payload, headers=headers_doc)
                
                if res_research.status_code == 200:
                    r_data = res_research.json()
                    # Check routing
                    actual_task = r_data.get("routed_to")
                    if actual_task == expected_task:
                        print(f"   [PASS] Routed to '{expected_task}'.")
                        
                        # Check result structure
                        result = r_data.get("result", {})
                        if expected_task == "find_guidelines":
                             if "guideline_title" in result:
                                 print(f"   [PASS] Received Guideline: {result.get('guideline_title')}")
                             else:
                                 print(f"   [FAIL] Invalid Guideline structure: {result}")
                        elif expected_task == "research_condition":
                             if "summary" in result:
                                 print("   [PASS] Received Research Summary.")
                             else:
                                 print(f"   [FAIL] Invalid Research structure: {result}")
                    else:
                        print(f"   [FAIL/WARN] Expected '{expected_task}' but got '{actual_task}' (Using Model Routing)")
                else:
                    print(f"   [FAIL] API Error {res_research.status_code}: {res_research.text}")

    except Exception as e:
        print(f"   [FAIL] Error in test: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup dummy file
        try:
            import os
            if os.path.exists("dummy_xray.jpg"):
                os.remove("dummy_xray.jpg")
        except: pass

if __name__ == "__main__":
    test_agent_execution()
