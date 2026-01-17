from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from server.database import get_db
from server.models import PartnerApplication
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
from server.services.sdk_service import create_api_key_for_partner

router = APIRouter(prefix="/api/partners", tags=["Hardware Partners"])

class PartnerApplicationRequest(BaseModel):
    company_name: str
    contact_name: str
    email: EmailStr
    phone: str
    website: Optional[str] = None
    device_category: str
    device_description: str
    api_experience: str
    expected_volume: str
    message: Optional[str] = None

@router.post("/apply")
async def submit_partner_application(request: PartnerApplicationRequest, db: Session = Depends(get_db)):
    """
    Hardware distributors/manufacturers submit application for SDK access.
    Applications go through approval process before SDK access is granted.
    """
    # Check for duplicate applications by email
    existing = db.query(PartnerApplication).filter(
        PartnerApplication.email == request.email,
        PartnerApplication.status == "pending"
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="You already have a pending application. We'll review it soon!"
        )
    
    application = PartnerApplication(
        id=str(uuid.uuid4()),
        company_name=request.company_name,
        contact_name=request.contact_name,
        email=request.email,
        phone=request.phone,
        website=request.website,
        device_category=request.device_category,
        device_description=request.device_description,
        api_experience=request.api_experience,
        expected_volume=request.expected_volume,
        message=request.message,
        status="pending"
    )
    
    db.add(application)
    db.commit()
    db.refresh(application)
    
    # TODO: Send notification email to admin and confirmation to applicant
    
    return {
        "status": "success",
        "message": "Application submitted successfully! We'll review and contact you within 5-7 business days.",
        "application_id": application.id
    }

@router.get("/applications")
async def get_all_applications(db: Session = Depends(get_db)):
    """
    Admin endpoint to view all partner applications.
    In production, this should be protected by admin authentication.
    """
    applications = db.query(PartnerApplication).order_by(PartnerApplication.created_at.desc()).all()
    return applications

@router.get("/application/{application_id}")
async def get_application_status(application_id: str, db: Session = Depends(get_db)):
    """
    Check application status by ID.
    """
    application = db.query(PartnerApplication).filter(PartnerApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return {
        "id": application.id,
        "company_name": application.company_name,
        "status": application.status,
        "created_at": application.created_at,
        "reviewed_at": application.reviewed_at
    }

@router.patch("/application/{application_id}/status")
async def update_application_status(
    application_id: str, 
    status: str,
    db: Session = Depends(get_db)
):
    """
    Admin endpoint to approve/reject applications.
    In production, this should be protected by admin authentication.
    """
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    
    application = db.query(PartnerApplication).filter(PartnerApplication.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    application.status = status
    from datetime import datetime
    application.reviewed_at = datetime.utcnow()
    
    db.commit()
    
    # Generate API credentials if approved
    credentials = None
    if status == "approved":
        credentials = create_api_key_for_partner(
            db=db,
            application_id=application_id,
            key_name=f"{application.company_name} - Production Key"
        )
    
    # TODO: Send approval/rejection email with SDK credentials if approved
    
    return {
        "status": "success",
        "message": f"Application {status}",
        "credentials": credentials  # Only returned once, must be saved by partner
    }
