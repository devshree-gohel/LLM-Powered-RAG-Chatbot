import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, FileText, CheckCircle2, ShieldAlert, Sparkles, ExternalLink, RefreshCw, Bot, User, Award, Flame, Zap, ArrowRight, HelpCircle } from 'lucide-react';
import { RAGQueryResponse, Citation } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  evaluation?: any;
  llm_meta?: any;
  total_latency_ms?: number;
}

const SAMPLE_QUERIES = [
  "What encryption algorithm is used for vector data at rest?",
  "How does Reciprocal Rank Fusion (RRF) combine dense and sparse search?",
  "Why is Cross-Encoder reranking applied after Bi-Encoder retrieval?",
  "Explain the 3 pillars of RAG Triad evaluation."
];

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '✨ Welcome to PrismRAG 3D Studio! Upload any document (PDF, Markdown, or Text) on the left to start querying. Every answer includes verifiable source citations and real-time RAG Triad evaluation scores.',
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Settings
  const [provider, setProvider] = useState('mock');
  const [modelName, setModelName] = useState('gemini-1.5-flash');
  const [chunkStrategy, setChunkStrategy] = useState('recursive');
  const [searchMode, setSearchMode] = useState('hybrid');
  const [applyRerank, setApplyRerank] = useState(true);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(`Indexing ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('chunk_strategy', chunkStrategy);
    formData.append('chunk_size', '450');
    formData.append('chunk_overlap', '80');

    try {
      const res = await fetch('/api/rag/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setUploadStatus(`✨ Indexed ${data.filename} into ${data.total_chunks_created} vector chunks!`);
    } catch (err) {
      setUploadStatus('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToSend = customQuery || inputQuery;
    if (!queryToSend.trim() || isSending) return;

    const userText = queryToSend.trim();
    setInputQuery('');

    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setIsSending(true);

    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userText,
          provider,
          model: modelName,
          search_mode: searchMode,
          apply_reranking: applyRerank,
          top_k: 4,
          temperature: 0.1
        })
      });
      const data: RAGQueryResponse = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          citations: data.citations,
          evaluation: data.evaluation,
          llm_meta: data.llm_meta,
          total_latency_ms: data.total_latency_ms
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error communicating with RAG backend. Please verify that the backend server is running.'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-7rem)] grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
      
      {/* 3D Sidebar Controls (3 cols) */}
      <div className="lg:col-span-3 glass-panel rounded-2xl p-6 flex flex-col justify-between space-y-5 overflow-y-auto h-full">
        <div className="space-y-5">
          <div className="border-b border-purple-500/20 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2.5">
              <span className="p-2 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-xl text-white shadow-md">
                <Upload className="w-4 h-4" />
              </span>
              Document Ingestion
            </h3>
            <p className="text-xs text-purple-200/70 mt-2 leading-relaxed">
              Upload PDF, Markdown, or Text files to extract, chunk, and embed into vector storage.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-purple-100 block">Chunking Strategy</label>
            <select
              value={chunkStrategy}
              onChange={(e) => setChunkStrategy(e.target.value)}
              className="w-full bg-[#130d2d] border border-purple-500/30 rounded-xl p-3 text-sm text-purple-100 focus:outline-none focus:border-fuchsia-400 font-medium shadow-inner"
            >
              <option value="recursive">Recursive Character (Recommended)</option>
              <option value="fixed">Fixed Size with Overlap</option>
              <option value="sliding">Sliding Window</option>
              <option value="semantic">Semantic Similarity</option>
            </select>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.txt,.md,.markdown"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-3.5 btn-3d-primary text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider"
          >
            <FileText className="w-4.5 h-4.5 drop-shadow" />
            {isUploading ? 'Vectorizing...' : 'Upload & Ingest Document'}
          </button>

          {uploadStatus && (
            <div className="text-xs font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 p-3.5 rounded-xl shadow-sm">
              {uploadStatus}
            </div>
          )}

          <div className="border-t border-purple-500/20 pt-4 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              RAG Pipeline Configuration
            </h4>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-purple-200/80 block">LLM Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-[#130d2d] border border-purple-500/30 rounded-xl p-2.5 text-xs md:text-sm text-purple-100 font-medium"
              >
                <option value="mock">Offline Neural Simulator (0-Config)</option>
                <option value="gemini">Google Gemini 1.5 Flash</option>
                <option value="openai">OpenAI GPT-4o-mini</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-purple-200/80 block">Search Pipeline Mode</label>
              <select
                value={searchMode}
                onChange={(e) => setSearchMode(e.target.value)}
                className="w-full bg-[#130d2d] border border-purple-500/30 rounded-xl p-2.5 text-xs md:text-sm text-purple-100 font-medium"
              >
                <option value="hybrid">Hybrid Search (Dense + BM25 RRF)</option>
                <option value="dense">Dense Semantic Vector Only</option>
                <option value="sparse">Sparse BM25 Keyword Only</option>
              </select>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs md:text-sm text-purple-200 font-medium pt-1">
              <input
                type="checkbox"
                checked={applyRerank}
                onChange={(e) => setApplyRerank(e.target.checked)}
                className="w-4 h-4 accent-fuchsia-500 rounded cursor-pointer"
              />
              <span>Cross-Encoder Attention Rerank</span>
            </label>
          </div>
        </div>

        <div className="bg-gradient-to-r from-violet-950/80 to-fuchsia-950/80 border border-fuchsia-500/30 p-4 rounded-xl text-xs text-purple-200/90 space-y-1 shadow-inner">
          <div className="flex items-center gap-1.5 text-fuchsia-300 font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" /> Grounded Attribution
          </div>
          <p className="leading-relaxed">Answers are verified against ingested chunks with strict citation tags.</p>
        </div>
      </div>

      {/* Main 3D Chat Stream Panel (9 cols) */}
      <div className="lg:col-span-9 glass-panel rounded-2xl flex flex-col justify-between overflow-hidden shadow-[0_15px_35px_-5px_rgba(0,0,0,0.7)] h-full">
        
        {/* Messages List */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white flex items-center justify-center border border-white/20 flex-shrink-0 mt-0.5 shadow-[0_4px_12px_rgba(217,70,239,0.35)]">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-2xl p-6 text-sm md:text-base space-y-4 transition-all leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-tr-none shadow-[0_8px_20px_rgba(139,92,246,0.35),inset_0_1px_0_rgba(255,255,255,0.3)]'
                    : 'bg-[#150e33]/90 border border-purple-500/25 text-purple-50 rounded-tl-none shadow-[0_8px_25px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Grounding Citation Badges */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-3 border-t border-purple-500/20 space-y-2">
                    <span className="text-xs font-bold text-fuchsia-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Grounded Citations:
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {msg.citations.map((c) => (
                        <button
                          key={c.source_id}
                          onClick={() => setSelectedCitation(c)}
                          className="px-3.5 py-1.5 bg-[#251752] hover:bg-[#341f73] border border-fuchsia-500/40 text-fuchsia-200 text-xs rounded-xl font-mono flex items-center gap-2 transition-all shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] hover:scale-105 cursor-pointer font-semibold"
                        >
                          <span className="text-amber-400 font-bold">[Source #{c.source_id}]</span>
                          <span className="text-purple-300 max-w-[220px] truncate">{c.label}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-fuchsia-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live RAG Triad Scorecard */}
                {msg.evaluation && (
                  <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-purple-500/20 text-xs text-purple-200/80">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold rounded-lg shadow-sm">
                      <Award className="w-4 h-4 text-emerald-400" />
                      RAG Score: {(msg.evaluation.overall_rag_score * 100).toFixed(0)}%
                    </span>
                    <span>Faithfulness: <strong className="text-white">{(msg.evaluation.faithfulness_score * 100).toFixed(0)}%</strong></span>
                    <span>Context Precision: <strong className="text-white">{(msg.evaluation.context_precision_score * 100).toFixed(0)}%</strong></span>
                    <span>Latency: <strong className="text-amber-300 font-mono">{msg.total_latency_ms}ms</strong></span>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center border border-white/20 flex-shrink-0 mt-0.5 shadow-[0_4px_12px_rgba(245,158,11,0.35)]">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {/* Quick Start Suggested Queries (if only 1 message) */}
          {messages.length === 1 && (
            <div className="pt-6 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-300/70 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-fuchsia-400" /> Suggested Exploratory Queries:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SAMPLE_QUERIES.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => handleSendMessage(e as any, q)}
                    className="p-4 rounded-xl bg-[#130d2d]/80 hover:bg-[#1f1547] border border-purple-500/30 text-left text-xs md:text-sm text-purple-200 hover:text-white transition-all flex items-center justify-between group shadow-sm hover:border-fuchsia-500/50 hover:scale-[1.01] cursor-pointer"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-fuchsia-400 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {isSending && (
            <div className="flex gap-4 justify-start items-center text-sm text-fuchsia-300 italic">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white flex items-center justify-center border border-white/20 shadow-md">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <span className="bg-purple-950/50 border border-purple-500/40 px-4 py-2.5 rounded-xl font-medium">
                Searching vector space, executing BM25 & cross-encoder reranking...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 3D Input Bar */}
        <form onSubmit={(e) => handleSendMessage(e)} className="p-4 md:p-5 bg-[#0a0718] border-t border-purple-500/20 flex gap-3.5">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything about your ingested documents or RAG architecture..."
            className="flex-1 bg-[#150e33] border border-purple-500/30 rounded-xl px-5 py-3.5 text-sm md:text-base text-purple-100 placeholder-purple-300/40 focus:outline-none focus:border-fuchsia-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] font-medium"
          />
          <button
            type="submit"
            disabled={isSending || !inputQuery.trim()}
            className="px-7 py-3.5 btn-3d-primary disabled:opacity-50 text-white text-sm md:text-base font-bold rounded-xl flex items-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Send className="w-4 h-4 drop-shadow" />
            Ask
          </button>
        </form>
      </div>

      {/* 3D Citation Inspection Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass-panel border border-fuchsia-500/40 rounded-2xl max-w-2xl w-full p-7 space-y-5 shadow-[0_25px_50px_-12px_rgba(217,70,239,0.35)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-mono text-xs font-bold rounded-lg shadow-sm">
                  [Source #{selectedCitation.source_id}]
                </span>
                <span className="text-base font-bold text-white">{selectedCitation.label}</span>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                className="text-purple-300 hover:text-white text-xs px-3 py-1.5 bg-white/10 rounded-lg hover:bg-white/20 cursor-pointer font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-fuchsia-300 mb-2">Grounded Document Passage:</div>
              <div className="bg-[#0b071a] border border-purple-500/30 rounded-xl p-5 font-mono text-sm text-purple-100 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {selectedCitation.full_content}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs md:text-sm text-purple-200/80 pt-3 border-t border-purple-500/20 font-medium">
              <span>Relevance Score: <strong className="text-emerald-400 font-mono font-bold">{selectedCitation.score}</strong></span>
              <span>Source File: <strong className="text-white">{selectedCitation.source}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
