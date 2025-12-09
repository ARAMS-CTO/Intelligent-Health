import json
import os
from typing import Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..models import AgentState as AgentStateModel

DATA_FILE = "server/data/agent_store.json"

class AgentState(BaseModel):
    userId: str
    preferences: Dict[str, Any] = {}
    interaction_history_summary: str = ""
    learning_points: list[str] = []

class AgentService:
    def __init__(self):
        pass # No file loading needed

    def get_agent_state(self, user_id: str, db: Session) -> Dict[str, Any]:
        state = db.query(AgentStateModel).filter(AgentStateModel.user_id == user_id).first()
        if state:
            return {
                "preferences": state.preferences,
                "interaction_history_summary": state.interaction_history_summary,
                "learning_points": state.learning_points
            }
        return {
            "preferences": {},
            "interaction_history_summary": "",
            "learning_points": []
        }

    def update_preferences(self, user_id: str, preferences: Dict[str, Any], db: Session):
        state = db.query(AgentStateModel).filter(AgentStateModel.user_id == user_id).first()
        if not state:
            state = AgentStateModel(user_id=user_id, preferences=preferences)
            db.add(state)
        else:
            # Merge preferences
            current_prefs = dict(state.preferences) if state.preferences else {}
            current_prefs.update(preferences)
            state.preferences = current_prefs
        
        db.commit()

    def add_learning_point(self, user_id: str, point: str, db: Session):
        state = db.query(AgentStateModel).filter(AgentStateModel.user_id == user_id).first()
        if not state:
            state = AgentStateModel(user_id=user_id, learning_points=[point])
            db.add(state)
        else:
            points = list(state.learning_points) if state.learning_points else []
            if point not in points:
                points.append(point)
                state.learning_points = points
        
        db.commit()

    def get_system_instruction(self, user_id: str, role: str, db: Session) -> str:
        state = self.get_agent_state(user_id, db)
        preferences = state.get("preferences", {})
        learning_points = state.get("learning_points", [])
        
        instruction = f"You are a helpful AI assistant for a {role}."
        
        if preferences:
            instruction += f"\nUser Preferences: {json.dumps(preferences)}"
        
        if learning_points:
            instruction += f"\nThings you've learned about this user: {'; '.join(learning_points)}"
            
        return instruction

    def get_system_instruction_context(self, user_id: str, role: str) -> str:
        # Note: This method currently doesn't use DB because it's called from a context where DB session might not be readily available 
        # or it was designed to be lightweight. However, to be consistent, it should ideally use DB.
        # For now, we'll return a generic context or we need to refactor ai.py to pass db here.
        # Looking at ai.py, get_case_insights does NOT inject db. 
        # We should update ai.py to inject db if we want personalization here.
        # For now, returning a static context to fix the crash.
        return f"You are an expert medical AI assistant helping a {role}."

agent_service = AgentService()
