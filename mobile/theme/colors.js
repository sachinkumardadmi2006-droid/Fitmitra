// TweakCN Theme Palette — Earthy Terracotta & Warm Slate
// Designed for both React Native Paper MD3 and custom FitMitra tokens

export const lightColors = {
  // Primary (tweakcn --primary: #c96442, --primary-foreground: #ffffff)
  primary: '#c96442',
  onPrimary: '#ffffff',
  primaryContainer: '#f4dbd2',
  onPrimaryContainer: '#451709',

  // Secondary Accent (tweakcn --chart-5: #b4552d for high-contrast icons/accents, container: --secondary #e9e6dc)
  secondary: '#b4552d',
  onSecondary: '#ffffff',
  secondaryContainer: '#ede9de',
  onSecondaryContainer: '#535146',

  // Tertiary (tweakcn --chart-2: #9c87f5, --chart-4: #dbd3f0)
  tertiary: '#9c87f5',
  onTertiary: '#ffffff',
  tertiaryContainer: '#dbd3f0',
  onTertiaryContainer: '#2f2b48',

  // Error / Destructive (tweakcn --destructive: #141413 / semantic accessible red)
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#410002',

  // Background & Surface (tweakcn --background: #faf9f5, --foreground: #3d3929, --card: #faf9f5, --card-foreground: #141413)
  background: '#faf9f5',
  onBackground: '#3d3929',
  surface: '#faf9f5',
  onSurface: '#141413',

  // Variant / Muted (tweakcn --muted: #ede9de, --muted-foreground: #83827d)
  surfaceVariant: '#ede9de',
  onSurfaceVariant: '#83827d',

  // Borders & Inputs (tweakcn --border: #dad9d4, --input: #b4b2a7)
  outline: '#b4b2a7',
  outlineVariant: '#dad9d4',

  // Shadows & Scrim
  shadow: '#000000',
  scrim: '#000000',

  // Inverses
  inverseSurface: '#262624',
  inverseOnSurface: '#faf9f5',
  inversePrimary: '#d97757',

  surfaceDisabled: 'rgba(20, 20, 19, 0.12)',
  onSurfaceDisabled: 'rgba(20, 20, 19, 0.38)',
  backdrop: 'rgba(38, 38, 36, 0.4)',

  // Elevation steps (derived from --sidebar #f5f4ee, --muted #ede9de, --secondary #e9e6dc, --chart-3 #ded8c4)
  elevation: {
    level0: 'transparent',
    level1: '#f5f4ee',
    level2: '#ede9de',
    level3: '#e9e6dc',
    level4: '#e5e1d5',
    level5: '#ded8c4',
  },

  // Direct TweakCN Token Exports
  card: '#faf9f5',
  cardForeground: '#141413',
  popover: '#ffffff',
  popoverForeground: '#28261b',
  muted: '#ede9de',
  mutedForeground: '#83827d',
  accent: '#e9e6dc',
  accentForeground: '#28261b',
  destructive: '#141413',
  destructiveForeground: '#ffffff',
  border: '#dad9d4',
  input: '#b4b2a7',
  ring: '#c96442',
  sidebar: '#f5f4ee',
  sidebarForeground: '#3d3d3a',
  sidebarPrimary: '#c96442',
  sidebarPrimaryForeground: '#fbfbfb',
  sidebarAccent: '#e9e6dc',
  sidebarAccentForeground: '#343434',
  sidebarBorder: '#ebebeb',
  sidebarRing: '#b5b5b5',
};

