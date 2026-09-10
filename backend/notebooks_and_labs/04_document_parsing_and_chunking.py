import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..")))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..", "backend")))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..", "..", "backend")))

from app.rag.loaders import DocumentLoader
from app.rag.chunkers import FixedSizeChunker, RecursiveCharacterChunker, SlidingWindowChunker, SemanticSimilarityChunker

SAMPLE_DOCUMENT_TEXT = """# Understanding Vector Databases and RAG

Retrieval-Augmented Generation (RAG) is an architectural pattern that enhances Large Language Models.
Instead of relying solely on parameters learned during training, RAG injects relevant facts into the prompt.

## How Embeddings Work
Embeddings map unstructured text into continuous vector representations.
Semantically similar texts are placed close together in multi-dimensional vector space.
Standard embedding models include OpenAI text-embedding-3-small, Google text-embedding-004, and open-weight BAAI/bge-small models.

## Chunking Strategies
Chunking is the process of breaking long documents into smaller semantic passages.
If chunks are too small, critical context is lost. If chunks are too large, vector representations become diluted and noisy.
Recursive character chunking is the industry standard because it respects natural paragraph and sentence boundaries.

## Vector Search vs Keyword Search
Dense vector search finds conceptual matches using cosine similarity.
Sparse keyword search (like BM25) excels at exact part numbers, error codes, and unique identifiers.
Modern production systems combine both using Hybrid Search with Reciprocal Rank Fusion (RRF).
"""

def run_lab_04():
    print("=" * 70)
    print("[LAB 04] DOCUMENT PARSING & COMPARATIVE CHUNKING STRATEGIES")
    print("=" * 70)

    docs = DocumentLoader.load_from_text(SAMPLE_DOCUMENT_TEXT, source_name="rag_guide.md")
    print(f"Extracted Documents: {len(docs)}")
    print(f"Sample Metadata:     {docs[0].metadata}")
    print(f"Document Length:     {len(docs[0].page_content)} chars")

    print("\n--- 2. Strategy A: Fixed-Size Chunking (size=300, overlap=50) ---")
    fixed_chunker = FixedSizeChunker(chunk_size=300, chunk_overlap=50)
    fixed_chunks = fixed_chunker.chunk(docs)
    print(f"Total Chunks Generated: {len(fixed_chunks)}")
    for i, c in enumerate(fixed_chunks[:2]):
        print(f"  [Chunk #{i+1}] ({c['token_count']} tokens): {repr(c['content'][:70])}...")

    print("\n--- 3. Strategy B: Recursive Character Chunking (size=350, overlap=60) ---")
    rec_chunker = RecursiveCharacterChunker(chunk_size=350, chunk_overlap=60)
    rec_chunks = rec_chunker.chunk(docs)
    print(f"Total Chunks Generated: {len(rec_chunks)}")
    for i, c in enumerate(rec_chunks[:2]):
        print(f"  [Chunk #{i+1}] ({c['token_count']} tokens): {repr(c['content'][:70])}...")

    print("\n--- 4. Strategy C: Sliding Window Chunking (window=3 sentences, step=2) ---")
    sliding_chunker = SlidingWindowChunker(window_size_sentences=3, step_size_sentences=2)
    sliding_chunks = sliding_chunker.chunk(docs)
    print(f"Total Chunks Generated: {len(sliding_chunks)}")
    for i, c in enumerate(sliding_chunks[:2]):
        print(f"  [Chunk #{i+1}] ({c['token_count']} tokens): {repr(c['content'][:70])}...")

    print("\n--- 5. Strategy D: Semantic Similarity Chunking ---")
    sem_chunker = SemanticSimilarityChunker(max_tokens=300)
    sem_chunks = sem_chunker.chunk(docs)
    print(f"Total Chunks Generated: {len(sem_chunks)}")
    for i, c in enumerate(sem_chunks[:2]):
        print(f"  [Chunk #{i+1}] ({c['token_count']} tokens): {repr(c['content'][:70])}...")

    print("\n" + "=" * 70)
    print(f"{'Strategy':<25} | {'Chunk Count':<12} | {'Avg Token Count':<15} | {'Boundary Type'}")
    print("-" * 70)
    strats = [
        ("Fixed Size", fixed_chunks, "Arbitrary Character Cut"),
        ("Recursive Character", rec_chunks, "Paragraph / Sentence Aware"),
        ("Sliding Window", sliding_chunks, "Rolling Sentence Window"),
        ("Semantic Similarity", sem_chunks, "Topic / Transition Shift")
    ]
    for name, chunks, b_type in strats:
        avg_tok = sum(c['token_count'] for c in chunks) / max(1, len(chunks))
        print(f"{name:<25} | {len(chunks):<12} | {avg_tok:<15.1f} | {b_type}")

    print("\n[OK] Lab 04 completed successfully!")

if __name__ == "__main__":
    run_lab_04()
