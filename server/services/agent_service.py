import json
import os
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
import uuid
from datetime import datetime
import server.models as models
from ..config import settings
import google.generativeai as genai

# Initialize Gemini Client for legacy SDK
API_KEY = settings.GEMINI_API_KEY
if API_KEY:
    genai.configure(api_key=API_KEY)

# --- Vector Store Strategy ---
class VectorStore:
    def add(self, user_id: str, text: str, metadata: Dict[str, Any]): raise NotImplementedError
    def query(self, user_id: str, query_text: str, n_results: int) -> List[str]: raise NotImplementedError
    def get_embedding(self, text: str) -> List[float]: return []

# --- USearch Implementation (High Performance RAG) ---
try:
    from usearch.index import Index
    import numpy as np
    usearch_available = True
except ImportError:
    usearch_available = False
    print("WARNING: USearch/Numpy not found. RAG might be limited.")

class USearchVectorStore(VectorStore):
    def __init__(self):
        self.data_path = "server/data/rag_metadata.json"
        self.index_path = "server/data/rag_index.usearch"
        self.ndim = 768 # Gemini Embedding Dimensions
        os.makedirs("server/data", exist_ok=True)
        
        # Initialize Metadata Store
        if os.path.exists(self.data_path):
            with open(self.data_path, 'r') as f:
                self.metadata_store = json.load(f)
        else:
            self.metadata_store = {} # Key: str(id), Value: {text, metadata, user_id}

        # Initialize Index
        try:
            self.index = Index(ndim=self.ndim, metric="cos")
            if os.path.exists(self.index_path):
                self.index.load(self.index_path)
        except Exception as e:
            print(f"USearch Init Error: {e}")
            self.index = None

    def get_embedding(self, text: str) -> List[float]:
        if not API_KEY: return []
        try:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            print(f"Embedding Failed: {e}")
            return []

    def _save_metadata(self):
        with open(self.data_path, 'w') as f:
            json.dump(self.metadata_store, f)

    def add(self, user_id: str, text: str, metadata: Dict[str, Any]):
        if self.index is None: return
        
        # Create unique integer ID for USearch (simple hash or incremental)
        # Using simple hash of text + user_id collision prone but okay for demo, 
        # better to use incremental or mapped ID.
        # Let's use simple incremental based on current store size.
        
        # Check duplicates in metadata to avoid re-embedding
        for k, v in self.metadata_store.items():
            if v['user_id'] == user_id and v['text'] == text:
                return

        vector = self.get_embedding(text)
        if not vector: return
        
        # Generate ID
        import random
        doc_id = int(str(uuid.uuid4().int)[:16]) # USearch uses 64-bit integers usually
        # Ensure positive
        
        self.index.add(doc_id, np.array(vector, dtype=np.float32))
        self.index.save(self.index_path)
        
        self.metadata_store[str(doc_id)] = {
            "text": text,
            "metadata": metadata,
            "user_id": user_id
        }
        self._save_metadata()

    def query(self, user_id: str, query_text: str, n_results: int) -> List[str]:
        if self.index is None or len(self.metadata_store) == 0: return []
        
        query_vector = self.get_embedding(query_text)
        if not query_vector: return []
        
        # Search global index
        matches = self.index.search(np.array(query_vector, dtype=np.float32), n_results * 5) # Fetch more to filter by user
        
        results = []
        for match_id in matches.keys:
            doc = self.metadata_store.get(str(match_id))
            if doc and doc['user_id'] == user_id:
                results.append(doc['text'])
                if len(results) >= n_results:
                    break
                    
        return results

# --- Optimized Google Cloud Vector Store (Legacy SDK) ---
class VertexAIVectorStore(VectorStore):
    def __init__(self):
        self.project_id = settings.GOOGLE_CLOUD_PROJECT
        self.location = "us-central1"
        self.index_endpoint = settings.VERTEX_AI_INDEX_ENDPOINT
        
    def get_embedding(self, text: str) -> List[float]:
        try:
            if not API_KEY: return []
            # Legacy SDK embedding call
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            print(f"Embedding error: {e}")
            return []

    def add(self, user_id: str, text: str, metadata: Dict[str, Any]):
        # In a real heavy-duty setup, this would push to Vertex AI Vector Search
        # For now, we fallback to local storage or just logging
        print(f"[VertexAI Optimization] Computed embedding for storage: {text[:20]}...")

    def query(self, user_id: str, query_text: str, n_results: int) -> List[str]:
        return []

