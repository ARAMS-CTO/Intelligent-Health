import requests
import uuid
import sys

BASE_URL = "http://localhost:8000/api"

def get_auth_token(role="Patient"):
    email = f"test_{role.lower()}_{uuid.uuid4().hex[:6]}@example.com"
    reg_payload = {"email": email, "role": role, "password": "password", "name": f"Test {role}"}
    
    res = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    if res.status_code == 200:
        return res.json()["access_token"], res.json()["user"]["id"]
    raise Exception(f"Auth Failed: {res.text}")

def test_referral_flow():
    print("Testing Referral System...")
    
    # User A (Referrer)
    token_a, id_a = get_auth_token("Patient")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    
    # User B (Referred)
    token_b, id_b = get_auth_token("Patient")
    headers_b = {"Authorization": f"Bearer {token_b}"}
    
    # 1. User A generates code
    print("1. Generating Code for User A...")
    res = requests.post(f"{BASE_URL}/referrals/create", json={}, headers=headers_a)
    assert res.status_code == 200
    code = res.json()["code"]
    print(f"   Code: {code}")
    
    # 2. User B redeems code
    print("2. User B Redeems Code...")
    res = requests.post(f"{BASE_URL}/referrals/redeem", json={"invite_code": code}, headers=headers_b)
    if res.status_code != 200:
        print(f"   Redeem Failed: {res.text}")
    assert res.status_code == 200
    print("   [PASS] Redeemed.")
    
    # 3. User A checks stats (Should have 1 referral and +50 credits)
    print("3. Checking User A Stats...")
    res = requests.get(f"{BASE_URL}/referrals/stats", headers=headers_a)
    assert res.status_code == 200
    stats = res.json()
    print(f"   Stats: {stats}")
    assert stats["referral_count"] == 1
    assert stats["credits_earned"] == 50.0
    
    # 4. Check User A Credit Balance (100 + 50 = 150)
    res = requests.get(f"{BASE_URL}/credits/balance", headers=headers_a)
    balance = res.json()["balance"]
    print(f"   User A Balance: {balance}")
    assert balance == 150.0

if __name__ == "__main__":
    try:
        test_referral_flow()
        print("ALL REFERRAL TESTS PASSED")
    except Exception as e:
        print(f"TEST FAILED: {e}")
        sys.exit(1)
