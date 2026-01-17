from server.database import SessionLocal
from server.models import MedicalRecord, Patient

def inspect_records():
    db = SessionLocal()
    try:
        records = db.query(MedicalRecord).all()
        print(f"Total Medical Records: {len(records)}")
        for r in records:
            print(f"\n--- Record ID: {r.id} ---")
            print(f"Patient ID: {r.patient_id}")
            print(f"Type: {r.type}")
            print(f"File: {r.file_url}")
            print(f"Summary: {r.ai_summary}")
            print(f"Created At: {r.created_at}")
    except Exception as e:
        print(e)
    finally:
        db.close()

if __name__ == "__main__":
    inspect_records()
