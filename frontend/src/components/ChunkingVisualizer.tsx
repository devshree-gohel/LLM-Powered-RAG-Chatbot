import React, { useState } from 'react';
import { Layers, Split, ArrowRight, FileText, CheckCircle, Sparkles } from 'lucide-react';
import { CompareChunkingResponse } from '../types';

const DEFAULT_SAMPLE_DOC = `# Deep Dive into Vector Search and RAG Pipelines

Retrieval-Augmented Generation (RAG) bridges external domain data with generative LLM inference.
Rather than fine-tuning weights for every single update, vector databases store embedded knowledge chunks.

## 1. Embeddings & Semantic Geometry
Embedding models project text passages into dense mathematical vector representations.
Nearness in vector space reflects semantic similarity, measured using Cosine Similarity or Dot Product.

## 2. Chunking Granularity Tradeoffs
Chunking balances contextual preservation against noise dilution.
- Fixed-Size Chunking chops text strictly at arbitrary character thresholds.
- Recursive Character Chunking hierarchically splits on paragraphs and punctuation marks.
- Sliding Window Chunking preserves rolling sentence continuity with overlap.
- Semantic Chunking detects topical transition boundaries across sentence vectors.

## 3. Hybrid Search & Cross-Encoder Reranking
Combining dense semantic search with sparse lexical BM25 matching yields optimal retrieval precision.
Cross-encoders then evaluate joint attention across (query, passage) pairs to filter false positives.`;

export const ChunkingVisualizer: React.FC = () => {
  const [sampleText, setSampleText] = useState(DEFAULT_SAMPLE_DOC);
  const [chunkSize, setChunkSize] = useState(300);
  const [chunkOverlap, setChunkOverlap] = useState(50);
  const [result, setResult] = useState<CompareChunkingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<'recursive_character' | 'fixed_size' | 'sliding_window' | 'semantic_similarity'>('recursive_character');

  const handleCompare = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rag/compare-chunking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          chunk_size: chunkSize,
          chunk_overlap: chunkOverlap
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Input */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-2xl p-7 space-y-5">
          <div className="flex justify-between items-center border-b border-purple-500/20 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <span className="p-2 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-xl text-white">
                <FileText className="w-4.5 h-4.5" />
              </span>
              Source Document for Chunking Analysis
            </h3>
            <span className="text-xs font-mono text-purple-300 font-bold bg-[#150e33] px-3 py-1 rounded-lg border border-purple-500/30">
              {sampleText.length} characters
            </span>
          </div>

          <textarea
            rows={8}
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            className="w-full bg-[#130d2d] border border-purple-500/30 rounded-xl p-4 text-sm font-mono text-purple-100 shadow-inner focus:outline-none focus:border-fuchsia-400 leading-relaxed"
          />

          <div className="flex flex-wrap items-center justify-between gap-5 pt-2">
            <div className="flex items-center gap-6 text-sm text-purple-200 font-semibold">
              <div className="flex items-center gap-2.5">
                <span>Chunk Size:</span>
                <input
                  type="number"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(parseInt(e.target.value) || 200)}
                  className="w-24 bg-[#150e33] border border-purple-500/30 rounded-xl px-3 py-1.5 text-center font-mono text-sm"
                />
              </div>
              <div className="flex items-center gap-2.5">
                <span>Overlap:</span>
                <input
                  type="number"
                  value={chunkOverlap}
                  onChange={(e) => setChunkOverlap(parseInt(e.target.value) || 0)}
                  className="w-24 bg-[#150e33] border border-purple-500/30 rounded-xl px-3 py-1.5 text-center font-mono text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleCompare}
              disabled={isLoading}
              className="px-6 py-3.5 btn-3d-primary text-white text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Split className="w-4.5 h-4.5" />
              {isLoading ? 'Processing...' : 'Compare 4 Chunking Strategies'}
            </button>
          </div>
        </div>

        {/* 3D Strategy Selector Cards */}
        <div className="glass-panel rounded-2xl p-7 space-y-5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2.5 border-b border-purple-500/20 pb-4">
            <span className="p-2 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-xl text-white">
              <Layers className="w-4.5 h-4.5" />
            </span>
            Select Strategy to Inspect
          </h3>

          <div className="space-y-3">
            {[
              { id: 'recursive_character', title: 'Recursive Character (Recommended)', desc: 'Respects headers, paragraphs & punctuation boundaries.' },
              { id: 'fixed_size', title: 'Fixed-Size with Overlap', desc: 'Arbitrary character limit splitting.' },
              { id: 'sliding_window', title: 'Sliding Window', desc: 'Rolling N-sentence window with stride.' },
              { id: 'semantic_similarity', title: 'Semantic Similarity', desc: 'Detects vector shift transitions between sentences.' }
            ].map((st) => (
              <div
                key={st.id}
                onClick={() => setSelectedStrategy(st.id as any)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedStrategy === st.id
                    ? 'bg-gradient-to-r from-violet-950/90 to-fuchsia-950/90 border-fuchsia-500 text-white shadow-[0_6px_20px_rgba(217,70,239,0.25)] translate-y-[-2px]'
                    : 'bg-[#130d2d] border-purple-500/20 text-purple-300/70 hover:border-purple-500/40 hover:bg-[#1a123d]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{st.title}</span>
                  {result && (
                    <span className="text-xs font-mono bg-purple-900/60 px-2.5 py-1 rounded-lg text-amber-300 font-bold border border-purple-500/30">
                      {(result.strategies as any)[st.id]?.count || 0} chunks
                    </span>
                  )}
                </div>
                <p className="text-xs text-purple-200/70 mt-1.5 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3D Visual Chunk Cards Grid */}
      {result && (
        <div className="glass-panel rounded-2xl p-7 space-y-5">
          <div className="flex justify-between items-center border-b border-purple-500/20 pb-4">
            <h4 className="text-base font-bold text-white">
              Visual Chunks for: <span className="text-fuchsia-400 capitalize">{selectedStrategy.replace('_', ' ')}</span>
            </h4>
            <span className="text-sm text-purple-300">
              Total Chunks Generated: <strong className="text-white font-mono font-bold">{(result.strategies as any)[selectedStrategy]?.count}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(result.strategies as any)[selectedStrategy]?.chunks.map((c: any, idx: number) => (
              <div
                key={idx}
                className="glass-card rounded-2xl p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
                  <span className="text-sm font-mono text-fuchsia-300 font-bold">Chunk #{idx + 1}</span>
                  <span className="text-xs font-mono text-amber-300 bg-[#1a123d] px-3 py-1 rounded-lg border border-purple-500/30 font-bold">
                    {c.token_count} tokens
                  </span>
                </div>
                <p className="text-sm text-purple-100 font-mono whitespace-pre-wrap leading-relaxed flex-1">
                  {c.content}
                </p>
                <div className="text-xs text-purple-300/60 pt-2.5 border-t border-purple-500/20 font-mono">
                  Strategy: {c.metadata.chunk_strategy}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
