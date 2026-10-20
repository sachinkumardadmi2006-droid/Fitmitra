import React, { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { Screen, AppHeader, AppButton, AppCard, SectionHeader, StatTile, EmptyState, ErrorState, SkeletonList, ConfirmDialog, ThemeSelector, useSnackbar } from '../components/ui';
import { useAppTheme } from '../theme/ThemeContext';

function Gallery() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { showMessage } = useSnackbar();
  const [dialog, setDialog] = useState(false);
  return (
    <Screen header={<AppHeader title="UI gallery" onBack={() => router.back()} />}>
      <ThemeSelector />
      <SectionHeader title="Buttons" />
      <AppButton label="Primary" onPress={() => showMessage('Saved', 'success')} />
      <View style={{ height: 8 }} />
      <AppButton label="Accent" tone="accent" onPress={() => showMessage('Info message', 'info')} />
      <View style={{ height: 8 }} />
      <AppButton label="Outlined" mode="outlined" onPress={() => showMessage('Something failed', 'error')} />
      <View style={{ height: 8 }} />
      <AppButton label="Danger" tone="danger" onPress={() => setDialog(true)} />
      <View style={{ height: 8 }} />
      <AppButton label="Loading" loading onPress={() => {}} />
      <SectionHeader title="Cards and stats" actionLabel="See all" onAction={() => showMessage('See all pressed')} />
      <AppCard>
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Card title</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>Card body text in the current theme.</Text>
      </AppCard>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <StatTile icon="fire" value="0" label="Streak" tone="accent" />
        <StatTile icon="flash" value="0" label="Points" />
      </View>
      <SectionHeader title="Loading state" />
      <SkeletonList count={2} />
      <SectionHeader title="Empty state" />
      <EmptyState icon="dumbbell" message="Nothing to show here." actionLabel="Action" onAction={() => showMessage('Action pressed')} />
      <SectionHeader title="Error state" />
      <ErrorState error={{ code: 'ERR_NETWORK', message: 'Network Error' }} onRetry={() => showMessage('Retry pressed', 'success')} />
      <ConfirmDialog visible={dialog} title="Delete item?" message="This cannot be undone." destructive onCancel={() => setDialog(false)} onConfirm={() => { setDialog(false); showMessage('Deleted', 'success'); }} />
    </Screen>
  );
}

export default function UiGalleryGate() {
  if (!__DEV__) return <Redirect href="/" />;
  return <Gallery />;
}
