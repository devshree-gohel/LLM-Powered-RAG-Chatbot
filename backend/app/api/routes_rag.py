import time
import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..rag.loaders import DocumentLoader, Document
from ..rag.chunkers import get_chunker, FixedSizeChunker, RecursiveCharacterChunker, SlidingWindowChunker, SemanticSimilarityChunker
from ..rag.vector_stores import get_vector_store
from ..rag.hybrid_retriever import HybridRetriever
from ..rag.rerankers import get_reranker
from ..rag.context_builder import ContextBuilder
from ..rag.evaluation import RAGEvaluator
from ..rag.web_search import WebSearchEngine
from ..core.llm_factory import get_llm_client
from ..core.token_counter import TokenAnalytics

router = APIRouter(prefix="/rag", tags=["RAG Pipeline"])

class CompareChunkingRequest(BaseModel):
    text: str
    chunk_size: int = 400
    chunk_overlap: int = 80

class SearchRequest(BaseModel):
    query: str
    top_k: int = 4
    search_mode: str = "hybrid"  # dense, sparse, hybrid
    apply_reranking: bool = True
    source_filter: Optional[str] = None

class RAGQueryRequest(BaseModel):
    query: str
    provider: str = "mock"
    model: str = "gemini-1.5-flash"
    search_mode: str = "hybrid"  # dense, sparse, hybrid
    apply_reranking: bool = True
    top_k: int = 4
    temperature: float = 0.2
    source_filter: Optional[str] = None
    enable_web_search: bool = False

class DeleteSourceRequest(BaseModel):
    source: str

class IngestUrlRequest(BaseModel):
    url: str
    chunk_strategy: str = "recursive"
    chunk_size: int = 500
    chunk_overlap: int = 100

