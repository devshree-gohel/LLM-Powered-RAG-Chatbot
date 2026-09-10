import React, { useState, useEffect } from 'react';
import { Database, Search, Sparkles, Sliders, Trash2, CheckCircle, Upload, Zap } from 'lucide-react';
import { SearchResultItem } from '../types';

export const VectorSearchVisualizer: React.FC = () => {
  const [query, setQuery] = useState('What algorithm is used for vector encryption at rest?');
  const [searchMode, setSearchMode] = useState<'hybrid' | 'dense' | 'sparse'>('hybrid');
  const [applyRerank, setApplyRerank] = useState(true);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [indexedDocs, setIndexedDocs] = useState<any>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/rag/documents');
      const data = await res.json();
      setIndexedDocs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const res = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          search_mode: searchMode,
          apply_reranking: applyRerank,
          top_k: 4
        })
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = async () => {
    if (confirm('Clear the vector store?')) {
      await fetch('/api/rag/clear', { method: 'POST' });
      setResults([]);
      fetchDocuments();
    }
  };

  return (
    <div className="space-y-6">
      {/* 3D Top Stat Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel rounded-2xl p-6 border border-purple-500/20 shadow-md">
          <div className="text-xs font-bold text-purple-300/70 uppercase tracking-wider">Total Indexed Vector Chunks</div>
          <div className="text-4xl font-extrabold text-fuchsia-400 mt-2 font-mono">{indexedDocs?.total_chunks || 0}</div>
        </div>
        <div className="glass-panel rounded-2xl p-6 border border-purple-500/20 shadow-md">
          <div className="text-xs font-bold text-purple-300/70 uppercase tracking-wider">Indexed Document Catalog</div>
          <div className="text-base font-bold text-purple-100 mt-2 truncate">
            {indexedDocs?.distinct_sources?.join(', ') || 'None (Upload via Assistant)'}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-6 border border-purple-500/20 shadow-md flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-purple-300/70 uppercase tracking-wider">Vector Math Engine</div>
            <div className="text-base font-bold text-emerald-400 mt-2">NumPy Cosine & BM25 Inverted</div>
          </div>
          <button
            onClick={handleClear}
            className="p-3 text-rose-300 hover:bg-rose-950/60 rounded-xl border border-rose-500/30 transition-colors cursor-pointer shadow-sm"
            title="Reset Vector DB"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Query Search Panel */}
      <div className="glass-panel rounded-2xl p-7 space-y-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
          <span className="p-2 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-xl text-white">
            <Search className="w-4.5 h-4.5" />
          </span>
          Hybrid vs Dense vs Sparse Search Inspector
        </h3>

        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-[#130d2d] border border-purple-500/30 rounded-xl px-5 py-3.5 text-sm md:text-base text-purple-100 placeholder-purple-300/40 focus:outline-none focus:border-fuchsia-400 shadow-inner font-medium"
            placeholder="Type query to inspect distance and fusion rankings..."
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-7 py-3.5 btn-3d-primary text-white text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Zap className="w-4 h-4" />
            {isSearching ? 'Searching...' : 'Execute Vector Search'}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-5 pt-3 border-t border-purple-500/20 text-sm">
          <div className="flex items-center gap-5">
            <span className="text-purple-300/80 font-bold">Retrieval Mode:</span>
            {[
              { id: 'hybrid', label: 'Hybrid (Dense + BM25 RRF)' },
              { id: 'dense', label: 'Dense Semantic Vector Only' },
              { id: 'sparse', label: 'Sparse BM25 Keyword Only' }
            ].map((m) => (
              <label key={m.id} className="flex items-center gap-2 cursor-pointer text-purple-200 font-medium">
                <input
                  type="radio"
                  name="searchMode"
                  checked={searchMode === m.id}
                  onChange={() => setSearchMode(m.id as any)}
                  className="w-4 h-4 accent-fuchsia-500 cursor-pointer"
                />
                {m.label}
              </label>
            ))}
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer text-purple-200 font-medium">
            <input
              type="checkbox"
              checked={applyRerank}
              onChange={(e) => setApplyRerank(e.target.checked)}
              className="w-4 h-4 accent-fuchsia-500 rounded cursor-pointer"
            />
            <span>Apply Cross-Encoder Reranking</span>
          </label>
        </div>
      </div>

      {/* 3D Results Grid */}
      <div className="space-y-4">
        <h4 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4.5 h-4.5 text-amber-400" />
          Retrieved Candidate Chunks ({results.length} Chunks)
        </h4>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {results.map((res, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl p-6 space-y-3.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white font-mono text-sm flex items-center justify-center font-bold shadow-md">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {res.metadata?.source || 'Document Chunk'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-mono">
                    {res.rerank_score !== undefined && (
                      <span className="text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/40 font-bold shadow-sm">
                        Cross-Score: {res.rerank_score}
                      </span>
                    )}
                    <span className="text-amber-300 bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-500/40 font-bold shadow-sm">
                      Score: {res.score}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-purple-100 font-mono whitespace-pre-wrap leading-relaxed flex-1">
                  {res.content}
                </p>

                {(res.dense_rank || res.sparse_rank) && (
                  <div className="flex gap-6 text-xs text-purple-300/80 border-t border-purple-500/20 pt-3 font-mono">
                    <span>Dense Rank: <strong className="text-white">#{res.dense_rank ?? 'N/A'}</strong></span>
                    <span>Sparse BM25 Rank: <strong className="text-white">#{res.sparse_rank ?? 'N/A'}</strong></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center text-sm text-purple-300/50 italic">
            Run a search to inspect rank shifts between dense semantic matching, BM25 keywords, and Cross-Encoder scoring.
          </div>
        )}
      </div>
    </div>
  );
};
