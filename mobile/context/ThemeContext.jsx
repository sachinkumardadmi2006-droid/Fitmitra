import React, { createContext, useContext, useMemo } from 'react';
import { useAppTheme } from '../theme/ThemeContext';
import { mapThemeColors, LightTheme } from '../constants/theme';

export const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  colors: LightTheme,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export const ThemeProvider = ({ children }) => {
  return <>{children}</>;
};

export const useTheme = () => {
  const appTheme = useAppTheme();
  const { theme, mode, isDark, setPreference } = appTheme;

  const colors = useMemo(() => {
    return mapThemeColors(theme.colors, theme.custom, isDark);
  }, [theme, isDark]);

  const toggleTheme = () => {
    setPreference(isDark ? 'light' : 'dark');
  };

  const setThemeMode = (newMode) => {
    setPreference(newMode);
  };

  return {
    theme: mode,
    isDark,
    colors,
    toggleTheme,
    setThemeMode,
  };
};
