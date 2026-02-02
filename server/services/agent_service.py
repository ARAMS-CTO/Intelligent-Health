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
    def add_many(self, user_id: str, items: List[tuple]): 
        """items: List of (text, metadata)"""
        for text, meta in items:
            self.add(user_id, text, meta)
            
    def query(self, user_id: str, query_text: str, n_results: int, filter: Optional[Dict] = None) -> List[str]: raise NotImplementedError
    def query_with_scores(self, user_id: str, query_text: str, n_results: int, filter: Optional[Dict] = None) -> List[tuple]: return []
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
        self.data_dir = "server/data"
        try:
            os.makedirs(self.data_dir, exist_ok=True)
        except OSError:
            print("Warning: Read-only FS detected. Using /tmp for AgentService vector store.")
            self.data_dir = "/tmp/server/data"
            os.makedirs(self.data_dir, exist_ok=True)

        self.data_path = f"{self.data_dir}/rag_metadata.json"
        self.index_path = f"{self.data_dir}/rag_index.usearch"
        self.ndim = 768 # Gemini Embedding Dimensions
        
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
        # Ensure positive
        doc_id = int(str(uuid.uuid4().int)[:16])
        
        try:
            self.index.add(doc_id, np.array(vector, dtype=np.float32))
            self.index.save(self.index_path)
            
            self.metadata_store[str(doc_id)] = {
                "text": text,
                "metadata": metadata,
                "user_id": user_id
            }
            self._save_metadata()
        except Exception as e:
            print(f"Vector Add Error: {e}")

    def query(self, user_id: str, query_text: str, n_results: int) -> List[str]:
        if self.index is None or len(self.metadata_store) == 0: return []
        
        query_vector = self.get_embedding(query_text)
        if not query_vector: return []
        
        try:
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
        except Exception as e:
            print(f"Vector Search Error: {e}")
            return []

    def query_with_scores(self, user_id: str, query_text: str, n_results: int) -> List[tuple]:
        """
        USearch implementation of query_with_scores.
        Returns list of (text, metadata, score)
        """
        if self.index is None or len(self.metadata_store) == 0: return []
        
        query_vector = self.get_embedding(query_text)
        if not query_vector: return []
        
        try:
            # Search global index
            matches = self.index.search(np.array(query_vector, dtype=np.float32), n_results * 5)
            
            results = []
            for match_id, dist in zip(matches.keys, matches.distances):
                doc = self.metadata_store.get(str(match_id))
                if doc and doc['user_id'] == user_id:
                    # USearch returns distance (often cosine distance 1-sim)
                    # Convert to similarity: 1 / (1 + dist) or 1 - dist
                    # For Cosine metric in USearch, it's 1 - cos_sim.
                    sim = 1.0 - dist
                    results.append((doc['text'], doc.get('metadata', {}), sim))
                    if len(results) >= n_results:
                        break
            return results
        except Exception as e:
            print(f"Vector Search Error: {e}")
            return []

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
        self.data_dir = "server/data"
        try:
            os.makedirs(self.data_dir, exist_ok=True)
        except OSError:
            self.data_dir = "/tmp/server/data"
            os.makedirs(self.data_dir, exist_ok=True)
            
        self.path = f"{self.data_dir}/user_knowledge.json"
        
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

    def query_with_scores(self, user_id: str, query_text: str, n_results: int) -> List[tuple]:
        data = self._load()
        user_data = data.get(user_id, [])
        if not user_data: return []
        
        import re
        def tokenize(text):
            return set(re.findall(r'\w+', text.lower()))
            
        query_words = tokenize(query_text)
        scored = []
        for item in user_data:
            text_words = tokenize(item['text'])
            overlap = len(query_words.intersection(text_words))
            # Basic score: overlap count normalized by query length
            score = overlap / len(query_words) if query_words else 0
            if score > 0:
                scored.append((item['text'], item.get('metadata', {}), score))
            
        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[:n_results]

