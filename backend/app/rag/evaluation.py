import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class EvaluationResult(BaseModel):
    faithfulness_score: float
    answer_relevance_score: float
    context_precision_score: float
    overall_rag_score: float
    latency_ms: float
    details: Dict[str, Any]

class RAGEvaluator:
    """
    RAG Triad & System Evaluator:
    1. Context Precision: Are the retrieved documents relevant to the query?
    2. Faithfulness / Groundedness: Is the generated answer strictly derived from the context?
    3. Answer Relevance: Does the generated response directly address the user's question?
    """

    @staticmethod
    def evaluate_context_precision(query: str, retrieved_chunks: List[Dict[str, Any]]) -> float:
        if not retrieved_chunks:
            return 0.0
        query_words = set(re.findall(r'\w+', query.lower()))
        if not query_words:
            return 1.0

        scores = []
        for c in retrieved_chunks:
            chunk_words = set(re.findall(r'\w+', c["content"].lower()))
            overlap = len(query_words.intersection(chunk_words)) / len(query_words)
            scores.append(min(1.0, overlap * 1.5))

        return round(sum(scores) / len(scores), 3)

    @staticmethod
    def evaluate_faithfulness(answer: str, context: str) -> float:
        if not answer or not context:
            return 0.0

        # Split answer into individual claim sentences
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', answer) if s.strip()]
        if not sentences:
            return 1.0

        context_lower = context.lower()
        supported_count = 0

        for sent in sentences:
            words = [w for w in re.findall(r'\w+', sent.lower()) if len(w) > 3]
            if not words:
                supported_count += 1
                continue

            # Check if majority of keywords exist in context
            found = sum(1 for w in words if w in context_lower)
            if (found / len(words)) >= 0.6:
                supported_count += 1

        return round(supported_count / len(sentences), 3)

    @staticmethod
    def evaluate_answer_relevance(query: str, answer: str) -> float:
        if not query or not answer:
            return 0.0

        q_terms = set(re.findall(r'\w+', query.lower()))
        a_terms = set(re.findall(r'\w+', answer.lower()))
        if not q_terms:
            return 1.0

        overlap = len(q_terms.intersection(a_terms)) / len(q_terms)
        # Length penalty if answer is trivially short (< 5 words)
        length_multiplier = 1.0 if len(a_terms) >= 5 else 0.5
        return round(min(1.0, overlap * 1.4) * length_multiplier, 3)

    @classmethod
    def run_full_evaluation(
        cls,
        query: str,
        answer: str,
        context: str,
        retrieved_chunks: List[Dict[str, Any]],
        latency_ms: float = 0.0
    ) -> EvaluationResult:
        c_precision = cls.evaluate_context_precision(query, retrieved_chunks)
        faith = cls.evaluate_faithfulness(answer, context)
        a_relevance = cls.evaluate_answer_relevance(query, answer)

        overall = round((c_precision * 0.3 + faith * 0.4 + a_relevance * 0.3), 3)

        return EvaluationResult(
            faithfulness_score=faith,
            answer_relevance_score=a_relevance,
            context_precision_score=c_precision,
            overall_rag_score=overall,
            latency_ms=round(latency_ms, 2),
            details={
                "has_hallucination_risk": faith < 0.6,
                "has_low_relevance": a_relevance < 0.5,
                "has_context_drift": c_precision < 0.4,
                "citations_present": bool(re.search(r'\[Source #\d+\]', answer))
            }
        )
