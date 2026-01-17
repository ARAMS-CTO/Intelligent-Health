
from sqlalchemy.orm import Session
from server.models import Product, Order
import uuid
import logging

class CommerceService:
    def __init__(self, db: Session):
        self.db = db

    def get_product_by_id(self, product_id: str):
        return self.db.query(Product).filter(Product.id == product_id).first()
    
    def get_product_by_sku(self, sku: str):
        return self.db.query(Product).filter(Product.sku == sku).first()

    def create_session(self, cart_items: list):
        """
        Validates items and prepares a buying session response.
        In UCP, this is the 'Check Availability' / 'Start Session' phase.
        
        Args:
            cart_items: list of dicts {product_id, quantity}
        """
        validated_items = []
        total = 0.0
        
        for item in cart_items:
            product = self.get_product_by_id(item['product_id'])
            if not product:
                continue # Or raise Error
                
            if product.stock_quantity < item['quantity']:
                raise ValueError(f"Insufficient stock for {product.name}")
                
            line_total = product.price * item['quantity']
            total += line_total
            
            validated_items.append({
                 "product_id": product.id,
                 "name": product.name,
                 "price": product.price,
                 "quantity": item['quantity'],
                 "image_url": product.image_url,
                 "sku": product.sku
            })
            
        return {
            "session_id": str(uuid.uuid4()),
            "items": validated_items,
            "subtotal": total,
            "currency": "USD"
        }

    def seed_initial_products(self):
        """Creates sample products if none exist."""
        if self.db.query(Product).count() > 0:
            return


        products = [
            Product(name="Vitamin D3 Complex", description="High potency Vitamin D3 for immune support.", price=24.99, stock_quantity=100, sku="VIT-D3-001", image_url="https://placeholder.com/vitd.jpg"),
            Product(name="Advanced DNA Health Kit", description="Comprehensive genetic analysis for health risks.", price=199.00, stock_quantity=50, sku="DNA-KIT-001", image_url="https://placeholder.com/dna.jpg"),
            Product(name="Smart Blood Pressure Monitor", description="Bluetooth connected BP monitor.", price=89.50, stock_quantity=30, sku="DEV-BP-001", image_url="https://placeholder.com/bp.jpg"),
            Product(name="Telehealth Consultation Credit", description="1 Hour consultation with a specialist.", price=150.00, stock_quantity=999, sku="SVC-CONSULT-001", image_url="https://placeholder.com/doc.jpg"),
        ]
        
        self.db.add_all(products)
        self.db.commit()
        logging.info("Seeded initial products.")

    def create_order(self, session_id: str, items: list, total: float, user_id: str = None, shipping_address: dict = None):
        """Finalizes an order."""
        # Deduct stock
        for item in items:
            product = self.get_product_by_id(item['product_id'])
            if product:
                product.stock_quantity -= item['quantity']
        
        order = Order(
            ucp_session_id=session_id,
            user_id=user_id,
            status="CONFIRMED",
            total_amount=total,
            items=items,
            shipping_address=shipping_address
        )
        self.db.add(order)
        self.db.commit()
        return order
