from typing import List, Dict, Any, Optional
from .vector_stores import BaseVectorStore, get_vector_store
from .embeddings import SparseBM25Model

class HybridRetriever:
    """
    Combines Dense Vector Retrieval (semantic meaning) with Sparse BM25 Retrieval (exact keywords)
    using Reciprocal Rank Fusion (RRF).
    
    RRF Formula:
    RRF_Score(d) = sum( 1 / (k + rank_i(d)) ) for each retriever i
    """
    def __init__(self, vector_store: Optional[BaseVectorStore] = None, rrf_k: int = 60):
        self.vector_store = vector_store or get_vector_store()
        self.rrf_k = rrf_k
        self.bm25_model: Optional[SparseBM25Model] = None
        self._sync_bm25()

    def _sync_bm25(self):
        chunks = getattr(self.vector_store, "chunks", [])
        if chunks:
            corpus = [c["content"] for c in chunks]
            self.bm25_model = SparseBM25Model(corpus)

    def retrieve(
        self,
        query: str,
        top_k: int = 4,
        dense_weight: float = 0.5,
        sparse_weight: float = 0.5
    ) -> List[Dict[str, Any]]:
        self._sync_bm25()
        chunks = getattr(self.vector_store, "chunks", [])
        if not chunks:
            return []

        # 1. Dense Semantic Search
        dense_results = self.vector_store.similarity_search_with_score(query, k=len(chunks))
        dense_ranks = {res["content"]: idx + 1 for idx, res in enumerate(dense_results)}

        # 2. Sparse BM25 Keyword Search
        sparse_scores = self.bm25_model.get_scores(query) if self.bm25_model else [0.0] * len(chunks)
        sparse_ranked_indices = sorted(range(len(sparse_scores)), key=lambda i: sparse_scores[i], reverse=True)
        sparse_ranks = {chunks[idx]["content"]: rank + 1 for rank, idx in enumerate(sparse_ranked_indices)}

        # 3. Reciprocal Rank Fusion calculation
        fused_scores: Dict[str, Dict[str, Any]] = {}

        for chunk in chunks:
            content = chunk["content"]
            d_rank = dense_ranks.get(content, 999)
            s_rank = sparse_ranks.get(content, 999)

            # RRF score with weights
            rrf_dense = dense_weight * (1.0 / (self.rrf_k + d_rank))
            rrf_sparse = sparse_weight * (1.0 / (self.rrf_k + s_rank))
            total_rrf = rrf_dense + rrf_sparse

            fused_scores[content] = {
                "content": content,
                "metadata": chunk["metadata"],
                "score": round(total_rrf * 100, 4),  # Scale for readability
                "dense_rank": d_rank if d_rank != 999 else None,
                "sparse_rank": s_rank if s_rank != 999 else None,
                "retrieval_mode": "hybrid_rrf"
            }

        # Sort descending by fused score
        sorted_results = sorted(fused_scores.values(), key=lambda x: x["score"], reverse=True)
        return sorted_results[:top_k]
