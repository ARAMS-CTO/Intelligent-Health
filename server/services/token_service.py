from sqlalchemy.orm import Session
from ..models import TokenWallet, TokenTransaction, ResearchGroup, ResearchContribution, User
from datetime import datetime
import uuid

class TokenService:
    def __init__(self, db: Session):
        self.db = db

    def get_wallet(self, user_id: str):
        wallet = self.db.query(TokenWallet).filter(TokenWallet.user_id == user_id).first()
        if not wallet:
            wallet = TokenWallet(user_id=user_id, balance=0.0, total_earned=0.0)
            self.db.add(wallet)
            self.db.commit()
            self.db.refresh(wallet)
        return wallet

    def issue_reward(self, user_id: str, amount: float, reason: str, entity_id: str = None):
        wallet = self.get_wallet(user_id)
        
        # Frequency Cap for Daily Login
        if reason == "Daily Login Bonus":
            start_of_day = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            existing = self.db.query(TokenTransaction).filter(
                TokenTransaction.wallet_id == user_id,
                TokenTransaction.description == reason,
                TokenTransaction.timestamp >= start_of_day
            ).first()
            if existing:
                return wallet  # Already rewarded today
        
        # 1. Platform Fee (10% Reserved - logic could be more complex, e.g. taken from revenue source, here simulated)
        # Assuming 'amount' is net reward to user.
        
        wallet.balance += amount
        wallet.total_earned += amount
        wallet.updated_at = datetime.utcnow()
        
        tx = TokenTransaction(
            id=str(uuid.uuid4()),
            wallet_id=user_id,
            amount=amount,
            type="Reward",
            description=reason,
            related_entity_id=entity_id,
            timestamp=datetime.utcnow()
        )
        
        self.db.add(tx)
        self.db.commit()
        return wallet

    def create_research_group(self, creator_id: str, name: str, topic: str, members: list):
        # Validate composition: Minimum 1 Doctor, 1 Nurse, 1 Patient
        roles = {"Doctor": 0, "Nurse": 0, "Patient": 0}
        
        all_members = members + [creator_id]
        users = self.db.query(User).filter(User.id.in_(all_members)).all()
        
        for u in users:
            if u.role in roles:
                roles[u.role] += 1
                
        # if roles["Doctor"] < 1 or roles["Nurse"] < 1 or roles["Patient"] < 1:
        #     raise ValueError("Group must have at least 1 Doctor, 1 Nurse, and 1 Patient.")

        group = ResearchGroup(
            id=str(uuid.uuid4()),
            name=name,
            topic=topic,
            creator_id=creator_id,
            members=list(set(all_members)), # Unique
            created_at=datetime.utcnow()
        )
        self.db.add(group)
        self.db.commit()
        return group

    def join_research_group(self, group_id: str, user_id: str):
        group = self.db.query(ResearchGroup).filter(ResearchGroup.id == group_id).first()
        if not group:
            raise ValueError("Group not found")
            
        if user_id not in group.members:
            # SQLAlchemy mutable array needs explicit re-assignment or flag modification often, 
            # or simple re-assign for JSON types
            new_members = list(group.members)
            new_members.append(user_id)
            group.members = new_members
            self.db.commit()
        return group

    def log_contribution(self, group_id: str, contributor_id: str, data_type: str, data_id: str, quality: float):
        # Logic: Reward based on quality
        # Base value of a data point (e.g. 100 Tokens)
        base_value = 100.0 
        
        # 10% Platform Fee reserved immediately from the 'value' generated
        platform_fee = base_value * 0.10
        distributable_value = base_value - platform_fee
        
        # User gets a share based on quality (0.0 - 1.0)
        # If quality is 1.0, they get the full distributable amount.
        actual_reward = distributable_value * quality
        
        contribution = ResearchContribution(
            id=str(uuid.uuid4()),
            group_id=group_id,
            contributor_id=contributor_id,
            data_type=data_type,
            data_id=data_id,
            quality_score=quality,
            tokens_awarded=actual_reward,
            timestamp=datetime.utcnow()
        )
        
        self.db.add(contribution)
        
        # Update Group Stats
        group = self.db.query(ResearchGroup).filter(ResearchGroup.id == group_id).first()
        if group:
            group.total_tokens_generated += actual_reward
        
        # Issue Tokens
        self.issue_reward(contributor_id, actual_reward, f"Research Contribution: {data_type} (Quality: {quality:.2f})", data_id)
        
        return contribution
