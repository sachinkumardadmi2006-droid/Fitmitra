/**
 * FitMitra — Secure Token Storage Service
 *
 * Implements hardware-backed, encrypted token storage via `expo-secure-store`
 * with universal `AsyncStorage` persistence and in-memory caching.
 *
 * Reliability & Security Rules:
 * - In-memory token cache guarantees instant zero-latency retrieval across fast sequential requests.
 * - Always persists to AsyncStorage to prevent session loss on Web, Expo Go, and devices without keystores.
 * - Saves to SecureStore whenever hardware/platform support is detected.
 * - Under no circumstances may a development token ('dev-token') be stored in production (!__DEV__).
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ACCESS_TOKEN_KEY = 'fitmitra_token';
export const REFRESH_TOKEN_KEY = 'fitmitra_refresh_token';

// In-memory cache for instant synchronous access avoiding async race conditions
let inMemoryAccessToken = null;
let inMemoryRefreshToken = null;
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
 * Checks in-memory cache first, then SecureStore, then AsyncStorage fallback.
 */
export async function getAccessToken() {
  // 1. Fast in-memory hit
  if (inMemoryAccessToken) {
    if (!__DEV__ && inMemoryAccessToken.startsWith('dev-')) {
      inMemoryAccessToken = null;
      return null;
    }
    return inMemoryAccessToken;
  }

  try {
    const supported = await checkSecureStoreSupport();
    if (supported) {
      try {
        const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        if (token) {
          if (!__DEV__ && token.startsWith('dev-')) {
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => {});
            return null;
          }
          inMemoryAccessToken = token;
          return token;
        }
      } catch (secErr) {
        console.warn('[tokenStorage] SecureStore read failed, falling back to AsyncStorage:', secErr?.message || secErr);
      }
    }

    // 2. Persistent AsyncStorage fallback
    const legacyToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (legacyToken) {
      if (!__DEV__ && legacyToken.startsWith('dev-')) {
        await AsyncStorage.removeItem(ACCESS_TOKEN_KEY).catch(() => {});
        return null;
      }
      inMemoryAccessToken = legacyToken;
      return legacyToken;
    }

    return null;
  } catch (err) {
    console.warn('[tokenStorage] getAccessToken error:', err?.message || err);
    return null;
  }
}

/**
 * Retrieve the current refresh token.
 */
export async function getRefreshToken() {
  // 1. Fast in-memory hit
  if (inMemoryRefreshToken) {
    if (!__DEV__ && inMemoryRefreshToken.startsWith('dev-')) {
      inMemoryRefreshToken = null;
      return null;
    }
    return inMemoryRefreshToken;
  }

  try {
    const supported = await checkSecureStoreSupport();
    if (supported) {
      try {
        const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (token) {
          if (!__DEV__ && token.startsWith('dev-')) {
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
            return null;
          }
          inMemoryRefreshToken = token;
          return token;
        }
      } catch (secErr) {
        console.warn('[tokenStorage] SecureStore read refresh failed, falling back to AsyncStorage:', secErr?.message || secErr);
      }
    }

    // 2. Persistent AsyncStorage fallback
    const legacy = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (legacy) {
      if (!__DEV__ && legacy.startsWith('dev-')) {
        await AsyncStorage.removeItem(REFRESH_TOKEN_KEY).catch(() => {});
        return null;
      }
      inMemoryRefreshToken = legacy;
      return legacy;
    }

    return null;
  } catch (err) {
    console.warn('[tokenStorage] getRefreshToken error:', err?.message || err);
    return null;
  }
}

/**
 * Persist access and refresh tokens securely.
 * Saves in-memory, to AsyncStorage, and to SecureStore when available.
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

  // 1. Update in-memory cache immediately
  inMemoryAccessToken = accessToken || null;
  inMemoryRefreshToken = refreshToken || null;

  try {
    // 2. Persist to AsyncStorage (universal support across Web, Expo Go, and native)
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

    // 3. Persist to SecureStore if platform supports it
    const supported = await checkSecureStoreSupport();
    if (supported) {
      try {
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
      } catch (secErr) {
        console.warn('[tokenStorage] SecureStore write error (AsyncStorage preserved):', secErr?.message || secErr);
      }
    }
  } catch (err) {
    console.warn('[tokenStorage] setAuthTokens error:', err?.message || err);
    throw err;
  }
}

/**
 * Remove all stored authentication tokens from in-memory cache, SecureStore, and AsyncStorage.
 */
export async function clearAuthTokens() {
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;

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
