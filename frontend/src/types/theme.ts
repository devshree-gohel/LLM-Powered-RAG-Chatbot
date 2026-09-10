export type ThemeId = 
  | 'lumina-pearl'
  | 'cosmic-lilac'
  | 'cyber-cyan'
  | 'emerald-aurora'
  | 'sunset-flare'
  | 'rose-nebula'
  | 'oled-obsidian'
  | 'clean-light';

export type BackgroundStyle = 
  | 'lumina-orb'
  | 'celestial-orb'
  | 'starfield'
  | 'cyber-grid'
  | 'aurora-mesh'
  | 'minimal-glass'
  | 'synthwave-sunset'
  | 'deep-space-nebula'
  | 'tokyo-cyber'
  | 'zen-minimal'
  | 'custom-url';

export type FontFamily = 'jakarta' | 'inter' | 'mono' | 'serif';

export interface ThemePreset {
  id: ThemeId;
  name: string;
  category: 'dark' | 'light' | 'special';
  previewColors: [string, string, string]; // [bg, accent1, accent2]
  bgBase: string;
  surfaceBg: string;
  sidebarBg: string;
  accentPrimary: string;
  accentSecondary: string;
  glowColor: string;
  textPrimary: string;
  textSecondary: string;
  cardBorder: string;
  inputBg: string;
}

export interface BackgroundPreset {
  id: BackgroundStyle;
  name: string;
  type: 'procedural' | 'wallpaper' | 'custom';
  previewGradient: string;
  thumbnailUrl?: string;
  description: string;
}

export interface UserThemeSettings {
  themeId: ThemeId;
  backgroundStyle: BackgroundStyle;
  customWallpaperUrl: string;
  wallpaperDim: number; // 0 to 90%
  wallpaperBlur: number; // 0 to 20px
  glowIntensity: 'none' | 'low' | 'medium' | 'high';
  showOrb: boolean;
  fontFamily: FontFamily;
}
