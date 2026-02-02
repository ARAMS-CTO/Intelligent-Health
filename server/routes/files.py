from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, BackgroundTasks
from typing import Optional
from ..services.storage_service import StorageService
from ..services.file_processor import FileProcessor
from ..config import settings

router = APIRouter()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    case_id: Optional[str] = Form(None),
    patient_id: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    # Upload via StorageService
    # Note: upload_file expects a file-like object. 
    # FastAPI's SpoiledTemporaryFile is file-like.
    
    try:
        url = StorageService.upload_file(file.file, file.filename, file.content_type)
        
        # Determine GCS Context for processor
        bucket_name = settings.GCS_BUCKET_NAME if settings.GCS_BUCKET_NAME and "googleapis" in url else None
        blob_name = url.split('/')[-1] # Simple extraction, might need robust parsing if logic changes
        
        # Trigger Background AI Processing
        # We need to be careful: if it's GCS, the Processor needs to download it or use GCS URI.
        # If it's local, it needs the path.
        
        local_path = None
        if not bucket_name:
             # Local path reconstruction
             local_path = f"static/uploads/{blob_name}" 
        
        if case_id or patient_id:
            background_tasks.add_task(
                FileProcessor.process_and_attach, 
                case_id=case_id,
                patient_id=patient_id,
                blob_name=blob_name, 
                bucket_name=bucket_name,
                file_type=file.content_type,
                local_path=local_path
            )
        
        return {"url": url, "name": file.filename, "type": file.content_type}
        
    except Exception as e:
        print(f"Upload Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="File Upload Failed")
