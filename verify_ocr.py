import requests
import os
import time
from server.database import SessionLocal
from server.models import User, MedicalRecord

BASE_URL = "http://localhost:8080/api"
TEST_FILES_DIR = "docs/Health tests"
PATIENT_EMAIL = "aram.ghannad@gmail.com"

def verify_ocr():
    db = SessionLocal()
    try:
        # 1. Get Patient ID
        patient = db.query(User).filter(User.email == PATIENT_EMAIL).first()
        if not patient:
            print(f"Error: Patient {PATIENT_EMAIL} not found.")
            return

        print(f"Testing OCR for Patient: {patient.name} (ID: {patient.id})")
        
        # 2. Iterate Files
        if not os.path.exists(TEST_FILES_DIR):
             print(f"Error: Directory {TEST_FILES_DIR} not found.")
             return

        files = [f for f in os.listdir(TEST_FILES_DIR) if os.path.isfile(os.path.join(TEST_FILES_DIR, f))]
        
        for filename in files:
            filepath = os.path.join(TEST_FILES_DIR, filename)
            print(f"\nUploading {filename}...")
            
            with open(filepath, "rb") as f:
                # Direct upload simulation (Multipart)
                files = {"file": (filename, f, "application/pdf" if filename.endswith(".pdf") else "image/jpeg")}
                data = {"patient_id": patient.id}
                
                try:
                    # Assuming running locally on 8080 as per defaults
                    res = requests.post(f"{BASE_URL}/files/upload", files=files, data=data)
                    
                    if res.status_code == 200:
                        print(f"Upload Success: {res.json()}")
                        
                        # 3. Wait for Background Processing (Polling DB)
                        print("Waiting for AI Analysis (15s)...")
                        time.sleep(15) 
                        
                        # 4. Check DB
                        # Re-query session to get fresh data
                        db.expire_all()
                        record = db.query(MedicalRecord).filter(
                             MedicalRecord.patient_id == patient.id
                        ).order_by(MedicalRecord.created_at.desc()).first()
                        
                        if record and filename in record.file_url:
                            print(f"[PASS] Record Created: {record.id}")
                            print(f"       Type: {record.type}")
                            print(f"       Summary: {record.ai_summary[:100]}...")
                        else:
                            print(f"[FAIL] No record found or mismatch for {filename}")
                            
                    else:
                        print(f"[FAIL] Upload Request Failed: {res.text}")
                        
                except Exception as e:
                    print(f"[ERROR] Request Error: {e}")

    finally:
        db.close()

if __name__ == "__main__":
    verify_ocr()
