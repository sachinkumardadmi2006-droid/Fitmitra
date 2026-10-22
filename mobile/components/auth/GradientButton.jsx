import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { authSizes, authTypography } from './authTheme';

/**
 * Primary action button with solid primary theme color
 * Dynamic theme colors (supports Light and Dark mode)
 * @param {{
 *   title: string,
 *   onPress: () => void,
 *   loading?: boolean,
 *   disabled?: boolean,
 *   showArrow?: boolean,
 *   style?: object,
 * }} props
 */
export default function GradientButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  showArrow = true,
  style,
}) {
  const { theme } = useAppTheme();
  const isInactive = disabled || loading;

  const handlePress = () => {
    if (isInactive) return;
    if (onPress) onPress();
  };

  const backgroundColor = isInactive
    ? theme.colors.surfaceDisabled
    : theme.colors.primary;

  const contentColor = isInactive
    ? theme.colors.onSurfaceDisabled
    : theme.colors.onPrimary;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.buttonWrapper,
        { backgroundColor },
        pressed && !isInactive ? styles.pressed : null,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          <Text
            style={[
              styles.title,
              { color: contentColor },
            ]}
          >
            {title}
          </Text>
          {showArrow ? (
            <Feather
              name="arrow-right"
              size={18}
              color={contentColor}
              style={styles.arrowIcon}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    height: authSizes.buttonHeight,
    borderRadius: authSizes.buttonRadius,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: authTypography.subheadingSize,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  arrowIcon: {
    marginLeft: 8,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
