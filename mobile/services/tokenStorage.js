/**
 * FitMitra — Secure Token Storage Service
 *
 * Implements hardware-backed, encrypted token storage via `expo-secure-store`
 * with automatic fallback and safe one-time migration from legacy `AsyncStorage`.
 *
 * Security rules:
 * - Access token and refresh token are stored in SecureStore.
 * - Legacy tokens found in AsyncStorage are migrated to SecureStore and purged from AsyncStorage.
 * - Under no circumstances may a development token ('dev-token') be stored in production (!__DEV__).
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ACCESS_TOKEN_KEY = 'fitmitra_token';
export const REFRESH_TOKEN_KEY = 'fitmitra_refresh_token';

let isSecureStoreSupported = null;

async function checkSecureStoreSupport() {
  if (isSecureStoreSupported !== null) return isSecureStoreSupported;
  try {
    isSecureStoreSupported = await SecureStore.isAvailableAsync();
  } catch (_) {
    isSecureStoreSupported = false;
  }
  return isSecureStoreSupported;
}

/**
 * Retrieve the current access token.
 * Automatically migrates legacy tokens from AsyncStorage to SecureStore.
 */
export async function getAccessToken() {
  try {
    const supported = await checkSecureStoreSupport();
    if (supported) {
      let token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      if (token) {
        if (!__DEV__ && token.startsWith('dev-')) {
          await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => {});
          return null;
        }
        return token;
      }

      // Safe migration: check legacy AsyncStorage
      const legacyToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (legacyToken) {
        if (!__DEV__ && legacyToken.startsWith('dev-')) {
          await AsyncStorage.removeItem(ACCESS_TOKEN_KEY).catch(() => {});
          return null;
        }
        // Save to secure store and remove from legacy unencrypted store only if write succeeds
        try {
          await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, legacyToken);
          await AsyncStorage.removeItem(ACCESS_TOKEN_KEY).catch(() => {});
        } catch (migErr) {
          console.warn('[tokenStorage] Migration failed, preserving legacy access token:', migErr);
        }
        return legacyToken;
      }
      return null;
    } else {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!__DEV__ && token && token.startsWith('dev-')) {
        await AsyncStorage.removeItem(ACCESS_TOKEN_KEY).catch(() => {});
        return null;
      }
      return token;
    }
  } catch (err) {
    console.warn('[tokenStorage] getAccessToken error:', err?.message || err);
    return null;
  }
}

/**
 * Retrieve the current refresh token.
 * Automatically migrates legacy refresh tokens from AsyncStorage to SecureStore.
 */
export async function getRefreshToken() {
  try {
    const supported = await checkSecureStoreSupport();
    if (supported) {
      let token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (token) {
        if (!__DEV__ && token.startsWith('dev-')) {
          await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
          return null;
        }
        return token;
      }

      // Safe migration: check legacy AsyncStorage
      const legacy = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (legacy) {
        if (!__DEV__ && legacy.startsWith('dev-')) {
          await AsyncStorage.removeItem(REFRESH_TOKEN_KEY).catch(() => {});
          return null;
        }
        try {
          await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, legacy);
          await AsyncStorage.removeItem(REFRESH_TOKEN_KEY).catch(() => {});
        } catch (migErr) {
          console.warn('[tokenStorage] Migration failed, preserving legacy refresh token:', migErr);
        }
        return legacy;
      }
      return null;
    } else {
      const token = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!__DEV__ && token && token.startsWith('dev-')) {
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY).catch(() => {});
        return null;
      }
      return token;
    }
  } catch (err) {
    console.warn('[tokenStorage] getRefreshToken error:', err?.message || err);
    return null;
  }
}

/**
 * Persist access and refresh tokens securely.
 * Rejects any development token when not running in __DEV__.
 */
export async function setAuthTokens({ accessToken, refreshToken }) {
  if (!__DEV__) {
    if (accessToken && accessToken.startsWith('dev-')) {
      throw new Error('Development token cannot be saved in a production environment.');
    }
    if (refreshToken && refreshToken.startsWith('dev-')) {
      throw new Error('Development refresh token cannot be saved in a production environment.');
    }
  }

  try {
    const supported = await checkSecureStoreSupport();
    if (supported) {
      if (accessToken) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      } else {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => {});
      }

      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
      }
    } else {
      if (accessToken) {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      } else {
        await AsyncStorage.removeItem(ACCESS_TOKEN_KEY).catch(() => {});
      }

      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY).catch(() => {});
      }
    }

    // Ensure legacy storage is cleared
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]).catch(() => {});
  } catch (err) {
    console.warn('[tokenStorage] setAuthTokens error:', err?.message || err);
    throw err;
  }
}

/**
 * Remove all stored authentication tokens from both SecureStore and AsyncStorage.
 */
export async function clearAuthTokens() {
  try {
    const supported = await checkSecureStoreSupport();
    if (supported) {
      await Promise.allSettled([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      ]);
    }
  } catch (_) {}

  try {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  } catch (_) {}
}

export const getStoredToken = getAccessToken;
export const setStoredToken = (token) => setAuthTokens({ accessToken: token });
