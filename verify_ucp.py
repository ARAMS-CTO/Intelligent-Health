
from server.database import SessionLocal, Base, engine
from server.services.commerce_service import CommerceService
from server.models import Order
import uuid

# Ensure tables exist for verification
Base.metadata.create_all(bind=engine)

def test_ucp_flow():
    db = SessionLocal()
    try:
        print("\n--- Starting UCP (Commerce) Verification ---")
        svc = CommerceService(db)
        
        # 1. Seed
        svc.seed_initial_products()
        product = svc.get_product_by_sku("VIT-D3-001")
        if not product:
            print("FAILURE: Seeding failed, product not found.")
            return

        print(f"[1] Found Product: {product.name} (${product.price})")
        
        # 2. Start Session (Check Availability)
        print("[2] Creating Buying Session...")
        cart = [{"product_id": product.id, "quantity": 2}]
        try:
            session = svc.create_session(cart)
            print(f"    Session Created: {session['session_id']}")
            print(f"    Subtotal: {session['subtotal']}")
        except ValueError as e:
            print(f"FAILURE: Session creation failed: {e}")
            return

        # 3. Simulate Complete Order
        print("[3] Completing Order...")
        # In real flow, Google sends this back.
        order = svc.create_order(
            session_id=session['session_id'],
            items=session['items'],
            total=session['subtotal'],
            user_id=None, # Guest
            shipping_address={"line1": "123 Google Way", "city": "Mountain View", "state": "CA"}
        )
        print(f"    Order Created: {order.id} (Status: {order.status})")
        
        # 4. Verify DB
        db_order = db.query(Order).filter(Order.id == order.id).first()
        if db_order and db_order.total_amount == 49.98:
             print("SUCCESS: Order persisted correctly.")
        else:
             print("FAILURE: Order mismatch in DB.")

        print("\n--- UCP Verification Complete ---")

    except Exception as e:
        print(f"FAILURE: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_ucp_flow()
