import os
import sys
import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..")))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..", "backend")))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..", "..", "backend")))

from app.rag.embeddings import get_embedding_model, cosine_similarity, dot_product_similarity, euclidean_distance, SparseBM25Model
from app.rag.vector_stores import InMemoryVectorStore

def run_lab_05():
    print("=" * 70)
    print("[LAB 05] EMBEDDINGS, VECTOR DISTANCE MATH & VECTOR DATABASES")
    print("=" * 70)

    embedder = get_embedding_model()

    sent1 = "The database query executed in 12 milliseconds."
    sent2 = "SQL performance was fast with low latency."
    sent3 = "A delicious recipe for homemade lasagna."

    vec1 = np.array(embedder.embed_query(sent1))
    vec2 = np.array(embedder.embed_query(sent2))
    vec3 = np.array(embedder.embed_query(sent3))

    print(f"Embedding Dimension: {len(vec1)}")
    print(f"Vector 1 Sample:     {vec1[:5]}...")

    print("\n--- 2. Similarity Metric Comparison ---")
    cos_1_2 = cosine_similarity(vec1, vec2)
    cos_1_3 = cosine_similarity(vec1, vec3)

    euc_1_2 = euclidean_distance(vec1, vec2)
    euc_1_3 = euclidean_distance(vec1, vec3)

    print(f"Sent 1 vs Sent 2 (Related topics):")
    print(f"  -> Cosine Similarity:  {cos_1_2:.4f} (Higher is closer)")
    print(f"  -> Euclidean Distance: {euc_1_2:.4f} (Lower is closer)")

    print(f"\nSent 1 vs Sent 3 (Unrelated topics):")
    print(f"  -> Cosine Similarity:  {cos_1_3:.4f}")
    print(f"  -> Euclidean Distance: {euc_1_3:.4f}")

    print("\n--- 3. Sparse BM25 Lexical Scoring ---")
    corpus = [
        "PostgreSQL supports pgvector extension for similarity search.",
        "Elasticsearch provides inverted indices for full-text search.",
        "Lasagna pasta baked with mozzarella and tomato sauce."
    ]
    bm25 = SparseBM25Model(corpus)
    keyword_query = "pgvector extension"
    bm25_scores = bm25.get_scores(keyword_query)
    print(f"Query: \"{keyword_query}\"")
    for doc, score in zip(corpus, bm25_scores):
        print(f"  BM25 Score: {score:.4f} | Doc: \"{doc}\"")

    print("\n--- 4. In-Memory Vector Database (NumPy Matrix Engine) ---")
    store = InMemoryVectorStore(embedding_model=embedder)

    sample_chunks = [
        {"content": "Chroma is an open-source AI-native vector database designed for developer simplicity.", "metadata": {"source": "docs_chroma.txt"}},
        {"content": "FAISS by Meta is optimized for high-density similarity search and GPU clustering.", "metadata": {"source": "docs_faiss.txt"}},
        {"content": "Chunk overlap ensures context continuity across split boundaries.", "metadata": {"source": "rag_concepts.txt"}},
        {"content": "Pydantic guarantees schema compliance in structured LLM workflows.", "metadata": {"source": "python_tools.txt"}}
    ]

    chunk_ids = store.add_chunks(sample_chunks)
    print(f"Indexed {len(chunk_ids)} chunks into Vector Database.")

    user_query = "What vector database did Meta develop for fast search?"
    print(f"\nQuerying: \"{user_query}\" (Top-2 results)")

    search_results = store.similarity_search_with_score(user_query, k=2)
    for rank, res in enumerate(search_results, start=1):
        print(f"\n  [Rank #{rank}] Score: {res['score']:.4f} | Source: {res['metadata']['source']}")
        print(f"  Content: {res['content']}")

    print("\n[OK] Lab 05 completed successfully!")

if __name__ == "__main__":
    run_lab_05()
