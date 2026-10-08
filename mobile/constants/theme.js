// FitMitra Design Tokens — Design Authority: DESIGN.md (v2.1.0) & Material 3

export const DarkTheme = {
  isDark: true,
  bgBase: '#080A0F',
  surface: '#10131A',
  surfaceElevated: '#171B24',
  border: '#252B36',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  borderFocus: '#B7FF00',

  primary: '#add810ff', // Athletic fluorescent lime
  primaryStrong: '#b3d810ff',
  primaryGlow: 'rgba(183, 255, 0, 0.25)',
  primaryDim: 'rgba(183, 255, 0, 0.1)',

  secondaryCyan: '#00F0FF',
  accentPurple: '#A855F7',
  accentRose: '#F43F5E',
  accentAmber: '#FFB800',

  textPrimary: '#FFFFFF',
  textSecondary: '#A8AFBA',
  textMuted: '#6F7783',

  cardBg: '#10131A',
  cardElevation: 0,
  cardShadow: 'none',

  success: '#35D07F',
  warning: '#FFC857',
  error: '#FF5C69',
  info: '#4DA3FF',
};

export const LightTheme = {
  isDark: false,
  bgBase: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F3F5',
  border: '#E5E7EB',
  borderLight: 'rgba(0, 0, 0, 0.06)',
  borderFocus: '#10B981',

  primary: '#10B981', // Clean vibrant emerald
  primaryStrong: '#059669',
  primaryGlow: 'rgba(16, 185, 129, 0.25)',
  primaryDim: 'rgba(16, 185, 129, 0.1)',

  secondaryCyan: '#0284C7',
  accentPurple: '#7C3AED',
  accentRose: '#E11D48',
  accentAmber: '#D97706',

  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',

  cardBg: '#FFFFFF',
  cardElevation: 2,
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

// Backward-compatible default Colors (pointing to athletic dark theme tokens)
export const Colors = {
  ...DarkTheme,
  bgDarkBase: DarkTheme.bgBase,
  bgDarkCard: DarkTheme.surface,
  bgGlass: DarkTheme.surface,
  bgGlassHover: DarkTheme.surfaceElevated,
  borderGlass: DarkTheme.borderLight,
  borderGlassBright: DarkTheme.border,
  primaryNeon: DarkTheme.primary,
  primaryNeonGlow: DarkTheme.primaryGlow,
  primaryNeonDim: DarkTheme.primaryDim,
  white: '#FFFFFF',
  black: '#000000',

  // Auth screen specifics
  authBg: '#080A0F',
  authText: '#FFFFFF',
  authSubtext: '#A8AFBA',
  authMuted: '#6F7783',
  authBorder: '#252B36',
  authBorderLight: 'rgba(255, 255, 255, 0.1)',
  authGold: '#FFB800',
  authBlue: '#3B82F6',
  authError: '#FF5C69',
  authErrorBg: 'rgba(255, 92, 105, 0.1)',
  authErrorBorder: 'rgba(255, 92, 105, 0.3)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};
