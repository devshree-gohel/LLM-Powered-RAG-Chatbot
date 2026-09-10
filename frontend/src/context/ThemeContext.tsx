import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeId, BackgroundStyle, FontFamily, ThemePreset, BackgroundPreset, UserThemeSettings } from '../types/theme';

export const THEME_PRESETS: Record<ThemeId, ThemePreset> = {
  'cosmic-lilac': {
    id: 'cosmic-lilac',
    name: 'Cosmic Lilac',
    category: 'dark',
    previewColors: ['#080914', '#a855f7', '#c084fc'],
    bgBase: '#080914',
    surfaceBg: 'rgba(16, 18, 36, 0.75)',
    sidebarBg: '#0b0c1e',
    accentPrimary: '#a855f7',
    accentSecondary: '#c084fc',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    cardBorder: 'rgba(168, 85, 247, 0.2)',
    inputBg: 'rgba(14, 16, 32, 0.85)',
  },
  'cyber-cyan': {
    id: 'cyber-cyan',
    name: 'Cyber Neon',
    category: 'dark',
    previewColors: ['#050c18', '#06b6d4', '#38bdf8'],
    bgBase: '#050c18',
    surfaceBg: 'rgba(10, 22, 40, 0.8)',
    sidebarBg: '#071324',
    accentPrimary: '#06b6d4',
    accentSecondary: '#38bdf8',
    glowColor: 'rgba(6, 182, 212, 0.35)',
    textPrimary: '#f0f9ff',
    textSecondary: '#7dd3fc',
    cardBorder: 'rgba(6, 182, 212, 0.25)',
    inputBg: 'rgba(8, 20, 36, 0.9)',
  },
  'emerald-aurora': {
    id: 'emerald-aurora',
    name: 'Emerald Aurora',
    category: 'dark',
    previewColors: ['#04140d', '#10b981', '#34d399'],
    bgBase: '#04140d',
    surfaceBg: 'rgba(6, 28, 20, 0.8)',
    sidebarBg: '#051d14',
    accentPrimary: '#10b981',
    accentSecondary: '#34d399',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    textPrimary: '#ecfdf5',
    textSecondary: '#6ee7b7',
    cardBorder: 'rgba(168, 85, 247, 0.25)',
    inputBg: 'rgba(5, 24, 17, 0.9)',
  },
  'sunset-flare': {
    id: 'sunset-flare',
    name: 'Sunset Flare',
    category: 'dark',
    previewColors: ['#160b08', '#f59e0b', '#fb7185'],
    bgBase: '#160b08',
    surfaceBg: 'rgba(32, 16, 12, 0.8)',
    sidebarBg: '#1a0d0a',
    accentPrimary: '#f59e0b',
    accentSecondary: '#fb7185',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    textPrimary: '#fff7ed',
    textSecondary: '#fdba74',
    cardBorder: 'rgba(245, 158, 11, 0.25)',
    inputBg: 'rgba(26, 12, 8, 0.9)',
  },
  'rose-nebula': {
    id: 'rose-nebula',
    name: 'Rose Nebula',
    category: 'dark',
    previewColors: ['#150818', '#ec4899', '#f472b6'],
    bgBase: '#150818',
    surfaceBg: 'rgba(30, 12, 34, 0.8)',
    sidebarBg: '#1b0a20',
    accentPrimary: '#ec4899',
    accentSecondary: '#f472b6',
    glowColor: 'rgba(236, 72, 153, 0.35)',
    textPrimary: '#fdf2f8',
    textSecondary: '#f472b6',
    cardBorder: 'rgba(236, 72, 153, 0.25)',
    inputBg: 'rgba(24, 10, 28, 0.9)',
  },
  'oled-obsidian': {
    id: 'oled-obsidian',
    name: 'OLED Obsidian',
    category: 'dark',
    previewColors: ['#000000', '#94a3b8', '#e2e8f0'],
    bgBase: '#000000',
    surfaceBg: 'rgba(14, 14, 17, 0.9)',
    sidebarBg: '#09090b',
    accentPrimary: '#cbd5e1',
    accentSecondary: '#f8fafc',
    glowColor: 'rgba(255, 255, 255, 0.2)',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    inputBg: 'rgba(12, 12, 14, 0.95)',
  },
  'clean-light': {
    id: 'clean-light',
    name: 'Google Clean Studio',
    category: 'light',
    previewColors: ['#f8fafc', '#6366f1', '#8b5cf6'],
    bgBase: '#f8fafc',
    surfaceBg: 'rgba(255, 255, 255, 0.85)',
    sidebarBg: '#f1f5f9',
    accentPrimary: '#6366f1',
    accentSecondary: '#8b5cf6',
    glowColor: 'rgba(99, 102, 241, 0.2)',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    cardBorder: 'rgba(99, 102, 241, 0.2)',
    inputBg: 'rgba(255, 255, 255, 0.95)',
  },
  'lumina-pearl': {
    id: 'lumina-pearl',
    name: 'Dreamy Lumina Pearl',
    category: 'light',
    previewColors: ['#f5f6fb', '#f43f5e', '#7c3aed'],
    bgBase: '#f5f6fb',
    surfaceBg: 'rgba(255, 255, 255, 0.92)',
    sidebarBg: '#eef1f8',
    accentPrimary: '#7c3aed',
    accentSecondary: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.22)',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    cardBorder: 'rgba(124, 58, 237, 0.14)',
    inputBg: 'rgba(255, 255, 255, 0.98)',
  },
};

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'celestial-orb',
    name: 'Planetary Orb',
    type: 'procedural',
    previewGradient: 'from-violet-900 via-fuchsia-950 to-indigo-950',
    description: '3D floating celestial core with dynamic orbital rings',
  },
  {
    id: 'starfield',
    name: 'Cosmic Starfield',
    type: 'procedural',
    previewGradient: 'from-blue-950 via-slate-950 to-purple-950',
    description: 'Deep space twinkling star constellation',
  },
  {
    id: 'cyber-grid',
    name: 'Cyber Matrix Grid',
    type: 'procedural',
    previewGradient: 'from-cyan-950 via-slate-950 to-blue-950',
    description: 'Perspective blueprint grid with glowing vector lines',
  },
  {
    id: 'aurora-mesh',
    name: 'Fluid Aurora',
    type: 'procedural',
    previewGradient: 'from-emerald-950 via-teal-950 to-indigo-950',
    description: 'Floating chromatic aura clouds and gradients',
  },
  {
    id: 'minimal-glass',
    name: 'Minimal Obsidian',
    type: 'procedural',
    previewGradient: 'from-slate-950 via-zinc-950 to-black',
    description: 'Clean distraction-free dark vignette',
  },
  {
    id: 'lumina-orb',
    name: 'Dreamy Lumina Orb',
    type: 'procedural',
    previewGradient: 'from-rose-400 via-fuchsia-500 to-indigo-500',
    description: '3D sunset pink & violet glass sphere',
  },
  {
    id: 'synthwave-sunset',
    name: 'Synthwave Neon',
    type: 'wallpaper',
    previewGradient: 'from-purple-900 via-pink-900 to-amber-900',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    description: 'Retro synthwave horizon with glowing neon dusk',
  },
  {
    id: 'deep-space-nebula',
    name: 'Deep Nebula',
    type: 'wallpaper',
    previewGradient: 'from-indigo-950 via-purple-950 to-pink-950',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    description: 'Stunning interstellar cosmic cloud cluster',
  },
  {
    id: 'tokyo-cyber',
    name: 'Tokyo Cyberpunk',
    type: 'wallpaper',
    previewGradient: 'from-blue-950 via-slate-900 to-fuchsia-950',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
    description: 'Rainy futuristic neon metropolis architecture',
  },
  {
    id: 'zen-minimal',
    name: 'Zen Mountain Mist',
    type: 'wallpaper',
    previewGradient: 'from-emerald-950 via-slate-950 to-zinc-900',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
    description: 'Serene minimal twilight mountain silhouette',
  },
  {
    id: 'custom-url',
    name: 'Custom Wallpaper',
    type: 'custom',
    previewGradient: 'from-purple-600 via-indigo-600 to-cyan-600',
    description: 'Set your own custom image URL or local photo',
  },
];

