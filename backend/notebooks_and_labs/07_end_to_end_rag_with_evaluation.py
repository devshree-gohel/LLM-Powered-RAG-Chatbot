import os
import sys
import json

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..")))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..", "backend")))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..", "..", "backend")))

from app.rag.loaders import DocumentLoader
from app.rag.chunkers import RecursiveCharacterChunker
from app.rag.vector_stores import InMemoryVectorStore
from app.rag.hybrid_retriever import HybridRetriever
from app.rag.rerankers import CrossEncoderReranker
from app.rag.context_builder import ContextBuilder
from app.rag.evaluation import RAGEvaluator
from app.core.llm_factory import get_llm_client

DOCUMENT_CORPUS = """# Enterprise AI System Architecture Specification

## Section 1: Security and Compliance Standards
All inbound API requests must be authenticated using JWT bearer tokens signed with RSA-256 keys.
Data at rest in the vector database is encrypted using AES-256-GCM.
Auditing logs are streamed to CloudWatch and retained for a mandatory compliance duration of 7 years.

## Section 2: Vector Database Infrastructure
The primary vector storage engine is deployed across 3 availability zones with active replication.
Index queries maintain a 99th percentile latency SLA of under 35 milliseconds for top-10 nearest neighbor search.
Automatic snapshot backups execute daily at 02:00 UTC.

## Section 3: Fallback and Degradation Policies
When upstream LLM provider error rates exceed 5% over a 1-minute rolling window, the circuit breaker triggers.
Traffic is immediately rerouted to secondary fallback model replicas with cached context responses.
"""

def run_lab_07():
    print("=" * 70)
    print("[LAB 07] END-TO-END ADVANCED RAG & RAG TRIAD EVALUATION")
    print("=" * 70)

    docs = DocumentLoader.load_from_text(DOCUMENT_CORPUS, source_name="enterprise_ai_spec.md")
    chunker = RecursiveCharacterChunker(chunk_size=350, chunk_overlap=50)
    chunks = chunker.chunk(docs)
    print(f"Generated {len(chunks)} chunks.")

    store = InMemoryVectorStore()
    store.add_chunks(chunks)
    print("Vector database indexed successfully.")

    user_query = "What encryption algorithm is used for vector data at rest, and how long are audit logs kept?"
    print(f"\n--- Step 3: Hybrid Search & Reranking for Query ---")
    print(f"Query: \"{user_query}\"")

    retriever = HybridRetriever(store)
    candidates = retriever.retrieve(user_query, top_k=4)
    reranker = CrossEncoderReranker()
    ranked_chunks = reranker.rerank(user_query, candidates, top_k=2)

    context_str, cited_sources = ContextBuilder.build_context(ranked_chunks)
    print(f"Formatted Context:\n{context_str}")

    client = get_llm_client()
    messages = ContextBuilder.build_rag_prompt(user_query, context_str)
    res = client.generate(messages=messages, temperature=0.1)
    print(f"Generated Answer:\n{res.content}")
    print(f"\nCited Source Badges:")
    for s in cited_sources:
        print(f"  [Source #{s['source_id']}] {s['label']} (Relevance Score: {s['score']:.4f})")

    eval_metrics = RAGEvaluator.run_full_evaluation(
        query=user_query,
        answer=res.content,
        context=context_str,
        retrieved_chunks=ranked_chunks,
        latency_ms=res.latency_ms
    )

    print(f"Evaluation Metrics:")
    print(f"  Context Precision Score:    {eval_metrics.context_precision_score:.3f} / 1.000")
    print(f"  Faithfulness (Groundedness): {eval_metrics.faithfulness_score:.3f} / 1.000")
    print(f"  Answer Relevance Score:     {eval_metrics.answer_relevance_score:.3f} / 1.000")
    print(f"  Overall RAG System Score:   {eval_metrics.overall_rag_score:.3f} / 1.000")
    print(f"  Total Latency:              {eval_metrics.latency_ms}ms")
    print(f"  Diagnostic Flags:           {json.dumps(eval_metrics.details, indent=2)}")

    print("\n[OK] Lab 07 completed successfully!")

if __name__ == "__main__":
    run_lab_07()
