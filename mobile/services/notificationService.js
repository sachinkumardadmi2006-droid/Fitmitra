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
   * @param {object} payload { token, platform }
   */
  async registerDevice(payload) {
    return api.post('/devices/register', payload);
  },
};
