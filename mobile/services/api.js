/**
 * FitMitra — Unified Authenticated API Service
 *
 * All server requests include `Authorization: Bearer <token>`.
 * Handles automatic session token refresh on 401 Unauthorized,
 * coordinates concurrent refresh requests, and performs controlled
 * logout when refresh fails.
 *
 * Token storage is backed by `expo-secure-store` with safe legacy migration.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';
import { emitDbUpdate } from '../utils/events';
import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
  getStoredToken,
  setStoredToken,
} from './tokenStorage';
import { clearUserCache } from './queryClient';

export {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
  getStoredToken,
  setStoredToken,
};

const USER_KEY = 'fitmitra_user';
const ONBOARDED_KEY = 'fitmitra_onboarded';

export const clearAuthData = async () => {
  try {
    await clearAuthTokens();
    await AsyncStorage.multiRemove([USER_KEY, ONBOARDED_KEY]);
    await clearUserCache();
  } catch (_) { }
};

// ─── Token Refresh Coordination ──────────────────────────────────────────────

let refreshPromise = null;

/**
 * Coordinate concurrent refresh requests so only ONE `/auth/refresh` HTTP call
 * runs at a time. All other concurrent 401 callers await this single promise.
 */
export const refreshAuthSession = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok || !body?.data?.tokens?.idToken) {
        const errorMsg = body?.message || body?.error || 'Token refresh failed';
        throw new Error(errorMsg);
      }

      const { idToken, refreshToken: newRefreshToken } = body.data.tokens;
      await setAuthTokens({
        accessToken: idToken,
        refreshToken: newRefreshToken || refreshToken,
      });

      return idToken;
    } catch (err) {
      // Refresh failed — clear credentials and trigger logout across app
      await clearAuthData();
      emitDbUpdate();
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// ─── Core Request Helper ─────────────────────────────────────────────────────

const request = async (path, options = {}) => {
  const isAuthEndpoint =
    path.startsWith('/auth/login') ||
    path.startsWith('/auth/register') ||
    path.startsWith('/auth/refresh') ||
    path.startsWith('/auth/logout');

  const token = await getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutMs = options.timeout || 10000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
    signal: controller.signal,
  };

  if (options.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const normalizedPath = path.startsWith('/api/v1') ? path.replace(/^\/api\/v1/, '') : path;
  const fullUrl = `${API_URL}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;

  try {
    const response = await fetch(fullUrl, fetchOptions);
    clearTimeout(timeoutId);

    // Automatic token refresh on 401 (retry eligible requests at most once)
    if (response.status === 401 && !options._retry && !isAuthEndpoint) {
      try {
        const newToken = await refreshAuthSession();
        if (newToken) {
          return await request(path, {
            ...options,
            _retry: true,
            headers: {
              ...(options.headers || {}),
              Authorization: `Bearer ${newToken}`,
            },
          });
        }
      } catch (refreshErr) {
        console.warn('[FitMitra API] Session refresh failed, logging out:', refreshErr.message);
        const expiredErr = new Error('Session expired. Please log in again.');
        expiredErr.status = 401;
        throw expiredErr;
      }
    }

    let data = {};
    try {
      data = await response.json();
    } catch (_) {
      data = {};
    }

    if (!response.ok) {
      const serverMessage =
        (typeof data?.error === 'string' ? data.error : data?.error?.message) ||
        (typeof data?.message === 'string' ? data.message : null) ||
        `Request failed with status ${response.status}`;
      const apiErr = new Error(serverMessage);
      apiErr.status = response.status;
      apiErr.code = data?.error?.code;
      apiErr.data = data;
      throw apiErr;
    }

    return data?.data !== undefined ? data.data : data;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[FitMitra API Error] ${fetchOptions.method} ${fullUrl}${err.status ? ` [${err.status}]` : ''} ->`, err.message);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Connection timed out. Server taking too long to respond.');
      timeoutErr.code = 'ERR_NETWORK';
      throw timeoutErr;
    }
    if (err instanceof TypeError && !err.status) {
      const netErr = new Error('Cannot reach the server. Please check your connection.');
      netErr.code = 'ERR_NETWORK';
      throw netErr;
    }
    throw err;
  }
};


// ─── Convenience Methods ──────────────────────────────────────────────────────

