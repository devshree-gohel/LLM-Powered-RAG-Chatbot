import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from app.rag.loaders import DocumentLoader
from app.rag.chunkers import RecursiveCharacterChunker, FixedSizeChunker, SlidingWindowChunker, SemanticSimilarityChunker
from app.rag.vector_stores import InMemoryVectorStore
from app.rag.hybrid_retriever import HybridRetriever
from app.rag.rerankers import CrossEncoderReranker
from app.rag.context_builder import ContextBuilder
from app.rag.evaluation import RAGEvaluator
from app.core.token_counter import TokenAnalytics

def test_token_analytics():
    text = "Hello world! Testing vector retrieval."
    tokens = TokenAnalytics.count_tokens(text)
    assert tokens > 0
    breakdown = TokenAnalytics.tokenize_breakdown(text)
    assert len(breakdown) == tokens
    cost = TokenAnalytics.estimate_cost(1000, 500, "gemini-1.5-flash")
    assert cost["total_cost_usd"] > 0

def test_chunking_strategies():
    text = "Sentence one. Sentence two. Sentence three. Sentence four."
    docs = DocumentLoader.load_from_text(text, "test.txt")
    
    fixed = FixedSizeChunker(chunk_size=30, chunk_overlap=5).chunk(docs)
    assert len(fixed) >= 1
    
    rec = RecursiveCharacterChunker(chunk_size=30, chunk_overlap=5).chunk(docs)
    assert len(rec) >= 1

    sliding = SlidingWindowChunker(window_size_sentences=2, step_size_sentences=1).chunk(docs)
    assert len(sliding) >= 1

    sem = SemanticSimilarityChunker(max_tokens=50).chunk(docs)
    assert len(sem) >= 1

def test_vector_store_and_hybrid():
    store = InMemoryVectorStore()
    chunks = [
        {"content": "Python is a dynamic programming language.", "metadata": {"source": "python.txt"}},
        {"content": "Rust offers memory safety without garbage collection.", "metadata": {"source": "rust.txt"}}
    ]
    ids = store.add_chunks(chunks)
    assert len(ids) == 2

    # Search
    results = store.similarity_search_with_score("Python language", k=1)
    assert len(results) == 1
    assert "Python" in results[0]["content"]

    # Hybrid
    retriever = HybridRetriever(store)
    hybrid_res = retriever.retrieve("Python language", top_k=2)
    assert len(hybrid_res) == 2

    # Reranking
    reranker = CrossEncoderReranker()
    reranked = reranker.rerank("Python language", hybrid_res, top_k=1)
    assert len(reranked) == 1
    assert "Python" in reranked[0]["content"]

def test_rag_evaluation():
    context = "Database backups run daily at midnight. Encryption is AES-256."
    query = "When do backups run?"
    answer = "Backups run daily at midnight [Source #1]."
    chunks = [{"content": context}]

    eval_res = RAGEvaluator.run_full_evaluation(query, answer, context, chunks)
    assert eval_res.overall_rag_score > 0.5
    assert eval_res.details["citations_present"] is True
