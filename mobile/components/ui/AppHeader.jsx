import React from 'react';
import { Appbar } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeContext';

export default function AppHeader({ title, onBack, actions = [], centered = false }) {
  const { theme } = useAppTheme();
  return (
    <Appbar.Header mode={centered ? 'center-aligned' : 'small'} elevated={false} style={{ backgroundColor: theme.colors.background }}>
      {onBack ? <Appbar.BackAction onPress={onBack} color={theme.colors.onSurface} /> : null}
      <Appbar.Content title={title} titleStyle={{ color: theme.colors.onSurface, fontWeight: '700' }} />
      {actions.map((a, i) => (
        <Appbar.Action key={`${a.icon}-${i}`} icon={a.icon} onPress={a.onPress} color={theme.colors.onSurface} accessibilityLabel={a.accessibilityLabel} />
      ))}
    </Appbar.Header>
  );
}
