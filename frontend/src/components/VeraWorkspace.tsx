import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Plus, Clock, Database, Bookmark, FileText, Globe, Box, 
  Layers, Upload, Link, Trash2, ArrowRight, ArrowUpRight, Search, 
  Lightbulb, Code, ChevronRight, ChevronDown, Paperclip, CheckCircle2, 
  ExternalLink, Bot, User, Award, RefreshCw, Shield,
  PanelLeftClose, PanelLeftOpen, MessageSquare, BookOpen, HardDrive,
  Palette, Copy, Check, Square, Download, FolderArchive, Save, RotateCcw, X
} from 'lucide-react';
import { RAGQueryResponse, Citation } from '../types';
import { VeraLogo } from './VeraLogo';
import { AuthModal, UserProfile } from './AuthModal';
import { useTheme, BACKGROUND_PRESETS } from '../context/ThemeContext';

interface VeraWorkspaceProps {
  onOpenLab?: (tab: string) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  evaluation?: any;
  llm_meta?: any;
  total_latency_ms?: number;
}

interface SavedSession {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
  messages: ChatMessage[];
}

const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let inTable = false;
  let tableBuffer: string[] = [];

  const parseInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[Source #\d+\]|\[Web #\d+\])/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} className="bg-purple-950/70 text-purple-200 px-1.5 py-0.5 rounded text-[13px] font-mono border border-purple-500/20">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('[Source #') || part.startsWith('[Web #')) {
        return (
          <span key={idx} className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono font-bold bg-purple-900/60 text-purple-200 border border-purple-500/30 shadow-sm">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const flushTable = (tableLines: string[], keyPrefix: string) => {
    if (tableLines.length < 2) {
      tableLines.forEach((tl, idx) => {
        elements.push(
          <p key={`${keyPrefix}-fallback-${idx}`} className="text-slate-200 leading-relaxed select-text">
            {parseInline(tl)}
          </p>
        );
      });
      return;
    }

    const parseRow = (rowStr: string) => {
      return rowStr
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim());
    };

    const headerCells = parseRow(tableLines[0]);
    const isSeparator = (s: string) => /^\|?(\s*:?-+:?\s*\|?)+$/.test(s.trim());
    const dataLines = isSeparator(tableLines[1]) ? tableLines.slice(2) : tableLines.slice(1);
    const bodyRows = dataLines.map(parseRow);

    elements.push(
      <div key={`${keyPrefix}-table`} className="overflow-x-auto my-3 rounded-xl border border-white/[0.12] bg-[#0c0e22]/90 shadow-lg scrollbar-thin">
        <table className="min-w-full text-left text-xs border-collapse">
          <thead className="bg-[#181a3d] text-purple-200 border-b border-white/[0.12]">
            <tr>
              {headerCells.map((h, hIdx) => (
                <th key={hIdx} className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-purple-300 font-mono">
                  {parseInline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] text-slate-200">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-transparent hover:bg-white/[0.04] transition-colors' : 'bg-white/[0.02] hover:bg-white/[0.05] transition-colors'}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-3 leading-relaxed align-top">
                    {parseInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inTable) {
        flushTable(tableBuffer, `tbl-${i}`);
        tableBuffer = [];
        inTable = false;
      }
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="bg-[#0b0c1b] border border-white/[0.08] p-3.5 rounded-xl font-mono text-xs text-purple-200 overflow-x-auto my-2">
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Check table rows
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
      inTable = true;
      tableBuffer.push(trimmed);
      return;
    } else if (inTable) {
      flushTable(tableBuffer, `tbl-${i}`);
      tableBuffer = [];
      inTable = false;
    }

    if (!trimmed) {
      elements.push(<div key={`sp-${i}`} className="h-1.5" />);
      return;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-bold text-white tracking-tight pt-2 pb-1 border-b border-white/[0.06] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-bold text-white tracking-tight pt-3 pb-1 border-b border-white/[0.08]">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl font-bold text-white tracking-tight pt-3 pb-1">
          {trimmed.slice(2)}
        </h1>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2.5 pl-1 my-1">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
          <div className="text-slate-200 leading-relaxed select-text">{parseInline(trimmed.slice(2))}</div>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s(.*)$/);
      elements.push(
        <div key={`oli-${i}`} className="flex items-start gap-2.5 pl-1 my-1">
          <span className="text-purple-400 font-mono text-xs font-bold mt-0.5 flex-shrink-0">{match ? match[1] : '1'}.</span>
          <div className="text-slate-200 leading-relaxed select-text">{parseInline(match ? match[2] : trimmed)}</div>
        </div>
      );
    } else {
      elements.push(
        <p key={`p-${i}`} className="text-slate-200 leading-relaxed select-text">
          {parseInline(line)}
        </p>
      );
    }
  });

  if (inTable && tableBuffer.length > 0) {
    flushTable(tableBuffer, `tbl-end`);
  }

  return <div className="space-y-1 select-text cursor-text">{elements}</div>;
};

