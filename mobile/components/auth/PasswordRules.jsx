import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { authTypography } from './authTheme';

/**
 * Real-time password requirement checklist
 * - Returns null when password is empty
 * - Returns null when all rules are satisfied
 * - Renders only unsatisfied rules while user is typing
 *
 * @param {{ password?: string, style?: object }} props
 */
export default function PasswordRules({ password = '', style }) {
  const { theme } = useAppTheme();

  if (!password || password.length === 0) {
    return null;
  }

  const allRules = [
    {
      id: 'length',
      label: 'At least 8 characters',
      valid: password.length >= 8,
    },
    {
      id: 'number',
      label: 'Include a number',
      valid: /\d/.test(password),
    },
    {
      id: 'special',
      label: 'Include a special character',
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  // Only render the rules that are NOT yet satisfied
  const unmetRules = allRules.filter((rule) => !rule.valid);

  if (unmetRules.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {unmetRules.map((rule) => (
        <View key={rule.id} style={styles.ruleRow}>
          <Feather
            name="circle"
            size={14}
            color={theme.colors.onSurfaceVariant}
            style={styles.icon}
          />
          <Text
            style={[
              styles.label,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {rule.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingHorizontal: 4,
    gap: 8,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: authTypography.smallSize,
    fontWeight: '500',
  },
});
