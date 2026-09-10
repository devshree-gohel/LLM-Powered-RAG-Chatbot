import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # API Keys
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    HUGGINGFACE_API_KEY: str = ""

    # Defaults
    DEFAULT_LLM_PROVIDER: str = "mock"
    DEFAULT_LLM_MODEL: str = "gemini-1.5-flash"
    DEFAULT_EMBEDDING_PROVIDER: str = "mock"
    DEFAULT_EMBEDDING_MODEL: str = "models/text-embedding-004"

    # Vector Storage
    VECTOR_STORE_TYPE: str = "in_memory"  # in_memory, chroma, faiss
    CHROMA_PERSIST_DIR: str = "./data/chroma_db"
    FAISS_INDEX_PATH: str = "./data/faiss_index"

    # Server
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"]

settings = Settings()
