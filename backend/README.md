# ⚙️ Backend: LLM & RAG Core Service

FastAPI REST & Streaming Server powering token analysis, multi-strategy document chunking, dense/sparse embeddings, in-memory & FAISS vector search, hybrid RRF, cross-encoder reranking, and RAG Triad evaluation.

---

## 🏃 How to Run in its Own Terminal

```powershell
# Open terminal inside the 'backend' folder
cd backend

# Install dependencies (first time only)
pip install -r requirements.txt

# Run the backend server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Or double-click `run_backend.bat`.

- **API Root**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

---

## 🧪 Running Educational Lab Scripts from Backend Folder

```powershell
python notebooks_and_labs\01_llm_api_basics_and_prompting.py
python notebooks_and_labs\02_tokens_context_temperature_cost.py
python notebooks_and_labs\03_structured_json_and_function_calling.py
python notebooks_and_labs\04_document_parsing_and_chunking.py
python notebooks_and_labs\05_embeddings_and_vector_databases.py
python notebooks_and_labs\06_hybrid_retrieval_and_reranking.py
python notebooks_and_labs\07_end_to_end_rag_with_evaluation.py
```

---

## 🧪 Running Pytest

```powershell
pytest tests -v
```
