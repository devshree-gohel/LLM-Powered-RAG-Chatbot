import React, { useState } from 'react';
import { VeraWorkspace } from './components/VeraWorkspace';
import { BuildingBlocksLab } from './components/BuildingBlocksLab';
import { ChunkingVisualizer } from './components/ChunkingVisualizer';
import { VectorSearchVisualizer } from './components/VectorSearchVisualizer';
import { RerankingInspector } from './components/RerankingInspector';
import { EvaluationDashboard } from './components/EvaluationDashboard';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeModal } from './components/ThemeModal';
import { ArrowLeft, X } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('chat');

  return (
    <ThemeProvider>
      <div className="h-screen w-screen bg-[var(--vera-bg)] text-slate-100 flex flex-col overflow-hidden font-sans">
        
        {activeTab === 'chat' ? (
          <VeraWorkspace onOpenLab={(tab) => setActiveTab(tab)} />
        ) : (
          /* Educational Studio Lab View */
          <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--vera-bg)]">
            {/* Studio Header */}
            <div className="w-full bg-[var(--vera-sidebar)] border-b border-purple-500/20 px-8 py-3.5 flex items-center justify-between z-30">
              <button
                onClick={() => setActiveTab('chat')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Vera Chat</span>
              </button>

              <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10 text-xs font-semibold">
                {[
                  { id: 'blocks', label: 'LLM Lab' },
                  { id: 'chunking', label: 'Chunking' },
                  { id: 'search', label: 'Vectors' },
                  { id: 'rerank', label: 'Rerank' },
                  { id: 'evaluation', label: 'Eval' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === t.id
                        ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 text-white font-bold shadow-sm'
                        : 'text-purple-300/70 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setActiveTab('chat')}
                className="p-2 text-purple-300 hover:text-white rounded-lg hover:bg-white/10"
                title="Close Studio"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Studio Body */}
            <main className="flex-1 w-full overflow-y-auto px-8 py-6">
              {activeTab === 'blocks' && <BuildingBlocksLab />}
              {activeTab === 'chunking' && <ChunkingVisualizer />}
              {activeTab === 'search' && <VectorSearchVisualizer />}
              {activeTab === 'rerank' && <RerankingInspector />}
              {activeTab === 'evaluation' && <EvaluationDashboard />}
            </main>
          </div>
        )}

        {/* Global Theme & Background Customizer Modal */}
        <ThemeModal />
      </div>
    </ThemeProvider>
  );
}

export default App;
