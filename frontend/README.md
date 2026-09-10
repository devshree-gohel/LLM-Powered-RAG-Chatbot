# 🎨 Frontend: Vera AI Workspace & LLM Interactive Studio

Modern React 18 + TypeScript + Tailwind CSS dashboard providing both a **Production-grade AI Knowledge Assistant (Vera)** and **Interactive Visual Labs** for Tokenization, Prompt Engineering, Chunking comparisons, Vector Search, Cross-Encoder Reranking, and Live RAG Evaluation.

---

## ✨ Features Included

- **Vera Workspace**: Unified Chat & Knowledge sidebar, rich Markdown rendering with comparison tables, one-click answer copying, and an interactive Stop/Cancel generation button.
- **Live Web Search Grounding**: Real-time web search toggle with clickable `[Web #1]` source badges and webpage crawler ingestion modal.
- **Session Manager & Storage**: Auto-persistence to browser `localStorage`, conversation snapshot saving, session restoration, Markdown (`.md`) and JSON (`.json`) export.
- **Interactive Labs**: 5 dedicated visual playgrounds for BPE Tokenization, Prompt Engineering, Chunking comparisons, Vector Search & Reranking, and RAG Triad Evaluation.

---

## 🏃 How to Run in its Own Terminal

```powershell
# Open terminal inside the 'frontend' folder
cd frontend

# Install dependencies (first time only)
npm install

# Start Vite development server
npm run dev
```

Or double-click `run_frontend.bat`.

- **Web UI App**: `http://localhost:5173`
- Backend API proxy is pre-configured to `http://127.0.0.1:8000`.
