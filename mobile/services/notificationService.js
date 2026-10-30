import { api } from './api';

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
};