# --- PostgreSQL PGVector Implementation (Production RAG) ---
class PGVectorStore(VectorStore):
    """
    Production-grade Vector Store using PostgreSQL + pgvector extension.
    Requires: 'pgvector' installed in DB and 'sqlalchemy-utils'/'pgvector' python package.
    """
    def __init__(self):
        # We assume the 'embeddings' table exists or we create it.
        # For this implementation, we use raw SQL or a separate model for speed.
        # Let's check connection.
        from ..database import engine
        self.engine = engine
        # In production, we assume migrations are run. 
        # We try to init roughly to be helpful in dev, but don't fail hard.
        self._init_db()

    def _init_db(self):
        try:
             # Basic check if table exists
            with self.engine.connect() as conn:
                # We do NOT try to create extension here as it requires superuser usually.
                # Use alembic for that.
                pass
        except Exception as e:
            # Silent fail - rely on migrations
            pass

    def get_embedding(self, text: str) -> List[float]:
        try:
            if not API_KEY: return []
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            print(f"Embedding error: {e}")
            return []

    def add_many(self, user_id: str, items: List[tuple]):
        """
        Optimized batch insert for PostgreSQL.
        items: List of (text, metadata)
        """
        if not items: return
        
        # 1. Compute Embeddings (We could batch this if API allows, but loop for now)
        # Note: We can parallelism this with ThreadPool if needed
        rows = []
        for text, meta in items:
            vec = self.get_embedding(text)
            if vec:
                import json
                rows.append({
                    "user_id": user_id,
                    "content": text,
                    "metadata": json.dumps(meta),
                    "embedding": str(vec)
                })
        
        if not rows: return

        # 2. Bulk Insert
        try:
             with self.engine.begin() as conn: # Transactional
                from sqlalchemy import text
                conn.execute(
                    text("""
                    INSERT INTO embeddings (user_id, content, metadata, embedding)
                    VALUES (:user_id, :content, :metadata, :embedding)
                    """),
                    rows
                )
        except Exception as e:
            print(f"PGVector Batch Add Error: {e}")

    def add(self, user_id: str, text: str, metadata: Dict[str, Any]):
        self.add_many(user_id, [(text, metadata)])

    def query_with_scores(self, user_id: str, query_text: str, n_results: int, filter: Optional[Dict] = None) -> List[tuple]:
        """Returns list of (text, metadata, score)"""
        vec = self.get_embedding(query_text)
        if not vec: return []
        
        try:
            import json
            from sqlalchemy import text
            
            filter_clause = ""
            params = {"vec": str(vec), "user_id": user_id, "limit": n_results}
            
            if filter:
                # Basic JSONB filtering: metadata @> :filter
                filter_clause = "AND metadata @> :filter"
                params["filter"] = json.dumps(filter)

            with self.engine.connect() as conn:
                # Cosine similarity search (<=> is distance, so 1 - distance approx similarity for ranking)
                result = conn.execute(
                    text(f"""
                    SELECT content, metadata, (embedding <=> :vec) as dist
                    FROM embeddings 
                    WHERE user_id = :user_id
                    {filter_clause}
                    ORDER BY dist ASC
                    LIMIT :limit
                    """),
                    params
                )
                
                output = []
                for row in result:
                    # Convert dist to sim score (0 to 1)
                    # row[2] access by index for raw result
                    # SQLAlchemy returns Row object
                    sim = 1.0 - (float(row[2]) / 2.0 if row[2] is not None else 1.0) 
                    output.append((row[0], json.loads(row[1]) if row[1] else {}, sim))
                return output
        except Exception as e:
            print(f"PGVector Query Error: {e}")
            return []

    def query(self, user_id: str, query_text: str, n_results: int) -> List[str]:
        vec = self.get_embedding(query_text)
        if not vec: return []
        
        try:
            with self.engine.connect() as conn:
                # Cosine similarity search (<=> operator in pgvector is distance, so order by ASC)
                result = conn.execute(
                    """
                    SELECT content FROM embeddings 
                    WHERE user_id = %s
                    ORDER BY embedding <=> %s 
                    LIMIT %s
                    """,
                    (user_id, str(vec), n_results)
                )
                return [row[0] for row in result]
        except Exception as e:
            print(f"PGVector Query Error: {e}")
            return []

