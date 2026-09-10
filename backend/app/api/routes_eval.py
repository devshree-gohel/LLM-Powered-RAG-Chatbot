from typing import List, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel
from ..rag.evaluation import RAGEvaluator

router = APIRouter(prefix="/eval", tags=["RAG Evaluation"])

class EvalBenchmarkRequest(BaseModel):
    test_cases: List[Dict[str, Any]]

@router.post("/benchmark")
def run_benchmark(req: EvalBenchmarkRequest):
    """
    Run automated RAG Triad evaluation over a collection of test cases:
    Each case contains {query, context, answer, retrieved_chunks}.
    """
    results = []
    for case in req.test_cases:
        query = case.get("query", "")
        context = case.get("context", "")
        answer = case.get("answer", "")
        chunks = case.get("retrieved_chunks", [])
        
        eval_res = RAGEvaluator.run_full_evaluation(
            query=query,
            answer=answer,
            context=context,
            retrieved_chunks=chunks
        )
        results.append({
            "query": query,
            "evaluation": eval_res.model_dump()
        })

    avg_faith = sum(r["evaluation"]["faithfulness_score"] for r in results) / max(1, len(results))
    avg_relevance = sum(r["evaluation"]["answer_relevance_score"] for r in results) / max(1, len(results))
    avg_precision = sum(r["evaluation"]["context_precision_score"] for r in results) / max(1, len(results))
    avg_overall = sum(r["evaluation"]["overall_rag_score"] for r in results) / max(1, len(results))

    return {
        "benchmark_summary": {
            "total_cases_evaluated": len(results),
            "average_faithfulness": round(avg_faith, 3),
            "average_answer_relevance": round(avg_relevance, 3),
            "average_context_precision": round(avg_precision, 3),
            "average_overall_rag_score": round(avg_overall, 3)
        },
        "detailed_results": results
    }
