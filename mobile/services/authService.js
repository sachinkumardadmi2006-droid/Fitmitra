import { api, clearAuthData } from './api';
import {
  setAuthTokens,
  getStoredToken,
  setStoredToken,
} from './tokenStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearUserCache } from './queryClient';
import { emitDbUpdate } from '../utils/events';

const USER_KEY = 'fitmitra_user';
const ONBOARDED_KEY = 'fitmitra_onboarded';

/**
 * Format human-readable authentication error messages from backend or network
 */
export const formatAuthError = (err) => {
  const message = err?.message || '';
  if (/email.*already.*exists/i.test(message)) {
    return 'An account already exists with this email. Please log in.';
  }
  if (/invalid.*credential|incorrect.*password|user not found|unauthorized/i.test(message)) {
    return 'Incorrect email or password. Please try again.';
  }
  if (/invalid email/i.test(message)) {
    return 'Please enter a valid email address.';
  }
  if (/network|cannot reach/i.test(message)) {
    return 'Cannot reach the server. Please check your internet connection.';
  }
  return message || 'Authentication failed. Please try again.';
};

export const authService = {
  /**
   * Status check for authentication service
   */
  isConfigured() {
    return true;
  },

  /**
   * Log in directly with backend /auth/login endpoint
   * @param {string} email
   * @param {string} password
   */
  async loginWithEmail(email, password) {
    try {
      await clearUserCache();
      const result = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const user = result?.user;
      const tokens = result?.tokens;

      if (!tokens?.idToken) {
        throw new Error('Authentication succeeded but server returned no access token.');
      }

      // Save tokens securely in expo-secure-store
      await setAuthTokens({
        accessToken: tokens.idToken,
        refreshToken: tokens.refreshToken,
      });

      if (user) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      }

      // Check onboarding state from server profile or user biometrics
      const hasBiometrics = Boolean(user?.profile?.heightCm && user?.profile?.weightKg);
      if (hasBiometrics) {
        await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
      } else {
        await AsyncStorage.removeItem(ONBOARDED_KEY);
      }

      emitDbUpdate();
      return {
        user,
        isOnboarded: hasBiometrics,
      };
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  },

  /**
   * Register directly with backend /auth/register endpoint
   * @param {string} name
   * @param {string} email
   * @param {string} password
   */
  async signupWithEmail(name, email, password) {
    try {
      await clearUserCache();
      const result = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      const user = result?.user;
      const tokens = result?.tokens;

      if (!tokens?.idToken) {
        throw new Error('Registration succeeded but server returned no access token.');
      }

      // Save tokens securely in expo-secure-store
      await setAuthTokens({
        accessToken: tokens.idToken,
        refreshToken: tokens.refreshToken,
      });

      if (user) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      }

      // Newly registered users must complete onboarding
      await AsyncStorage.removeItem(ONBOARDED_KEY);

      emitDbUpdate();
      return {
        user,
        isOnboarded: false,
      };
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  },

  /**
   * Request password reset OTP email from backend /auth/forgot-password
   * @param {string} email
   */
  async forgotPassword(email) {
    try {
      return await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  },

  /**
   * Verify password reset 6-digit OTP code with backend /auth/verify-reset-otp
   * @param {string} email
   * @param {string} otp
   * @returns {Promise<string>} resetToken
   */
  async verifyResetOtp(email, otp) {
    try {
      const result = await api.post('/auth/verify-reset-otp', {
        email: email.trim().toLowerCase(),
        otp: String(otp).trim(),
      });
      return result?.resetToken || result;
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  },

  /**
   * Reset user password with verified resetToken via /auth/reset-password
   * @param {string} resetToken
   * @param {string} newPassword
   */
  async resetPassword(resetToken, newPassword) {
    try {
      return await api.post('/auth/reset-password', {
        resetToken,
        newPassword,
      });
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  },

  /**
   * Log in via Google ID token with backend /auth/google
   * @param {string} idToken
   */
  async googleLogin(idToken) {
    try {
      await clearUserCache();
      const result = await api.post('/auth/google', {
        idToken,
      });

      const user = result?.user;
      const tokens = result?.tokens;

      if (!tokens?.idToken) {
        throw new Error('Google authentication succeeded but server returned no access token.');
      }

      // Save tokens securely in expo-secure-store
      await setAuthTokens({
        accessToken: tokens.idToken,
        refreshToken: tokens.refreshToken,
      });

      if (user) {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      }

      // Check onboarding state from server profile or user biometrics
      const hasBiometrics = Boolean(user?.profile?.heightCm && user?.profile?.weightKg);
      if (hasBiometrics) {
        await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
      } else {
        await AsyncStorage.removeItem(ONBOARDED_KEY);
      }

      emitDbUpdate();
      return {
        user,
        isOnboarded: hasBiometrics,
      };
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  },

  /**
   * Synchronize authenticated session with backend (legacy compatibility)
   * @param {string} idToken
   * @param {object} profileData
   */
  async syncUser(idToken, profileData = {}) {
    await setStoredToken(idToken);

    const sanitizedData = {};
    if (profileData.displayName?.trim()) {
      sanitizedData.displayName = profileData.displayName.trim();
    }
    if (profileData.photoUrl) {
      sanitizedData.photoUrl = profileData.photoUrl;
    }
    if (profileData.language && ['en', 'kn'].includes(profileData.language)) {
      sanitizedData.language = profileData.language;
    }

    const result = await api.post('/auth/sync', sanitizedData);

    if (result?.user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
    }

    const hasBiometrics = Boolean(result?.profile?.heightCm && result?.profile?.weightKg);
    if (hasBiometrics) {
      await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    } else {
      await AsyncStorage.removeItem(ONBOARDED_KEY);
    }

    emitDbUpdate();
    return {
      user: result?.user,
      profile: result?.profile,
      isOnboarded: hasBiometrics,
    };
  },

  /**
   * Development Quick Login (strictly gated to __DEV__)
   * NEVER executable in production builds.
   */
  async devLogin() {
    if (!__DEV__) {
      throw new Error('Development quick login is disabled in production builds.');
    }

    await clearUserCache();

    const devUser = {
      _id: 'dev-user-shivanna',
      email: 'shivannagorkal@gmail.com',
      displayName: 'Shivanna Gorkal',
      role: 'USER',
    };

    await setStoredToken('dev-token');
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(devUser));
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');

    try {
      const syncResult = await this.syncUser('dev-token', {
        displayName: 'Shivanna Gorkal',
      });
      return syncResult;
    } catch (e) {
      console.warn('Backend sync in devLogin deferred:', e?.message || e);
      emitDbUpdate();
      return {
        user: devUser,
        profile: { heightCm: 175, weightKg: 70, points: 100 },
        isOnboarded: true,
      };
    }
  },

  /**
   * Check if onboarding has been completed
   */
  async getOnboardedStatus() {
    try {
      const stored = await AsyncStorage.getItem(ONBOARDED_KEY);
      return stored === 'true';
    } catch (_) {
      return false;
    }
  },

  /**
   * Mark onboarding as complete or incomplete
   */
  async setOnboardedStatus(status = true, emit = false) {
    try {
      const current = await AsyncStorage.getItem(ONBOARDED_KEY);
      const isAlready = current === 'true';
      if (Boolean(status) === isAlready) return;
      if (status) {
        await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
      } else {
        await AsyncStorage.removeItem(ONBOARDED_KEY);
      }
      if (emit) {
        emitDbUpdate();
      }
    } catch (_) {}
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
    try {
      if (!user) {
        await AsyncStorage.removeItem(USER_KEY);
      } else {
        const current = await AsyncStorage.getItem(USER_KEY);
        const next = JSON.stringify(user);
        if (current === next) return;
        await AsyncStorage.setItem(USER_KEY, next);
      }
      emitDbUpdate();
    } catch (_) {}
  },

  /**
   * Sign out and clear all stored session tokens and profile
   */
  async logout() {
    try {
      await api.post('/auth/logout').catch(() => {});
    } catch (_) {}
    await clearAuthData();
    emitDbUpdate();
  },

  getStoredToken,
  setStoredToken,
};
