
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
