from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import CostEstimate, Case as CaseModel
from ..schemas import CostEstimate as CostEstimateSchema
import uuid
import datetime

router = APIRouter()

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
    
    if current_status == "Draft" or current_status == "Estimated":
        estimate.status = "Pending Nurse Review"
    
    elif current_status == "Pending Nurse Review":
        if current_user.role not in ["Nurse", "Admin"]:
             raise HTTPException(status_code=403, detail="Only Nurses or Admins can approve at this stage")
        # If Admin approves, does it skip to Insurance? Or to Admin Review?
        # Let's say if Admin approves nurse stage, it goes to Pending Insurance (skips Admin Review self-check)
        # OR just standard flow:
        estimate.status = "Pending Admin Review"
        if current_user.role == "Admin":
            # Auto-progress if Admin is doing the Nurse's job?
            estimate.status = "Pending Insurance Approval"
        
    elif current_status == "Pending Admin Review":
        if current_user.role != "Admin":
             raise HTTPException(status_code=403, detail="Only Admins can approve at this stage")
        estimate.status = "Pending Insurance Approval"
        
        # Mock Insurance Integration (Auto-approve for demo)
        # In real world, this would trigger an external API
        estimate.status = "Pending Patient Approval"
        
    elif current_status == "Pending Patient Approval":
        # Any authorized user can "mark" it as approved by patient for now?
        # Or strictly the patient? 
        # Let's allow Doctor/Admin to record patient approval too.
        estimate.status = "Approved"
        
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
