// FitMitra Database / AsyncStorage Helper & Express API Synchronizer
// Mirrors frontend/src/utils/db.js — replaces localStorage with AsyncStorage,
// window events with EventEmitter, connects to real backend API

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';
import { emitDbUpdate } from './events';

const KEYS = {
  USER: 'fitmitra_user',
  WORKOUT_HISTORY: 'fitmitra_workout_history',
  NUTRITION_LOGS: 'fitmitra_nutrition_logs',
  WEIGHT_HISTORY: 'fitmitra_weight_history',
};

// Dummy initDb to satisfy imports, does not run automatically on app start
export const initDb = () => {
  // Client database is now initialized on successful login/signup from server
};

// --- API FETCH HELPERS ---

const getAuthEmail = async () => {
  try {
    const userStr = await AsyncStorage.getItem(KEYS.USER);
    const user = userStr ? JSON.parse(userStr) : null;
    return user ? user.email : '';
  } catch (e) {
    return '';
  }
};

const makeRequest = async (path, method = 'GET', body = null) => {
  const email = await getAuthEmail();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (email) {
    headers['Authorization'] = email;
  }

  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, options);
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || 'API request failed');
  }
  return response.json();
};

// --- AUTHENTICATION API CALLS ---

export const loginUser = async (email, password) => {
  const data = await makeRequest('/auth/login', 'POST', { email, password });

  // Cache user data & history logs locally
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(data.user));
  await AsyncStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(data.workoutHistory || []));
  await AsyncStorage.setItem(KEYS.NUTRITION_LOGS, JSON.stringify(data.nutritionLogs || []));
  await AsyncStorage.setItem(KEYS.WEIGHT_HISTORY, JSON.stringify(data.weightHistory || []));

  emitDbUpdate();
  return data.user;
};

export const signupUser = async (name, email, password) => {
  const data = await makeRequest('/auth/signup', 'POST', { name, email, password });

  // Cache user data & history logs locally
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(data.user));
  await AsyncStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(data.workoutHistory || []));
  await AsyncStorage.setItem(KEYS.NUTRITION_LOGS, JSON.stringify(data.nutritionLogs || []));
  await AsyncStorage.setItem(KEYS.WEIGHT_HISTORY, JSON.stringify(data.weightHistory || []));

  emitDbUpdate();
  return data.user;
};

export const requestOtp = async (phone, email = '', name = '', isSignup = false) => {
  return makeRequest('/auth/request-otp', 'POST', { phone, email, name, isSignup });
};

export const verifyOtp = async (phone, otp) => {
  const data = await makeRequest('/auth/verify-otp', 'POST', { phone, otp });

  // Cache user data & history logs locally
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(data.user));
  await AsyncStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(data.workoutHistory || []));
  await AsyncStorage.setItem(KEYS.NUTRITION_LOGS, JSON.stringify(data.nutritionLogs || []));
  await AsyncStorage.setItem(KEYS.WEIGHT_HISTORY, JSON.stringify(data.weightHistory || []));

  emitDbUpdate();
  return data.user;
};

// --- DATA ACCESSORS & MUTATORS ---

export const getUser = async () => {
  try {
    const str = await AsyncStorage.getItem(KEYS.USER);
    return str ? JSON.parse(str) : null;
  } catch (e) {
    return null;
  }
};

// Synchronous version for components that have already loaded user into state
export const getUserSync = () => {
  // This is a fallback — prefer async getUser() and store in state
  return null;
};

export const saveUser = async (user) => {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  emitDbUpdate();

  // Sync profile details asynchronously in the background
  try {
    await makeRequest('/user/profile', 'POST', { user });
  } catch (err) {
    console.error('Failed to sync user profile with backend:', err);
  }
};

export const getWorkoutHistory = async () => {
  try {
    const str = await AsyncStorage.getItem(KEYS.WORKOUT_HISTORY);
    return str ? JSON.parse(str) : [];
  } catch (e) {
    return [];
  }
};