class SimpleJSONVectorStore(VectorStore):
    def __init__(self):
        self.path = "server/data/user_knowledge.json"
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        if not os.path.exists(self.path):
            with open(self.path, 'w') as f:
                json.dump({}, f)
    
    def _load(self):
        try:
            with open(self.path, 'r') as f:
                return json.load(f)
        except: return {}

    def _save(self, data):
        with open(self.path, 'w') as f:
            json.dump(data, f)
            
    def add(self, user_id: str, text: str, metadata: Dict[str, Any]):
        data = self._load()
        if user_id not in data:
            data[user_id] = []
        
        # Avoid duplicates
        for item in data[user_id]:
            if item['text'] == text:
                return
                
        data[user_id].append({
            "text": text,
            "metadata": metadata,
            "id": str(uuid.uuid4())
        })
        self._save(data)
        
    def query(self, user_id: str, query_text: str, n_results: int) -> List[str]:
        data = self._load()
        user_data = data.get(user_id, [])
        if not user_data: return []
        
        import re
        def tokenize(text):
            return set(re.findall(r'\w+', text.lower()))
            
        # Simple keyword overlap scoring
        query_words = tokenize(query_text)
        scored = []
        for item in user_data:
            text_words = tokenize(item['text'])
            overlap = len(query_words.intersection(text_words))
            scored.append((overlap, item['text']))
            
        # Sort by score desc, filter 0 overlap
        scored.sort(key=lambda x: x[0], reverse=True)
        return [s[1] for s in scored if s[0] > 0][:n_results]

# Select Store
if usearch_available:
    try:
        vector_store = USearchVectorStore()
        print("Using USearchVectorStore for RAG")
    except Exception as e:
        print(f"Fallback to SimpleJSONVectorStore: {e}")
        vector_store = SimpleJSONVectorStore()
else:
    print("Using SimpleJSONVectorStore")
    vector_store = SimpleJSONVectorStore()

