from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import CostEstimate, Case as CaseModel
from ..schemas import CostEstimate as CostEstimateSchema
import uuid
import datetime

router = APIRouter()
from ..routes.auth import get_current_user
from ..schemas import User
from ..config import settings

# Mock Standard Pricing DB
STANDARD_PRICING = {
    "X-Ray": {"cost": 150.0, "category": "Investigation"},
    "MRI": {"cost": 850.0, "category": "Investigation"},
    "Blood Test (CBC)": {"cost": 45.0, "category": "Investigation"},
    "General Consultation": {"cost": 100.0, "category": "Procedure"},
    "Urgent Care Visit": {"cost": 250.0, "category": "Procedure"},
    "Antibiotics": {"cost": 30.0, "category": "Medication"},
    "Hospital Stay (Day)": {"cost": 1200.0, "category": "Stay"}
}

from ..models import SystemConfig
from pydantic import BaseModel

class BillingConfig(BaseModel):
    accepted_currencies: list[str]
    payment_gateways: dict[str, bool] # {"paypal": true, "stripe": true, "wechat": false}
    
@router.get("/config")
async def get_billing_config(db: Session = Depends(get_db)):
    # Fetch from DB or return defaults
    config = db.query(SystemConfig).filter(SystemConfig.key == "billing_settings").first()
    if config:
        return config.value
    return {
        "accepted_currencies": ["USD", "EUR", "AED", "CNY"],
        "payment_gateways": {"paypal": True, "stripe": True, "wechat": False} 
    }

