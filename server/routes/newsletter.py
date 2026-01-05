from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from ..database import get_db
from ..models import NewsletterSubscriber

router = APIRouter()

class SubscribeRequest(BaseModel):
    email: EmailStr

@router.post("/newsletter/subscribe")
async def subscribe_newsletter(request: SubscribeRequest, db: Session = Depends(get_db)):
    # Check if exists
    existing = db.query(NewsletterSubscriber).filter(NewsletterSubscriber.email == request.email).first()
    if existing:
        if not existing.is_active:
            existing.is_active = True
            db.commit()
            return {"status": "success", "message": "Subscription reactivated!"}
        return {"status": "success", "message": "Already subscribed."}

    new_sub = NewsletterSubscriber(email=request.email)
    db.add(new_sub)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")
        
    return {"status": "success", "message": "Successfully subscribed to newsletter."}
