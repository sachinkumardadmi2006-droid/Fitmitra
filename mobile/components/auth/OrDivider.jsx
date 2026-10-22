import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { authTypography } from './authTheme';

/**
 * Clean separator line with centered "OR"
 * Dynamic theme colors (supports Light and Dark mode)
 * @param {{ style?: object }} props
 */
export default function OrDivider({ style }) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.line,
          { backgroundColor: theme.colors.outlineVariant },
        ]}
      />
      <Text
        style={[
          styles.text,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        OR
      </Text>
      <View
        style={[
          styles.line,
          { backgroundColor: theme.colors.outlineVariant },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
  },
  text: {
    marginHorizontal: 16,
    fontSize: authTypography.smallSize,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
