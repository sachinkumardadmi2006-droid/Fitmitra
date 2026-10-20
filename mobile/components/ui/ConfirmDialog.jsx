import React from 'react';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { useTranslation } from '../../utils/i18n';
import { useAppTheme } from '../../theme/ThemeContext';

export default function ConfirmDialog({ visible, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, destructive = false, loading = false }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={loading ? undefined : onCancel} style={{ backgroundColor: theme.colors.surface, borderRadius: theme.custom.radius.xl }}>
        <Dialog.Title style={{ color: theme.colors.onSurface }}>{title}</Dialog.Title>
        {message ? (
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{message}</Text>
          </Dialog.Content>
        ) : null}
        <Dialog.Actions>
          <Button onPress={onCancel} disabled={loading} textColor={theme.colors.onSurfaceVariant}>{cancelLabel || t('common.cancel')}</Button>
          <Button onPress={onConfirm} loading={loading} disabled={loading} textColor={destructive ? theme.colors.error : theme.custom.primaryStrong}>{confirmLabel || t('common.confirm')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
