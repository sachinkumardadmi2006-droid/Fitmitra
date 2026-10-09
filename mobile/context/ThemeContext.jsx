import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, LightTheme } from '../constants/theme';

const THEME_STORAGE_KEY = 'fitmitra_theme_mode';

export const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  colors: LightTheme,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeModeState] = useState('light');

  useEffect(() => {
    // Temporarily disabled AsyncStorage theme loading to enforce global light mode
    // until Phase 3 (dynamic styling refactor) is fully complete.
    // (async () => {
    //   try {
    //     const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    //     if (saved === 'light' || saved === 'dark') {
    //       setThemeModeState(saved);
    //     }
    //   } catch (_) {}
    // })();
  }, []);

  const setThemeMode = async (mode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (_) {}
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  };

  const isDark = themeMode === 'dark';
  const colors = useMemo(() => (isDark ? DarkTheme : LightTheme), [isDark]);

  return (
    <ThemeContext.Provider
      value={{
        theme: themeMode,
        isDark,
        colors,
        toggleTheme,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
