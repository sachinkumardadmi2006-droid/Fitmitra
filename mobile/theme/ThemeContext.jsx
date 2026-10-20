import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { buildTheme, buildNavigationTheme } from './index';

const STORAGE_KEY = 'fitmitra.themePreference';
const ThemeContext = createContext(null);

export function AppThemeProvider({ language, children }) {
  const deviceScheme = useColorScheme();
  const [preference, setPreferenceState] = useState('light'); // the app starts in light theme
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (active && (v === 'light' || v === 'dark' || v === 'system')) setPreferenceState(v);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(preference === 'system' ? null : preference);
    }
  }, [preference]);

  const setPreference = useCallback((next) => {
    if (next !== 'light' && next !== 'dark' && next !== 'system') return;
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const mode = preference === 'system' ? (deviceScheme === 'dark' ? 'dark' : 'light') : preference;
  const isKannada = typeof language === 'string' && language.toLowerCase().startsWith('kn');
  const theme = useMemo(() => buildTheme(mode, isKannada), [mode, isKannada]);
  const navTheme = useMemo(() => buildNavigationTheme(theme), [theme]);
  const value = useMemo(
    () => ({ theme, navTheme, mode, isDark: mode === 'dark', preference, setPreference, isReady }),
    [theme, navTheme, mode, preference, setPreference, isReady]
  );

  if (!isReady) return null;

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider
        theme={theme}
        settings={{
          icon: (props) => <MaterialCommunityIcons {...props} />,
        }}
      >
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return ctx;
}
