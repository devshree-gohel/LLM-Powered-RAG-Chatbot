import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.rag.vector_stores import InMemoryVectorStore
from app.rag.hybrid_retriever import HybridRetriever
from app.rag.rerankers import CrossEncoderReranker

def run_lab_06():
    print("=" * 70)
    print("[LAB 06] HYBRID RETRIEVAL (RRF) & CROSS-ENCODER RERANKING")
    print("=" * 70)

    store = InMemoryVectorStore()

    dataset = [
        {"content": "Error code ERR_502 indicates Bad Gateway proxy communication failure.", "metadata": {"doc": "errors.log"}},
        {"content": "Server error 500 signals unhandled internal server exceptions.", "metadata": {"doc": "errors.log"}},
        {"content": "Gateway timeout occurs when upstream origin fails to respond in time.", "metadata": {"doc": "network.md"}},
        {"content": "Database connection pool exhaustion causes high query latency.", "metadata": {"doc": "db.md"}},
        {"content": "To fix ERR_502, verify upstream microservice health checks and load balancers.", "metadata": {"doc": "troubleshoot.md"}}
    ]

    store.add_chunks(dataset)
    retriever = HybridRetriever(store, rrf_k=60)
    reranker = CrossEncoderReranker()

    query = "How to resolve ERR_502 proxy errors?"
    print(f"Target Query: \"{query}\"\n")

    # 1. Pure Dense Vector Search
    print("--- 1. Dense Semantic Search (Top 3) ---")
    dense_res = store.similarity_search_with_score(query, k=3)
    for i, r in enumerate(dense_res, 1):
        print(f"  [Dense #{i}] Score: {r['score']:.4f} | {r['content'][:65]}...")

    # 2. Hybrid Search with RRF
    print("\n--- 2. Hybrid Search (Dense + BM25 RRF) (Top 3) ---")
    hybrid_res = retriever.retrieve(query, top_k=3, dense_weight=0.5, sparse_weight=0.5)
    for i, r in enumerate(hybrid_res, 1):
        print(f"  [Hybrid #{i}] RRF Score: {r['score']:.4f} (DenseRank={r['dense_rank']}, SparseRank={r['sparse_rank']}) | {r['content'][:65]}...")

    # 3. Cross-Encoder Reranking
    print("\n--- 3. Cross-Encoder Reranking applied to Hybrid Candidates ---")
    reranked_res = reranker.rerank(query, hybrid_res, top_k=3)
    for i, r in enumerate(reranked_res, 1):
        print(f"  [Reranked #{i}] Cross-Score: {r['rerank_score']:.4f} (Initial: {r['initial_score']:.4f}) | {r['content']}")

    print("\nNotice how the exact troubleshooting guidance for ERR_502 is promoted to Rank #1!")
    print("\n[OK] Lab 06 completed successfully!")

if __name__ == "__main__":
    run_lab_06()
