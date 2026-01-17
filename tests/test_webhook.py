import requests
import io

BASE_URL = "http://localhost:8000/api"

def test_email_webhook():
    print("Testing Email Webhook...")
    
    # 1. Register a user (or use existing)
    email = "sender@example.com"
    # Try login first to check existence
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email, "password": "password", "name": "Email Sender", "role": "Patient"
    })
    
    # 2. Prepare Payload
    # Multipart form data
    
    file_content = b"%PDF-1.4 ... Dummy PDF Content ..."
    files = {
        "files": ("report.pdf", file_content, "application/pdf")
    }
    
    data = {
        "from_email": f"Sender Name <{email}>",
        "subject": "My Lab Report",
        "text": "Please analyze this."
    }
    
    print("2. Sending Inbound Email...")
    res = requests.post(f"{BASE_URL}/webhooks/email/inbound", data=data, files=files)
    
    print(f"   Status: {res.status_code}")
    print(f"   Response: {res.text}")
    
    assert res.status_code == 200
    resp = res.json()
    assert resp["status"] == "success"
    assert resp["processed_files"] == 1
    assert resp["matched_user"] == email
    
    # Test Unmatched User but Valid Case ID
    # Need a Case ID first.
    # Skip for now to keep test simple
    
if __name__ == "__main__":
    try:
        test_email_webhook()
        print("WEBHOOK TEST PASSED")
    except Exception as e:
        print(f"TEST FAILED: {e}")
        # Don't exit 1 if it's just a connection error (server might be starting), 
        # but here we assume server is up
