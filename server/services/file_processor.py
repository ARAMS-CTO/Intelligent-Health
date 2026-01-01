from typing import Optional
import os
from sqlalchemy.orm import Session
from ..models import Case, Comment, LabResult
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
        case_id: str, 
        blob_name: str, 
        bucket_name: Optional[str], 
        file_type: str,
        local_path: Optional[str] = None
    ):
        """
        Background task to process an uploaded file using Gemini Multimodal capabilities
        and attach the insights to the case.
        Supports both GCS and local files.
        """
        db = SessionLocal()
        temp_path = None
        
        try:
            print(f"Processing file {blob_name} for case {case_id}")
            
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
            prompt = """
            Analyze this medical document or image. 
            1. Identify the type of document (e.g., Lab Report, Radiology, Prescription, Clinical Note).
            2. Extract key findings, values, and abnormalities.
            3. Summarize the clinical context.
            4. If it's a lab report, extract specific test names, values, units, and ranges if consistent.
            
            Return the result in JSON format with keys: 
            {
                "document_type": "string",
                "summary": "string",
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
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0]
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0]
                    
                data = json.loads(text)
                
                # Update Database
                case = db.query(Case).filter(Case.id == case_id).first()
                if case:
                    summary_text = f"**AI Analysis of Uploaded File**\n*Type:* {data.get('document_type', 'Unknown')}\n\n*Summary:* {data.get('summary', '')}\n\n*Key Findings:*\n" + "\n".join([f"- {f}" for f in data.get('findings', [])])
                    
                    new_comment = Comment(
                        id=f"ai-analysis-{blob_name}-{datetime.utcnow().timestamp()}", # Safer ID
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
                    
                    db.commit()
                    print(f"Successfully processed file for case {case_id}")
                    
            except Exception as e_inner:
                print(f"Gemini API Error: {e_inner}")

        except Exception as e:
            print(f"Error in file processing: {e}")
        finally:
            db.close()
            # Clean up temp file only if we created it
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
