import React from 'react';
import { View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from '../../utils/i18n';
import { useAppTheme } from '../../theme/ThemeContext';
import { getErrorKey, getErrorMessage } from '../../utils/errorMessage';
import AppButton from './AppButton';

export default function ErrorState({ error, message, onRetry, style }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const isNetwork = getErrorKey(error) === 'errors.network';
  const text = message || getErrorMessage(error, t);
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', padding: theme.custom.spacing.xxl }, style]}>
      <View style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.errorContainer, marginBottom: theme.custom.spacing.lg }}>
        <Icon source={isNetwork ? 'wifi-off' : 'alert-circle-outline'} size={36} color={theme.colors.onErrorContainer} />
      </View>
      <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, textAlign: 'center' }}>{text}</Text>
      {onRetry ? <AppButton label={t('common.retry')} onPress={onRetry} mode="outlined" fullWidth={false} style={{ marginTop: theme.custom.spacing.lg }} /> : null}
    </View>
  );
}
