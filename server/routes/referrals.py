from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
import server.models as models
from server.routes.auth import get_current_user
from pydantic import BaseModel
import uuid

router = APIRouter()

class CreateReferralRequest(BaseModel):
    # Optional custom code, or auto-generate
    custom_code: str = None

class RedeemReferralRequest(BaseModel):
    invite_code: str

@router.post("/create")
async def create_referral_code(
    request: CreateReferralRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if user already has a pending/active referral code (generic one)
    # We look for a Referral where referrer is current_user and referred is None
    existing = db.query(models.Referral).filter(
        models.Referral.referrer_id == current_user.id,
        models.Referral.referred_user_id == None
    ).first()
    
    if existing:
        return {"code": existing.invite_code, "message": "Existing code retrieved"}

    # Generate Code
    if request.custom_code:
        # Check availability
        if db.query(models.Referral).filter(models.Referral.invite_code == request.custom_code).first():
             raise HTTPException(status_code=400, detail="Code already taken")
        code = request.custom_code
    else:
        # Auto: IH-{Name}-{Rand}
        name_part = current_user.name.split(" ")[0].upper()[:4]
        rand_part = uuid.uuid4().hex[:4].upper()
        code = f"IH-{name_part}-{rand_part}"

    new_ref = models.Referral(
        id=str(uuid.uuid4()),
        referrer_id=current_user.id,
        invite_code=code,
        status="ACTIVE" # Use as 'Template' status
    )
    db.add(new_ref)
    db.commit()
    
    return {"code": code, "message": "Code created"}

@router.post("/redeem")
async def redeem_code(
    request: RedeemReferralRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not request.invite_code:
        raise HTTPException(status_code=400, detail="Code required")

    # Find the Referrer (Owner of the code)
    # logic: find a Referral entry with this code where referred_user_id is NULL (the template)
    template = db.query(models.Referral).filter(
        models.Referral.invite_code == request.invite_code,
        models.Referral.referred_user_id == None
    ).first()
    
    if not template:
        # Fallback: maybe find ANY usage? No, that's insecure/ambiguous.
        raise HTTPException(status_code=404, detail="Invalid code")
        
    if template.referrer_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot refer yourself")

    # Check if already redeemed
    already_redeemed = db.query(models.Referral).filter(
        models.Referral.referred_user_id == current_user.id,
        models.Referral.invite_code == request.invite_code
    ).first()
    
    if already_redeemed:
        return {"message": "Already redeemed", "status": "verified"}

    try:
        # Create Redemption Record
        redemption = models.Referral(
            id=str(uuid.uuid4()),
            referrer_id=template.referrer_id,
            referred_user_id=current_user.id,
            invite_code=request.invite_code,
            status="VERIFIED",
            reward_claimed=False
        )
        db.add(redemption)
        
        # Issue Credits to Referrer (Reward)
        from ..services.credit_service import CreditService
        cs = CreditService(db)
        cs.add_credits(template.referrer_id, 50.0, f"Referral Bonus: {current_user.name}")
        
        db.commit()
    except Exception as e:
        print(f"Redeem Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Redeem Error: {str(e)}")
    
    return {"status": "success", "message": "Code redeemed! +50 Credits to referrer."}

@router.get("/stats")
async def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Total referrals sent (where referred_user_id IS NOT NULL)
    count = db.query(models.Referral).filter(
        models.Referral.referrer_id == current_user.id,
        models.Referral.referred_user_id != None
    ).count()
    
    # Template code
    template = db.query(models.Referral).filter(
        models.Referral.referrer_id == current_user.id,
        models.Referral.referred_user_id == None
    ).first()
    
    # Credits earned from referrals (simplistic: count * 50)
    # Or fetch from transactions
    earned = count * 50.0 
    
    return {
        "referral_count": count,
        "credits_earned": earned,
        "invite_code": template.invite_code if template else None
    }

@router.get("/leaderboard")
async def get_leaderboard(
    db: Session = Depends(get_db)
):
    from sqlalchemy import func
    # Top 10 Referrers
    results = db.query(
        models.Referral.referrer_id, 
        func.count(models.Referral.id).label('count')
    ).filter(
        models.Referral.referred_user_id != None
    ).group_by(
        models.Referral.referrer_id
    ).order_by(
        func.count(models.Referral.id).desc()
    ).limit(10).all()
    
    leaderboard = []
    for r in results:
        user = db.query(models.User).filter(models.User.id == r.referrer_id).first()
        if user:
            leaderboard.append({
                "name": user.name,
                "role": user.role,
                "referrals": r.count,
                "credits": r.count * 50
            })
            
    return leaderboard
