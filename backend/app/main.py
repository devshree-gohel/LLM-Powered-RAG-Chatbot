from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.router import api_router

app = FastAPI(
    title="LLM-Powered Advanced RAG Chatbot API",
    description="Comprehensive system covering LLM building blocks, token mechanics, multi-strategy chunking, dense/sparse embeddings, vector DBs, hybrid search, reranking, citations, and RAG Triad evaluation.",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "LLM-Powered Advanced RAG Chatbot",
        "endpoints": {
            "docs": "/docs",
            "llm_blocks": "/api/llm",
            "rag_pipeline": "/api/rag",
            "evaluation": "/api/eval"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
