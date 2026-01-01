from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, BackgroundTasks
import os
from google.cloud import storage
import uuid
from typing import Optional
from ..services.file_processor import FileProcessor

router = APIRouter()

import shutil

BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    case_id: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    # Create a unique filename
    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid.uuid4()}{ext}"
    
    url = ""
    gs_uri = None
    local_path = None
    
    # Try GCS Upload
    uploaded_gcs = False
    if BUCKET_NAME:
        try:
            storage_client = storage.Client()
            bucket = storage_client.bucket(BUCKET_NAME)
            blob = bucket.blob(unique_name)
            blob.upload_from_file(file.file, content_type=file.content_type)
            url = f"https://storage.googleapis.com/{BUCKET_NAME}/{unique_name}"
            gs_uri = f"gs://{BUCKET_NAME}/{unique_name}"
            uploaded_gcs = True
            
            # Reset file pointer for local save if needed? No, consumed.
            # If GCS succeeded, we are good.
        except Exception as e:
            print(f"GCS Upload Failed (falling back to local): {e}")
            # Reset file pointer if we read partially?
            await file.seek(0)

    # Fallback or Local Default
    if not uploaded_gcs:
        local_dir = "static/uploads"
        os.makedirs(local_dir, exist_ok=True)
        local_path = os.path.join(local_dir, unique_name)
        
        with open(local_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        url = f"/uploads/{unique_name}"
    
    # Trigger Background AI Processing
    if case_id:
        background_tasks.add_task(
            FileProcessor.process_and_attach, 
            case_id=case_id, 
            blob_name=unique_name, 
            bucket_name=BUCKET_NAME if uploaded_gcs else None,
            file_type=file.content_type,
            local_path=local_path if not uploaded_gcs else None
        )
    
    return {"url": url, "name": file.filename, "type": file.content_type, "gs_uri": gs_uri}
