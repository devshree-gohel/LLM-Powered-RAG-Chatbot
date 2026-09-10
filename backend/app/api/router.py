from fastapi import APIRouter
from .routes_llm_blocks import router as llm_router
from .routes_rag import router as rag_router
from .routes_eval import router as eval_router

api_router = APIRouter()
api_router.include_router(llm_router)
api_router.include_router(rag_router)
api_router.include_router(eval_router)
