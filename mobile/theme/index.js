import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { lightColors, darkColors, lightCustom, darkCustom } from './colors';
import { spacing, radius } from './tokens';

const KANNADA_LINE_HEIGHT_SCALE = 1.15; // Kannada script needs more vertical room

function scaleFonts(fonts, scale) {
  const out = {};
  Object.keys(fonts).forEach((key) => {
    const f = fonts[key];
    out[key] = f && typeof f === 'object' && typeof f.lineHeight === 'number'
      ? { ...f, lineHeight: Math.round(f.lineHeight * scale) }
      : f;
  });
  return out;
}

export function buildTheme(mode, isKannada) {
  const dark = mode === 'dark';
  const base = dark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    dark,
    roundness: 3,
    colors: { ...base.colors, ...(dark ? darkColors : lightColors) },
    fonts: isKannada ? scaleFonts(base.fonts, KANNADA_LINE_HEIGHT_SCALE) : base.fonts,
    custom: { ...(dark ? darkCustom : lightCustom), spacing, radius },
  };
}

export function buildNavigationTheme(theme) {
  const isDark = Boolean(theme?.dark);
  return {
    dark: isDark,
    colors: {
      primary: theme?.custom?.primaryStrong || theme?.colors?.primary || (isDark ? '#d97757' : '#c96442'),
      background: theme?.colors?.background || (isDark ? '#262624' : '#faf9f5'),
      card: theme?.colors?.surface || (isDark ? '#262624' : '#faf9f5'),
      text: theme?.colors?.onSurface || (isDark ? '#faf9f5' : '#141413'),
      border: theme?.colors?.outlineVariant || (isDark ? '#3e3e38' : '#dad9d4'),
      notification: theme?.colors?.error || (isDark ? '#ef4444' : '#ba1a1a'),
    },
  };
}

export { lightColors, darkColors, spacing, radius };
