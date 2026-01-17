import requests
import uuid
import sys

BASE_URL = "http://localhost:8000/api"

def get_auth_token(role="Patient"):
    email = f"test_{role.lower()}_{uuid.uuid4().hex[:6]}@example.com"
    reg_payload = {"email": email, "role": role, "password": "password", "name": f"Test {role}"}
    
    # Try Register
    res = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    if res.status_code == 200:
        return res.json()["access_token"], res.json()["user"]["id"], email
        
    # Try Login
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "role": role, "password": "password"})
    if res.status_code == 200:
         return res.json()["access_token"], res.json()["user"]["id"], email
         
    raise Exception(f"Auth Failed: {res.text}")

def test_credits_flow():
    print("Testing Credits System...")
    token, user_id, _ = get_auth_token("Patient")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Check Initial Balance (Should be 100 as per Register default)
    print("1. Checking Balance...")
    res = requests.get(f"{BASE_URL}/credits/balance", headers=headers)
    assert res.status_code == 200
    balance = res.json()["balance"]
    print(f"   Balance: {balance} (Expected 100)")
    assert balance == 100.0
    
    # 2. Deduct Credits
    print("2. Deducting 10 Credits...")
    deduct_payload = {"amount": 10.0, "reason": "Test Usage"}
    res = requests.post(f"{BASE_URL}/credits/deduct", json=deduct_payload, headers=headers)
    assert res.status_code == 200
    new_balance = res.json()["new_balance"]
    print(f"   New Balance: {new_balance}")
    assert new_balance == 90.0
    
    # 3. Insufficient Funds
    print("3. Testing Insufficient Funds...")
    deduct_payload["amount"] = 500.0
    res = requests.post(f"{BASE_URL}/credits/deduct", json=deduct_payload, headers=headers)
    assert res.status_code == 402
    print("   [PASS] 402 Received.")

if __name__ == "__main__":
    try:
        test_credits_flow()
        print("ALL CREDIT TESTS PASSED")
    except Exception as e:
        print(f"TEST FAILED: {e}")
        sys.exit(1)
