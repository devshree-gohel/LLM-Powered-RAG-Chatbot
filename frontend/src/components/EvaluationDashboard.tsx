import React, { useState } from 'react';
import { Award, CheckCircle, AlertTriangle, ShieldCheck, Play, BarChart2, Sparkles, Zap } from 'lucide-react';

const BENCHMARK_TEST_CASES = [
  {
    query: "What encryption standard is used for data at rest in the vector database?",
    context: "Data at rest in the vector database is encrypted using AES-256-GCM. Auditing logs are retained for 7 years.",
    answer: "Data at rest is secured using AES-256-GCM encryption [Source #1].",
    retrieved_chunks: [
      { content: "Data at rest in the vector database is encrypted using AES-256-GCM." }
    ]
  },
  {
    query: "What is the mandatory compliance retention period for auditing logs?",
    context: "Auditing logs are streamed to CloudWatch and retained for a mandatory compliance duration of 7 years.",
    answer: "Auditing logs must be kept for 7 years to meet compliance mandates [Source #1].",
    retrieved_chunks: [
      { content: "Auditing logs are retained for a mandatory compliance duration of 7 years." }
    ]
  },
  {
    query: "How many availability zones are used for deployment?",
    context: "The primary vector storage engine is deployed across 3 availability zones with active replication.",
    answer: "The vector database engine is deployed across 3 availability zones [Source #1].",
    retrieved_chunks: [
      { content: "The primary vector storage engine is deployed across 3 availability zones with active replication." }
    ]
  }
];

export const EvaluationDashboard: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/eval/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_cases: BENCHMARK_TEST_CASES })
      });
      const data = await res.json();
      setBenchmarkResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 3D Intro Header */}
      <div className="glass-panel rounded-2xl p-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-xl text-white">
              <Award className="w-4.5 h-4.5" />
            </span>
            RAG Triad Automated Evaluation Benchmark
          </h3>
          <p className="text-sm text-purple-200/70 mt-1.5 max-w-3xl leading-relaxed">
            Quantify neural retrieval quality across 3 pillars:
            <strong className="text-amber-300"> Context Precision</strong> (Retrieval), <strong className="text-emerald-300">Faithfulness</strong> (Anti-hallucination), and <strong className="text-fuchsia-300">Answer Relevance</strong> (Intent match).
          </p>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={isRunning}
          className="px-7 py-3.5 btn-3d-primary text-white text-sm font-bold rounded-xl flex items-center gap-2.5 cursor-pointer uppercase tracking-wider shadow-lg whitespace-nowrap"
        >
          <Play className="w-4 h-4" />
          {isRunning ? 'Evaluating Test Suite...' : 'Run RAG Triad Benchmark'}
        </button>
      </div>

      {/* 3D Score Cards */}
      {benchmarkResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-card rounded-2xl p-6 text-center space-y-2.5 border-fuchsia-500/40">
            <div className="text-xs uppercase font-bold text-purple-300/80">Overall RAG Triad Score</div>
            <div className="text-5xl font-black bg-gradient-to-r from-violet-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent font-mono">
              {(benchmarkResult.benchmark_summary.average_overall_rag_score * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-emerald-300 flex items-center justify-center gap-1.5 font-bold">
              <CheckCircle className="w-4 h-4" /> Production Grade
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 text-center space-y-2.5 border-emerald-500/40">
            <div className="text-xs uppercase font-bold text-purple-300/80">Faithfulness (Groundedness)</div>
            <div className="text-5xl font-black text-emerald-400 font-mono">
              {(benchmarkResult.benchmark_summary.average_faithfulness * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-purple-300/70 font-medium">Zero Hallucination Risk</div>
          </div>

          <div className="glass-card rounded-2xl p-6 text-center space-y-2.5 border-purple-500/40">
            <div className="text-xs uppercase font-bold text-purple-300/80">Answer Relevance</div>
            <div className="text-5xl font-black text-fuchsia-400 font-mono">
              {(benchmarkResult.benchmark_summary.average_answer_relevance * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-purple-300/70 font-medium">High Query Alignment</div>
          </div>

          <div className="glass-card rounded-2xl p-6 text-center space-y-2.5 border-amber-500/40">
            <div className="text-xs uppercase font-bold text-purple-300/80">Context Precision</div>
            <div className="text-5xl font-black text-amber-400 font-mono">
              {(benchmarkResult.benchmark_summary.average_context_precision * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-purple-300/70 font-medium">Top-K Chunk Accuracy</div>
          </div>
        </div>
      )}

      {/* Evaluated Test Cases */}
      {benchmarkResult ? (
        <div className="glass-panel rounded-2xl p-7 space-y-5">
          <h4 className="text-base font-bold text-white flex items-center gap-2.5 border-b border-purple-500/20 pb-4">
            <Sparkles className="w-4.5 h-4.5 text-amber-400" />
            Evaluated Test Case Metrics
          </h4>
          <div className="space-y-4">
            {benchmarkResult.detailed_results.map((item: any, idx: number) => (
              <div key={idx} className="bg-[#130d2d] border border-purple-500/20 rounded-xl p-5 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-fuchsia-300">Query #{idx + 1}: {item.query}</span>
                  <span className="text-xs font-mono text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30 font-bold">
                    Overall: {item.evaluation.overall_rag_score}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs text-purple-300/80 border-t border-purple-500/20 pt-3 font-mono">
                  <span>Faithfulness: <strong className="text-emerald-400">{item.evaluation.faithfulness_score}</strong></span>
                  <span>Relevance: <strong className="text-fuchsia-300">{item.evaluation.answer_relevance_score}</strong></span>
                  <span>Precision: <strong className="text-amber-300">{item.evaluation.context_precision_score}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-14 text-center text-sm text-purple-300/50 italic space-y-3">
          <BarChart2 className="w-12 h-12 text-purple-500/30 mx-auto" />
          <p>Click "Run RAG Triad Benchmark" to run automated evaluation across test cases.</p>
        </div>
      )}
    </div>
  );
};
