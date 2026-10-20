import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Snackbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/ThemeContext';

const SnackbarContext = createContext({ showMessage: () => {} });

export function SnackbarProvider({ children }) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState({ visible: false, text: '', type: 'info' });
  const showMessage = useCallback((text, type = 'info') => {
    setState({ visible: true, text: String(text || ''), type });
  }, []);
  const hide = useCallback(() => setState((s) => ({ ...s, visible: false })), []);
  const value = useMemo(() => ({ showMessage }), [showMessage]);
  const c = theme.colors;
  const bg = state.type === 'error' ? c.errorContainer : state.type === 'success' ? c.primaryContainer : c.inverseSurface;
  const fg = state.type === 'error' ? c.onErrorContainer : state.type === 'success' ? c.onPrimaryContainer : c.inverseOnSurface;
  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        visible={state.visible}
        onDismiss={hide}
        duration={3500}
        wrapperStyle={{ bottom: insets.bottom + 64 }}
        style={{ backgroundColor: bg, borderRadius: theme.custom.radius.md }}
      >
        <Text style={{ color: fg }}>{state.text}</Text>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  return useContext(SnackbarContext);
}
