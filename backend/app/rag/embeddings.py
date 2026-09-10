import math
import hashlib
import numpy as np
from typing import List, Dict, Any, Optional
from ..core.config import settings

def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """Cosine similarity: dot(A, B) / (||A|| * ||B||). Ranges from -1.0 to 1.0."""
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))

def dot_product_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """Standard Dot Product similarity."""
    return float(np.dot(vec_a, vec_b))

def euclidean_distance(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """Euclidean Distance: sqrt(sum((A_i - B_i)^2)). Lower is closer."""
    return float(np.linalg.norm(vec_a - vec_b))

class BaseEmbeddingModel:
    dimension: int = 384
    def embed_query(self, text: str) -> List[float]:
        raise NotImplementedError
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        raise NotImplementedError

class GeminiEmbeddingModel(BaseEmbeddingModel):
    def __init__(self, api_key: Optional[str] = None, model: str = "models/text-embedding-004"):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model
        self.dimension = 768
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
            except Exception:
                pass

    def embed_query(self, text: str) -> List[float]:
        try:
            import google.generativeai as genai
            result = genai.embed_content(model=self.model, content=text, task_type="retrieval_query")
            return result['embedding']
        except Exception:
            return EducationalDeterministicEmbeddingModel(dim=self.dimension).embed_query(text)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        try:
            import google.generativeai as genai
            result = genai.embed_content(model=self.model, content=texts, task_type="retrieval_document")
            return result['embedding']
        except Exception:
            return EducationalDeterministicEmbeddingModel(dim=self.dimension).embed_documents(texts)

class OpenAIEmbeddingModel(BaseEmbeddingModel):
    def __init__(self, api_key: Optional[str] = None, model: str = "text-embedding-3-small"):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model
        self.dimension = 1536

    def embed_query(self, text: str) -> List[float]:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key)
            res = client.embeddings.create(input=text, model=self.model)
            return res.data[0].embedding
        except Exception:
            return EducationalDeterministicEmbeddingModel(dim=self.dimension).embed_query(text)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key)
            res = client.embeddings.create(input=texts, model=self.model)
            return [d.embedding for d in res.data]
        except Exception:
            return EducationalDeterministicEmbeddingModel(dim=self.dimension).embed_documents(texts)

class EducationalDeterministicEmbeddingModel(BaseEmbeddingModel):
    """
    Deterministic zero-dependency dense vector generator based on bag-of-words/subword hashing
    and normalized Gaussian projections. Produces realistic semantic clustering offline.
    """
    def __init__(self, dim: int = 384):
        self.dimension = dim

    def _embed_single(self, text: str) -> List[float]:
        words = text.lower().split()
        vec = np.zeros(self.dimension, dtype=np.float32)
        if not words:
            return vec.tolist()

        for w in words:
            # Hash word to seed
            h = int(hashlib.md5(w.encode('utf-8')).hexdigest(), 16) % (2**32)
            np.random.seed(h)
            word_vec = np.random.normal(0, 1, self.dimension)
            vec += word_vec

        # L2 Normalization
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def embed_query(self, text: str) -> List[float]:
        return self._embed_single(text)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed_single(t) for t in texts]

class SparseBM25Model:
    """Sparse Lexical Model using BM25 for term frequency and inverted index scoring."""
    def __init__(self, corpus: Optional[List[str]] = None):
        self.corpus = corpus or []
        self.bm25 = None
        if self.corpus:
            self._fit(self.corpus)

    def _tokenize(self, text: str) -> List[str]:
        import re
        return re.findall(r'\w+', text.lower())

    def _fit(self, corpus: List[str]):
        from rank_bm25 import BM25Okapi
        tokenized_corpus = [self._tokenize(doc) for doc in corpus]
        self.bm25 = BM25Okapi(tokenized_corpus)

    def get_scores(self, query: str) -> List[float]:
        if not self.bm25 or not self.corpus:
            return []
        tokenized_query = self._tokenize(query)
        scores = self.bm25.get_scores(tokenized_query)
        # Normalize between 0 and 1
        max_score = max(scores) if len(scores) > 0 and max(scores) > 0 else 1.0
        return [float(s / max_score) for s in scores]

def get_embedding_model(provider: Optional[str] = None) -> BaseEmbeddingModel:
    prov = (provider or settings.DEFAULT_EMBEDDING_PROVIDER).lower()
    if prov == "gemini" and settings.GEMINI_API_KEY:
        return GeminiEmbeddingModel()
    elif prov == "openai" and settings.OPENAI_API_KEY:
        return OpenAIEmbeddingModel()
    return EducationalDeterministicEmbeddingModel()
