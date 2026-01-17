from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from server.database import get_db
import server.models as models
from server.services.file_processor import FileProcessor
import re
import os
import tempfile
import shutil

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])

@router.post("/email/inbound")
async def handle_inbound_email(
    request: Request,
    from_email: str = Form(...),
    subject: str = Form(""),
    text: str = Form(""),
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Handle inbound emails for document ingestion.
    Supports processing attachments (PDFs, Images) using AI.
    """
    print(f"Inbound Email from: {from_email}")
    print(f"Subject: {subject}")
    
    # 1. Identify User
    # Clean email format "Name <email@domain.com>" -> "email@domain.com"
    email_clean = from_email
    if "<" in from_email:
        email_clean = from_email.split("<")[1].strip(">")
        
    user = db.query(models.User).filter(models.User.email == email_clean).first()
    
    patient_id = None
    case_id = None
    
    if user:
        print(f"Matched User: {user.name} ({user.role})")
        # If Patient, attach to their record
        if user.role == "Patient" and user.patient_profile:
            patient_id = user.patient_profile.id
        # If Doctor, look for Case ID in subject
        elif user.role in ["Doctor", "Nurse", "Admin"]:
             # Try to find Case ID case-XXX or just UUID
             # Regex for Case ID
             match = re.search(r'case[ -]?([a-zA-Z0-9-]+)', subject, re.IGNORECASE)
             if match:
                 case_id_candidate = match.group(1)
                 # Verify case exists
                 # Try adding prefix if missing
                 if not case_id_candidate.startswith("case-"):
                      case_id_candidate = f"case-{case_id_candidate}"
                 
                 case = db.query(models.Case).filter(models.Case.id == case_id_candidate).first()
                 if case:
                     case_id = case.id
                     print(f"Matched Case: {case_id}")
    else:
        print("User not found. checking for external case reference...")
        # Still check for Case ID for external contributors?
        # For security, we might reject or put in "Pending Review".
        # For demo, let's allow if case ID is present.
        match = re.search(r'case[ -]?([a-zA-Z0-9-]+)', subject, re.IGNORECASE)
        if match:
             case_id_candidate = match.group(1)
             if not case_id_candidate.startswith("case-"):
                  case_id_candidate = f"case-{case_id_candidate}"
             case = db.query(models.Case).filter(models.Case.id == case_id_candidate).first()
             if case:
                 case_id = case.id
                 print(f"Matched Case directly: {case_id}")
    
    if not patient_id and not case_id:
        return {"status": "ignored", "reason": "No matching user or case found."}

    # 2. Process Attachments
    processed_count = 0
    if files:
        for file in files:
            print(f"Processing attachment: {file.filename} ({file.content_type})")
            
            # Save to temp
            suffix = os.path.splitext(file.filename)[1]
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                shutil.copyfileobj(file.file, tmp)
                temp_path = tmp.name
            
            try:
                # Call FileProcessor
                FileProcessor.process_and_attach(
                    case_id=case_id,
                    blob_name=file.filename, # Using filename as blob name for now
                    bucket_name=None, # Local processing
                    file_type=file.content_type,
                    patient_id=patient_id,
                    local_path=temp_path
                )
                processed_count += 1
            except Exception as e:
                print(f"Error processing {file.filename}: {e}")
            finally:
                # Cleanup handled by FileProcessor mostly, but we created the temp path here.
                # FileProcessor accepts local_path and does NOT delete it unless it created it?
                # FileProcessor: "temp_path = None ... if temp_path and os.path.exists(temp_path): os.remove(temp_path)"
                # Wait, FileProcessor ONLY cleans up `temp_path` if IT created it (lines 53-56).
                # If we pass `local_path`, it uses it (lines 44-45) and does NOT clean it up explicitly in finally block?
                # Looking at FileProcessor.finally (lines 187-191):
                # "if temp_path ... os.remove(temp_path)". 
                # `temp_path` variable in FileProcessor is local to that function.
                # So it won't delete OUR temp file. We must delete it.
                if os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except:
                        pass

    return {
        "status": "success", 
        "processed_files": processed_count,
        "matched_user": user.email if user else None,
        "matched_case": case_id,
        "matched_patient": patient_id
    }

@router.post("/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle Stripe Webhooks (Payment Succeeded).
    """
    try:
        payload = await request.json()
        event_type = payload.get("type")
        
        if event_type == "payment_intent.succeeded":
            intent = payload.get("data", {}).get("object", {})
            amount = intent.get("amount", 0) / 100.0 # Cents to Dollars
            metadata = intent.get("metadata", {})
            user_id = metadata.get("user_id")
            
            if user_id:
                from ..services.credit_service import CreditService
                svc = CreditService(db)
                print(f"Stripe Webhook: Adding {amount} credits to {user_id}")
                svc.add_credits(user_id, amount, f"Stripe Top-up: {intent.get('id')}")
                
        return {"status": "success"}
    except Exception as e:
        print(f"Stripe Webhook Error: {e}")
        raise HTTPException(status_code=400, detail="Webhook Failed")

@router.post("/paypal")
async def paypal_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle PayPal Webhooks (Payment Capture Completed).
    """
    try:
        payload = await request.json()
        event_type = payload.get("event_type")
        
        if event_type == "PAYMENT.CAPTURE.COMPLETED":
            resource = payload.get("resource", {})
            amount_obj = resource.get("amount", {})
            value = float(amount_obj.get("value", "0.0"))
            
            # Custom id often in custom_id or look up invoice
            custom_id = resource.get("custom_id")
            
            # If custom_id carries user_id, use it.
            # Assuming format "user_id|..."
            user_id = None
            if custom_id:
                user_id = custom_id  # Simplify
                
            if user_id:
                 from ..services.credit_service import CreditService
                 svc = CreditService(db)
                 print(f"PayPal Webhook: Adding {value} credits to {user_id}")
                 svc.add_credits(user_id, value, f"PayPal Top-up: {resource.get('id')}")
                 
        return {"status": "received"}
    except Exception as e:
        print(f"PayPal Webhook Error: {e}")
        return {"status": "error"}
