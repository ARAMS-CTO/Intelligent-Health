import sys
import os
import json

# Add parent directory to path to import server modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.database import SessionLocal
from server.models import MedicalRecord, Patient, User
from server.services.agent_service import agent_service

def reindex_records():
    db = SessionLocal()
    try:
        records = db.query(MedicalRecord).all()
        print(f"Found {len(records)} records to check/index.")
        
        for record in records:
            # Resolve User ID for indexing
            user_id = record.uploader_id
            if not user_id and record.patient_id:
                patient = db.query(Patient).filter(Patient.id == record.patient_id).first()
                if patient and patient.user_id:
                    user_id = patient.user_id
            
            if not user_id:
                print(f"Skipping Record {record.id}: No linked User ID found.")
                continue
                
            print(f"Indexing Record {record.id} for User {user_id}")
            
            # Construct Content
            # Try to reproduce the format from upload_patient_record
            findings_str = ""
            try:
                # content_text is effectively the findings JSON in the new format
                # or OCR text in valid old format
                content_json = json.loads(record.content_text)
                if isinstance(content_json, dict):
                    findings_str = ", ".join([f"{k}: {v}" for k, v in content_json.items()])
                elif isinstance(content_json, list):
                    findings_str = ", ".join([str(f) for f in content_json])
                else:
                    findings_str = str(content_json)
            except:
                # If not JSON, assume raw text
                findings_str = record.content_text or ""
            
            rag_content = f"Findings: {findings_str}"
            if record.ai_summary:
                rag_content += f"\nSummary: {record.ai_summary}"
            
            # Include Staff metadata in index
            staff_info = []
            if record.metadata_:
                 meta = record.metadata_
                 if meta.get("doctor_name"): staff_info.append(f"Doctor: {meta.get('doctor_name')}")
                 if meta.get("nurse_name"): staff_info.append(f"Nurse: {meta.get('nurse_name')}")
                 if meta.get("facility_name"): staff_info.append(f"Facility: {meta.get('facility_name')}")
            
            if staff_info:
                 rag_content += f"\nStaff: {' | '.join(staff_info)}"

            try:
                agent_service.index_medical_record(
                    user_id=user_id,
                    record_id=record.id,
                    content=rag_content,
                    summary=record.ai_summary or "Medical Record"
                )
                print(f"Successfully Indexed {record.id}")
            except Exception as e:
                print(f"Failed to index {record.id}: {e}")

    finally:
        db.close()

if __name__ == "__main__":
    reindex_records()
