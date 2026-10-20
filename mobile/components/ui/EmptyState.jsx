import React from 'react';
import { View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from '../../utils/i18n';
import { useAppTheme } from '../../theme/ThemeContext';
import AppButton from './AppButton';

export default function EmptyState({ icon = 'inbox-outline', title, message, actionLabel, onAction, style }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', padding: theme.custom.spacing.xxl }, style]}>
      <View style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primaryContainer, marginBottom: theme.custom.spacing.lg }}>
        <Icon source={icon} size={36} color={theme.colors.onPrimaryContainer} />
      </View>
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface, textAlign: 'center', fontWeight: '700' }}>{title || t('empty.title')}</Text>
      {message ? <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 6 }}>{message}</Text> : null}
      {actionLabel ? <AppButton label={actionLabel} onPress={onAction} fullWidth={false} style={{ marginTop: theme.custom.spacing.lg }} /> : null}
    </View>
  );
}
