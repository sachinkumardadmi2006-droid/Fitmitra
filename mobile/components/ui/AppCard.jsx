import React from 'react';
import { View } from 'react-native';
import { Card } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeContext';

export default function AppCard({ children, onPress, variant = 'elevated', padded = true, style, contentStyle, accessibilityLabel }) {
  const { theme } = useAppTheme();
  const { spacing, radius } = theme.custom;
  const background = theme.dark ? theme.colors.elevation.level1 : theme.colors.surface;
  return (
    <Card
      mode={variant}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={[{ borderRadius: radius.lg, backgroundColor: background }, variant === 'outlined' ? { borderColor: theme.colors.outlineVariant } : null, style]}
    >
      <View style={[padded ? { padding: spacing.lg } : null, contentStyle]}>{children}</View>
    </Card>
  );
}
