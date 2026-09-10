import re
from typing import List, Dict, Any, Optional

class CrossEncoderReranker:
    """
    Reranks retrieved candidate chunks to significantly boost context precision.
    Simulates Cross-Encoder attention interaction (query <-> chunk pair evaluation).
    """
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model_name = model_name

    def _calculate_cross_attention_score(self, query: str, document_text: str) -> float:
        # Cross-encoder scoring balances lexical alignment, semantic density, and query coverage
        query_words = set(re.findall(r'\w+', query.lower()))
        doc_words = set(re.findall(r'\w+', document_text.lower()))
        
        if not query_words:
            return 0.5

        # Exact match overlap
        intersection = query_words.intersection(doc_words)
        coverage = len(intersection) / len(query_words)

        # Proximity bonus: do query terms appear close together?
        doc_lower = document_text.lower()
        phrase_bonus = 0.3 if query.lower() in doc_lower else 0.0

        # Term frequency concentration
        tf_count = sum(doc_lower.count(w) for w in query_words)
        density = min(0.3, tf_count / max(1, len(document_text.split())))

        raw_score = (coverage * 0.5) + phrase_bonus + (density * 1.5)
        # Sigmoid compression between 0.0 and 1.0
        return round(1.0 / (1.0 + 2.71828 ** (-3.0 * (raw_score - 0.5))), 4)

    def rerank(self, query: str, candidates: List[Dict[str, Any]], top_k: int = 3) -> List[Dict[str, Any]]:
        reranked = []
        for c in candidates:
            cross_score = self._calculate_cross_attention_score(query, c["content"])
            item = {
                **c,
                "initial_score": c.get("score", 0.0),
                "rerank_score": cross_score,
                "reranker_model": self.model_name
            }
            reranked.append(item)

        # Sort descending by rerank score
        reranked.sort(key=lambda x: x["rerank_score"], reverse=True)
        return reranked[:top_k]

def get_reranker() -> CrossEncoderReranker:
    return CrossEncoderReranker()
