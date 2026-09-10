# 🚀 LLM-Powered Advanced RAG Chatbot & Learning System

A comprehensive, production-grade, and deeply educational system covering the continuum from **raw foundational LLM building blocks** to **Advanced Production RAG architectures** (Dense/Sparse Hybrid Search, Reciprocal Rank Fusion, Cross-Encoder Reranking, Token Budgeting, Citation Grounding, and RAG Triad Evaluation).

---

## 🏛️ Architecture Overview

```
                               ┌─────────────────────────────┐
                               │   User Query / Document     │
                               └──────────────┬──────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
       ┌────────────────────────┐                          ┌────────────────────────┐
       │ Dense Embedding Model  │                          │  Sparse BM25 Lexical   │
       │ (Gemini/OpenAI/Custom) │                          │     Keyword Model      │
       └────────────┬───────────┘                          └────────────┬───────────┘
                    ▼                                                   ▼
       ┌────────────────────────┐                          ┌────────────────────────┐
       │ In-Memory / FAISS /    │                          │ BM25 Inverted Term     │
       │ ChromaDB Vector Index  │                          │ Frequency Scoring      │
       └────────────┬───────────┘                          └────────────┬───────────┘
                    │                                                   │
                    └─────────────────────────┬─────────────────────────┘
                                              ▼
                             ┌─────────────────────────────────┐
                             │  Reciprocal Rank Fusion (RRF)   │
                             │  Hybrid Retrieval Combiner      │
                             └────────────────┬────────────────┘
                                              ▼
                             ┌─────────────────────────────────┐
                             │ Cross-Encoder Precision Rerank  │
                             └────────────────┬────────────────┘
                                              ▼
                             ┌─────────────────────────────────┐
                             │ Token-Budgeted Context Builder  │
                             │ & Citation Tag Injector         │
                             └────────────────┬────────────────┘
                                              ▼
                             ┌─────────────────────────────────┐
                             │ Autoregressive LLM Generation   │
                             │ (OpenAI / Gemini / Claude)      │
                             └────────────────┬────────────────┘
                                              ▼
                             ┌─────────────────────────────────┐
                             │ Automated RAG Triad Evaluation  │
                             │ (Faithfulness, Precision, Rel.) │
                             └─────────────────────────────────┘
```

---

## 📚 Curriculum & Hands-on Lab Notebooks

We provide 7 standalone runnable scripts in `notebooks_and_labs/` that teach every concept from first principles:

| Lab Script | Topics Covered | Key Mechanics |
| :--- | :--- | :--- |
| **`01_llm_api_basics_and_prompting.py`** | System/User/Assistant Roles, Prompt Design | Few-shot in-context learning, Chain-of-Thought (CoT), Persona Steering |
| **`02_tokens_context_temperature_cost.py`** | BPE Tokenization, Context Windows, Cost Engine | Token deconstruction, Temperature logit softmax scaling, multi-provider pricing |
| **`03_structured_json_and_function_calling.py`** | Structured JSON, Tool Calling | Pydantic Schema enforcement, tool schema registration, local function dispatch |
| **`04_document_parsing_and_chunking.py`** | Document Ingestion & Chunking | Fixed-Size, Recursive Character, Sliding Window, Semantic Chunking comparison |
| **`05_embeddings_and_vector_databases.py`** | Embeddings, Distance Math, Vector DBs | Cosine similarity, Euclidean distance, Dot products, Pure NumPy Matrix Vector DB |
| **`06_hybrid_retrieval_and_reranking.py`** | Hybrid Search & Cross-Encoders | Dense + BM25 Reciprocal Rank Fusion (RRF), Cross-Encoder query-passage attention |
| **`07_end_to_end_rag_with_evaluation.py`** | End-to-End Production RAG & Triad Eval | Token-budgeted context, Inline citations `[Source #1]`, Faithfulness & Precision |

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# (Optional) Set your API Keys in .env
# If left empty, the built-in offline educational simulator runs automatically!
cp .env.example .env

# Run unit tests
pytest tests -v

# Start FastAPI backend server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend will be live at: `http://127.0.0.1:8000` (API Docs at `http://127.0.0.1:8000/docs`).

### 3. Frontend Setup
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend UI will be live at: `http://127.0.0.1:5173`.

---

## 🛠️ Interactive UI & Production Workspace Features

### 🌟 1. Vera Workspace (AI Knowledge Companion)
- **Unified Sidebar Navigation**: Segmented navigation between **Chats** (recent query history, saved snapshots) and **Knowledge** (indexed documents, upload triggers, source filters).
- **Rich Markdown & Dynamic Comparison Tables**: Automatically formats comparisons into clean, high-contrast Markdown tables with specific subject headers (e.g. *Feature / Metric*, *Subject A*, *Subject B*).
- **One-Click Answer Copy**: Copy complete formatted responses directly to clipboard.
- **Interactive Stop Button**: Glowing Stop (`Square`) button connected to `AbortController` allowing instant cancellation of in-flight queries.

### 🌐 2. Live Web Search Grounding & URL Ingestion
- **Live Web Search Toggle**: Augment local RAG with real-time internet search results (DuckDuckGo + Wikipedia).
- **Clickable Web Citations**: Web sources appear as clickable `[Web #1]` badges opening original articles directly.
- **Webpage Ingestion Modal**: Paste any URL (Wikipedia, documentation, blogs) to scrape, clean, chunk, and index into the vector store.

### 💾 3. Local Session Storage & Saved Threads Manager
- **Auto-Persistence**: Active chat history auto-persists in browser `localStorage` across page reloads.
- **Snapshot Saving**: Save conversation snapshots with custom or auto-generated titles.
- **Session Restorer**: Switch between past conversations with one click.
- **Storage Metrics & Exporters**:
  - Live storage usage monitor (`KB used`).
  - **Export Chat (.md)**: Export active conversation as formatted Markdown.
  - **Export Backup (.json)**: Export complete thread backup in JSON format.
  - Quick "Clear Active Chat" and "Reset Storage" controls.

### 📑 4. Knowledge Base & Source Filtering
- **Multi-Format Ingestion**: Upload PDF, TXT, and Markdown documents.
- **Granular Source Filtering**: Query all documents or restrict retrieval to a specific document or web page via the dropdown selector.
- **Source Management**: Inspect character counts, chunks, delete individual sources, or clear vector store.

### 🔬 5. Interactive LLM & RAG Educational Labs
- **Tokenization & Cost Studio**: Visual Byte-Pair Encoding (BPE) token fragment colorizer and multi-model cost calculator.
- **Prompt Engineering Lab**: Interactive prompt designer with Temperature, Top-P, and System Steering controls.
- **Chunking Studio**: Side-by-side comparison of Fixed-Size, Recursive Character, Sliding Window, and Semantic chunking.
- **Hybrid Search & Reranking Inspector**: Real-time comparison of Dense Semantic Vector search, Sparse BM25 lexical search, and Cross-Encoder neural reranking.
- **RAG Triad Benchmark**: Automated evaluation measuring **Faithfulness** (hallucination detection), **Context Precision**, and **Answer Relevance**.
