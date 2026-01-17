from typing import Dict, Any, List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import random

import server.models as models
# HealthIntegration, HealthData accessed via models.*
from .base import BaseAgent

class IntegrationAgent(BaseAgent):
    """
    Agent responsible for managing third-party health integrations (Samsung, Apple, etc.).
    It acts as a 'Service Bus' handler, normalizing incoming data and managing OAuth states.
    """
    def __init__(self):
        super().__init__(
            name="IntegrationBot",
            role="IntegrationSpecialist",
            description="Manages connections and data sync with external health providers."
        )

    def can_handle(self, task_type: str) -> bool:
        return task_type in ["connect_provider", "sync_data", "disconnect_provider", "get_status"]

    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        if task == "connect_provider":
            return self._connect_provider(payload, context, db)
        elif task == "sync_data":
            return await self._sync_data(payload, context, db)
        elif task == "get_status":
            return self._get_status(payload, context, db)
        elif task == "disconnect_provider":
            return self._disconnect_provider(payload, context, db)
        else:
            return {"error": f"Unknown task: {task}"}

    def _connect_provider(self, payload: Dict[str, Any], context: Dict[str, Any], db: Session):
        user_id = context.get("user_id")
        provider = payload.get("provider")
        
        if not user_id or not provider:
            return {"status": "error", "message": "Missing user_id or provider"}

        # Check existing
        existing = db.query(models.HealthIntegration).filter_by(user_id=user_id, provider=provider).first()
        if existing:
            existing.status = "active"
            existing.last_sync_timestamp = datetime.utcnow()
            db.commit()
            return {"status": "success", "message": f"Reconnected to {provider}", "integration_id": existing.id}

        # Create new connection (Simulation of OAuth success)
        new_integration = models.HealthIntegration(
            id=str(uuid.uuid4()),
            user_id=user_id,
            provider=provider,
            status="active",
            access_token=f"mock_token_{random.randint(1000,9999)}",
            last_sync_timestamp=datetime.utcnow()
        )
        db.add(new_integration)
        db.commit()
        
        return {"status": "success", "message": f"Successfully connected to {provider}", "integration_id": new_integration.id}

    async def _sync_data(self, payload: Dict[str, Any], context: Dict[str, Any], db: Session):
        user_id = context.get("user_id")
        
        integrations = db.query(models.HealthIntegration).filter_by(user_id=user_id, status="active").all()
        synced_count = 0
        
        for integ in integrations:
            # Mock Data Fetch based on Provider
            new_data = self._fetch_mock_data(integ.provider)
            
            for item in new_data:
                # Deduplicate based on timestamp (simple check)
                exists = db.query(models.HealthData).filter_by(
                    user_id=user_id, 
                    integration_id=integ.id, 
                    data_type=item['type'],
                    source_timestamp=item['timestamp']
                ).first()
                
                if not exists:
                    hd = models.HealthData(
                        user_id=user_id,
                        integration_id=integ.id,
                        data_type=item['type'],
                        value=item['value'],
                        unit=item['unit'],
                        source_timestamp=item['timestamp']
                    )
                    db.add(hd)
                    synced_count += 1
            
            integ.last_sync_timestamp = datetime.utcnow()
            
        db.commit()
        return {"status": "success", "synced_records": synced_count}

    def _get_status(self, payload: Dict[str, Any], context: Dict[str, Any], db: Session):
        user_id = context.get("user_id")
        integrations = db.query(models.HealthIntegration).filter_by(user_id=user_id).all()
        
        return {
            "integrations": [
                {
                    "provider": i.provider,
                    "status": i.status,
                    "last_sync": i.last_sync_timestamp.isoformat() if i.last_sync_timestamp else None
                }
                for i in integrations
            ]
        }
        
    def _disconnect_provider(self, payload: Dict[str, Any], context: Dict[str, Any], db: Session):
        user_id = context.get("user_id")
        provider = payload.get("provider")
        
        integ = db.query(models.HealthIntegration).filter_by(user_id=user_id, provider=provider).first()
        if integ:
            integ.status = "disconnected"
            db.commit()
            return {"status": "success", "message": f"Disconnected {provider}"}
        return {"status": "error", "message": "Integration not found"}

    def _fetch_mock_data(self, provider: str) -> List[Dict]:
        """
        Simulates fetching data from specific APIs.
        """
        data = []
        now = datetime.utcnow()
        
        if provider == "samsung_health":
            # Samsung: Steps, Heart Rate
            data.append({"type": "steps", "value": random.randint(500, 2000), "unit": "count", "timestamp": now})
            data.append({"type": "heart_rate", "value": random.randint(60, 100), "unit": "bpm", "timestamp": now})
            
        elif provider == "apple_health":
            # Apple: Sleep, Steps
            data.append({"type": "sleep_minutes", "value": random.randint(300, 500), "unit": "minutes", "timestamp": now - timedelta(hours=8)})
            data.append({"type": "steps", "value": random.randint(300, 1500), "unit": "count", "timestamp": now})
            
        elif provider == "withings":
            # Withings: Weight, BP
            data.append({"type": "weight", "value": random.uniform(60, 90), "unit": "kg", "timestamp": now})
            data.append({"type": "systolic_bp", "value": random.randint(110, 140), "unit": "mmHg", "timestamp": now})
            
        elif provider == "chatgpt_health":
            # ChatGPT Health: Digital Twin Data
            # Note: Real implementation would parse JSON exports from the user's ChatGPT Health archives
            data.append({"type": "mental_wellbeing_score", "value": random.randint(7, 10), "unit": "scale_1_10", "timestamp": now})
            data.append({"type": "sleep_quality_index", "value": random.randint(70, 95), "unit": "index", "timestamp": now})
            data.append({"type": "dietary_adherence_score", "value": random.randint(80, 100), "unit": "percentage", "timestamp": now})

        return data
