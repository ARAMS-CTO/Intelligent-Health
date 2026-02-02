
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from server.database import get_db
from server.services.commerce_service import CommerceService
from pydantic import BaseModel
from typing import List, Optional, Any

router = APIRouter(prefix="/api/commerce/ucp", tags=["Commerce - UCP"])

# --- Request Models ---
class CartItem(BaseModel):
    product_id: str
    quantity: int

class SessionRequest(BaseModel):
    cart_items: List[CartItem]
    user_context: Optional[dict] = None

class Address(BaseModel):
    line1: str
    city: str
    state: str
    postal_code: str
    country: str

class UpdateSessionRequest(BaseModel):
    shipping_address: Optional[Address] = None
    email: Optional[str] = None

class CompleteOrderRequest(BaseModel):
    session_id: str
    payment_token: str # Mock token
    total_authorized_amount: float
    items: List[dict] # Final list of items
    shipping_address: Optional[Address] = None
    user_id: Optional[str] = None

# --- Endpoints ---

@router.post("/session")
async def start_session(request: SessionRequest, db: Session = Depends(get_db)):
    """
    Google Agent calls this to start a checkout flow (Check Availability).
    """
    svc = CommerceService(db)
    try:
        session_data = svc.create_session([item.dict() for item in request.cart_items])
        return {"status": "success", "session": session_data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/session/{session_id}")
async def update_session(session_id: str, request: UpdateSessionRequest):
    """
    Google Agent calls this to update shipping address and get tax/shipping costs.
    """
    # Simply calculate mock tax/shipping based on logic
    shipping_cost = 5.99
    tax_rate = 0.08
    
    # In a real implementation, we would fetch the session from cache/db and recalculate.
    # For this Agentic Demo, we return updated metadata.
    
    return {
        "status": "success",
        "updates": {
            "shipping_methods": [
                {"id": "std", "name": "Standard Shipping", "cost": 5.99, "estimated_days": 3},
                {"id": "exp", "name": "Express", "cost": 15.99, "estimated_days": 1}
            ],
            "tax_rate": tax_rate
        }
    }

@router.post("/complete")
async def complete_order(request: CompleteOrderRequest, db: Session = Depends(get_db)):
    """
    Google Agent calls this to finalize the purchase.
    """
    svc = CommerceService(db)
    try:
        # Verify amount matches (simplified)
        order = svc.create_order(
            session_id=request.session_id,
            items=request.items,
            total=request.total_authorized_amount,
            user_id=request.user_id,
            shipping_address=request.shipping_address.dict() if request.shipping_address else None
        )
        return {"status": "success", "order_id": order.id, "message": "Transaction Completed"}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.post("/seed")
async def seed_inventory(db: Session = Depends(get_db)):
    svc = CommerceService(db)
    svc.seed_initial_products()
    return {"message": "Seeded products"}

@router.get("/products")
async def list_products(db: Session = Depends(get_db)):
    from server.models import Product
    return db.query(Product).all()

# --- Cost Transparency Engine ---

@router.get("/cost/estimate")
async def get_procedure_cost(
    procedure_id: str, 
    country: str = "USA",
    tier: str = "Standard",
    db: Session = Depends(get_db)
):
    """
    Real-time cost estimation based on Standardized Procedure Database.
    Calculates Conficence Score based on data density (simulated).
    """
    import os
    import json
    
    # Load DB
    try:
        # Assuming running from root
        file_path = os.path.join("server", "data", "procedures_db.json")
        if not os.path.exists(file_path):
             # Fallback for Docker path variation
             file_path = "procedures_db.json"
             
        with open(file_path, "r") as f:
            proc_db = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Knowledge Base Error: {e}")

    proc = proc_db.get(procedure_id)
    if not proc:
        raise HTTPException(status_code=404, detail="Procedure not found in Knowledge Base")
        
    # Logic
    base = proc.get("base_cost_usd", 0)
    multiplier = proc.get("country_multipliers", {}).get(country, 1.0)
    
    # Tier Multiplier
    tier_mult = 1.0
    if tier == "Basic": tier_mult = 0.8
    elif tier == "Premium": tier_mult = 1.5
    
    estimated_cost = base * multiplier * tier_mult
    
    # Confidence Score Calculation (Deterministic)
    # Simulator: "USA" has 100% data, others have less
    data_points = 1000 if country == "USA" else 300
    if country in ["India", "Thailand"]: data_points = 800 # High medical tourism data
    
    confidence = min(98, int((data_points / 1000) * 100))
    
    return {
        "procedure_name": proc["name"],
        "country": country,
        "tier": tier,
        "estimated_cost": int(estimated_cost),
        "currency": "USD",
        "confidence_score": confidence,
        "breakdown": {
            "hospital_fees": int(estimated_cost * 0.6),
            "doctor_fees": int(estimated_cost * 0.25),
            "medication_consumables": int(estimated_cost * 0.15)
        },
        "disclaimer": "AI Generated Estimate based on Global Health Indices 2024. Actual hospital charges may vary."
    }

@router.get("/cost/procedures")
async def list_procedures():
    """Return list of available procedures for the dropdown."""
    import os
    import json
    try:
        file_path = os.path.join("server", "data", "procedures_db.json")
        with open(file_path, "r") as f:
            proc_db = json.load(f)
        
        # Return simplified list
        return [{"id": k, "name": v["name"]} for k, v in proc_db.items()]
    except:
        return []
