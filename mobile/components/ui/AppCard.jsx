import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';

/**
 * AppCard — A unified cross-platform card component for FitMitra.
 * Supports 'elevated' and 'outlined' variants with robust border and padding handling,
 * preventing Android outline-offset glitches and double-border rendering.
 */
export default function AppCard({
  children,
  onPress,
  variant = 'elevated',
  padded = true,
  style,
  contentStyle,
  accessibilityLabel,
}) {
  const { theme } = useAppTheme();
  const { spacing, radius } = theme.custom || { spacing: { lg: 16 }, radius: { lg: 16 } };
  const background = theme.dark
    ? theme.colors?.elevation?.level1 || theme.colors?.surface || '#18181B'
    : theme.colors?.surface || '#FFFFFF';

  // Separate padding styles so padding is strictly applied to the inner content View.
  // This completely eliminates Yoga flexbox offset bugs where absolute outlines
  // get pushed down and right by container padding on Android.
  const flattened = StyleSheet.flatten(style) || {};
  const {
    padding,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingHorizontal,
    paddingVertical,
    ...outerStyle
  } = flattened;

  const hasExplicitPadding =
    padding !== undefined ||
    paddingTop !== undefined ||
    paddingBottom !== undefined ||
    paddingLeft !== undefined ||
    paddingRight !== undefined ||
    paddingHorizontal !== undefined ||
    paddingVertical !== undefined;

  const innerPaddingStyle = hasExplicitPadding
    ? {
        padding,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
        paddingHorizontal,
        paddingVertical,
      }
    : padded
    ? { padding: spacing?.lg ?? 16 }
    : null;

  const isOutlined = variant === 'outlined';

  const defaultBorder = isOutlined
    ? {
        borderWidth: outerStyle.borderWidth ?? 1,
        borderColor:
          outerStyle.borderColor ??
          theme.colors?.outlineVariant ??
          theme.colors?.borderLight ??
          'rgba(0, 0, 0, 0.12)',
      }
    : null;

  // Elevation styles for elevated variant
  const elevationStyle =
    variant === 'elevated'
      ? Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: theme.dark ? 0.35 : 0.08,
            shadowRadius: 8,
          },
          android: {
            elevation: 2,
          },
          default: {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          },
        })
      : null;

  const containerStyle = [
    styles.card,
    {
      borderRadius: radius?.lg ?? 16,
      backgroundColor: background,
    },
    elevationStyle,
    defaultBorder,
    outerStyle,
  ];

  const content = (
    <View style={[innerPaddingStyle, contentStyle]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        style={({ pressed }) => [
          containerStyle,
          pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle} accessibilityLabel={accessibilityLabel}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
