// FitMitra Design Tokens — Design Authority: Material 3 & New Palette
import { lightColors, darkColors, lightCustom, darkCustom } from '../theme/colors';

export function mapThemeColors(colors, custom, isDark) {
  return {
    isDark,
    bgBase: colors.background,
    surface: colors.surface,
    surfaceElevated: colors.elevation ? colors.elevation.level2 : colors.surface,
    border: colors.outlineVariant,
    borderLight: colors.outlineVariant,
    borderFocus: custom.primaryStrong,

    primary: colors.primary,
    primaryStrong: custom.primaryStrong,
    primaryGlow: colors.primaryContainer,
    primaryDim: colors.surfaceVariant,

    secondaryCyan: colors.tertiary,
    accentPurple: custom.chart ? custom.chart[4] : '#7E57C2',
    accentRose: colors.error,
    accentAmber: colors.secondary,

    textPrimary: colors.onSurface,
    textSecondary: colors.onSurfaceVariant,
    textMuted: colors.outline,

    cardBg: colors.surface,
    cardElevation: isDark ? 0 : 2,
    cardShadow: isDark
      ? 'none'
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        },

    success: custom.success,
    warning: custom.warning,
    error: colors.error,
    info: colors.tertiary,
  };
}

export const DarkTheme = mapThemeColors(darkColors, darkCustom, true);
export const LightTheme = mapThemeColors(lightColors, lightCustom, false);

// Backward-compatible default Colors (pointing to light theme tokens)
export const Colors = {
  ...LightTheme,
  bgDarkBase: DarkTheme.bgBase,
  bgDarkCard: DarkTheme.surface,
  bgGlass: LightTheme.surface,
  bgGlassHover: LightTheme.surfaceElevated,
  borderGlass: LightTheme.borderLight,
  borderGlassBright: LightTheme.border,
  primaryNeon: LightTheme.primary,
  primaryNeonGlow: LightTheme.primaryGlow,
  primaryNeonDim: LightTheme.primaryDim,
  white: '#FFFFFF',
  black: '#000000',

  // Auth screen specifics
  authBg: LightTheme.bgBase,
  authText: LightTheme.textPrimary,
  authSubtext: LightTheme.textSecondary,
  authMuted: LightTheme.textMuted,
  authBorder: LightTheme.border,
  authBorderLight: LightTheme.borderLight,
  authGold: LightTheme.accentAmber,
  authBlue: LightTheme.info,
  authError: LightTheme.error,
  authErrorBg: 'rgba(186, 26, 26, 0.1)',
  authErrorBorder: 'rgba(186, 26, 26, 0.3)',
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
