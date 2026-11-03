import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';
import { getNotificationsModule, isExpoGo } from '../utils/notifications';

/**
 * Request notification permissions and register native FCM push token with backend.
 * Android: Native FCM device token via expo-notifications.
 * iOS: TODO — deferred. Returns null early without crashing.
 * Expo Go: Safely bypassed (native FCM push requires a development build: npx expo run:android).
 */
export async function requestPushPermissionAndRegisterToken() {
  if (Platform.OS !== 'android') {
    // Web has no native FCM support; iOS push is deferred for future phase.
    return null;
  }

  const Notifications = getNotificationsModule();
  if (!Notifications) {
    if (isExpoGo()) {
      console.log(
        '[Push] Running in Expo Go: Native FCM push registration skipped (requires development build: npx expo run:android). In-app notifications will continue to work normally.'
      );
    }
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Notification permissions not granted');
      return null;
    }

    // On Android, getDevicePushTokenAsync returns the native FCM token
    const pushTokenData = await Notifications.getDevicePushTokenAsync();
    const pushToken = pushTokenData?.data;

    if (!pushToken) {
      console.warn('[Push] No FCM push token returned by device');
      return null;
    }

    await notificationService.registerDevice({
      pushToken,
      platform: 'ANDROID',
      appVersion: Constants.expoConfig?.version || '1.0.0',
    });

    console.log('[Push] FCM device push token registered successfully');
    return pushToken;
  } catch (err) {
    console.warn('[Push] Error registering device token:', err?.message || err);
    return null;
  }
}

/**
 * Subscribe to FCM push token refreshes and re-register automatically.
 * Returns an unsubscribe callback.
 */
export function subscribeToTokenRefresh() {
  if (Platform.OS !== 'android') {
    // Web and iOS push token refresh deferred.
    return () => {};
  }

  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return () => {};
  }

  try {
    const subscription = Notifications.addPushTokenListener(async ({ data: newToken }) => {
      if (!newToken) return;
      try {
        await notificationService.registerDevice({
          pushToken: newToken,
          platform: 'ANDROID',
          appVersion: Constants.expoConfig?.version || '1.0.0',
        });
        console.log('[Push] Device push token refreshed and updated on server');
      } catch (err) {
        console.warn('[Push] Failed to register refreshed token:', err);
      }
    });

    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  } catch (err) {
    console.warn('[Push] Error attaching push token listener:', err);
    return () => {};
  }
}

export const notificationService = {
  /**
   * Fetch paginated list of notifications for the user
   * @param {object} params { page, limit }
   */
  async getNotifications(params = {}) {
    return api.get('/notifications', params);
  },

  /**
   * Mark single notification as read
   * @param {string} id Notification ID
   */
  async markAsRead(id) {
    return api.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all unread notifications as read
   */
  async markAllAsRead() {
    return api.post('/notifications/mark-all-read');
  },

  /**
   * Register device push notification token (FCM / Expo)
   * @param {object} payload { pushToken, token, platform, appVersion }
   */
  async registerDevice(payload) {
    const pushToken = payload.pushToken || payload.token;
    const platform = payload.platform ? String(payload.platform).toUpperCase() : 'ANDROID';
    return api.post('/devices/register', {
      pushToken,
      platform,
      appVersion: payload.appVersion,
    });
  },

  /**
   * Unregister device push notification token
   * @param {string} token Push token
   */
  async unregisterDevice(token) {
    if (!token) return;
    return api.delete(`/devices/${encodeURIComponent(token)}`);
  },

  /**
   * Update user timezone for scheduled notifications
   * @param {string} timezone e.g. 'Asia/Kolkata'
   */
  async updateTimezone(timezone) {
    if (!timezone) return;
    return api.patch('/profiles/notification-preferences', { timezone });
  },

  /**
   * Fetch user notification preferences matrix, schedule, and quiet hours
   */
  async getNotificationPreferences() {
    return api.get('/profiles/notification-preferences');
  },

  /**
   * Update notification preferences matrix, schedule, and/or quiet hours
   * @param {object} payload
   */
  async updateNotificationPreferences(payload) {
    return api.patch('/profiles/notification-preferences', payload);
  },

  /**
   * Update lastSeenAt timestamp for all devices owned by user
   */
  async updateLastSeen() {
    return api.patch('/devices/last-seen');
  },
};