@router.post("/compare-chunking")
def compare_chunking_strategies(req: CompareChunkingRequest):
    """Compare Fixed, Recursive, Sliding Window, and Semantic chunking on the same text."""
    doc = DocumentLoader.load_from_text(req.text, "sample_input")

    fixed = FixedSizeChunker(chunk_size=req.chunk_size, chunk_overlap=req.chunk_overlap).chunk(doc)
    recursive = RecursiveCharacterChunker(chunk_size=req.chunk_size, chunk_overlap=req.chunk_overlap).chunk(doc)
    sliding = SlidingWindowChunker(window_size_sentences=4, step_size_sentences=2).chunk(doc)
    semantic = SemanticSimilarityChunker(max_tokens=req.chunk_size).chunk(doc)

    return {
        "text_length": len(req.text),
        "total_tokens": TokenAnalytics.count_tokens(req.text),
        "strategies": {
            "fixed_size": {"chunks": fixed, "count": len(fixed)},
            "recursive_character": {"chunks": recursive, "count": len(recursive)},
            "sliding_window": {"chunks": sliding, "count": len(sliding)},
            "semantic_similarity": {"chunks": semantic, "count": len(semantic)}
        }
    }

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    chunk_strategy: str = Form("recursive"),
    chunk_size: int = Form(500),
    chunk_overlap: int = Form(100)
):
    """Ingest, parse, chunk, embed, and index a document."""
    file_bytes = await file.read()
    docs = DocumentLoader.load_from_file_bytes(file_bytes, file.filename or "uploaded_file")
    
    chunker = get_chunker(chunk_strategy, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunks = chunker.chunk(docs)

    store = get_vector_store()
    chunk_ids = store.add_chunks(chunks)

    return {
        "status": "success",
        "filename": file.filename,
        "strategy": chunk_strategy,
        "documents_extracted": len(docs),
        "total_chunks_created": len(chunks),
        "total_tokens": sum(c["token_count"] for c in chunks),
        "sample_chunk": chunks[0] if chunks else None
    }

@router.post("/ingest-url")
def ingest_url_endpoint(req: IngestUrlRequest):
    """Scrape, clean, chunk, and index a webpage URL into vector database."""
    try:
        scraped = WebSearchEngine.scrape_url(req.url)
        doc = DocumentLoader.load_from_text(scraped["text"], source_name=scraped["url"], metadata={"title": scraped["title"], "type": "web_url"})
        
        chunker = get_chunker(req.chunk_strategy, chunk_size=req.chunk_size, chunk_overlap=req.chunk_overlap)
        chunks = chunker.chunk(doc)

        store = get_vector_store()
        store.add_chunks(chunks)

        return {
            "status": "success",
            "url": req.url,
            "title": scraped["title"],
            "total_chars": scraped["char_count"],
            "total_chunks_created": len(chunks),
            "total_tokens": sum(c["token_count"] for c in chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to ingest URL: {str(e)}")

@router.post("/search")
def search_documents(req: SearchRequest):
    """Inspect Vector Search vs Hybrid Search vs Reranking scores."""
    store = get_vector_store()
    retriever = HybridRetriever(store)
    reranker = get_reranker()

    start_t = time.time()

    if req.search_mode == "dense":
        candidates = store.similarity_search_with_score(req.query, k=req.top_k * 4)
    elif req.search_mode == "sparse":
        candidates = retriever.retrieve(req.query, top_k=req.top_k * 4, dense_weight=0.0, sparse_weight=1.0)
    else:
        candidates = retriever.retrieve(req.query, top_k=req.top_k * 4, dense_weight=0.5, sparse_weight=0.5)

    # Optional source filtering
    if req.source_filter and req.source_filter.lower() != "all":
        candidates = [
            c for c in candidates 
            if req.source_filter.lower() in c.get("metadata", {}).get("source", "").lower()
        ]

    if req.apply_reranking and candidates:
        results = reranker.rerank(req.query, candidates, top_k=req.top_k)
    else:
        results = candidates[:req.top_k]

    latency_ms = (time.time() - start_t) * 1000

    return {
        "query": req.query,
        "search_mode": req.search_mode,
        "reranking_applied": req.apply_reranking,
        "source_filter": req.source_filter,
        "total_results": len(results),
        "latency_ms": round(latency_ms, 2),
        "results": results
    }

@router.post("/query")
def query_rag(req: RAGQueryRequest):
    """Full RAG Pipeline with optional Live Web Search grounding, citation sources, and Triad evaluation."""
    start_time = time.time()

    store = get_vector_store()
    retriever = HybridRetriever(store)
    reranker = get_reranker()

    # 1. Retrieve local knowledge base chunks
    if req.search_mode == "dense":
        candidates = store.similarity_search_with_score(req.query, k=req.top_k * 4)
    else:
        candidates = retriever.retrieve(req.query, top_k=req.top_k * 4)

    # Filter by local source if requested
    if req.source_filter and req.source_filter.lower() != "all":
        candidates = [
            c for c in candidates 
            if req.source_filter.lower() in c.get("metadata", {}).get("source", "").lower()
        ]

    # 2. Live Web Search Grounding (if requested)
    web_candidates = []
    if req.enable_web_search:
        web_hits = WebSearchEngine.search(req.query, max_results=4)
        for i, hit in enumerate(web_hits):
            web_candidates.append({
                "id": f"web_{i}_{int(time.time())}",
                "content": f"Title: {hit['title']}\nSnippet: {hit['snippet']}",
                "metadata": {
                    "source": hit["url"],
                    "title": hit["title"],
                    "url": hit["url"],
                    "domain": hit["domain"],
                    "source_type": "web"
                },
                "score": 0.95 - (i * 0.05),
                "token_count": TokenAnalytics.count_tokens(hit["snippet"])
            })

    # Combine local and web candidates
    all_candidates = web_candidates + candidates

    # 3. Rerank
    if req.apply_reranking and all_candidates:
        retrieved_chunks = reranker.rerank(req.query, all_candidates, top_k=req.top_k)
    else:
        retrieved_chunks = all_candidates[:req.top_k]

    # 4. Context Construction
    context_text, cited_sources = ContextBuilder.build_context(retrieved_chunks)

    # 5. LLM Generation
    prompt_messages = ContextBuilder.build_rag_prompt(req.query, context_text)
    client = get_llm_client(req.provider)
    llm_res = client.generate(
        messages=prompt_messages,
        model=req.model,
        temperature=req.temperature
    )

    total_latency_ms = (time.time() - start_time) * 1000

    # 6. RAG Triad Evaluation
    eval_result = RAGEvaluator.run_full_evaluation(
        query=req.query,
        answer=llm_res.content,
        context=context_text,
        retrieved_chunks=retrieved_chunks,
        latency_ms=total_latency_ms
    )

    return {
        "query": req.query,
        "answer": llm_res.content,
        "citations": cited_sources,
        "context_used": context_text,
        "source_filter": req.source_filter,
        "web_search_used": req.enable_web_search,
        "evaluation": eval_result.model_dump(),
        "llm_meta": llm_res.model_dump(),
        "total_latency_ms": round(total_latency_ms, 2)
    }

@router.get("/documents")
def list_documents():
    """List current chunks and indexing metrics."""
    store = get_vector_store()
    chunks = getattr(store, "chunks", [])
    sources = list(set(c.get("metadata", {}).get("source", "Unknown") for c in chunks))
    return {
        "total_chunks": len(chunks),
        "distinct_sources": sources,
        "chunks_preview": chunks[:10]
    }

@router.post("/delete-source")
def delete_source_endpoint(req: DeleteSourceRequest):
    """Delete all chunks belonging to a specific source from vector store."""
    store = get_vector_store()
    removed = getattr(store, "remove_source", lambda s: 0)(req.source)
    return {
        "status": "success",
        "deleted_source": req.source,
        "chunks_removed": removed
    }

@router.post("/clear")
def clear_vector_store():
    """Reset the vector database."""
    store = get_vector_store()
    store.clear()
    return {"status": "cleared", "message": "Vector index reset successfully."}
