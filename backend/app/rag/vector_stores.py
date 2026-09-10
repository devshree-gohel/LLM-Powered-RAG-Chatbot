import os
import uuid
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from .embeddings import BaseEmbeddingModel, get_embedding_model

class SearchResult:
    def __init__(self, content: str, metadata: Dict[str, Any], score: float, chunk_id: str):
        self.content = content
        self.metadata = metadata
        self.score = score
        self.chunk_id = chunk_id

    def to_dict(self) -> Dict[str, Any]:
        return {
            "content": self.content,
            "metadata": self.metadata,
            "score": round(self.score, 4),
            "chunk_id": self.chunk_id
        }

class BaseVectorStore:
    def add_chunks(self, chunks: List[Dict[str, Any]]) -> List[str]:
        raise NotImplementedError

    def similarity_search_with_score(self, query: str, k: int = 4) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def clear(self):
        raise NotImplementedError

class InMemoryVectorStore(BaseVectorStore):
    """
    First-principles in-memory vector database built directly with NumPy matrices.
    Exposes raw cosine similarity dot-product calculations for maximum educational clarity.
    """
    def __init__(self, embedding_model: Optional[BaseEmbeddingModel] = None):
        self.embedding_model = embedding_model or get_embedding_model()
        self.vectors: np.ndarray = np.empty((0, self.embedding_model.dimension), dtype=np.float32)
        self.chunks: List[Dict[str, Any]] = []
        self.ids: List[str] = []

    def add_chunks(self, chunks: List[Dict[str, Any]]) -> List[str]:
        if not chunks:
            return []
        texts = [c["content"] for c in chunks]
        new_embeddings = np.array(self.embedding_model.embed_documents(texts), dtype=np.float32)

        # Normalize for fast cosine dot product
        norms = np.linalg.norm(new_embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        new_embeddings = new_embeddings / norms

        new_ids = [str(uuid.uuid4())[:8] for _ in chunks]

        if self.vectors.shape[0] == 0:
            self.vectors = new_embeddings
        else:
            self.vectors = np.vstack([self.vectors, new_embeddings])

        self.chunks.extend(chunks)
        self.ids.extend(new_ids)
        return new_ids

    def similarity_search_with_score(self, query: str, k: int = 4) -> List[Dict[str, Any]]:
        if len(self.chunks) == 0 or self.vectors.shape[0] == 0:
            return []

        query_vec = np.array(self.embedding_model.embed_query(query), dtype=np.float32)
        norm = np.linalg.norm(query_vec)
        if norm > 0:
            query_vec = query_vec / norm

        # Matrix-vector multiplication computes cosine similarity for all items simultaneously!
        # Shape: (N, D) dot (D,) -> (N,)
        similarities = np.dot(self.vectors, query_vec)

        # Top-k indices sorted descending
        top_indices = np.argsort(similarities)[::-1][:k]

        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            chunk = self.chunks[idx]
            results.append(SearchResult(
                content=chunk["content"],
                metadata=chunk["metadata"],
                score=score,
                chunk_id=self.ids[idx]
            ).to_dict())

        return results

    def clear(self):
        self.vectors = np.empty((0, self.embedding_model.dimension), dtype=np.float32)
        self.chunks = []
        self.ids = []

    def remove_source(self, source_name: str) -> int:
        if not self.chunks:
            return 0
        keep_indices = [
            i for i, c in enumerate(self.chunks)
            if c.get("metadata", {}).get("source") != source_name and source_name not in c.get("metadata", {}).get("source", "")
        ]
        removed_count = len(self.chunks) - len(keep_indices)
        if keep_indices:
            self.chunks = [self.chunks[i] for i in keep_indices]
            self.ids = [self.ids[i] for i in keep_indices]
            self.vectors = self.vectors[keep_indices]
        else:
            self.clear()
        return removed_count

class FAISSVectorStore(BaseVectorStore):
    """Production vector store powered by FAISS (IndexFlatIP for exact cosine search)."""
    def __init__(self, embedding_model: Optional[BaseEmbeddingModel] = None):
        self.embedding_model = embedding_model or get_embedding_model()
        self.index = None
        self.chunks: List[Dict[str, Any]] = []
        self.ids: List[str] = []
        self._init_index()

    def _init_index(self):
        try:
            import faiss
            self.index = faiss.IndexFlatIP(self.embedding_model.dimension)
        except Exception:
            self.index = None

    def add_chunks(self, chunks: List[Dict[str, Any]]) -> List[str]:
        if not chunks:
            return []
        texts = [c["content"] for c in chunks]
        embeddings = np.array(self.embedding_model.embed_documents(texts), dtype=np.float32)
        
        # Normalize
        import faiss
        faiss.normalize_L2(embeddings)

        if self.index is None:
            self._init_index()

        self.index.add(embeddings)
        new_ids = [str(uuid.uuid4())[:8] for _ in chunks]
        self.chunks.extend(chunks)
        self.ids.extend(new_ids)
        return new_ids

    def similarity_search_with_score(self, query: str, k: int = 4) -> List[Dict[str, Any]]:
        if not self.index or self.index.ntotal == 0:
            return []

        query_vec = np.array([self.embedding_model.embed_query(query)], dtype=np.float32)
        import faiss
        faiss.normalize_L2(query_vec)

        scores, indices = self.index.search(query_vec, min(k, self.index.ntotal))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx != -1 and idx < len(self.chunks):
                results.append(SearchResult(
                    content=self.chunks[idx]["content"],
                    metadata=self.chunks[idx]["metadata"],
                    score=float(score),
                    chunk_id=self.ids[idx]
                ).to_dict())

        return results

    def clear(self):
        self._init_index()
        self.chunks = []
        self.ids = []

    def remove_source(self, source_name: str) -> int:
        if not self.chunks:
            return 0
        keep_indices = [
            i for i, c in enumerate(self.chunks)
            if c.get("metadata", {}).get("source") != source_name and source_name not in c.get("metadata", {}).get("source", "")
        ]
        removed_count = len(self.chunks) - len(keep_indices)
        if keep_indices:
            self.chunks = [self.chunks[i] for i in keep_indices]
            self.ids = [self.ids[i] for i in keep_indices]
            self._init_index()
            if self.chunks:
                texts = [c["content"] for c in self.chunks]
                embeddings = np.array(self.embedding_model.embed_documents(texts), dtype=np.float32)
                import faiss
                faiss.normalize_L2(embeddings)
                if self.index:
                    self.index.add(embeddings)
        else:
            self.clear()
        return removed_count

# Global singleton storage instance
_global_store = InMemoryVectorStore()

def get_vector_store(store_type: str = "in_memory") -> BaseVectorStore:
    global _global_store
    if store_type.lower() == "faiss":
        try:
            import faiss
            return FAISSVectorStore()
        except ImportError:
            return _global_store
    return _global_store
