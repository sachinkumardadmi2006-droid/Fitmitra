import { api, setStoredToken, getStoredToken, clearAuthData } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitDbUpdate } from '../utils/events';

const USER_KEY = 'fitmitra_user';

export const authService = {
  /**
   * Synchronize authenticated session with backend
   * @param {string} idToken Firebase JWT or dev token
   * @param {object} profileData Optional initial profile data
   */
  async syncUser(idToken, profileData = {}) {
    await setStoredToken(idToken);
    const result = await api.post('/auth/sync', profileData);
    if (result?.user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
    }
    emitDbUpdate();
    return result;
  },

  /**
   * Get currently authenticated user details from server
   */
  async getCurrentUser() {
    return api.get('/users/me');
  },

  /**
   * Get cached local user
   */
  async getLocalUser() {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (_) {
      return null;
    }
  },

  /**
   * Save or update local cached user
   */
  async saveLocalUser(user) {
    if (!user) {
      await AsyncStorage.removeItem(USER_KEY);
    } else {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    emitDbUpdate();
  },

  /**
   * Sign out and clear all stored session tokens and profile
   */
  async logout() {
    await clearAuthData();
    emitDbUpdate();
  },

  getStoredToken,
  setStoredToken,
};
