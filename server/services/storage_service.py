import os
import shutil
import uuid
from typing import BinaryIO, Optional
import mimetypes
from ..config import settings

# Try importing GCS (might fail in dev)
try:
    from google.cloud import storage
    GCS_AVAILABLE = True
except ImportError:
    GCS_AVAILABLE = False
    print("WARNING: google-cloud-storage not installed. Using local storage only.")

class StorageService:
    """
    Unified interface for file storage.
    Supports: Google Cloud Storage (Production) and Local Filesystem (Dev/Fallback).
    """

    @staticmethod
    def _get_gcs_client():
        if not GCS_AVAILABLE:
            return None
        try:
            return storage.Client()
        except Exception as e:
            print(f"GCS Client Init Error: {e}")
            return None

    @classmethod
    def upload_file(cls, file_obj: BinaryIO, filename: str, content_type: str = None) -> str:
        """
        Uploads a file and returns the public/accessible URL.
        """
        # Generate unique path to avoid collisions
        ext = os.path.splitext(filename)[1]
        unique_name = f"{uuid.uuid4()}{ext}"
        
        # 1. Google Cloud Storage Strategy
        if settings.GCS_BUCKET_NAME and GCS_AVAILABLE:
            try:
                client = cls._get_gcs_client()
                if client:
                    bucket = client.bucket(settings.GCS_BUCKET_NAME)
                    blob = bucket.blob(unique_name)
                    
                    if content_type:
                        blob.content_type = content_type
                        
                    # Reset pointer just in case
                    file_obj.seek(0)
                    blob.upload_from_file(file_obj)
                    
                    # Return Public URL (assuming bucket is public or we use signed urls)
                    # For now returning publicAuth URL style or cloud storage style
                    return blob.public_url
            except Exception as e:
                print(f"GCS Upload Failed: {e}. Falling back to local.")

        # 2. Local Storage Strategy (Fallback/Dev)
        upload_dir = "static/uploads"
        
        # Ensure dir exists (handling Read-Only FS via try-except)
        try:
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, unique_name)
            
            with open(file_path, "wb") as buffer:
                file_obj.seek(0)
                shutil.copyfileobj(file_obj, buffer)
                
            # Return relative URL for frontend
            return f"/uploads/{unique_name}"
            
        except OSError:
            # Last Resort: /tmp for Cloud Run read-only fallback (ephemeral)
            print("WARNING: Writing to /tmp due to Read-Only FS")
            tmp_dir = "/tmp/static/uploads"
            os.makedirs(tmp_dir, exist_ok=True)
            file_path = os.path.join(tmp_dir, unique_name)
            
            with open(file_path, "wb") as buffer:
                file_obj.seek(0)
                shutil.copyfileobj(file_obj, buffer)
            
            # Application needs to know how to serve /tmp... 
            # This is complex, better to force GCS in prod.
            return f"/api/files/download/{unique_name}" # Placeholder for a download route

    @classmethod
    def get_signed_url(cls, filename: str, expiration=3600) -> str:
        """Generate a signed URL for private GCS objects."""
        if settings.GCS_BUCKET_NAME and GCS_AVAILABLE:
            client = cls._get_gcs_client()
            bucket = client.bucket(settings.GCS_BUCKET_NAME)
            blob = bucket.blob(filename)
            return blob.generate_signed_url(expiration=expiration)
        return f"/uploads/{filename}"
