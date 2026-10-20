import React from 'react';
import { View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from './AppCard';

export default function StatTile({ icon, value, label, tone = 'primary', style }) {
  const { theme } = useAppTheme();
  const bg = tone === 'accent' ? theme.colors.secondaryContainer : theme.colors.primaryContainer;
  const fg = tone === 'accent' ? theme.colors.onSecondaryContainer : theme.colors.onPrimaryContainer;
  return (
    <AppCard style={[{ flex: 1 }, style]}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', marginBottom: theme.custom.spacing.md }}>
        <Icon source={icon} size={22} color={fg} />
      </View>
      <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: '800' }}>{value}</Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>{label}</Text>
    </AppCard>
  );
}
