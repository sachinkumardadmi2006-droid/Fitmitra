import { api } from './api';

export const profileService = {
  /**
   * Fetch authenticated user's profile and reward points
   */
  async getProfile() {
    return api.get('/profiles/me');
  },

  /**
   * Update profile fields (weightKg, heightCm, goal, experienceLevel, preferredLanguage)
   */
  async updateProfile(updates) {
    return api.patch('/profiles/me', updates);
  },

  /**
   * Fetch notification settings
   */
  async getSettings() {
    return api.get('/profiles/me/settings');
  },

  /**
   * Update notification settings
   * @param {object} settings { workoutReminders, pointsAlerts, offersAndNews }
   */
  async updateSettings(settings) {
    return api.patch('/profiles/me/settings', settings);
  },
};

