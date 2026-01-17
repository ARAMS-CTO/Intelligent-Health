from sqlalchemy.orm import Session
from ..models import UserCredits, CreditTransaction, User
from datetime import datetime
import uuid

class CreditService:
    def __init__(self, db: Session):
        self.db = db

    def get_wallet(self, user_id: str):
        wallet = self.db.query(UserCredits).filter(UserCredits.user_id == user_id).first()
        if not wallet:
            # Check for legacy credits on User model?
            user = self.db.query(User).filter(User.id == user_id).first()
            initial_balance = float(user.credits) if user and user.credits else 0.0
            
            wallet = UserCredits(
                user_id=user_id, 
                balance=initial_balance, 
                tier="FREE",
                subscription_status="ACTIVE"
            )
            self.db.add(wallet)
            self.db.commit()
            self.db.refresh(wallet)
        return wallet

    def add_credits(self, user_id: str, amount: float, reason: str):
        print(f"DEBUG: add_credits user={user_id} amount={amount}")
        wallet = self.get_wallet(user_id)
        print(f"DEBUG: Pre-add Balance={wallet.balance}")
        wallet.balance += amount
        print(f"DEBUG: Post-add Balance={wallet.balance}")
        
        tx = CreditTransaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            amount=amount,
            reason=reason,
            timestamp=datetime.utcnow()
        )
        self.db.add(tx)
        
        try:
            self.db.commit()
            print("DEBUG: Commit success")
        except Exception as e:
            print(f"DEBUG: Commit failed: {e}")
            raise e
            
        return wallet

    def deduct_credits(self, user_id: str, amount: float, reason: str):
        wallet = self.get_wallet(user_id)
        
        if wallet.balance < amount:
            raise ValueError("Insufficient credits")
            
        wallet.balance -= amount
        
        tx = CreditTransaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            amount=-amount,
            reason=reason,
            timestamp=datetime.utcnow()
        )
        self.db.add(tx)
        self.db.commit()
        return wallet