@router.post("/config")
async def update_billing_config(config: BillingConfig, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "Admin":
         raise HTTPException(status_code=403, detail="Not authorized")
         
    db_config = db.query(SystemConfig).filter(SystemConfig.key == "billing_settings").first()
    if not db_config:
        db_config = SystemConfig(key="billing_settings", value=config.dict())
        db.add(db_config)
    else:
        db_config.value = config.dict()
        
    db.commit()
    return db_config.value

@router.post("/estimate/{case_id}", response_model=CostEstimateSchema)
async def generate_cost_estimate(case_id: str, db: Session = Depends(get_db)):
    """
    Generates a cost estimate using AI to identify CPT codes and procedures.
    """
    case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    breakdown = []
    total_cost = 0.0
    
    # AI-Based Estimation
    try:
        from ..routes.ai import API_KEY, DEFAULT_MODEL, genai
        if API_KEY:
            model = genai.GenerativeModel(DEFAULT_MODEL)
            prompt = f"""
            Analyze this medical case and generate a billing estimate.
            Identify likely CPT codes (Procedures) and resource usage (Medications, Investigations, Stays).
            Estimate costs based on US standard averages.
            
            Case Context:
            Complaint: {case.complaint}
            Diagnosis: {case.diagnosis}
            Findings: {case.findings}
            
            Return a JSON object with key "items" containing a list of objects: {{"name": "string", "category": "Investigation" | "Procedure" | "Consumable" | "Stay" | "Medication", "cost": float}}.
            """
            
            response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            import json
            data = json.loads(response.text)
            
            if "items" in data:
                breakdown = data["items"]
                total_cost = sum(item["cost"] for item in breakdown)
    except Exception as e:
        print(f"AI Billing Error: {e}")
        # Fallback will run below if breakdown is empty
        
    # Fallback to Logic-Based
    if not breakdown:
        # Base Fee
        breakdown.append({"name": "Consultation Fee", "category": "Procedure", "cost": 100.0})
        total_cost += 100.0
        
        text_corpus = (case.findings or "") + (case.diagnosis or "") + (case.complaint or "")
        
        for item, data in STANDARD_PRICING.items():
            if item.lower() in text_corpus.lower():
                breakdown.append({"name": item, "category": data["category"], "cost": data["cost"]})
                total_cost += data["cost"]
            
    # Estimate Insurance (Mock 80% coverage)
    insurance_coverage = total_cost * 0.80
    patient_responsibility = total_cost - insurance_coverage
    
    estimate_id = f"est-{uuid.uuid4()}"
    
    # Save to DB
    estimate = CostEstimate(
        id=estimate_id,
        case_id=case_id,
        total_cost=total_cost,
        currency="USD",
        breakdown=breakdown,
        insurance_coverage=insurance_coverage,
        patient_responsibility=patient_responsibility,
        status="Estimated",
        created_at=datetime.datetime.utcnow()
    )
    
    db.add(estimate)
    db.commit()
    return estimate

@router.get("/{case_id}", response_model=CostEstimateSchema)
async def get_estimate(case_id: str, db: Session = Depends(get_db)):
    estimate = db.query(CostEstimate).filter(CostEstimate.case_id == case_id).order_by(CostEstimate.created_at.desc()).first()
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")
    return estimate


from typing import List
from ..models import Transaction as TransactionModel
from ..schemas import Transaction as TransactionSchema

from ..routes.auth import get_current_user
from ..schemas import User

@router.post("/estimate/{case_id}/approve")
async def approve_estimate(case_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Progresses the approval workflow:
    Draft -> Pending Nurse -> Pending Admin -> Pending Insurance -> Pending Patient -> Approved
    """
    # Find latest estimate for case
    estimate = db.query(CostEstimate).filter(CostEstimate.case_id == case_id).order_by(CostEstimate.created_at.desc()).first()
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")
        
    current_status = estimate.status
    
    # Helper to simulate email
    def send_email_notification(to_role_or_email, subject, body):
        from ..models import SystemLog
        log = SystemLog(
            event_type="notification_email",
            user_id=current_user.id,
            details={
                "to": to_role_or_email,
                "subject": subject,
                "body": body,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
        )
        db.add(log)
        print(f"--- EMAIL SIMULATION ---\nTo: {to_role_or_email}\nSubject: {subject}\n{body}\n------------------------")

    if current_status == "Draft" or current_status == "Estimated":
        estimate.status = "Pending Nurse Review"
        send_email_notification("Nurse", f"New Estimate Approval Needed: {case_id}", "Please review the cost breakdown.")
    
    elif current_status == "Pending Nurse Review":
        if current_user.role not in ["Nurse", "Admin"]:
             raise HTTPException(status_code=403, detail="Only Nurses or Admins can approve at this stage")
        
        estimate.status = "Pending Admin Review"
        send_email_notification("Admin", f"Estimate Verified by Nurse: {case_id}", "Nurse has verified. Please authorize.")

        if current_user.role == "Admin":
            # Auto-progress
            estimate.status = "Pending Insurance Approval"
            send_email_notification("Insurance", f"Insurance Claim Request: {case_id}", "Please approve coverage.")
        
    elif current_status == "Pending Admin Review":
        if current_user.role != "Admin":
             raise HTTPException(status_code=403, detail="Only Admins can approve at this stage")
        estimate.status = "Pending Insurance Approval"
        send_email_notification("Insurance", f"Insurance Claim Request: {case_id}", "Please approve coverage.")
        
        # Mock Insurance Integration (Auto-approve for demo)
        # In real world, this would trigger an external API
        # For now, we leave it in "Pending Insurance Approval" so the new Insurance user can log in and approve!
        # estimate.status = "Pending Patient Approval" 
        
    elif current_status == "Pending Insurance Approval":
        # Only Insurance Rep or Admin can approve this
        # using 'BillingOfficer' role for Insurance based on seed data
        if current_user.role not in ["Billing & Insurance Officer", "Admin", "BillingOfficer"]: 
             # Note: Role enum string vs DB string. Seed uses Role.BillingOfficer="Billing & Insurance Officer"?
             # Let's check schemas.py Role enum.
             # Role.BillingOfficer = "Billing & Insurance Officer"
             raise HTTPException(status_code=403, detail="Only Insurance/Billing Officers can approve.")
             
        estimate.status = "Pending Patient Approval"
        
        # Find patient email
        case = db.query(CaseModel).filter(CaseModel.id == case_id).first()
        to_email = "Patient"
        if case and case.patient:
             # Try to find user linked to patient
             if case.patient.user_id:
                 user = db.query(User).filter(User.id == case.patient.user_id).first()
                 if user: to_email = user.email
        
        send_email_notification(to_email, f"Cost Estimate Approved by Insurance: {case_id}", "Your insurance has approved. Please review your responsibility.")

    elif current_status == "Pending Patient Approval":
        estimate.status = "Approved"
        send_email_notification("Billing", f"Estimate Finalized: {case_id}", "Patient accepted. Proceed with treatment.")
        
    db.commit()
    return estimate

@router.post("/estimate/{case_id}/reject")
async def reject_estimate(case_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    estimate = db.query(CostEstimate).filter(CostEstimate.case_id == case_id).order_by(CostEstimate.created_at.desc()).first()
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")
        
    estimate.status = "Rejected"
    db.commit()
    return estimate

@router.get("/admin/estimates/pending")
async def get_pending_estimates(role: str = "Nurse", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Fetch estimates pending review for a specific role, enriched with Case Title.
    """
    if role == "Nurse":
        status = "Pending Nurse Review"
    elif role == "Admin":
        status = "Pending Admin Review"
    else:
        status = "Pending Insurance Approval"
        
    results = db.query(CostEstimate, CaseModel).join(CaseModel, CostEstimate.case_id == CaseModel.id).filter(CostEstimate.status == status).all()
    
    output = []
    for est, case in results:
        output.append({
            "estimate_id": est.id,
            "case_id": est.case_id,
            "case_title": case.title,
            "total_cost": est.total_cost,
            "status": est.status
        })
        
    return output

@router.get("/admin/transactions", response_model=List[TransactionSchema])
async def get_transactions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "Admin":
         raise HTTPException(status_code=403, detail="Not authorized")
    # Check if empty, seed a few for demo
    count = db.query(TransactionModel).count()
    if count == 0:
        # Seed mock transactions
        mock_txs = [
            TransactionModel(id="tx-001", user_id="u1", user_name="Dr. Mario Sonati", amount=120.00, type="Subscription", status="Paid", date=datetime.datetime.utcnow() - datetime.timedelta(days=1)),
            TransactionModel(id="tx-002", user_id="u2", user_name="Aram Ghannad", amount=45.00, type="Consultation", status="Paid", date=datetime.datetime.utcnow() - datetime.timedelta(days=2)),
            TransactionModel(id="tx-003", user_id="u3", user_name="Dr. Sarah Lee", amount=250.00, type="Subscription", status="Pending", date=datetime.datetime.utcnow() - datetime.timedelta(days=2)),
            TransactionModel(id="tx-004", user_id="u4", user_name="Patient #442", amount=30.00, type="AI Analysis", status="Paid", date=datetime.datetime.utcnow() - datetime.timedelta(days=3))
        ]
        for tx in mock_txs:
            db.add(tx)
        db.commit()
    
    return db.query(TransactionModel).order_by(TransactionModel.date.desc()).all()

from ..services.paypal_service import PayPalService
from ..models import User as UserModel

@router.post("/paypal/create-order")
async def create_paypal_order(amount: float, currency: str = "USD", user: UserModel = Depends(get_current_user)):
    service = PayPalService()
    try:
        order = await service.create_order(amount, currency)
        return order
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/paypal/capture-order")
async def capture_paypal_order(order_id: str, db: Session = Depends(get_db), user: UserModel = Depends(get_current_user)):
    service = PayPalService()
    try:
        capture = await service.capture_order(order_id)
        
        # If successful, add credits or handle logic
        if capture.get("status") == "COMPLETED":
            # Logic: 1 USD = 10 Credits (Example)
            units = capture.get("purchase_units", [{}])[0]
            amount_str = units.get("payments", {}).get("captures", [{}])[0].get("amount", {}).get("value", "0")
            amount = float(amount_str)
            
            credits_to_add = int(amount * 10) # 10 credits per dollar
            user.credits += credits_to_add
            
            # Log transaction
            new_tx = TransactionModel(
                id=f"tx-{order_id}",
                user_id=user.id,
                user_name=user.name,
                amount=amount,
                type="Subscription", # Or "Credit Purchase"
                status="Paid",
                date=datetime.datetime.utcnow()
            )
            db.add(new_tx)
            db.commit()
            return {"status": "success", "new_credits": user.credits, "capture": capture}
            
        return {"status": "failed", "capture": capture}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from ..services.stripe_service import StripeService

@router.post("/stripe/create-payment-intent")
async def create_stripe_payment(amount: float, currency: str = "usd", user: UserModel = Depends(get_current_user)):
    service = StripeService()
    return await service.create_payment_intent(amount, currency)

@router.post("/stripe/verify-payment")
async def verify_stripe_payment(intent_id: str, db: Session = Depends(get_db), user: UserModel = Depends(get_current_user)):
    service = StripeService()
    intent = await service.retrieve_payment_intent(intent_id)
    
    if intent.status == "succeeded":
        # Check if already processed to prevent duplicates (ideally lookup tx ID)
        existing = db.query(TransactionModel).filter(TransactionModel.id == f"tx-{intent.id}").first()
        if existing:
            return {"status": "success", "message": "Already processed", "new_credits": user.credits}

        amount = intent.amount / 100.0
        credits_to_add = int(amount * 10) # 10 credits per dollar
        user.credits += credits_to_add
        
        new_tx = TransactionModel(
            id=f"tx-{intent.id}",
            user_id=user.id,
            user_name=user.name,
            amount=amount,
            type="Credit Purchase",
            status="Paid",
            date=datetime.datetime.utcnow()
        )
        db.add(new_tx)
        db.commit()
        return {"status": "success", "new_credits": user.credits}
    else:
        return {"status": "pending", "message": "Payment not yet succeeded"}

@router.post("/stripe/connect-account")
async def create_connect_account(email: str = None, user: UserModel = Depends(get_current_user)):
    """
    Onboards a user (e.g. Pharmacy/Insurance) to Stripe Connect to receive payouts.
    """
    if user.role not in ["Admin", "Pharmacy", "Insurance"]: 
         pass # Allow for dev
         
    service = StripeService()
    email_to_use = email or user.email
    account = await service.create_connected_account(email_to_use)
    
    # Generate Link
    frontend_url = settings.FRONTEND_URL
    link = await service.create_account_link(
        account.id, 
        refresh_url=f"{frontend_url}/admin/finance", 
        return_url=f"{frontend_url}/admin/finance"
    )
    
    return {"account_id": account.id, "onboarding_url": link.url}