export const VeraWorkspace: React.FC<VeraWorkspaceProps> = ({ onOpenLab }) => {
  const { settings, activeTheme, setIsThemeModalOpen } = useTheme();
  const [activeMode, setActiveMode] = useState<'rag' | 'general'>('rag');
  
  // Messages with automatic local storage persistence
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('vera_active_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vera_active_messages', JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Saved Threads & Local Sessions State
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(() => {
    try {
      const saved = localStorage.getItem('vera_saved_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vera_saved_sessions', JSON.stringify(savedSessions));
    } catch (e) {}
  }, [savedSessions]);

  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionNameInput, setSessionNameInput] = useState('');
  const [sessionSaveSuccess, setSessionSaveSuccess] = useState<string | null>(null);

  // Stop Generation AbortController
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSending(false);
  };

  // Helper to compute storage usage in KB
  const getStorageUsageKB = () => {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (key.startsWith('vera_')) {
          total += (localStorage.getItem(key) || '').length * 2;
        }
      }
      return (total / 1024).toFixed(1);
    } catch {
      return '0.0';
    }
  };

  const handleSaveCurrentSession = () => {
    if (messages.length === 0) return;
    const title = sessionNameInput.trim() || messages.find(m => m.role === 'user')?.content.slice(0, 36) || `Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newSession: SavedSession = {
      id: `session_${Date.now()}`,
      title,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      messageCount: messages.length,
      messages: [...messages]
    };
    setSavedSessions(prev => [newSession, ...prev]);
    setSessionNameInput('');
    setSessionSaveSuccess('Current conversation saved successfully!');
    setTimeout(() => setSessionSaveSuccess(null), 3000);
  };

  const handleRestoreSession = (session: SavedSession) => {
    setMessages(session.messages);
    setIsSessionModalOpen(false);
  };

  const handleDeleteSavedSession = (sessionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleExportChatMarkdown = () => {
    if (messages.length === 0) return;
    let md = `# Vera AI Conversation Export\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
    messages.forEach((msg, idx) => {
      const roleName = msg.role === 'user' ? 'User' : 'Vera Assistant';
      md += `### ${roleName} (${idx + 1})\n\n${msg.content}\n\n`;
      if (msg.citations && msg.citations.length > 0) {
        md += `**Sources Cited:**\n`;
        msg.citations.forEach(c => {
          md += `- [Source #${c.source_id}] ${c.label} (${c.source})\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vera-chat-${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportChatJSON = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      activeMessages: messages,
      savedSessions: savedSessions,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vera-sessions-backup-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearAllStorage = () => {
    if (window.confirm('Are you sure you want to clear all active chat messages and saved threads from local storage?')) {
      setMessages([]);
      setSavedSessions([]);
      setRecentActivity([]);
      try {
        localStorage.removeItem('vera_active_messages');
        localStorage.removeItem('vera_saved_sessions');
        localStorage.removeItem('vera_recent_activity');
      } catch (e) {}
      setIsSessionModalOpen(false);
    }
  };

  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  
  // Single Unified Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'knowledge'>('chats');

  // Copy Message State
  const [copiedMessageIdx, setCopiedMessageIdx] = useState<number | null>(null);

  const handleCopyMessage = (text: string, idx: number) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedMessageIdx(idx);
    setTimeout(() => {
      setCopiedMessageIdx(null);
    }, 2000);
  };

  // Live Web Search Grounding Toggle
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);

  // URL Ingest Modal State
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isIngestingUrl, setIsIngestingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Selected source for filtering RAG queries
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [isSourceMenuOpen, setIsSourceMenuOpen] = useState(false);

  // Authentication & User Profile state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('vera_auth_user');
      return saved ? JSON.parse(saved) : {
        name: 'Devshree Gohel',
        email: 'devshree@vera.ai',
        plan: 'Pro Plan',
        avatarInitials: 'DG',
        avatarGradient: 'from-violet-500 to-fuchsia-500',
        isLoggedIn: true,
      };
    } catch {
      return {
        name: 'Devshree Gohel',
        email: 'devshree@vera.ai',
        plan: 'Pro Plan',
        avatarInitials: 'DG',
        avatarGradient: 'from-violet-500 to-fuchsia-500',
        isLoggedIn: true,
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vera_auth_user', JSON.stringify(currentUser));
    } catch (e) {}
  }, [currentUser]);

  // Active knowledge sources
  const [activeSources, setActiveSources] = useState<Array<{ name: string; chars: string; pages: string; type: string }>>([
    { name: 'project_docs.pdf', chars: '2.4k chars', pages: '3 pages', type: 'pdf' },
    { name: 'research_paper.pdf', chars: '1.8k chars', pages: '2 pages', type: 'link' },
  ]);

  // Clean initial state for recent activity (loaded from localStorage or empty)
  const [recentActivity, setRecentActivity] = useState<Array<{ title: string; doc: string; time: string }>>(() => {
    try {
      const saved = localStorage.getItem('vera_recent_activity');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sourceMenuRef = useRef<HTMLDivElement>(null);

  // Sync recent activity to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vera_recent_activity', JSON.stringify(recentActivity));
    } catch (e) {}
  }, [recentActivity]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close source dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sourceMenuRef.current && !sourceMenuRef.current.contains(e.target as Node)) {
        setIsSourceMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for Cmd+N / Ctrl+N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setMessages([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(`Indexing ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('chunk_strategy', 'recursive');
    formData.append('chunk_size', '450');
    formData.append('chunk_overlap', '80');

    try {
      const res = await fetch('/api/rag/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setUploadStatus(`Indexed ${data.filename} (${data.total_chunks_created} chunks)`);
      setActiveSources((prev) => [
        { name: data.filename, chars: `${((data.total_tokens || 1000) / 1000).toFixed(1)}k chars`, pages: `${data.total_chunks_created} chunks`, type: 'pdf' },
        ...prev.filter(s => s.name !== data.filename)
      ]);
      setSelectedSource(data.filename);
    } catch (err) {
      setUploadStatus('Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteRecentActivity = (indexToDelete: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecentActivity(prev => prev.filter((_, idx) => idx !== indexToDelete));
  };

  const handleClearAllRecentActivity = () => {
    setRecentActivity([]);
    try {
      localStorage.removeItem('vera_recent_activity');
    } catch (e) {}
  };

  const handleDeleteSource = async (sourceName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveSources(prev => prev.filter(s => s.name !== sourceName));
    if (selectedSource === sourceName) {
      setSelectedSource('all');
    }
    try {
      await fetch('/api/rag/delete-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: sourceName })
      });
    } catch (err) {
      console.error('Failed to delete source from backend:', err);
    }
  };

  const handleClearAllSources = async () => {
    setActiveSources([]);
    setSelectedSource('all');
    setUploadStatus(null);
    try {
      await fetch('/api/rag/clear', { method: 'POST' });
    } catch (err) {
      console.error('Failed to clear vector store:', err);
    }
  };

  const handleLoadDemoActivity = () => {
    setRecentActivity([
      { title: 'Project overview and key points', doc: 'project_docs.pdf', time: '2m ago' },
      { title: 'Comparison of models', doc: 'research_paper.pdf', time: '12m ago' },
      { title: 'Summarize meeting notes', doc: 'notes.md', time: '1h ago' },
      { title: 'Key insights from dataset', doc: 'data.csv', time: '3h ago' },
    ]);
  };

  const handleIngestUrl = async () => {
    if (!urlInput.trim() || isIngestingUrl) return;
    setIsIngestingUrl(true);
    setUrlError(null);
    try {
      const res = await fetch('/api/rag/ingest-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveSources((prev) => [
          { 
            name: data.title || data.url, 
            chars: `${((data.total_tokens || 1000) / 1000).toFixed(1)}k tokens`, 
            pages: `${data.total_chunks_created} chunks`, 
            type: 'link' 
          },
          ...prev.filter(s => s.name !== (data.title || data.url))
        ]);
        setSelectedSource(data.title || data.url);
        setIsUrlModalOpen(false);
        setUrlInput('');
      } else {
        setUrlError(data.detail || 'Failed to index webpage URL.');
      }
    } catch (err: any) {
      setUrlError('Network error connecting to backend.');
    } finally {
      setIsIngestingUrl(false);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isSending) return;

    setInputQuery('');
    setMessages((prev) => [...prev, { role: 'user', content: textToSend }]);
    setIsSending(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const activeDocLabel = isWebSearchEnabled 
      ? 'Live Web Search' 
      : (selectedSource === 'all' ? (activeSources[0]?.name || 'all_sources') : selectedSource);

    setRecentActivity((prev) => [
      { title: textToSend.slice(0, 36) + (textToSend.length > 36 ? '...' : ''), doc: activeDocLabel, time: 'Just now' },
      ...prev.slice(0, 9)
    ]);

    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          query: textToSend,
          provider: 'gemini',
          model: 'gemini-1.5-flash',
          search_mode: activeMode === 'rag' ? 'hybrid' : 'dense',
          apply_reranking: true,
          top_k: 4,
          temperature: 0.1,
          source_filter: selectedSource === 'all' ? null : selectedSource,
          enable_web_search: isWebSearchEnabled
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
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '🛑 _Query generation stopped by user._'
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'I experienced an issue connecting to your vector knowledge base. Please ensure backend is running.'
          }
        ]);
      }
    } finally {
      abortControllerRef.current = null;
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#080914] text-slate-100 font-sans overflow-hidden">
      
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. UNIFIED SINGLE SIDEBAR                                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isSidebarOpen && (
        <aside className="w-[310px] xl:w-[330px] flex-shrink-0 bg-[#0a0b18] border-r border-white/[0.06] flex flex-col h-full p-4.5 z-20 overflow-hidden animate-in slide-in-from-left-4 duration-200">
          
          {/* Top Section: Brand & Collapse Toggle */}
          <div className="shrink-0 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 px-1 pt-1 cursor-pointer group" onClick={() => setMessages([])}>
                <VeraLogo size={34} />

                <div>
                  <h1 className="font-bold text-[22px] text-white tracking-tight leading-none font-outfit">Vera</h1>
                  <p className="text-[11px] text-slate-400 font-normal mt-1">Your Knowledge Companion</p>
                </div>
              </div>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat Primary Button */}
            <button 
              onClick={() => setMessages([])}
              className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-violet-600/35 via-purple-600/30 to-indigo-600/35 border border-purple-500/30 hover:border-purple-400/60 text-white text-[13px] font-semibold flex items-center justify-between shadow-[0_4px_16px_rgba(168,85,247,0.2)] transition-all cursor-pointer hover:scale-[1.01]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-lg bg-purple-500/25 flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5 text-purple-200" />
                </div>
                <span>New Chat</span>
              </div>
              <span className="text-[10px] font-mono bg-black/40 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">
                ⌘ N
              </span>
            </button>

            {/* Segmented Tab Navigation Switcher */}
            <div className="flex rounded-xl bg-[#121428] p-1 border border-white/[0.06] text-xs font-semibold text-slate-300">
              <button
                onClick={() => setSidebarTab('chats')}
                className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  sidebarTab === 'chats' 
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/30 shadow-sm font-bold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                <span>Chats</span>
                {recentActivity.length > 0 && (
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 rounded-full font-mono">
                    {recentActivity.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setSidebarTab('knowledge')}
                className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  sidebarTab === 'knowledge' 
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/30 shadow-sm font-bold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Knowledge</span>
                {activeSources.length > 0 && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 rounded-full font-mono">
                    {activeSources.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Middle Scrollable Content: Tab 1 (Chats) vs Tab 2 (Knowledge) */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-4 py-3 pr-1 my-1 scrollbar-thin">
            
            {/* ────── TAB 1: CHATS & RECENT PROMPTS ────── */}
            {sidebarTab === 'chats' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200 tracking-wider font-outfit uppercase">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Recent History</span>
                  </div>
                  {recentActivity.length > 0 ? (
                    <button 
                      onClick={handleClearAllRecentActivity}
                      className="text-[11px] text-rose-400/80 hover:text-rose-300 font-medium transition-colors cursor-pointer flex items-center gap-1 hover:underline"
                      title="Clear all recent history"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear All</span>
                    </button>
                  ) : (
                    <button 
                      onClick={handleLoadDemoActivity}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-medium cursor-pointer hover:underline"
                    >
                      Load Samples
                    </button>
                  )}
                </div>

                {recentActivity.length > 0 ? (
                  <div className="space-y-2">
                    {recentActivity.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleSendMessage(item.title)}
                        className="p-2.5 rounded-xl bg-[#121427]/80 hover:bg-[#181b38] border border-white/[0.06] hover:border-purple-500/35 transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden flex-1 pr-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-950/80 border border-purple-500/25 flex items-center justify-center text-purple-300 flex-shrink-0 group-hover:scale-105 transition-transform">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="overflow-hidden flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-purple-200 transition-colors">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <span className="text-purple-400/70">From:</span>
                              <span className="truncate">{item.doc}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-slate-500 whitespace-nowrap group-hover:hidden font-mono">
                            {item.time}
                          </span>
                          <button
                            onClick={(e) => handleDeleteRecentActivity(idx, e)}
                            className="hidden group-hover:flex p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                            title="Delete this query"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-[#121427]/40 border border-white/[0.04] text-center space-y-2">
                    <div className="w-8 h-8 mx-auto rounded-xl bg-purple-950/50 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-300">No Recent History</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Your queries and prompt threads will appear here automatically.</p>
                  </div>
                )}

                {/* Quick Chat Bookmarks */}
                <div className="pt-3 border-t border-white/[0.06] space-y-1">
                  <button 
                    onClick={() => setIsSessionModalOpen(true)}
                    className="w-full flex items-center justify-between px-3 py-2 text-slate-300 hover:text-white hover:bg-white/[0.04] rounded-xl text-xs font-medium transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bookmark className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                      <span>Saved Threads</span>
                    </div>
                    {savedSessions.length > 0 && (
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-mono font-bold">
                        {savedSessions.length}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => setIsSessionModalOpen(true)}
                    className="w-full flex items-center justify-between px-3 py-2 text-slate-300 hover:text-white hover:bg-white/[0.04] rounded-xl text-xs font-medium transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <HardDrive className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <span>Local Session Storage</span>
                    </div>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-mono">
                      {getStorageUsageKB()} KB
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ────── TAB 2: KNOWLEDGE BASE & DOCUMENTS ────── */}
            {sidebarTab === 'knowledge' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200 tracking-wider font-outfit uppercase">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Indexed Knowledge</span>
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-purple-400 hover:text-purple-200 p-1 rounded-lg hover:bg-purple-500/10 cursor-pointer"
                    title="Upload New Document"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {activeSources.length > 0 ? (
                  <div className="space-y-2">
                    {activeSources.map((src, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedSource(src.name)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group shadow-sm ${
                          selectedSource === src.name 
                            ? 'bg-purple-950/40 border-purple-500/50 shadow-md' 
                            : 'bg-[#121427]/80 hover:bg-[#181b38] border-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden flex-1 pr-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            idx === 0 ? 'bg-rose-950/70 border border-rose-500/30 text-rose-300' : 'bg-indigo-950/70 border border-indigo-500/30 text-indigo-300'
                          }`}>
                            {idx === 0 ? <FileText className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
                          </div>
                          <div className="overflow-hidden flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-100 truncate group-hover:text-purple-200">{src.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <span>{src.chars}</span>
                              <span>•</span>
                              <span>{src.pages}</span>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => handleDeleteSource(src.name, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer flex-shrink-0"
                          title={`Remove ${src.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-[#121427]/40 border border-white/[0.04] text-center space-y-2">
                    <div className="w-8 h-8 mx-auto rounded-xl bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Database className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-300">No Documents Uploaded</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">Attach PDFs, Markdown, or text files below to start grounding.</p>
                  </div>
                )}

                {/* Knowledge Actions */}
                <div className="pt-3 border-t border-white/[0.06] space-y-2 text-xs">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-2.5 rounded-xl bg-[#121427]/70 hover:bg-[#181b38] border border-white/[0.06] hover:border-purple-500/30 text-slate-300 hover:text-white font-medium flex items-center gap-2.5 transition-all cursor-pointer shadow-sm group"
                  >
                    <Upload className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span>Upload Document</span>
                  </button>
                  <button 
                    onClick={() => setIsUrlModalOpen(true)}
                    className="w-full p-2.5 rounded-xl bg-[#121427]/70 hover:bg-[#181b38] border border-white/[0.06] hover:border-blue-500/30 text-slate-300 hover:text-white font-medium flex items-center gap-2.5 transition-all cursor-pointer shadow-sm group"
                  >
                    <Link className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>Connect Web / URL</span>
                  </button>
                  <button 
                    onClick={handleClearAllSources}
                    className="w-full p-2.5 rounded-xl bg-rose-500/[0.06] hover:bg-rose-500/15 border border-rose-500/20 text-rose-300 hover:text-rose-200 font-medium flex items-center gap-2.5 transition-all cursor-pointer shadow-sm group"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                    <span>Clear Knowledge Base</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Fixed Footer: User Profile & Account Authentication Pill */}
          <div className="shrink-0 pt-3 border-t border-white/[0.06]">
            <div 
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center justify-between p-2.5 bg-[#121428] hover:bg-[#181a33] border border-white/[0.08] hover:border-purple-500/40 rounded-xl cursor-pointer transition-all group shadow-sm"
              title="Click to switch account, log in, or edit profile"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${currentUser.avatarGradient} flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0`}>
                  {currentUser.avatarInitials}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-100 truncate group-hover:text-purple-200 transition-colors">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                    <span>{currentUser.plan}</span>
                    <span className="text-purple-400 font-semibold">• Switch</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-purple-300 transition-transform flex-shrink-0" />
            </div>
          </div>

        </aside>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. FULL-SCREEN EXPANDED MAIN CHAT CANVAS                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <main className={`flex-1 flex flex-col justify-between relative overflow-hidden bg-[var(--vera-bg)] bg-style-${settings.backgroundStyle}`}>
        
        {/* Custom Wallpaper or Scenic Preset Layer */}
        {settings.backgroundStyle === 'custom-url' && settings.customWallpaperUrl && (
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-500"
            style={{ 
              backgroundImage: `url(${settings.customWallpaperUrl})`,
              filter: `blur(${settings.wallpaperBlur}px)`,
            }}
          />
        )}

        {BACKGROUND_PRESETS.find(b => b.id === settings.backgroundStyle)?.type === 'wallpaper' && (
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-500"
            style={{ 
              backgroundImage: `url(${BACKGROUND_PRESETS.find(b => b.id === settings.backgroundStyle)?.thumbnailUrl})`,
              filter: `blur(${settings.wallpaperBlur}px)`,
            }}
          />
        )}

        {/* Wallpaper Dimmer Overlay */}
        {(settings.backgroundStyle === 'custom-url' || BACKGROUND_PRESETS.find(b => b.id === settings.backgroundStyle)?.type === 'wallpaper') && (
          <div 
            className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
            style={{ backgroundColor: `rgba(0, 0, 0, ${settings.wallpaperDim / 100})` }}
          />
        )}

        {/* Atmospheric Glow Layer */}
        {settings.glowIntensity !== 'none' && (
          <div 
            className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-500 ${
              settings.glowIntensity === 'low' ? 'opacity-25' : settings.glowIntensity === 'high' ? 'opacity-85' : 'opacity-50'
            }`}
          >
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[580px] h-[360px] bg-[var(--vera-glow)] rounded-full blur-[120px] pointer-events-none" />
          </div>
        )}

        {/* Subtle Twinkling Star Particles */}
        <div className="absolute top-12 left-[18%] w-1.5 h-1.5 bg-fuchsia-300 rounded-full blur-[0.5px] opacity-70 animate-twinkle pointer-events-none"></div>
        <div className="absolute top-28 right-[22%] w-1 h-1 bg-cyan-200 rounded-full blur-[0.5px] opacity-60 pointer-events-none"></div>
        <div className="absolute top-44 left-[30%] text-[10px] text-purple-400/40 select-none pointer-events-none">✦</div>
        <div className="absolute bottom-40 right-[28%] text-[8px] text-fuchsia-400/40 select-none pointer-events-none">✧</div>
        <div className="absolute bottom-32 left-[20%] w-1.5 h-1.5 bg-purple-300 rounded-full blur-[0.8px] opacity-50 animate-twinkle pointer-events-none"></div>

        {/* Top Header Mode Toggle & Studio Tabs */}
        <header className="w-full flex items-center justify-between px-6 sm:px-8 py-4 z-10">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle Button (when collapsed) */}
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121428]/90 hover:bg-[#1b1e3d] border border-white/[0.08] hover:border-purple-500/40 text-slate-200 hover:text-white transition-all shadow-md cursor-pointer group"
                title="Expand Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold font-outfit">Vera</span>
              </button>
            )}

            {onOpenLab && (
              <div className="flex items-center gap-1.5 bg-[#121428]/90 p-1 rounded-xl border border-white/[0.06] text-xs font-semibold text-slate-300">
                <button onClick={() => onOpenLab('blocks')} className="px-2.5 py-1 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer">LLM Lab</button>
                <button onClick={() => onOpenLab('chunking')} className="px-2.5 py-1 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer">Chunking</button>
                <button onClick={() => onOpenLab('search')} className="px-2.5 py-1 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer">Vectors</button>
                <button onClick={() => onOpenLab('rerank')} className="px-2.5 py-1 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer">Rerank</button>
                <button onClick={() => onOpenLab('evaluation')} className="px-2.5 py-1 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer">Eval</button>
              </div>
            )}
          </div>

          {/* Right Header Section: Active Source Badge, Theme Customizer & Mode Toggle */}
          <div className="flex items-center gap-2.5">
            {/* Theme & Background Customizer Button */}
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#101224]/90 hover:bg-[#181b36] border border-purple-500/30 hover:border-purple-400 text-xs font-semibold text-purple-200 hover:text-white transition-all shadow-md cursor-pointer group"
              title="Customize Theme & Background"
            >
              <Palette className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline font-medium">Theme</span>
            </button>

            {selectedSource !== 'all' && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-[11px] text-purple-300 font-medium">
                <FileText className="w-3 h-3 text-purple-400" />
                <span className="max-w-[140px] truncate">{selectedSource}</span>
                <button 
                  onClick={() => setSelectedSource('all')}
                  className="hover:text-white ml-0.5 text-slate-400 cursor-pointer"
                  title="Clear source filter"
                >
                  ✕
                </button>
              </div>
            )}

            {/* RAG Mode / General Chat Pill Switch */}
            <div className="flex items-center bg-[#101224]/90 p-1 rounded-full border border-purple-500/25 shadow-lg">
              <button
                onClick={() => setActiveMode('rag')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'rag'
                    ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-[0_0_16px_rgba(168,85,247,0.45)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>RAG Mode</span>
              </button>
              <button
                onClick={() => setActiveMode('general')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeMode === 'general'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                General Chat
              </button>
            </div>
          </div>
        </header>

        {/* Main Canvas Body: Hero view vs Active Messages */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-3xl mx-auto w-full z-10 py-2 sm:py-3">
            
            {/* 3D Glowing Planetary Core with Orbital Rings */}
            {settings.showOrb && (
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 mb-3 sm:mb-4 flex items-center justify-center animate-orb-float flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/35 via-fuchsia-500/25 to-cyan-400/25 rounded-full blur-2xl animate-pulse"></div>
                <svg viewBox="0 0 220 220" className="absolute w-48 h-48 sm:w-52 sm:h-52 -top-6 -left-6 pointer-events-none opacity-85">
                  <ellipse cx="110" cy="110" rx="98" ry="34" stroke="url(#ringGrad1)" strokeWidth="1.6" transform="rotate(-26 110 110)" fill="none" />
                  <ellipse cx="110" cy="110" rx="84" ry="26" stroke="url(#ringGrad2)" strokeWidth="1.2" transform="rotate(-16 110 110)" fill="none" opacity="0.65" />
                  <circle cx="185" cy="78" r="2.2" fill="#ffffff" filter="drop-shadow(0 0 4px #e879f9)" />
                  <circle cx="35" cy="142" r="1.6" fill="#38bdf8" />
                  <defs>
                    <linearGradient id="ringGrad1" x1="0" y1="0" x2="220" y2="220" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#d8b4fe" stopOpacity="0.85" />
                      <stop offset="0.5" stopColor="#38bdf8" stopOpacity="0.9" />
                      <stop offset="1" stopColor="#c084fc" stopOpacity="0.15" />
                    </linearGradient>
                    <linearGradient id="ringGrad2" x1="0" y1="0" x2="220" y2="220" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#38bdf8" stopOpacity="0.7" />
                      <stop offset="1" stopColor="#a855f7" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#1b103f] via-[#581c87] to-[#c084fc] p-[2px] shadow-[inset_0_4px_14px_rgba(255,255,255,0.45),0_0_40px_rgba(168,85,247,0.55)]">
                  <div className="w-full h-full rounded-full bg-gradient-to-b from-[#7e22ce]/85 via-[#3b0764]/95 to-[#0b051d] backdrop-blur-md flex items-center justify-center overflow-hidden">
                    <div className="w-20 h-20 bg-gradient-to-tr from-fuchsia-500/40 via-cyan-400/40 to-transparent rounded-full blur-md transform -rotate-45"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Exact Greeting Headline */}
            <div className="text-center space-y-1.5 mb-5 max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-normal text-slate-100 tracking-tight font-outfit">
                Hi <span className="font-bold bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-200 bg-clip-text text-transparent">{currentUser.name.split(' ')[0] || 'there'}</span>,
              </h2>
              <p className="text-lg sm:text-xl font-medium text-slate-100 tracking-tight font-outfit">
                I'm your RAG-powered AI assistant.
              </p>
              <p className="text-xs sm:text-[13px] text-slate-400 max-w-lg mx-auto leading-relaxed pt-0.5">
                Ask me anything from your documents, notes, or connected sources — and I'll find the most relevant, accurate information for you.
              </p>
            </div>

            {/* 4 Feature Action Cards (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mb-4 sm:mb-6">
              
              {/* Card 1: Summarize */}
              <div 
                onClick={() => handleSendMessage("Summarize the key takeaways and insights from my uploaded documents.")}
                className="vera-card group p-3.5 rounded-xl sm:rounded-2xl cursor-pointer flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:text-fuchsia-300 group-hover:border-fuchsia-500/50 transition-colors flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-100">Summarize this document</div>
                    <div className="text-[11px] text-slate-400">Get key insights in seconds</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:text-fuchsia-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>

              {/* Card 2: Compare */}
              <div 
                onClick={() => handleSendMessage("Compare the technical differences, pros, and trade-offs between the topics in my documents.")}
                className="vera-card group p-3.5 rounded-xl sm:rounded-2xl cursor-pointer flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-300 group-hover:text-cyan-300 group-hover:border-cyan-500/50 transition-colors flex-shrink-0">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-100">Compare information</div>
                    <div className="text-[11px] text-slate-400">Find differences across files</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:text-fuchsia-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>

              {/* Card 3: Ask Data */}
              <div 
                onClick={() => handleSendMessage("What are the most critical takeaways from the knowledge base?")}
                className="vera-card group p-3.5 rounded-xl sm:rounded-2xl cursor-pointer flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-300 group-hover:text-yellow-200 group-hover:border-yellow-500/50 transition-colors flex-shrink-0">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-100">Ask about your data</div>
                    <div className="text-[11px] text-slate-400">Get answers with source links</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:text-fuchsia-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>

              {/* Card 4: Generate */}
              <div 
                onClick={() => handleSendMessage("Generate a structured brief and study notes based on my connected sources.")}
                className="vera-card group p-3.5 rounded-xl sm:rounded-2xl cursor-pointer flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-500/30 flex items-center justify-center text-teal-300 group-hover:text-emerald-300 group-hover:border-emerald-500/50 transition-colors flex-shrink-0">
                    <Code className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-100">Generate from context</div>
                    <div className="text-[11px] text-slate-400">Use your own knowledge base</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:text-fuchsia-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>

            </div>
          </div>
        ) : (
          /* Active Chat Stream - Full Width Spacious Experience */
          <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-6 space-y-6 max-w-5xl mx-auto w-full z-10 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-3xl rounded-2xl p-5 text-sm space-y-3 leading-relaxed shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-tr-none'
                    : 'bg-[#121428]/95 border border-white/[0.08] text-slate-100 rounded-tl-none'
                }`}>
                  {/* Top Bar for Assistant Messages: Vera badge & Copy Button */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-purple-300">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Vera Knowledge Synthesis</span>
                      </div>
                      <button
                        onClick={() => handleCopyMessage(msg.content, idx)}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                        title="Copy text to clipboard"
                      >
                        {copiedMessageIdx === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300 font-medium text-[11px]">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px]">Copy Answer</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Message Content: Rich Formatted Markdown */}
                  {msg.role === 'assistant' ? (
                    <FormattedMessage content={msg.content} />
                  ) : (
                    <div className="whitespace-pre-wrap select-text cursor-text leading-relaxed font-normal">
                      {msg.content}
                    </div>
                  )}

                  {/* Citation Pills */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-3 border-t border-white/[0.08] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-fuchsia-300 uppercase tracking-wider">Verified Sources:</span>
                        <span className="text-[10px] text-slate-400 font-mono">{msg.citations.length} cited</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.citations.map((c) => {
                          const isWeb = c.source_type === 'web' || Boolean(c.url);
                          return (
                            <button
                              key={c.source_id}
                              onClick={() => c.url ? window.open(c.url, '_blank') : setSelectedCitation(c)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer border ${
                                isWeb 
                                  ? 'bg-cyan-950/80 hover:bg-cyan-900/80 border-cyan-500/40 text-cyan-200 shadow-sm' 
                                  : 'bg-[#201548] hover:bg-[#2e1d68] border-purple-500/35 text-purple-200'
                              }`}
                              title={c.url ? `Open live source: ${c.url}` : 'View citation details'}
                            >
                              {isWeb && <Globe className="w-3 h-3 text-cyan-400" />}
                              <span className={isWeb ? 'text-cyan-300 font-bold' : 'text-amber-400 font-bold'}>
                                [{isWeb ? 'Web' : 'Source'} #{c.source_id}]
                              </span>
                              <span className="max-w-[150px] truncate text-slate-200">{c.label}</span>
                              <ExternalLink className={`w-3 h-3 ${isWeb ? 'text-cyan-400' : 'text-purple-400'}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Evaluation Metrics */}
                  {msg.evaluation && (
                    <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-white/[0.08] text-[11px] text-slate-400 font-mono">
                      <span className="text-emerald-300 font-bold flex items-center gap-1">
                        <Award className="w-3 h-3" /> RAG Score: {(msg.evaluation.overall_rag_score * 100).toFixed(0)}%
                      </span>
                      <span>Faithfulness: {(msg.evaluation.faithfulness_score * 100).toFixed(0)}%</span>
                      <span>Precision: {(msg.evaluation.context_precision_score * 100).toFixed(0)}%</span>
                      <span>Latency: {msg.total_latency_ms}ms</span>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${currentUser.avatarGradient} flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0`}>
                    {currentUser.avatarInitials}
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex gap-3 items-center text-xs text-purple-300 italic">
                <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-500/30 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
                <span>
                  {isWebSearchEnabled 
                    ? 'Searching live web & retrieving grounded facts...' 
                    : 'Retrieving grounded facts and synthesizing response...'}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 3. BOTTOM FLOATING CHAT INPUT CAPSULE                         */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="w-full px-6 sm:px-12 pb-6 pt-2 z-20 shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            
            {/* Input Capsule Box */}
            <div className="vera-input-capsule p-3 rounded-3xl space-y-2.5">
              
              {/* Text Input Row */}
              <div className="flex items-center gap-3 px-2">
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 animate-pulse" />
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isWebSearchEnabled ? "Ask anything (Live Web Search active)..." : "Ask a question..."}
                  className="flex-1 bg-transparent border-none text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-normal"
                />
              </div>

              {/* Action Buttons Row Inside Pill */}
              <div className="flex items-center justify-between pt-1 px-1 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                  
                  {/* Attachment Clip */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title="Attach File"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.txt,.md,.markdown"
                    className="hidden"
                  />

                  {/* Web Search Live Toggle Pill */}
                  <button 
                    onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold transition-all cursor-pointer ${
                      isWebSearchEnabled 
                        ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.45)]' 
                        : 'bg-[#181a33] hover:bg-[#222547] border-white/[0.08] text-slate-300 hover:text-white'
                    }`}
                    title={isWebSearchEnabled ? 'Live Web Search is ACTIVE (Grounding with real-time web results)' : 'Click to enable live Web Search grounding'}
                  >
                    <Globe className={`w-3 h-3 ${isWebSearchEnabled ? 'text-cyan-300 animate-spin' : 'text-cyan-400'}`} style={{ animationDuration: isWebSearchEnabled ? '8s' : '0s' }} />
                    <span>{isWebSearchEnabled ? 'Web Search: Live' : 'Web Search'}</span>
                    {isWebSearchEnabled && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping ml-0.5" />
                    )}
                  </button>

                  {/* Upload Files Pill */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181a33] hover:bg-[#222547] border border-white/[0.08] text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Upload className="w-3 h-3 text-fuchsia-400" />
                    <span>Upload Files</span>
                  </button>

                  {/* Select Source Pill with Interactive Dropdown */}
                  <div className="relative" ref={sourceMenuRef}>
                    <button 
                      onClick={() => setIsSourceMenuOpen(!isSourceMenuOpen)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold transition-all cursor-pointer ${
                        selectedSource !== 'all'
                          ? 'bg-purple-900/60 border-purple-500/50 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                          : 'bg-[#181a33] hover:bg-[#222547] border-white/[0.08] text-slate-300 hover:text-white'
                      }`}
                      title="Select source to ground your questions"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span className="max-w-[120px] truncate">
                        {selectedSource === 'all' ? 'Select Source' : selectedSource}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isSourceMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu Popover */}
                    {isSourceMenuOpen && (
                      <div className="absolute bottom-full mb-2 left-0 w-72 bg-[#101226]/95 border border-purple-500/35 rounded-2xl p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/[0.06]">
                          <span>Filter Source</span>
                          <span className="text-[10px] text-purple-400 font-mono">{activeSources.length} available</span>
                        </div>

                        <div className="py-1.5 space-y-1 max-h-52 overflow-y-auto">
                          {/* Option: All Sources */}
                          <button
                            onClick={() => { setSelectedSource('all'); setIsSourceMenuOpen(false); }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                              selectedSource === 'all' 
                                ? 'bg-purple-600/25 text-purple-200 font-semibold border border-purple-500/30 shadow-inner' 
                                : 'text-slate-300 hover:bg-white/[0.06]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Globe className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                              <span>All Sources (Global RAG)</span>
                            </div>
                            {selectedSource === 'all' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />}
                          </button>

                          {/* Dynamic Active Sources */}
                          {activeSources.map((src, idx) => (
                            <button
                              key={idx}
                              onClick={() => { setSelectedSource(src.name); setIsSourceMenuOpen(false); }}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                                selectedSource === src.name 
                                  ? 'bg-purple-600/25 text-purple-200 font-semibold border border-purple-500/30 shadow-inner' 
                                  : 'text-slate-300 hover:bg-white/[0.06]'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <FileText className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                <span className="truncate">{src.name}</span>
                              </div>
                              {selectedSource === src.name && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />}
                            </button>
                          ))}

                          {activeSources.length === 0 && (
                            <div className="p-3 text-center text-[11px] text-slate-500">
                              No documents uploaded yet.
                            </div>
                          )}
                        </div>

                        {/* Upload action inside dropdown */}
                        <div className="pt-1.5 mt-1 border-t border-white/[0.06]">
                          <button
                            onClick={() => { fileInputRef.current?.click(); setIsSourceMenuOpen(false); }}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-medium transition-colors cursor-pointer border border-purple-500/20"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload New Document</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Circular Glowing Send / Stop Button */}
                {isSending ? (
                  <button
                    onClick={handleStopGeneration}
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 text-white flex items-center justify-center shadow-[0_0_16px_rgba(244,63,94,0.6)] hover:scale-110 transition-all cursor-pointer animate-pulse"
                    title="Stop generation"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputQuery.trim()}
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-500 disabled:opacity-40 text-white flex items-center justify-center shadow-[0_0_16px_rgba(168,85,247,0.5)] hover:scale-105 transition-all cursor-pointer"
                    title="Send query"
                  >
                    <ArrowUpRight className="w-4.5 h-4.5 font-bold" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. CITATION INSPECTOR MODAL                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="vera-card rounded-2xl max-w-2xl w-full p-7 space-y-5 shadow-2xl border-purple-500/40">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-mono text-xs font-bold rounded-lg shadow-sm">
                  [Source #{selectedCitation.source_id}]
                </span>
                <span className="text-base font-bold text-white">{selectedCitation.label}</span>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                className="text-slate-400 hover:text-white text-xs px-3 py-1.5 bg-white/10 rounded-lg hover:bg-white/20 cursor-pointer font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2">Grounded Document Passage:</div>
              <div className="bg-[#090a16] border border-white/[0.08] rounded-xl p-5 font-mono text-sm text-slate-200 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {selectedCitation.full_content}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs md:text-sm text-slate-400 pt-3 border-t border-white/[0.08]">
              <span>Relevance Score: <strong className="text-emerald-400 font-mono font-bold">{selectedCitation.score}</strong></span>
              <span>Source File: <strong className="text-white">{selectedCitation.source}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. AUTHENTICATION & PROFILE MODAL                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={setCurrentUser}
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. CONNECT WEB / URL INGESTION MODAL                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="fixed inset-0" onClick={() => !isIngestingUrl && setIsUrlModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#0e1022] border border-cyan-500/30 rounded-2xl shadow-2xl p-6 z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Connect Website / Web URL</h3>
                  <p className="text-[11px] text-slate-400">Scrape, extract facts, and index into knowledge base</p>
                </div>
              </div>
              <button 
                onClick={() => setIsUrlModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                disabled={isIngestingUrl}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Webpage URL</label>
                <input
                  type="url"
                  placeholder="https://en.wikipedia.org/wiki/Artificial_intelligence"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleIngestUrl()}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  disabled={isIngestingUrl}
                />
              </div>

              {urlError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  {urlError}
                </p>
              )}

              <div className="text-[11px] text-slate-400 leading-relaxed bg-white/[0.03] p-3 rounded-xl border border-white/[0.05]">
                💡 <strong>Tip:</strong> Paste documentation links, Wikipedia pages, articles, or research posts. The pipeline extracts clean text, creates chunks, and indexes them into the vector database.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                onClick={() => setIsUrlModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                disabled={isIngestingUrl}
              >
                Cancel
              </button>
              <button
                onClick={handleIngestUrl}
                disabled={isIngestingUrl || !urlInput.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-cyan-500/20 cursor-pointer flex items-center gap-2 transition-all"
              >
                {isIngestingUrl ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scraping & Indexing...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    <span>Crawl & Index URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 7. LOCAL SESSION STORAGE & SAVED THREADS MODAL               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setIsSessionModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-[#0d0f22] border border-purple-500/40 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-6 z-10 space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md">
                  <Database className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-outfit">Local Session Storage & Saved Threads</h3>
                  <p className="text-xs text-slate-400">Save, restore, export, and manage your conversation history</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono bg-purple-950/80 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/30">
                  {getStorageUsageKB()} KB used
                </span>
                <button 
                  onClick={() => setIsSessionModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Save Current Conversation Section */}
            <div className="p-4 rounded-2xl bg-[#141733]/70 border border-purple-500/25 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                  <Save className="w-3.5 h-3.5 text-purple-400" />
                  <span>Snapshot Active Conversation</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {messages.length} messages in active chat
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Thread title (e.g., Deep Learning Architecture Notes)..."
                  value={sessionNameInput}
                  onChange={(e) => setSessionNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveCurrentSession()}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-normal"
                />
                <button
                  onClick={handleSaveCurrentSession}
                  disabled={messages.length === 0}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-purple-500/20 cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 flex-shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Snapshot</span>
                </button>
              </div>

              {sessionSaveSuccess && (
                <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 animate-fadeIn">
                  <Check className="w-3.5 h-3.5" />
                  <span>{sessionSaveSuccess}</span>
                </div>
              )}
            </div>

            {/* Saved Threads List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <FolderArchive className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Saved Sessions ({savedSessions.length})</span>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {savedSessions.length > 0 ? (
                  savedSessions.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-2xl bg-[#121428] hover:bg-[#191c3d] border border-white/[0.06] hover:border-purple-500/35 transition-all flex items-center justify-between group shadow-sm"
                    >
                      <div className="flex items-center gap-3 overflow-hidden flex-1 pr-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-500/25 flex items-center justify-center text-purple-300 flex-shrink-0">
                          <Bookmark className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-purple-200 transition-colors">
                            {s.title}
                          </h4>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                            <span>{s.createdAt}</span>
                            <span>•</span>
                            <span className="text-purple-400">{s.messageCount} messages</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleRestoreSession(s)}
                          className="px-2.5 py-1 rounded-lg bg-purple-600/25 hover:bg-purple-600/45 text-purple-200 border border-purple-500/30 text-xs font-medium transition-all cursor-pointer flex items-center gap-1 hover:scale-105"
                          title="Restore this conversation"
                        >
                          <RotateCcw className="w-3 h-3 text-purple-300" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteSavedSession(s.id, e)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                          title="Delete saved session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center space-y-1.5">
                    <p className="text-xs font-semibold text-slate-300">No saved sessions yet</p>
                    <p className="text-[11px] text-slate-500">Save snapshots above to keep long-term conversation logs in your browser.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Export & Management Actions Footer */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportChatMarkdown}
                  disabled={messages.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                  title="Export active conversation as Markdown file"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span>Export Chat (.md)</span>
                </button>
                <button
                  onClick={handleExportChatJSON}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Export all saved sessions and active chat to JSON backup"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export Backup (.json)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setMessages([]); setIsSessionModalOpen(false); }}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-xs font-medium transition-colors cursor-pointer"
                >
                  Clear Active Chat
                </button>
                <button
                  onClick={handleClearAllStorage}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Reset Storage</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
