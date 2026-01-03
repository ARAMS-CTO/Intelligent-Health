import requests
import json
import os
from datetime import datetime

BASE_URL = "http://localhost:8002/api"
EMAIL = "agent_console_tester@hospital.com"
PASSWORD = "TestPassword123!"

def run_test():
    # 1. Register/Login
    print(f"Registering {EMAIL}...")
    requests.post(f"{BASE_URL}/auth/register", json={
        "email": EMAIL,
        "password": PASSWORD,
        "name": "Dr. Agent Tester",
        "role": "Doctor",
        "specialty": "Internal Medicine"
    })
    
    # Login
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD, "role": "Doctor"})
    if r.status_code != 200:
        print(f"Login Failed: {r.text}")
        return
    token = r.json()['access_token']
    headers = {"Authorization": f"Bearer {token}"}
    print("Login Success.")

    # 2. Test Emergency Agent
    print("\n--- Testing Emergency Protocol ---")
    payload = {
        "task": "emergency_protocol",
        "payload": {
            "symptoms": "Severe chest pain, radiating to left arm",
            "vitals": "BP 160/100, HR 110, SpO2 94%"
        }
    }
    r = requests.post(f"{BASE_URL}/ai/agent_task", json=payload, headers=headers)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        print(f"Result: {json.dumps(r.json(), indent=2)[:300]}...") # Truncate

    # 3. Test Insurance Agent
    print("\n--- Testing Insurance Check ---")
    payload = {
        "task": "check_eligibility",
        "payload": {
            "diagnosis": "Type 2 Diabetes",
            "plan": "Metformin and regular checkups"
        }
    }
    r = requests.post(f"{BASE_URL}/ai/agent_task", json=payload, headers=headers)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        print(f"Result: {json.dumps(r.json(), indent=2)[:300]}...")

    # 4. Test Crypto/Pricing Agent
    print("\n--- Testing Cost Estimate ---")
    payload = {
        "task": "estimate_cost",
        "payload": {
            "diagnosis": "Acute Appendicitis",
            "plan": "Laparoscopic Appendectomy"
        }
    }
    r = requests.post(f"{BASE_URL}/ai/agent_task", json=payload, headers=headers)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        print(f"Result: {json.dumps(r.json(), indent=2)[:300]}...")

    # 5. Test Recovery Agent
    print("\n--- Testing Rehab Plan ---")
    payload = {
        "task": "generate_rehab_plan",
        "payload": {
            "condition": "Total Knee Replacement",
            "age": 65,
            "severity": "Standard"
        }
    }
    r = requests.post(f"{BASE_URL}/ai/agent_task", json=payload, headers=headers)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        print(f"Result: {json.dumps(r.json(), indent=2)[:300]}...")

if __name__ == "__main__":
    run_test()
