import json
import os
from typing import Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..models import AgentState as AgentStateModel

try:
    import chromadb
    from chromadb.utils import embedding_functions
    chroma_available = True
except ImportError:
    chromadb = None
    chroma_available = False
    print("WARNING: ChromaDB not found. RAG disabled.")

import uuid

# Initialize ChromaDB (persistent)
CHROMA_DATA_PATH = "server/data/chroma_db"
os.makedirs(CHROMA_DATA_PATH, exist_ok=True)

collection = None
if chroma_available:
    try:
        chroma_client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)
        collection = chroma_client.get_or_create_collection(name="user_knowledge")
    except Exception as e:
        print(f"WARNING: ChromaDB initialization failed. RAG features will be disabled. Error: {e}")

class AgentService:
    def __init__(self):
        pass

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
        # 1. Update SQL State
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
        
        # 2. Add to Vector DB for RAG
        self.add_knowledge(user_id, point, {"type": "learning_point", "source": "interaction"})

    def add_knowledge(self, user_id: str, text: str, metadata: Dict[str, Any]):
        if not collection:
            return
            
        doc_id = str(uuid.uuid4())
        # Add user_id to metadata for filtering
        meta = metadata.copy()
        meta["user_id"] = user_id
        
        try:
            collection.add(
                documents=[text],
                metadatas=[meta],
                ids=[doc_id]
            )
        except Exception as e:
            print(f"Error adding to ChromaDB: {e}")

    def retrieve_context(self, user_id: str, query: str, n_results: int = 3) -> str:
        if not collection:
            return ""
            
        try:
            results = collection.query(
                query_texts=[query],
                n_results=n_results,
                where={"user_id": user_id}
            )
            
            if results and results['documents']:
                # Flatten the list of lists
                docs = [doc for sublist in results['documents'] for doc in sublist]
                return "\n".join(docs)
            return ""
        except Exception as e:
            print(f"RAG Retrieval Error: {e}")
            return ""

    def get_system_instruction(self, user_id: str, role: str, db: Session, context_query: Optional[str] = None) -> str:
        state = self.get_agent_state(user_id, db)
        preferences = state.get("preferences", {})
        learning_points = state.get("learning_points", [])
        
        instruction = f"You are a helpful AI assistant for a {role}."
        
        if preferences:
            instruction += f"\nUser Preferences: {json.dumps(preferences)}"
        
        # Add explicit learning points (recent ones)
        if learning_points:
            instruction += f"\nThings you've learned about this user: {'; '.join(learning_points)}"
            
        # Add RAG context if query provided
        if context_query:
            retrieved = self.retrieve_context(user_id, context_query)
            if retrieved:
                instruction += f"\nRelevant Context from Memory:\n{retrieved}"
            
        return instruction

    def get_system_instruction_context(self, user_id: str, role: str) -> str:
        return f"You are an expert medical AI assistant helping a {role}."

agent_service = AgentService()