class AgentService:
    def __init__(self):
        self.vector_store = vector_store

    def get_agent_state(self, user_id: str, db: Session) -> Dict[str, Any]:
        state = db.query(models.AgentState).filter(models.AgentState.user_id == user_id).first()
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
        state = db.query(models.AgentState).filter(models.AgentState.user_id == user_id).first()
        if not state:
            state = models.AgentState(user_id=user_id, preferences=preferences)
            db.add(state)
        else:
            current_prefs = dict(state.preferences) if state.preferences else {}
            current_prefs.update(preferences)
            state.preferences = current_prefs
        db.commit()

    def add_learning_point(self, user_id: str, point: str, db: Session):
        state = db.query(models.AgentState).filter(models.AgentState.user_id == user_id).first()
        if not state:
            state = models.AgentState(user_id=user_id, learning_points=[point])
            db.add(state)
        else:
            points = list(state.learning_points) if state.learning_points else []
            if point not in points:
                points.append(point)
                state.learning_points = points
        db.commit()
        
        # Also index as knowledge
        self.vector_store.add(user_id, point, {"type": "learning_point", "source": "interaction", "timestamp": datetime.utcnow().isoformat()})
        print(f"Agent learned for {user_id}: {point}")

    def add_preference(self, user_id: str, text: str):
        """
        Explicitly adds a user preference to the vector store.
        """
        self.vector_store.add(user_id, f"User Preference: {text}", {"type": "preference", "timestamp": datetime.utcnow().isoformat()})

    def add_knowledge(self, user_id: str, text: str, metadata: Dict[str, Any], db: Session = None):
        """
        Adds knowledge to both the Vector Store (for RAG) and the Database (KnowledgeItem) for persistence.
        """
        # 1. Add to Vector Store
        self.vector_store.add(user_id, text, metadata)
        
        # 2. Add to Database
        if db:
            try:
                # Check for duplications based on content hash or similar? 
                # for now, simple check if we just added it to vector store and it was new
                # We'll valid duplicate text check in DB
                existing = db.query(models.KnowledgeItem).filter(
                    models.KnowledgeItem.user_id == user_id,
                    models.KnowledgeItem.content == text
                ).first()
                
                if not existing:
                    # Determine ID from vector store or new UUID
                    k_item = models.KnowledgeItem(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        content=text,
                        metadata_=metadata
                    )
                    db.add(k_item)
                    db.commit()
            except Exception as e:
                print(f"Failed to persist KnowledgeItem to DB: {e}")
                db.rollback()
        
    def index_medical_record(self, user_id: str, record_id: str, content: str, summary: str):
        """
        Indexes a medical record for RAG retrieval.
        """
        text = f"Medical Record ({record_id}): {summary}\nDetails: {content}"
        self.vector_store.add(user_id, text, {"type": "medical_record", "record_id": record_id, "timestamp": datetime.utcnow().isoformat()})

    def retrieve_context(self, user_id: str, query: str, n_results: int = 3) -> str:
        results = self.vector_store.query(user_id, query, n_results)
        if results:
            return "\n".join(results)
        return ""

    def retrieve_lessons(self, query: str, n_results: int = 3) -> str:
        """
        Retrieves global lessons learned from previous cases.
        """
        results = self.vector_store.query("SYSTEM_LEARNING", query, n_results)
        if results:
            return "\n".join(results)
        return ""

    def get_pinned_knowledge(self, user_id: str, db: Session) -> str:
        """
        Retrieves 'pinned' knowledge items from the database. 
        These are high-priority context items explicitly marked by the user.
        """
        try:
            # Filter where metadata_ contains 'pinned': True
            # JSON querying depends on DB backend. For SQLite/Generic, we fetch all and filter in python for now.
            items = db.query(models.KnowledgeItem).filter(models.KnowledgeItem.user_id == user_id).all()
            pinned_content = []
            for item in items:
                if item.metadata_ and item.metadata_.get("pinned") == True:
                    pinned_content.append(item.content)
            
            if pinned_content:
                return "\n".join(pinned_content)
        except Exception as e:
            print(f"Error fetching pinned knowledge: {e}")
        return ""

    def get_system_instruction(self, user_id: str, role: str, db: Session, context_query: Optional[str] = None) -> str:
        """
        Constructs the personalized system prompt for the AI.
        """
        state = self.get_agent_state(user_id, db)
        preferences_from_db = state.get("preferences", {})
        learning_points_from_db = state.get("learning_points", [])
        
        # Fetch detailed User Profile
        from ..models import User
        user = db.query(User).filter(User.id == user_id).first()
        
        user_details = f"- Role: {role}\n- ID: {user_id}"
        if user:
            if user.name:
                user_details += f"\n- Name: {user.name}"
            # Add specialty if doctor
            if user.doctor_profile:
                 user_details += f"\n- Specialty: {user.doctor_profile.specialty}"

        if user and user.patient_profile:
            p = user.patient_profile
            user_details += f"\n- Patient Details: Age {p.dob} (DOB), Sex {p.sex}, Blood {p.blood_type}"
            if p.baseline_illnesses:
                user_details += f"\n- Chronic Conditions: {', '.join(p.baseline_illnesses)}"
            if p.allergies:
                user_details += f"\n- Allergies: {', '.join(p.allergies)}"
        
        # Structured System Instruction
        instruction = f"""## Role
You are an expert AI medical assistant designed to help a {role}. You provide clinical insights, documentation assistance, and data analysis.
You have access to the user's preferences and past interactions to personalize your support.
You also have access to the user's medical history via RAG (Retrieval Augmented Generation).

## Capabilities
- Get User Details: You can request detailed user information if needed.
- Triage: Auto-triage symptoms based on collected data.
- Lab Analysis: Interpret lab results in the context of the user's history.

## User Context
{user_details}
"""
        # 1. Preferences from DB (legacy)
        if preferences_from_db:
            instruction += f"- Preferences (from DB): {json.dumps(preferences_from_db)}\n"
            if "tone" in preferences_from_db:
                instruction += f"- Preferred Tone (from DB): {preferences_from_db['tone']}\n"
        
        # 2. Learning Points from DB (legacy)
        if learning_points_from_db:
            instruction += f"- User Learning History (from DB): {'; '.join(learning_points_from_db[-5:])}\n" # Limit to last 5 for relevance

        # 3. Retrieve Preferences from Vector Store
        retrieved_preferences = self.vector_store.query(user_id, "user preference style format how I like to work", n_results=3)
        if retrieved_preferences:
             instruction += f"\n## Doc's Personalization:\n" + "\n".join([f"- {p}" for p in retrieved_preferences])

        # 4. Pinned Knowledge (CAG - Context Augmentation)
        pinned = self.get_pinned_knowledge(user_id, db)
        if pinned:
            instruction += f"\n## Critical Guidelines (Pinned):\n{pinned}\n"

        # 5. Retrieve Knowledge / Context (RAG) from Vector Store
        if context_query:
            # We augment the context query with user role/specialty to get better matches
            expanded_query = f"{context_query} context for {role}"
            retrieved = self.retrieve_context(user_id, expanded_query, n_results=5) # Increased context window
            if retrieved:
                instruction += f"\n## Relevant Medical Knowledge (RAG)\n{retrieved}\n"
        
        instruction += "\n## Guidelines\n- Be concise and precise.\n- Prioritize patient safety.\n- Cite guidelines where applicable.\n- If you don't know something, ask for clarification or suggest a tool."
            
        return instruction

agent_service = AgentService()
