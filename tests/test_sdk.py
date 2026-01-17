import requests
import uuid
import sys
import secrets

BASE_URL = "http://localhost:8000/api"

def test_sdk_flow():
    print("Testing SDK Flow...")
    
    # 1. Submit Partner Application
    print("1. Submitting Partner Application...")
    app_email = f"tech_{secrets.token_hex(4)}@biotech.com"
    app_payload = {
        "company_name": "BioTech Inc",
        "contact_name": "Dr. Smith",
        "email": app_email,
        "phone": "555-0199",
        "device_category": "Wearable",
        "device_description": "Smart Vitals Monitor",
        "api_experience": "High",
        "expected_volume": "10k/day"
    }
    res = requests.post(f"{BASE_URL}/partners/apply", json=app_payload)
    assert res.status_code == 200
    app_id = res.json()["application_id"]
    print(f"   Application ID: {app_id}")
    
    # 2. Approve Application (Admin Action) - simulating by calling admin endpoint or updating DB?
    # We have an admin endpoint: PATCH /partners/application/{id}/status
    # It requires no auth currently in the code (it says "In production, this should be protected").
    print("2. Approving Application...")
    res = requests.patch(f"{BASE_URL}/partners/application/{app_id}/status?status=approved")
    if res.status_code != 200:
        print(f"   Approval Failed: {res.text}")
        sys.exit(1)
        
    creds = res.json()["credentials"] # Should contain api_key
    print(f"   Credentials Received: {creds is not None}")
    
    api_key_plain = creds["api_key"]
    # SDK Header: Bearer <ApiKey>
    headers = {"Authorization": f"Bearer {api_key_plain}"}
    
    # 3. Register Device
    print("3. Registering Device...")
    device_id = f"dev-{secrets.token_hex(4)}"
    dev_payload = {
        "device_id": device_id,
        "device_type": "smart_watch",
        "manufacturer": "BioTech",
        "model": "Watch-X1",
        "firmware_version": "1.0.0",
        "capabilities": ["heart_rate", "steps"]
    }
    res = requests.post(f"{BASE_URL}/sdk/v1/devices/register", json=dev_payload, headers=headers)
    assert res.status_code == 200
    dev_resp = res.json()
    print(f"   Device Registered: {dev_resp['device_id']}")
    
    # 4. Submit Data
    # Need a patient (user) to link to. 
    # For now, let's create a dummy patient or rely on the endpoint finding one.
    # The endpoint tries to find patient by patient_id.
    # Let's register a user first.
    user_email = f"patient_{secrets.token_hex(4)}@test.com"
    reg_res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": user_email, "password": "password", "role": "Patient", "name": "SDK Patient"
    })
    
    patient_id = None
    if reg_res.status_code == 200:
         user_data = reg_res.json().get("user", {})
         # Try to get patient profile id
         if "patient_profile" in user_data and user_data["patient_profile"]:
             patient_id = user_data["patient_profile"]["id"]
         else:
             # Fallback: Construct it based on logic in auth.py
             # auth.py: new_profile.id = f"profile-{new_user.id}"
             user_id = user_data.get("id")
             if user_id:
                 patient_id = f"profile-{user_id}"

    if not patient_id:
         print("   WARNING: Could not determine Patient ID. Using fallback 'profile-user-test'")
         patient_id = "profile-user-test" # Likely to fail if foreign key constraint exists, but worth a try or we abort
    
    print(f"   Using Patient ID: {patient_id}")
    
    print(f"4. Submitting Data for Patient: {patient_id}...")
    
    data_payload = {
        "patient_id": patient_id,
        "measurements": [
            {
                "device_id": device_id,
                "type": "heart_rate",
                "value": 75.0,
                "unit": "bpm"
            }
        ]
    }
    
    res = requests.post(f"{BASE_URL}/sdk/v1/data/submit", json=data_payload, headers=headers)
    if res.status_code != 200:
        print(f"   Submission Failed: {res.text}")
    assert res.status_code == 200
    print(f"   Data Submitted: {res.json()}")

if __name__ == "__main__":
    try:
        test_sdk_flow()
        print("ALL SDK TESTS PASSED")
    except Exception as e:
        print(f"TEST FAILED: {e}")
        sys.exit(1)
