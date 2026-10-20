import React from 'react';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeContext';

export default function LoadingScreen() {
  const { theme } = useAppTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
      <ActivityIndicator size="large" color={theme.custom.primaryStrong} />
    </View>
  );
}