export const addWorkoutHistory = async (workout) => {
  const history = await getWorkoutHistory();
  const todayStr = new Date().toISOString().split('T')[0];
  const newLog = {
    date: todayStr,
    ...workout,
    completed: true,
  };
  history.push(newLog);
  await AsyncStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(history));

  // Pre-update user stats locally
  const user = await getUser();
  if (user) {
    user.completedWorkoutsCount = (user.completedWorkoutsCount || 0) + 1;
    user.streak = (user.streak || 0) + 1;
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  }

  emitDbUpdate();

  // Sync workout details asynchronously in the background
  try {
    const res = await makeRequest('/workouts', 'POST', { workout: newLog });
    if (res.workoutHistory) {
      await AsyncStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(res.workoutHistory));
    }
    if (res.user) {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(res.user));
    }
    emitDbUpdate();
  } catch (err) {
    console.error('Failed to sync workout history with backend:', err);
  }
};

export const getNutritionLogs = async () => {
  try {
    const str = await AsyncStorage.getItem(KEYS.NUTRITION_LOGS);
    return str ? JSON.parse(str) : [];
  } catch (e) {
    return [];
  }
};

export const getTodayNutritionLogs = async () => {
  const logs = await getNutritionLogs();
  const todayStr = new Date().toISOString().split('T')[0];
  return logs.filter((log) => log.date === todayStr);
};

export const addNutritionLog = async (log) => {
  const logs = await getNutritionLogs();
  const todayStr = new Date().toISOString().split('T')[0];
  const newLog = {
    id: Date.now().toString(),
    date: todayStr,
    ...log,
  };
  logs.push(newLog);
  await AsyncStorage.setItem(KEYS.NUTRITION_LOGS, JSON.stringify(logs));
  emitDbUpdate();

  // Sync nutrition log asynchronously in the background
  try {
    const res = await makeRequest('/nutrition', 'POST', { log: newLog });
    if (res.nutritionLogs) {
      await AsyncStorage.setItem(KEYS.NUTRITION_LOGS, JSON.stringify(res.nutritionLogs));
      emitDbUpdate();
    }
  } catch (err) {
    console.error('Failed to sync nutrition log with backend:', err);
  }
};

export const deleteNutritionLog = async (id) => {
  let logs = await getNutritionLogs();
  logs = logs.filter(log => log.id !== id);
  await AsyncStorage.setItem(KEYS.NUTRITION_LOGS, JSON.stringify(logs));
  emitDbUpdate();

  // Sync nutrition log deletion asynchronously in the background
  try {
    const res = await makeRequest(`/nutrition/${id}`, 'DELETE');
    if (res.nutritionLogs) {
      await AsyncStorage.setItem(KEYS.NUTRITION_LOGS, JSON.stringify(res.nutritionLogs));
      emitDbUpdate();
    }
  } catch (err) {
    console.error('Failed to sync nutrition log deletion with backend:', err);
  }
};

export const getWeightHistory = async () => {
  try {
    const str = await AsyncStorage.getItem(KEYS.WEIGHT_HISTORY);
    return str ? JSON.parse(str) : [];
  } catch (e) {
    return [];
  }
};

export const addWeightLog = async (weightVal) => {
  const history = await getWeightHistory();
  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = history.filter(h => h.date !== todayStr);
  filtered.push({ date: todayStr, weight: parseFloat(weightVal) });
  filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  await AsyncStorage.setItem(KEYS.WEIGHT_HISTORY, JSON.stringify(filtered));

  const user = await getUser();
  if (user) {
    user.currentWeight = parseFloat(weightVal);
    user.weight = parseFloat(weightVal);
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  }

  emitDbUpdate();

  // Sync weight log asynchronously in the background
  try {
    const res = await makeRequest('/weight', 'POST', { weight: parseFloat(weightVal) });
    if (res.weightHistory) {
      await AsyncStorage.setItem(KEYS.WEIGHT_HISTORY, JSON.stringify(res.weightHistory));
    }
    if (res.user) {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(res.user));
    }
    emitDbUpdate();
  } catch (err) {
    console.error('Failed to sync weight log with backend:', err);
  }
};

// Logout helper — clears all cached data
export const clearAllData = async () => {
  await AsyncStorage.multiRemove([
    KEYS.USER,
    KEYS.WORKOUT_HISTORY,
    KEYS.NUTRITION_LOGS,
    KEYS.WEIGHT_HISTORY,
  ]);
  emitDbUpdate();
};