const DEFAULT_SETTINGS: UserThemeSettings = {
  themeId: 'cosmic-lilac',
  backgroundStyle: 'celestial-orb',
  customWallpaperUrl: '',
  wallpaperDim: 45,
  wallpaperBlur: 4,
  glowIntensity: 'medium',
  showOrb: true,
  fontFamily: 'jakarta',
};

interface ThemeContextType {
  settings: UserThemeSettings;
  activeTheme: ThemePreset;
  updateSettings: (partial: Partial<UserThemeSettings>) => void;
  setTheme: (themeId: ThemeId) => void;
  setBackgroundStyle: (style: BackgroundStyle) => void;
  setCustomWallpaper: (url: string) => void;
  resetToDefaults: () => void;
  isThemeModalOpen: boolean;
  setIsThemeModalOpen: (open: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserThemeSettings>(() => {
    try {
      const saved = localStorage.getItem('vera_theme_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('vera_theme_settings', JSON.stringify(settings));
    } catch (e) {}

    // Apply CSS variables to root document
    const theme = THEME_PRESETS[settings.themeId] || THEME_PRESETS['cosmic-lilac'];
    const root = document.documentElement;

    root.style.setProperty('--vera-bg', theme.bgBase);
    root.style.setProperty('--vera-surface', theme.surfaceBg);
    root.style.setProperty('--vera-sidebar', theme.sidebarBg);
    root.style.setProperty('--vera-accent', theme.accentPrimary);
    root.style.setProperty('--vera-accent-sec', theme.accentSecondary);
    root.style.setProperty('--vera-glow', theme.glowColor);
    root.style.setProperty('--vera-text', theme.textPrimary);
    root.style.setProperty('--vera-text-muted', theme.textSecondary);
    root.style.setProperty('--vera-border', theme.cardBorder);
    root.style.setProperty('--vera-input', theme.inputBg);

    // Apply font family
    if (settings.fontFamily === 'inter') {
      root.style.fontFamily = "'Inter', -apple-system, sans-serif";
    } else if (settings.fontFamily === 'mono') {
      root.style.fontFamily = "'JetBrains Mono', 'Fira Code', monospace";
    } else if (settings.fontFamily === 'serif') {
      root.style.fontFamily = "'Cinzel', 'Playfair Display', Georgia, serif";
    } else {
      root.style.fontFamily = "'Plus Jakarta Sans', -apple-system, sans-serif";
    }

    if (theme.category === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [settings]);

  const updateSettings = (partial: Partial<UserThemeSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const setTheme = (themeId: ThemeId) => {
    updateSettings({ themeId });
  };

  const setBackgroundStyle = (style: BackgroundStyle) => {
    updateSettings({ backgroundStyle: style });
  };

  const setCustomWallpaper = (url: string) => {
    updateSettings({ backgroundStyle: 'custom-url', customWallpaperUrl: url });
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const activeTheme = THEME_PRESETS[settings.themeId] || THEME_PRESETS['cosmic-lilac'];

  return (
    <ThemeContext.Provider
      value={{
        settings,
        activeTheme,
        updateSettings,
        setTheme,
        setBackgroundStyle,
        setCustomWallpaper,
        resetToDefaults,
        isThemeModalOpen,
        setIsThemeModalOpen,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
