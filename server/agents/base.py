from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..models import User

class BaseAgent(ABC):
    """
    Abstract Base Class for all specialized agents.
    Ensures a consistent interface for the Orchestrator.
    """
    
    def __init__(self, name: str, role: str, description: str):
        self.name = name
        self.role = role # e.g., "Nurse", "Doctor", "Billing"
        self.description = description
    
    @abstractmethod
    def can_handle(self, task_type: str) -> bool:
        """Determines if this agent can handle the specific task type."""
        pass

    @abstractmethod
    async def process(self, task: str, payload: Dict[str, Any], context: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """
        Main execution method.
        :param task: The specific action (e.g., 'triage', 'diagnose')
        :param payload: Input data (case_id, patient_data, etc.)
        :param context: Request context (user info, previous messages)
        :param db: Database session
        """
        pass

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "role": self.role,
            "description": self.description
        }
