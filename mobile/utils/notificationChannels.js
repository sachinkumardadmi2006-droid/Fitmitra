import { Platform } from 'react-native';
import { ANDROID_CHANNELS } from '../constants/notificationChannels';
import { getNotificationsModule } from './notifications';

/**
 * Creates Android notification channels for each FitMitra category.
 * Safe to call on each app launch (idempotent).
 * Bypassed safely on Web and in Expo Go.
 */
export async function createAndroidNotificationChannels() {
  if (Platform.OS !== 'android') return;

  const Notifications = getNotificationsModule();
  if (!Notifications) return;

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

