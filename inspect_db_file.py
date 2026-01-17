from server.database import SessionLocal
from server.models import MedicalRecord
import sys

def inspect_records():
    db = SessionLocal()
    with open("verification_results.txt", "w", encoding="utf-8") as f:
        try:
            records = db.query(MedicalRecord).all()
            f.write(f"Total Medical Records: {len(records)}\n")
            for r in records:
                f.write(f"\n--- Record ID: {r.id} ---\n")
                f.write(f"Patient ID: {r.patient_id}\n")
                f.write(f"Type: {r.type}\n")
                f.write(f"File: {r.file_url}\n")
                f.write(f"Summary: {r.ai_summary}\n")
                f.write(f"Created At: {str(r.created_at)}\n")
        except Exception as e:
            f.write(str(e))
        finally:
            db.close()

if __name__ == "__main__":
    inspect_records()
