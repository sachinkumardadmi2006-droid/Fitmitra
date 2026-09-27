import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

export function Badge({ label, variant = 'neon', size = 'medium' }) {
  const getColors = () => {
    switch (variant) {
      case 'amber':
        return { bg: 'rgba(255, 184, 0, 0.15)', text: '#FFB800', border: 'rgba(255, 184, 0, 0.3)' };
      case 'cyan':
        return { bg: 'rgba(0, 216, 246, 0.15)', text: '#00D8F6', border: 'rgba(0, 216, 246, 0.3)' };
      case 'rose':
        return { bg: 'rgba(255, 51, 102, 0.15)', text: '#FF3366', border: 'rgba(255, 51, 102, 0.3)' };
      case 'gray':
        return { bg: 'rgba(255, 255, 255, 0.1)', text: '#94A3B8', border: 'rgba(255, 255, 255, 0.15)' };
      case 'neon':
      default:
        return { bg: 'rgba(0, 245, 155, 0.15)', text: Colors.primaryNeon, border: 'rgba(0, 245, 155, 0.3)' };
    }
  };

  const c = getColors();
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg, borderColor: c.border },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Text style={[styles.text, { color: c.text }, isSmall && styles.textSmall]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSmall: {
    fontSize: 10,
    fontWeight: '600',
  },
});
