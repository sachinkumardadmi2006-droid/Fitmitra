import React from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeContext';

export default function SectionHeader({ title, actionLabel, onAction, style }) {
  const { theme } = useAppTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.custom.spacing.xl, marginBottom: theme.custom.spacing.sm }, style]}>
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700', flexShrink: 1 }}>{title}</Text>
      {actionLabel ? <Button compact onPress={onAction} textColor={theme.custom.primaryStrong}>{actionLabel}</Button> : null}
    </View>
  );
}