# Select Store
# Priority: PGVector (if postgres) > USearch > SimpleJSON
vector_store = None

# Check if using Postgres
try:
    if settings.DATABASE_URL and "postgres" in settings.DATABASE_URL:
        # Check if pgvector is strictly required or we fallback
        try:
            vector_store = PGVectorStore()
            print("Using PGVectorStore for RAG")
        except Exception as e:
             print(f"PGVector Init Failed ({e}). Falling back.")
except Exception as e:
     pass

if not vector_store and usearch_available:
    try:
        vector_store = USearchVectorStore()
        print("Using USearchVectorStore for RAG")
    except Exception as e:
        print(f"Fallback to SimpleJSONVectorStore: {e}")
        vector_store = SimpleJSONVectorStore()
elif not vector_store:
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
        Uses Advanced Chunking for better retrieval.
        """
        from ..utils.text_processing import TextSplitter
        
        # 1. Chunking
        chunks = TextSplitter.recursive_split(text, chunk_size=800, overlap=100)
        
        # 2. Add Chunks to Vector Store (Optimized Batch)
        batch_items = []
        for i, chunk in enumerate(chunks):
            meta = metadata.copy()
            meta['chunk_index'] = i
            meta['total_chunks'] = len(chunks)
            meta['timestamp'] = datetime.utcnow().isoformat()
            batch_items.append((chunk, meta))
            
        self.vector_store.add_many(user_id, batch_items)
        
        # 3. Add Original Full Text to Database (for reference/display)
        if db:
            try:
                # Check duplication
                existing = db.query(models.KnowledgeItem).filter(
                    models.KnowledgeItem.user_id == user_id,
                    models.KnowledgeItem.content == text
                ).first()
                
                if not existing:
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

    def retrieve_context(self, user_id: str, query: str, n_results: int = 3, filter: Optional[Dict[str, Any]] = None) -> str:
        """
        Retrieves context with basic Re-Ranking (Similarity + Recency).
        Supports metadata filtering.
        """
        # Fetch more candidates for re-ranking
        candidates = self.vector_store.query_with_scores(user_id, query, n_results * 3, filter=filter)
        
        if not candidates: return ""

        # Re-Ranking Logic
        # Score = (VectorSim * 0.7) + (Recency * 0.3)
        ranked_results = []
        now = datetime.utcnow()
        
        import dateutil.parser
        
        for text, meta, score in candidates:
            # Parse timestamp
            recency_score = 0.0
            if meta and 'timestamp' in meta:
                try:
                    ts = dateutil.parser.parse(meta['timestamp'])
                    if ts.tzinfo: ts = ts.replace(tzinfo=None) # naive comparison
                    # Decay: 1 day old = 1.0, 365 days = 0.0
                    days_old = (now - ts).days
                    recency_score = max(0, 1.0 - (days_old / 365.0))
                except: pass
            
            # Hybrid Score
            # Vector score is usually distance (lower is better) or similarity (higher is better). 
            # Assuming store returns cosine similarity (0-1).
            # If store returns distance, convert to similarity approx (1 / (1+d))
            
            final_score = (score * 0.7) + (recency_score * 0.3)
            ranked_results.append((final_score, text))
            
        # Sort desc
        ranked_results.sort(key=lambda x: x[0], reverse=True)
        
        # Deduplicate texts roughly
        seen = set()
        final_texts = []
        for _, txt in ranked_results:
            if txt not in seen:
                final_texts.append(txt)
                seen.add(txt)
            if len(final_texts) >= n_results: break
            
        return "\n".join(final_texts)

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
