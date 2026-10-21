import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/tokens';

export function LoadingSpinner({ message = 'Loading...', fullScreen = false }) {
  const { theme } = useAppTheme();
  const containerStyle = fullScreen
    ? [styles.fullScreen, { backgroundColor: theme.colors.background }]
    : styles.inline;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size="large" color={theme.custom.primaryStrong} />
      {message ? (
        <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inline: {
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: spacing.md,
    fontSize: 14,
    fontWeight: '500',
  },
});

