/**
 * FitMitra — Unified Authenticated API Service
 *
 * All server requests must include `Authorization: Bearer <token>`.
 * In development (__DEV__), if no real token is found in AsyncStorage,
 * the service automatically falls back to `dev-token` so the app
 * can connect to the local backend without requiring real Firebase Auth.
 *
 * Token storage key: 'fitmitra_token'
 * User storage key:  'fitmitra_user'
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

const TOKEN_KEY = 'fitmitra_token';
const USER_KEY = 'fitmitra_user';
const ONBOARDED_KEY = 'fitmitra_onboarded';

// ─── Token Management ────────────────────────────────────────────────────────

export const getStoredToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) return token;
  } catch (_) {}
  return null;
};

export const setStoredToken = async (token) => {
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch (_) {}
};

export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, ONBOARDED_KEY]);
  } catch (_) {}
};

// ─── Core Request Helper ─────────────────────────────────────────────────────

const request = async (path, options = {}) => {
  const token = await getStoredToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
    signal: controller.signal,
  };

  if (options.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_URL}${path}`, fetchOptions);
    clearTimeout(timeoutId);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return data?.data !== undefined ? data.data : data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out. Server taking too long to respond.');
    }
    if (err instanceof TypeError) {
      throw new Error('Cannot reach the server. Please check your connection.');
    }
    throw err;
  }
};


// ─── Convenience Methods ──────────────────────────────────────────────────────

export const api = {
  get: (path, params = {}) => {
    const keys = Object.keys(params).filter(
      (k) => params[k] !== undefined && params[k] !== null && params[k] !== ''
    );
    const query = keys.length
      ? '?' + keys.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&')
      : '';
    return request(`${path}${query}`);
  },
  post: (path, body = {}) => request(path, { method: 'POST', body }),
  patch: (path, body = {}) => request(path, { method: 'PATCH', body }),
  put: (path, body = {}) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
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
