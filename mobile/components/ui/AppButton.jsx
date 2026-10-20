import React from 'react';
import { Button } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeContext';

export default function AppButton({ label, onPress, mode = 'contained', tone = 'primary', loading = false, disabled = false, icon, fullWidth = true, style }) {
  const { theme } = useAppTheme();
  const palette = {
    primary: { bg: theme.colors.primary, fg: theme.colors.onPrimary, text: theme.custom.primaryStrong },
    accent: { bg: theme.colors.secondary, fg: theme.colors.onSecondary, text: theme.custom.accentText },
    danger: { bg: theme.colors.error, fg: theme.colors.onError, text: theme.colors.error },
  }[tone] || { bg: theme.colors.primary, fg: theme.colors.onPrimary, text: theme.custom.primaryStrong };
  const contained = mode === 'contained';
  return (
    <Button
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled || loading}
      icon={icon}
      buttonColor={contained ? palette.bg : undefined}
      textColor={contained ? palette.fg : palette.text}
      contentStyle={{ minHeight: 48 }}
      labelStyle={{ fontWeight: '700', fontSize: 16 }}
      style={[{ borderRadius: theme.custom.radius.md, alignSelf: fullWidth ? 'stretch' : 'flex-start' }, style]}
    >
      {label}
    </Button>
  );
}
