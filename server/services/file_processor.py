from typing import Optional
import os
from sqlalchemy.orm import Session
from ..models import Case, Comment, LabResult, MedicalRecord
import uuid
from ..database import SessionLocal
try:
    import google.generativeai as genai
except ImportError:
    genai = None
from datetime import datetime
import json
import logging
import tempfile

# Configure Gemini
api_key = os.environ.get("GEMINI_API_KEY")
if api_key and genai:
    genai.configure(api_key=api_key)

class FileProcessor:
    @staticmethod
    def process_and_attach(
        case_id: Optional[str], 
        blob_name: str, 
        bucket_name: Optional[str], 
        file_type: str,
        patient_id: Optional[str] = None, # Added patient_id
        local_path: Optional[str] = None
    ):
        """
        Background task to process an uploaded file using Gemini Multimodal capabilities
        and attach the insights to the case or patient record.
        Supports both GCS and local files.
        """
        db = SessionLocal()
        temp_path = None
        
        try:
            print(f"Processing file {blob_name} for case={case_id} patient={patient_id}")
            
            # Decide source
            file_to_process = None
            if local_path and os.path.exists(local_path):
                file_to_process = local_path
            elif bucket_name:
                # Download from GCS
                from google.cloud import storage
                storage_client = storage.Client()
                bucket = storage_client.bucket(bucket_name)
                blob = bucket.blob(blob_name)
                
                # Create temp file
                with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(blob_name)[1]) as tmp:
                    blob.download_to_file(tmp)
                    temp_path = tmp.name
                file_to_process = temp_path
            else:
                print("No valid file source found for processing.")
                return

            # Initialize Gemini Model
            # Note: File API is preferred for images/pdfs.
            if not genai:
                print("Gemini SDK not installed.")
                return
                
            model = genai.GenerativeModel('gemini-2.0-flash-exp') 
            
            # Prepare prompt
            # Prepare prompt
            prompt = """
            Analyze this medical file (document, image, or video). 
            
            1. Identify the type (e.g., Lab Report, Radiology, Prescription, Clinical Note, Surgical Video, Examination Video).
            2. Extract key findings, values, and abnormalities.
            3. Summarize the clinical context in a patient-friendly way.
            4. If it's a lab report, extract specific test names, values, units, and ranges.
            5. If it's a VIDEO: Describe the procedure, anatomical structures, and any specific clinical events seen.
            6. Extract textual content (OCR) if legible/applicable.
            
            Return the result in JSON format with keys: 
            {
                "document_type": "string (MUST include 'Video' suffix if it is a video)",
                "summary": "string",
                "ocr_text": "string",
                "findings": ["string"],
                "lab_results": [{"test": "string", "value": "string", "unit": "string", "range": "string", "flag": "string"}] 
            }
            """
            
            try:
                # Upload to Gemini File API
                uploaded_file = genai.upload_file(file_to_process)
                
                # Generate Content
                response = model.generate_content([prompt, uploaded_file])
                
                text = response.text
                # Clean JSON markdown
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0]
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0]
                    
                data = json.loads(text)
                
                # 1. Handle Patient Medical Record (Primary for Patient Uploads)
                if patient_id:
                    # from ..models import MedicalRecord # Already imported at top
                    # import uuid # Already imported at top
                    
                    record_id = f"rec-{uuid.uuid4()}"
                    
                    # Create or Find Medical Record? (Usually Create New for Upload)
                    # We might want to link it to the file URL. logic implies blob_name is key.
                    # This simplified logic creates a NEW record for every processing.
                    # In a real app, we might pass the record_id if created earlier.
                    
                    new_record = MedicalRecord(
                        id=record_id,
                        patient_id=patient_id,
                        uploader_id=patient_id, # Self-upload
                        type=data.get('document_type', 'Document'),
                        title=f"{data.get('document_type', 'Document')} - {datetime.utcnow().strftime('%Y-%m-%d')}",
                        file_url=f"/uploads/{blob_name}" if not bucket_name else f"https://storage.googleapis.com/{bucket_name}/{blob_name}",
                        content_text=data.get('ocr_text', ''),
                        ai_summary=data.get('summary', ''),
                        metadata_=data, # JSON Support
                        created_at=datetime.utcnow()
                    )
                    db.add(new_record)
                    print(f"Created MedicalRecord {record_id} for Patient {patient_id}")
                    
                    # 1.1 Index for RAG (AI Learning)
                    try:
                        from .agent_service import agent_service
                        agent_service.index_medical_record(
                            patient_id, 
                            record_id, 
                            data.get('ocr_text', '') + "\nFindings: " + ", ".join(data.get('findings', [])), 
                            data.get('summary', '')
                        )
                        print(f"Indexed Record {record_id} for RAG")
                    except Exception as e_rag:
                        print(f"RAG Indexing Error: {e_rag}")

                # 2. Handle Case Attachment (for Doctors)
                if case_id:
                    case = db.query(Case).filter(Case.id == case_id).first()
                    if case:
                        summary_text = f"**AI Analysis of Uploaded File**\n*Type:* {data.get('document_type', 'Unknown')}\n\n*Summary:* {data.get('summary', '')}\n\n*Key Findings:*\n" + "\n".join([f"- {f}" for f in data.get('findings', [])])
                        
                        new_comment = Comment(
                            id=f"ai-analysis-{blob_name}-{datetime.utcnow().timestamp()}", 
                            case_id=case_id,
                            user_id="ai-system",
                            user_name="AI Agent",
                            user_role="System",
                            text=summary_text,
                            timestamp=datetime.utcnow().isoformat()
                        )
                        db.add(new_comment)
                        
                        if "lab_results" in data and isinstance(data["lab_results"], list):
                            for res in data["lab_results"]:
                                lab = LabResult(
                                    case_id=case_id,
                                    test=res.get("test"),
                                    value=str(res.get("value")),
                                    unit=res.get("unit"),
                                    reference_range=res.get("range"),
                                    interpretation=res.get("flag", "Normal")
                                )
                                db.add(lab)
                        print(f"Attached analysis to Case {case_id}")
                    
                db.commit()
                    
            except Exception as e_inner:
                print(f"Gemini API Error: {e_inner}")
                # Fallback: Create record without AI data if patient_id exists?
                # For now just log. Use retry mechanism in prod.

        except Exception as e:
            print(f"Error in file processing: {e}")
        finally:
            db.close()
            # Clean up temp file only if we created it
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
