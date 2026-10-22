import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { authSizes, authTypography } from './authTheme';

/**
 * Secondary Google Sign-In button
 * Dynamic theme colors (supports Light and Dark mode)
 * @param {{
 *   onPress: () => void,
 *   loading?: boolean,
 *   disabled?: boolean,
 *   style?: object,
 * }} props
 */
export default function GoogleButton({
  onPress,
  loading = false,
  disabled = false,
  style,
}) {
  const { theme } = useAppTheme();
  const isInactive = disabled || loading;

  const handlePress = () => {
    if (isInactive) return;
    if (onPress) onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
        isInactive ? styles.disabled : null,
        pressed && !isInactive ? { backgroundColor: theme.colors.surfaceVariant } : null,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      accessibilityState={{ disabled: isInactive, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.onSurface} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {/* Official Google G icon brand color exception */}
          <AntDesign name="google" size={20} color="#EA4335" style={styles.googleIcon} />
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Continue with Google
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: authSizes.buttonHeight,
    borderRadius: authSizes.buttonRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: authTypography.subheadingSize,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
