import React from 'react';
import { Bot, Layers, Sparkles, Database, Search, Award } from 'lucide-react';

import { VeraLogo } from './VeraLogo';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'chat', label: 'Vera Chat', icon: Bot, badge: 'Live' },
    { id: 'blocks', label: 'LLM Lab', icon: Sparkles },
    { id: 'chunking', label: 'Chunking', icon: Layers },
    { id: 'search', label: 'Vectors', icon: Database },
    { id: 'rerank', label: 'Rerank', icon: Search },
    { id: 'evaluation', label: 'Eval', icon: Award },
  ];

  return (
    <header className="w-full border-b border-purple-500/20 bg-[#080914]/95 backdrop-blur-2xl sticky top-0 z-50 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.85)]">
      <div className="w-full px-6 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Logo */}
          <div 
            className="flex items-center gap-3 group cursor-pointer select-none" 
            onClick={() => setActiveTab('chat')}
          >
            <VeraLogo size={32} />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-white tracking-tight font-outfit">
                  Vera
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                  RAG
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal">
                Your Knowledge Companion
              </p>
            </div>
          </div>

          {/* Segmented Short-Pill Navigation */}
          <div className="flex items-center gap-4">
            <nav className="flex items-center bg-[#130d2d]/90 p-1.5 rounded-2xl border border-purple-500/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 text-white shadow-[0_4px_16px_rgba(217,70,239,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] translate-y-[-1px]'
                        : 'text-purple-200/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-300/70'}`} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-md uppercase tracking-wider ${
                        isActive 
                          ? 'bg-black/30 text-amber-300 border border-amber-300/40' 
                          : 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* System Status Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#130d2d] border border-purple-500/20 text-xs font-semibold text-purple-200/80 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]"></span>
              <span>Online</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
