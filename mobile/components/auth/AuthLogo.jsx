import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { authTypography } from './authTheme';

/**
 * FitMitra Brand Wordmark
 * Dynamic theme colors (supports Light and Dark mode)
 * @param {{ size?: number, style?: object }} props
 */
export default function AuthLogo({ size = authTypography.logoSize, style }) {
  const { theme } = useAppTheme();
  const primaryColor = theme.custom?.primaryStrong || theme.colors.primary;

  return (
    <Text style={[styles.logo, { fontSize: size, color: theme.colors.onBackground }, style]}>
      Fit<Text style={{ color: primaryColor }}>Mitra</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
