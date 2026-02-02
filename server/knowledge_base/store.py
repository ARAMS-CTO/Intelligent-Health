import os
import usearch.index
import numpy as np
import json
import uuid
import google.generativeai as genai
from ..config import settings

class DomainKnowledgeBase:
    _instances = {}

    def __init__(self, zone: str):
        self.zone = zone.lower()
        # Determine storage path (Fallback to /tmp for Cloud Run)
        self.storage_dir = "data/vectors"
        try:
            os.makedirs(self.storage_dir, exist_ok=True)
        except OSError:
            print(f"Warning: Read-only FS detected. Using /tmp for vector store ({zone}).")
            self.storage_dir = "/tmp/data/vectors"
            os.makedirs(self.storage_dir, exist_ok=True)

        self.index_path = f"{self.storage_dir}/{self.zone}.usearch"
        self.meta_path = f"{self.storage_dir}/{self.zone}_meta.json"
        
        # Embeddings config (Gemini)
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
        self.metadata = {} # id -> {text, source, ...}
        
        # Initialize index
        # text-embedding-004 output dimension is 768.
        self.ndim = 768 
        self.index = usearch.index.Index(ndim=self.ndim)
        
        self.load()

    @classmethod
    def get_instance(cls, zone: str):
        if zone not in cls._instances:
            cls._instances[zone] = cls(zone)
        return cls._instances[zone]

    def load(self):
        try:
            if os.path.exists(self.index_path):
                self.index.load(self.index_path)
            if os.path.exists(self.meta_path):
                with open(self.meta_path, 'r') as f:
                    self.metadata = json.load(f)
        except Exception as e:
            print(f"Vector Store Load Error ({self.zone}): {e}")

    def save(self):
        """
        Saves the index and metadata to disk.
        TODO: For high concurrency, consider append-only logs or DB storage.
        """
        try:
            self.index.save(self.index_path)
            # Atomic write for metadata to avoid corruption
            temp_path = self.meta_path + ".tmp"
            with open(temp_path, 'w') as f:
                json.dump(self.metadata, f)
            os.replace(temp_path, self.meta_path)
        except Exception as e:
            print(f"Vector Store Save Error: {e}")

    def get_embedding(self, text: str, mode="retrieval_document") -> np.ndarray:
        # Use Gemini to get embedding
        # Fallback to random if no key (dev mode)
        if not settings.GEMINI_API_KEY:
             return np.random.rand(self.ndim).astype(np.float32)
             
        # Switch to text-embedding-004
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type=mode,
            title="Medical Knowledge" if mode == "retrieval_document" else None
        )
        return np.array(result['embedding'], dtype=np.float32)

    def add_document(self, text: str, source: str, reliability: float = 1.0):
        # Generate UUID for ID
        doc_id = str(uuid.uuid4())
        
        # Check if already exists (content check)
        for m in self.metadata.values():
            if m['text'] == text:
                return # Skip duplicate

        embedding = self.get_embedding(text)
        # usearch requires integer keys for add, but we want UUIDs.
        # We will map int -> UUID in metadata.
        # Actually, for simplicity in this file-based version, let's keep using a hash or incrementing int for the search index
        # but store the full UUID in metadata as the primary key.
        # To keep it simple and compatible with previous code which used len(), let's use a stable hash of the UUID or just a robust counter.
        # Better: use the current length + random buffer if needed, but since it's in-memory dict, len() is fine for the INT key.
        
        internal_id = len(self.metadata) + 1
        
        self.index.add(internal_id, embedding)
        
        self.metadata[str(internal_id)] = {
            "id": doc_id,
            "text": text,
            "source": source,
            "reliability": reliability,
            "timestamp": str(uuid.uuid4())
        }
        self.save()

    def search(self, query: str, limit: int = 3) -> list:
        if not settings.GEMINI_API_KEY:
             return [{"text": "RAG Unavailable (No API Key)", "source": "System", "reliability": 0}]
             
        query_embedding = self.get_embedding(query, mode="retrieval_query")
        
        matches = self.index.search(query_embedding, limit)
        
        results = []
        # matches.keys is a numpy array of IDs
        for key in matches.keys:
            str_key = str(key)
            if str_key in self.metadata:
                item = self.metadata[str_key]
                results.append(item)
                
        return results