export const darkColors = {
  // Primary (tweakcn dark --primary: #d97757, --primary-foreground: #ffffff)
  primary: '#d97757',
  onPrimary: '#ffffff',
  primaryContainer: '#4a2214',
  onPrimaryContainer: '#f5dbd2',

  // Secondary (tweakcn dark --secondary: #faf9f5, --secondary-foreground: #30302e)
  secondary: '#faf9f5',
  onSecondary: '#30302e',
  secondaryContainer: '#30302e',
  onSecondaryContainer: '#e5e5e2',

  // Tertiary (tweakcn dark --chart-2: #9c87f5, --chart-4: #2f2b48)
  tertiary: '#9c87f5',
  onTertiary: '#1a1915',
  tertiaryContainer: '#2f2b48',
  onTertiaryContainer: '#dbd3f0',

  // Error / Destructive (tweakcn dark --destructive: #ef4444, --destructive-foreground: #ffffff)
  error: '#ef4444',
  onError: '#ffffff',
  errorContainer: '#7f1d1d',
  onErrorContainer: '#fecaca',

  // Background & Surface (tweakcn dark --background: #262624, --foreground: #c3c0b6, --card: #262624, --card-foreground: #faf9f5)
  background: '#262624',
  onBackground: '#c3c0b6',
  surface: '#262624',
  onSurface: '#faf9f5',

  // Variant / Muted (tweakcn dark --muted: #1b1b19, --muted-foreground: #b7b5a9)
  surfaceVariant: '#1b1b19',
  onSurfaceVariant: '#b7b5a9',

  // Borders & Inputs (tweakcn dark --border: #3e3e38, --input: #52514a)
  outline: '#52514a',
  outlineVariant: '#3e3e38',

  // Shadows & Scrim
  shadow: '#000000',
  scrim: '#000000',

  // Inverses
  inverseSurface: '#faf9f5',
  inverseOnSurface: '#262624',
  inversePrimary: '#c96442',

  surfaceDisabled: 'rgba(250, 249, 245, 0.12)',
  onSurfaceDisabled: 'rgba(250, 249, 245, 0.38)',
  backdrop: 'rgba(15, 15, 14, 0.65)',

  // Elevation steps (derived from --sidebar #1f1e1d, --popover #30302e, --sidebar-primary #343434, --border #3e3e38)
  elevation: {
    level0: 'transparent',
    level1: '#1f1e1d',
    level2: '#282826',
    level3: '#30302e',
    level4: '#343434',
    level5: '#3e3e38',
  },

  // Direct TweakCN Token Exports
  card: '#262624',
  cardForeground: '#faf9f5',
  popover: '#30302e',
  popoverForeground: '#e5e5e2',
  muted: '#1b1b19',
  mutedForeground: '#b7b5a9',
  accent: '#1a1915',
  accentForeground: '#f5f4ee',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  border: '#3e3e38',
  input: '#52514a',
  ring: '#d97757',
  sidebar: '#1f1e1d',
  sidebarForeground: '#c3c0b6',
  sidebarPrimary: '#343434',
  sidebarPrimaryForeground: '#fbfbfb',
  sidebarAccent: '#0f0f0e',
  sidebarAccentForeground: '#c3c0b6',
  sidebarBorder: '#ebebeb',
  sidebarRing: '#b5b5b5',
};

// Extra colors and specialized component tokens
export const lightCustom = {
  primaryStrong: '#b05730', // tweakcn --chart-1
  accentText: '#c96442',
  success: '#2e7d32',
  onSuccess: '#ffffff',
  warning: '#c97a22',
  skeletonBase: '#ede9de', // tweakcn --muted
  skeletonHighlight: '#f5f4ee', // tweakcn --sidebar
  chart: ['#b05730', '#9c87f5', '#ded8c4', '#dbd3f0', '#b4552d'], // tweakcn --chart-1 through --chart-5
  heatmap: {
    empty: '#ede9de',
    levels: ['#f4dbd2', '#e8ab95', '#c96442', '#b05730'],
  },
};

export const darkCustom = {
  primaryStrong: '#d97757', // tweakcn dark --primary
  accentText: '#e5e5e2',
  success: '#4ade80',
  onSuccess: '#141413',
  warning: '#fbbf24',
  skeletonBase: '#1b1b19', // tweakcn dark --muted
  skeletonHighlight: '#30302e', // tweakcn dark --popover
  chart: ['#b05730', '#9c87f5', '#1a1915', '#2f2b48', '#b4552d'], // tweakcn dark --chart-1 through --chart-5
  heatmap: {
    empty: '#1b1b19',
    levels: ['#3e2016', '#6e3420', '#b05730', '#d97757'],
  },
};
