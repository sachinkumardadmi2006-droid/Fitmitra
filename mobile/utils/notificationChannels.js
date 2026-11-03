import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ANDROID_CHANNELS } from '../constants/notificationChannels';

/**
 * Creates Android notification channels for each FitMitra category.
 * Safe to call on each app launch (idempotent).
 */
export async function createAndroidNotificationChannels() {
  if (Platform.OS !== 'android') return;

  for (const ch of ANDROID_CHANNELS) {
    let importance = Notifications.AndroidImportance.DEFAULT;
    if (ch.importance === 'HIGH') {
      importance = Notifications.AndroidImportance.HIGH;
    } else if (ch.importance === 'LOW') {
      importance = Notifications.AndroidImportance.LOW;
    }

    try {
      await Notifications.setNotificationChannelAsync(ch.id, {
        name: ch.name,
        importance,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
      });
    } catch (err) {
      console.warn(`[Push] Failed to set channel ${ch.id}:`, err);
    }
  }
}

