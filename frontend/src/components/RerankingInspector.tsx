import React, { useState } from 'react';
import { ArrowUpDown, Search, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export const RerankingInspector: React.FC = () => {
  const [query, setQuery] = useState('How to fix ERR_502 proxy errors?');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [comparison, setComparison] = useState<any>(null);

  const handleInspect = async () => {
    setIsEvaluating(true);
    try {
      const resRaw = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, search_mode: 'hybrid', apply_reranking: false, top_k: 4 })
      });
      const dataRaw = await resRaw.json();

      const resRerank = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, search_mode: 'hybrid', apply_reranking: true, top_k: 4 })
      });
      const dataRerank = await resRerank.json();

      setComparison({
        raw: dataRaw.results || [],
        reranked: dataRerank.results || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-7 space-y-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
          <span className="p-2 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-xl text-white">
            <ArrowUpDown className="w-4.5 h-4.5" />
          </span>
          Cross-Encoder Reranking Inspector (Before vs After)
        </h3>
        <p className="text-sm text-purple-200/70 leading-relaxed">
          Bi-encoders (dense vector indexes) find candidates rapidly (O(1) search), but lack query-passage interaction.
          Cross-Encoders re-evaluate the top-K candidates by computing joint token cross-attention, drastically boosting context precision.
        </p>

        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-[#130d2d] border border-purple-500/30 rounded-xl px-5 py-3.5 text-sm md:text-base text-purple-100 placeholder-purple-300/40 focus:outline-none focus:border-fuchsia-400 shadow-inner font-medium"
            placeholder="Type query to evaluate..."
          />
          <button
            onClick={handleInspect}
            disabled={isEvaluating}
            className="px-7 py-3.5 btn-3d-primary text-white text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Zap className="w-4 h-4" />
            {isEvaluating ? 'Reranking...' : 'Compare Ranking Shift'}
          </button>
        </div>
      </div>

      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before Reranking */}
          <div className="glass-panel rounded-2xl p-6 space-y-4 border-amber-500/30">
            <h4 className="text-base font-bold text-amber-300 flex items-center gap-2.5 pb-3 border-b border-purple-500/20">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]"></span>
              Before Reranking (Initial Hybrid Vector & BM25)
            </h4>
            <div className="space-y-3.5">
              {comparison.raw.map((item: any, idx: number) => (
                <div key={idx} className="bg-[#130d2d] p-4 rounded-xl border border-purple-500/20 text-sm space-y-2 shadow-md">
                  <div className="flex justify-between text-purple-300/70 font-mono text-xs">
                    <span className="text-amber-400 font-bold">Initial Rank #{idx + 1}</span>
                    <span>Score: {item.score}</span>
                  </div>
                  <p className="text-purple-100 font-mono leading-relaxed">{item.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* After Reranking */}
          <div className="glass-panel rounded-2xl p-6 space-y-4 border-emerald-500/40 shadow-[0_8px_25px_rgba(16,185,129,0.15)]">
            <h4 className="text-base font-bold text-emerald-300 flex items-center gap-2.5 pb-3 border-b border-purple-500/20">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]"></span>
              After Cross-Encoder Reranking (Promoted Precision)
            </h4>
            <div className="space-y-3.5">
              {comparison.reranked.map((item: any, idx: number) => (
                <div key={idx} className="bg-[#150e33] p-4 rounded-xl border border-emerald-500/40 text-sm space-y-2 shadow-md">
                  <div className="flex justify-between text-purple-300/70 font-mono text-xs">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Promoted Rank #{idx + 1}
                    </span>
                    <span className="text-emerald-300 font-bold">Cross-Score: {item.rerank_score}</span>
                  </div>
                  <p className="text-purple-100 font-mono leading-relaxed">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