export const api = {
  get: (path, params = {}, options = {}) => {
    const keys = Object.keys(params).filter(
      (k) => params[k] !== undefined && params[k] !== null && params[k] !== ''
    );
    const query = keys.length
      ? '?' + keys.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&')
      : '';
    return request(`${path}${query}`, options);
  },
  post: (path, body = {}, options = {}) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body = {}, options = {}) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body = {}, options = {}) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' }),
};

// ─── Auth Sync ───────────────────────────────────────────────────────────────

export const syncAuth = async (idToken, profileData = {}) => {
  await setStoredToken(idToken);
  const sanitized = { ...profileData };
  if (sanitized.photoUrl === '') {
    delete sanitized.photoUrl;
  }
  const result = await api.post('/auth/sync', sanitized);
  return result;
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const fetchDashboard = () => api.get('/dashboard');

// ─── Profile ─────────────────────────────────────────────────────────────────

export const fetchProfile = () => api.get('/profiles/me');
export const updateProfile = (updates) => api.patch('/profiles/me', updates);

// ─── Users ───────────────────────────────────────────────────────────────────

export const fetchCurrentUser = () => api.get('/users/me');

// ─── Exercises ───────────────────────────────────────────────────────────────

export const fetchExercises = (params = {}) => api.get('/exercises', params);
export const fetchExercise = (id) => api.get(`/exercises/${id}`);

// ─── Programs ────────────────────────────────────────────────────────────────

export const fetchPrograms = (params = {}) => api.get('/programs', params);
export const fetchProgram = (id) => api.get(`/programs/${id}`);

// ─── Workouts ────────────────────────────────────────────────────────────────

export const startWorkout = (programDayId = null) =>
  api.post('/workouts/start', programDayId ? { programDayId } : {});

export const logExercise = (sessionId, exerciseData) =>
  api.post(`/workouts/${sessionId}/log-exercise`, exerciseData);

export const completeWorkout = (sessionId) =>
  api.post(`/workouts/${sessionId}/complete`);

export const abandonWorkout = (sessionId) =>
  api.post(`/workouts/${sessionId}/abandon`);

export const fetchWorkoutHistory = (params = {}) =>
  api.get('/workouts/history', params);

export const fetchWorkoutStats = () => api.get('/workouts/stats');

// ─── Nutrition ───────────────────────────────────────────────────────────────

export const fetchRecipes = (params = {}) => api.get('/nutrition/recipes', params);
export const fetchRecipe = (id) => api.get(`/nutrition/recipes/${id}`);
export const fetchNutritionLogs = (date) =>
  api.get('/nutrition/logs', date ? { date } : {});
export const addNutritionEntry = (logData) => api.post('/nutrition/logs', logData);
export const deleteNutritionItem = (logId, itemId) =>
  api.delete(`/nutrition/logs/${logId}/items/${itemId}`);

// ─── Store & Supplements ─────────────────────────────────────────────────────

export const fetchProducts = (params = {}) => api.get('/store/products', params);
export const fetchProduct = (slug) => api.get(`/store/products/${slug}`);
export const createCashOrder = (orderData) => api.post('/store/orders/cash', orderData);
export const createPointsOrder = (orderData) => api.post('/store/orders/points', orderData);
export const fetchMyOrders = () => api.get('/store/orders');
export const fetchOrder = (orderId) => api.get(`/store/orders/${orderId}`);
export const trackShipment = (awb) => api.get(`/shipping/track/${awb}`);

// ─── AI Coach ────────────────────────────────────────────────────────────────

export const sendAiMessage = (messageData) => api.post('/ai/chat', messageData);
export const fetchAiConversations = () => api.get('/ai/conversations');

// ─── Subscriptions & Payments ─────────────────────────────────────────────────

export const fetchSubscriptionPlans = () => api.get('/subscriptions/plans');
export const fetchMySubscription = () => api.get('/subscriptions/me');
export const createSubscription = (planData) => api.post('/subscriptions/create', planData);
export const verifyPayment = (paymentData) => api.post('/payments/verify', paymentData);
export const fetchPaymentHistory = () => api.get('/payments/history');

// ─── Notifications ────────────────────────────────────────────────────────────

export const fetchNotifications = () => api.get('/notifications');
export const markNotificationRead = (notifId) => api.patch(`/notifications/${notifId}/read`);
export const registerPushToken = (deviceToken, platform) =>
  api.post('/notifications/register-token', { deviceToken, platform });
