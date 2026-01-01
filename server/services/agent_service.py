import json
import os
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from ..models import AgentState as AgentStateModel
import uuid
# Import the legacy SDK
import google.generativeai as genai

# Initialize Gemini Client for legacy SDK
API_KEY = os.environ.get("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

# --- Vector Store Strategy ---
class VectorStore:
    def add(self, user_id: str, text: str, metadata: Dict[str, Any]): raise NotImplementedError
    def query(self, user_id: str, query_text: str, n_results: int) -> List[str]: raise NotImplementedError

# --- Chroma Implementation (Local / Simple) ---
try:
    import chromadb
    from chromadb.utils import embedding_functions
    chroma_available = True
except ImportError:
    chromadb = None
    chroma_available = False
    print("WARNING: ChromaDB not found. RAG might be limited.")

class ChromaVectorStore(VectorStore):
    def __init__(self):
        if not chroma_available:
            self.collection = None
            return
        
        path = "server/data/chroma_db"
        os.makedirs(path, exist_ok=True)
        try:
            self.client = chromadb.PersistentClient(path=path)
            self.collection = self.client.get_or_create_collection(name="user_knowledge")
        except Exception:
            self.collection = None

    def add(self, user_id: str, text: str, metadata: Dict[str, Any]):
        if not self.collection: return
        doc_id = str(uuid.uuid4())
        meta = metadata.copy()
        meta["user_id"] = user_id
        self.collection.add(documents=[text], metadatas=[meta], ids=[doc_id])

    def query(self, user_id: str, query_text: str, n_results: int) -> List[str]:
        if not self.collection: return []
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where={"user_id": user_id}
        )
        if results and results['documents']:
            return [doc for sublist in results['documents'] for doc in sublist]
        return []

# --- Optimized Google Cloud Vector Store (Legacy SDK) ---
class VertexAIVectorStore(VectorStore):
    def __init__(self):
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = "us-central1"
        self.index_endpoint = os.getenv("VERTEX_AI_INDEX_ENDPOINT")
        
    def get_embedding(self, text: str) -> List[float]:
        try:
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
        embedding = self.get_embedding(text)
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
        
        # Simple keyword overlap scoring
        query_words = set(query_text.lower().split())
        scored = []
        for item in user_data:
            text_words = set(item['text'].lower().split())
            overlap = len(query_words.intersection(text_words))
            scored.append((overlap, item['text']))
            
        # Sort by score desc, filter 0 overlap
        scored.sort(key=lambda x: x[0], reverse=True)
        return [s[1] for s in scored if s[0] > 0][:n_results]

# Select Store
if chroma_available:
    try:
        vector_store = ChromaVectorStore()
        # Test initialization
        if vector_store.collection is None:
             raise Exception("Chroma Init Failed")
    except:
        print("Fallback to SimpleJSONVectorStore")
        vector_store = SimpleJSONVectorStore()
else:
    print("Using SimpleJSONVectorStore")
    vector_store = SimpleJSONVectorStore()

class AgentService:
    def __init__(self):
        self.vector_store = vector_store

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
        
        self.vector_store.add(user_id, point, {"type": "learning_point", "source": "interaction", "timestamp": datetime.utcnow().isoformat()})
        print(f"Agent learned for {user_id}: {point}")

    def add_preference(self, user_id: str, text: str):
        """
        Explicitly adds a user preference to the vector store.
        """
        self.vector_store.add(user_id, f"User Preference: {text}", {"type": "preference", "timestamp": datetime.utcnow().isoformat()})

    def add_knowledge(self, user_id: str, text: str, metadata: Dict[str, Any]):
        self.vector_store.add(user_id, text, metadata)

    def retrieve_context(self, user_id: str, query: str, n_results: int = 3) -> str:
        results = self.vector_store.query(user_id, query, n_results)
        if results:
            return "\n".join(results)
        return ""

    def get_system_instruction(self, user_id: str, role: str, db: Session, context_query: Optional[str] = None) -> str:
        """
        Constructs the personalized system prompt for the AI.
        """
        state = self.get_agent_state(user_id, db)
        preferences_from_db = state.get("preferences", {})
        learning_points_from_db = state.get("learning_points", [])
        
        # Structured System Instruction
        instruction = f"""## Role
You are an expert AI medical assistant designed to help a {role}. You provide clinical insights, documentation assistance, and data analysis.

## User Context
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

        # 4. Retrieve Knowledge / Context (RAG) from Vector Store
        if context_query:
            retrieved = self.retrieve_context(user_id, context_query, n_results=3)
            if retrieved:
                instruction += f"\n## Knowledge Base (RAG)\n{retrieved}\n"
        
        instruction += "\n## Guidelines\n- Be concise and precise.\n- Prioritize patient safety.\n- Cite guidelines where applicable."
            
        return instruction

agent_service = AgentService()
