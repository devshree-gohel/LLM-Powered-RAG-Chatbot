import React, { useState, useRef } from 'react';
import { 
  Palette, Image as ImageIcon, Sparkles, Sliders, Check, X, RotateCcw, 
  Upload, Link2, Eye, Sun, Moon, Type, Globe, Monitor
} from 'lucide-react';
import { useTheme, THEME_PRESETS, BACKGROUND_PRESETS } from '../context/ThemeContext';
import { ThemeId, BackgroundStyle, FontFamily } from '../types/theme';

export const ThemeModal: React.FC = () => {
  const { 
    settings, 
    activeTheme, 
    updateSettings, 
    setTheme, 
    setBackgroundStyle, 
    setCustomWallpaper,
    resetToDefaults, 
    isThemeModalOpen, 
    setIsThemeModalOpen 
  } = useTheme();

  const [activeTab, setActiveTab] = useState<'themes' | 'backgrounds' | 'typography'>('themes');
  const [customInputUrl, setCustomInputUrl] = useState(settings.customWallpaperUrl || '');
  const [urlError, setUrlError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isThemeModalOpen) return null;

  const handleApplyCustomUrl = () => {
    if (!customInputUrl.trim()) {
      setUrlError('Please enter a valid image URL');
      return;
    }
    setUrlError(null);
    setCustomWallpaper(customInputUrl.trim());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomWallpaper(reader.result);
          setCustomInputUrl('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const themeList = Object.values(THEME_PRESETS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={() => setIsThemeModalOpen(false)} />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-2xl bg-[#0e1022] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#13162f]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Customize Workspace Theme</h2>
              <p className="text-xs text-slate-400">Personalize color accents, background wallpaper, and ambient glow</p>
            </div>
          </div>
          <button
            onClick={() => setIsThemeModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tab Navigation */}
        <div className="px-6 pt-3 pb-1 border-b border-white/[0.06] bg-[#0c0e1e] flex gap-2">
          <button
            onClick={() => setActiveTab('themes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'themes'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Color Palettes</span>
          </button>
          
          <button
            onClick={() => setActiveTab('backgrounds')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'backgrounds'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Background & Wallpapers</span>
          </button>

          <button
            onClick={() => setActiveTab('typography')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'typography'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Atmosphere & Fonts</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          
          {/* ────── TAB 1: COLOR PALETTES ────── */}
          {activeTab === 'themes' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Preset Color Schemes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {themeList.map((preset) => {
                    const isSelected = settings.themeId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setTheme(preset.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                          isSelected
                            ? 'bg-[#181a38] border-purple-500 shadow-md shadow-purple-500/10'
                            : 'bg-[#121427]/70 border-white/[0.08] hover:bg-[#161830] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Color preview discs */}
                          <div className="flex items-center -space-x-2">
                            <div 
                              className="w-6 h-6 rounded-full border border-black/40 shadow-sm" 
                              style={{ backgroundColor: preset.previewColors[0] }} 
                            />
                            <div 
                              className="w-6 h-6 rounded-full border border-black/40 shadow-sm" 
                              style={{ backgroundColor: preset.previewColors[1] }} 
                            />
                            <div 
                              className="w-6 h-6 rounded-full border border-black/40 shadow-sm" 
                              style={{ backgroundColor: preset.previewColors[2] }} 
                            />
                          </div>

                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{preset.name}</span>
                              {preset.category === 'light' && (
                                <Sun className="w-3 h-3 text-amber-400" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {preset.category === 'light' ? 'Crisp light mode' : 'Dark atmosphere'}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ────── TAB 2: BACKGROUNDS & WALLPAPERS ────── */}
          {activeTab === 'backgrounds' && (
            <div className="space-y-6">
              {/* Procedural & Animated Backgrounds */}
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Ambient Background Styles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BACKGROUND_PRESETS.filter(b => b.type === 'procedural').map((bg) => {
                    const isSelected = settings.backgroundStyle === bg.id;
                    return (
                      <div
                        key={bg.id}
                        onClick={() => setBackgroundStyle(bg.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-[#181a38] border-purple-500 shadow-md'
                            : 'bg-[#121427]/70 border-white/[0.08] hover:bg-[#161830] hover:border-white/20'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${bg.previewGradient} border border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner`}>
                          {bg.id === 'celestial-orb' && <Sparkles className="w-5 h-5 text-purple-300" />}
                          {bg.id === 'starfield' && <span className="text-lg">✨</span>}
                          {bg.id === 'cyber-grid' && <Monitor className="w-5 h-5 text-cyan-300" />}
                          {bg.id === 'aurora-mesh' && <span className="text-lg">🔮</span>}
                          {bg.id === 'minimal-glass' && <div className="w-5 h-5 rounded-full border border-white/40" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate">{bg.name}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-2">{bg.description}</div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Curated Aesthetic Wallpapers */}
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Curated Scenic Wallpapers</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {BACKGROUND_PRESETS.filter(b => b.type === 'wallpaper').map((bg) => {
                    const isSelected = settings.backgroundStyle === bg.id;
                    return (
                      <div
                        key={bg.id}
                        onClick={() => setBackgroundStyle(bg.id)}
                        className={`relative rounded-xl overflow-hidden border transition-all cursor-pointer group aspect-[4/3] ${
                          isSelected
                            ? 'border-purple-500 ring-2 ring-purple-500/50'
                            : 'border-white/[0.08] hover:border-white/30'
                        }`}
                      >
                        {bg.thumbnailUrl ? (
                          <img 
                            src={bg.thumbnailUrl} 
                            alt={bg.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${bg.previewGradient}`} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-2">
                          <span className="text-[11px] font-bold text-white leading-tight drop-shadow-md">{bg.name}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image URL / Upload */}
              <div className="p-4 rounded-xl bg-[#121427]/80 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Use Custom Wallpaper (URL or File)</span>
                  </div>
                  {settings.backgroundStyle === 'custom-url' && (
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono border border-purple-500/30">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste image link (e.g. https://images.unsplash.com/...)"
                    value={customInputUrl}
                    onChange={(e) => setCustomInputUrl(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleApplyCustomUrl}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Apply URL
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Upload local picture"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Upload</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                {urlError && <p className="text-[11px] text-rose-400">{urlError}</p>}

                {/* Wallpaper Dimming & Blur Slider */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                      <span>Wallpaper Dimming (Darken)</span>
                      <span className="font-mono text-purple-300">{settings.wallpaperDim}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      value={settings.wallpaperDim}
                      onChange={(e) => updateSettings({ wallpaperDim: Number(e.target.value) })}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                      <span>Background Blur</span>
                      <span className="font-mono text-purple-300">{settings.wallpaperBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={settings.wallpaperBlur}
                      onChange={(e) => updateSettings({ wallpaperBlur: Number(e.target.value) })}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ────── TAB 3: ATMOSPHERE & FONTS ────── */}
          {activeTab === 'typography' && (
            <div className="space-y-6">
              {/* Planetary Orb Core Toggle */}
              <div className="p-4 rounded-xl bg-[#121427]/80 border border-white/[0.08] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>3D Glowing Planetary Core</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Display animated central celestial orb & orbital rings in empty chat state
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showOrb}
                    onChange={(e) => updateSettings({ showOrb: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Ambient Glow Intensity */}
              <div className="p-4 rounded-xl bg-[#121427]/80 border border-white/[0.08] space-y-3">
                <div className="text-xs font-bold text-white">Ambient Glow Atmosphere</div>
                <div className="grid grid-cols-4 gap-2">
                  {(['none', 'low', 'medium', 'high'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => updateSettings({ glowIntensity: lvl })}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                        settings.glowIntensity === lvl
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-black/30 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography Font Family */}
              <div className="p-4 rounded-xl bg-[#121427]/80 border border-white/[0.08] space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Type className="w-3.5 h-3.5 text-purple-400" />
                  <span>Typography & Font Style</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'jakarta', name: 'Plus Jakarta Sans', sample: 'Modern, clean & readable' },
                    { id: 'inter', name: 'Inter (Tech)', sample: 'Crisp precision interface' },
                    { id: 'mono', name: 'JetBrains Mono', sample: 'Developer code monospace' },
                    { id: 'serif', name: 'Cinzel Serif', sample: 'Editorial & classical elegance' },
                  ].map((font) => (
                    <button
                      key={font.id}
                      onClick={() => updateSettings({ fontFamily: font.id as FontFamily })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        settings.fontFamily === font.id
                          ? 'bg-purple-950/50 border-purple-500 text-white shadow-sm'
                          : 'bg-black/30 border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="text-xs font-bold">{font.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{font.sample}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-[#13162f]/80 flex items-center justify-between">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => setIsThemeModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 cursor-pointer transition-all"
          >
            Save & Apply
          </button>
        </div>

      </div>
    </div>
  );
};
