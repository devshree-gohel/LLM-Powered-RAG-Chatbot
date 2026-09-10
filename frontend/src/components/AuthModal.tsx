import React, { useState } from 'react';
import { User, LogIn, LogOut, ShieldCheck, Sparkles, Check, X, UserPlus, KeyRound, Mail } from 'lucide-react';

export interface UserProfile {
  name: string;
  email: string;
  plan: 'Free Plan' | 'Pro Plan' | 'Enterprise';
  avatarInitials: string;
  avatarGradient: string;
  isLoggedIn: boolean;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
}

const PRESET_USERS: UserProfile[] = [
  {
    name: 'Devshree Gohel',
    email: 'devshree@vera.ai',
    plan: 'Pro Plan',
    avatarInitials: 'DG',
    avatarGradient: 'from-violet-500 to-fuchsia-500',
    isLoggedIn: true,
  },
  {
    name: 'Dharmang Patel',
    email: 'dharmang@vera.ai',
    plan: 'Enterprise',
    avatarInitials: 'DP',
    avatarGradient: 'from-cyan-500 to-blue-600',
    isLoggedIn: true,
  },
  {
    name: 'Alex Rivera',
    email: 'alex.rivera@research.org',
    plan: 'Free Plan',
    avatarInitials: 'AR',
    avatarGradient: 'from-amber-500 to-rose-500',
    isLoggedIn: true,
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'login' | 'signup'>('profile');
  const [nameInput, setNameInput] = useState(currentUser.name);
  const [emailInput, setEmailInput] = useState(currentUser.email);
  const [passwordInput, setPasswordInput] = useState('');
  const [planInput, setPlanInput] = useState<UserProfile['plan']>(currentUser.plan);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const getInitials = (str: string) => {
    const parts = str.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return str.slice(0, 2).toUpperCase() || 'U';
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...currentUser,
      name: nameInput.trim() || 'User',
      email: emailInput.trim() || 'user@vera.ai',
      plan: planInput,
      avatarInitials: getInitials(nameInput),
      isLoggedIn: true,
    };
    onUpdateUser(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleSwitchPreset = (preset: UserProfile) => {
    setNameInput(preset.name);
    setEmailInput(preset.email);
    setPlanInput(preset.plan);
    onUpdateUser(preset);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 400);
  };

  const handleLogout = () => {
    const guestUser: UserProfile = {
      name: 'Guest User',
      email: 'guest@vera.ai',
      plan: 'Free Plan',
      avatarInitials: 'GU',
      avatarGradient: 'from-slate-600 to-slate-700',
      isLoggedIn: false,
    };
    setNameInput(guestUser.name);
    setEmailInput(guestUser.email);
    setPlanInput(guestUser.plan);
    onUpdateUser(guestUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-[#0e1022] border border-purple-500/30 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-outfit">Account & Authentication</h2>
              <p className="text-[11px] text-slate-400">Manage profile identity and permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-[#14162e] p-1 border border-white/[0.06] text-xs font-semibold text-slate-300">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-purple-600 text-white shadow-sm' : 'hover:text-white'
            }`}
          >
            Active Profile
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'login' ? 'bg-purple-600 text-white shadow-sm' : 'hover:text-white'
            }`}
          >
            Switch Account
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'signup' ? 'bg-purple-600 text-white shadow-sm' : 'hover:text-white'
            }`}
          >
            New User
          </button>
        </div>

        {/* Tab 1: Active Profile Edit */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#151733]/80 border border-white/[0.06]">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${currentUser.avatarGradient} flex items-center justify-center font-bold text-white text-base shadow-lg`}>
                {currentUser.avatarInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-xs text-slate-400 truncate">{currentUser.email}</div>
                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{currentUser.plan}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Devshree Gohel"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#14162e] border border-white/[0.08] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@vera.ai"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#14162e] border border-white/[0.08] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Plan Tier</label>
                <select
                  value={planInput}
                  onChange={(e) => setPlanInput(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#14162e] border border-white/[0.08] text-slate-100 focus:outline-none focus:border-purple-500/60 cursor-pointer"
                >
                  <option value="Free Plan">Free Plan (Standard RAG)</option>
                  <option value="Pro Plan">Pro Plan (Unlimited Citations + Claude 3.5)</option>
                  <option value="Enterprise">Enterprise (Custom Vector DB & SLA)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Update Profile</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/20 transition-colors cursor-pointer flex items-center gap-1.5"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Switch Preset Accounts */}
        {activeTab === 'login' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Select any saved member to switch sessions instantly:</p>
            
            <div className="space-y-2">
              {PRESET_USERS.map((user, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSwitchPreset(user)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    currentUser.email === user.email
                      ? 'bg-purple-600/20 border-purple-500/50 shadow-md'
                      : 'bg-[#151733]/60 hover:bg-[#151733] border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${user.avatarGradient} flex items-center justify-center font-bold text-white text-xs`}>
                      {user.avatarInitials}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">{user.name}</div>
                      <div className="text-[10px] text-slate-400">{user.email} • {user.plan}</div>
                    </div>
                  </div>

                  {currentUser.email === user.email && (
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Sign Up New Member */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3.5 py-2 rounded-xl bg-[#14162e] border border-white/[0.08] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Email</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3.5 py-2 rounded-xl bg-[#14162e] border border-white/[0.08] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl bg-[#14162e] border border-white/[0.08] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account & Login</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
