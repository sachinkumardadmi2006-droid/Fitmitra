// FitMitra Database/Local Storage Helper & Express API Synchronizer

const KEYS = {
  USER: 'fitmitra_user',
  WORKOUT_HISTORY: 'fitmitra_workout_history',
  NUTRITION_LOGS: 'fitmitra_nutrition_logs',
  WEIGHT_HISTORY: 'fitmitra_weight_history',
};

const API_URL = 'http://localhost:5000/api';

// Dummy initDb to satisfy imports, does not run automatically on app start
export const initDb = () => {
  // Client database is now initialized on successful login/signup from server
};

// --- API FETCH HELPERS ---

const getAuthEmail = () => {
  try {
    const user = JSON.parse(localStorage.getItem(KEYS.USER));
    return user ? user.email : '';
  } catch (e) {
    return '';
  }
};

const makeRequest = async (path, method = 'GET', body = null) => {
  const email = getAuthEmail();
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
  localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
  localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(data.workoutHistory || []));
  localStorage.setItem(KEYS.NUTRITION_LOGS, JSON.stringify(data.nutritionLogs || []));
  localStorage.setItem(KEYS.WEIGHT_HISTORY, JSON.stringify(data.weightHistory || []));
  
  window.dispatchEvent(new Event('fitmitra_db_update'));
  return data.user;
};

export const signupUser = async (name, email, password) => {
  const data = await makeRequest('/auth/signup', 'POST', { name, email, password });
  
  // Cache user data & history logs locally
  localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
  localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(data.workoutHistory || []));
  localStorage.setItem(KEYS.NUTRITION_LOGS, JSON.stringify(data.nutritionLogs || []));
  localStorage.setItem(KEYS.WEIGHT_HISTORY, JSON.stringify(data.weightHistory || []));
  
  window.dispatchEvent(new Event('fitmitra_db_update'));
  return data.user;
};

export const requestOtp = async (phone, email = '', name = '', isSignup = false) => {
  return makeRequest('/auth/request-otp', 'POST', { phone, email, name, isSignup });
};

export const verifyOtp = async (phone, otp) => {
  const data = await makeRequest('/auth/verify-otp', 'POST', { phone, otp });
  
  // Cache user data & history logs locally
  localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
  localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(data.workoutHistory || []));
  localStorage.setItem(KEYS.NUTRITION_LOGS, JSON.stringify(data.nutritionLogs || []));
  localStorage.setItem(KEYS.WEIGHT_HISTORY, JSON.stringify(data.weightHistory || []));
  
  window.dispatchEvent(new Event('fitmitra_db_update'));
  return data.user;
};

// --- DATA ACCESSORS & MUTATORS ---

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.USER)) || null;
  } catch (e) {
    return null;
  }
};

export const saveUser = (user) => {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
  window.dispatchEvent(new Event('fitmitra_db_update'));

  // Sync profile details asynchronously in the background
  makeRequest('/user/profile', 'POST', { user }).catch(err => {
    console.error('Failed to sync user profile with backend:', err);
  });
};

export const getWorkoutHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.WORKOUT_HISTORY)) || [];
  } catch (e) {
    return [];
  }
};

export const addWorkoutHistory = (workout) => {
  const history = getWorkoutHistory();
  const todayStr = new Date().toISOString().split('T')[0];
  const newLog = {
    date: todayStr,
    ...workout,
    completed: true,
  };
  history.push(newLog);
  localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(history));

  // Pre-update user stats locally
  const user = getUser();
  if (user) {
    user.completedWorkoutsCount = (user.completedWorkoutsCount || 0) + 1;
    user.streak = (user.streak || 0) + 1;
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  }

  window.dispatchEvent(new Event('fitmitra_db_update'));

  // Sync workout details asynchronously in the background
  makeRequest('/workouts', 'POST', { workout: newLog }).then(res => {
    if (res.workoutHistory) {
      localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(res.workoutHistory));
    }
    if (res.user) {
      localStorage.setItem(KEYS.USER, JSON.stringify(res.user));
    }
    window.dispatchEvent(new Event('fitmitra_db_update'));
  }).catch(err => {
    console.error('Failed to sync workout history with backend:', err);
  });
};

export const getNutritionLogs = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.NUTRITION_LOGS)) || [];
  } catch (e) {
    return [];
  }
};

export const getTodayNutritionLogs = () => {
  const logs = getNutritionLogs();
  const todayStr = new Date().toISOString().split('T')[0];
  return logs.filter((log) => log.date === todayStr);
};

export const addNutritionLog = (log) => {
  const logs = getNutritionLogs();
  const todayStr = new Date().toISOString().split('T')[0];
  const newLog = {
    id: Date.now().toString(),
    date: todayStr,
    ...log,
  };
  logs.push(newLog);
  localStorage.setItem(KEYS.NUTRITION_LOGS, JSON.stringify(logs));
  window.dispatchEvent(new Event('fitmitra_db_update'));

  // Sync nutrition log asynchronously in the background
  makeRequest('/nutrition', 'POST', { log: newLog }).then(res => {
    if (res.nutritionLogs) {
      localStorage.setItem(KEYS.NUTRITION_LOGS, JSON.stringify(res.nutritionLogs));
      window.dispatchEvent(new Event('fitmitra_db_update'));
    }
  }).catch(err => {
    console.error('Failed to sync nutrition log with backend:', err);
  });
};

export const deleteNutritionLog = (id) => {
  let logs = getNutritionLogs();
  logs = logs.filter(log => log.id !== id);
  localStorage.setItem(KEYS.NUTRITION_LOGS, JSON.stringify(logs));
  window.dispatchEvent(new Event('fitmitra_db_update'));

  // Sync nutrition log deletion asynchronously in the background
  makeRequest(`/nutrition/${id}`, 'DELETE').then(res => {
    if (res.nutritionLogs) {
      localStorage.setItem(KEYS.NUTRITION_LOGS, JSON.stringify(res.nutritionLogs));
      window.dispatchEvent(new Event('fitmitra_db_update'));
    }
  }).catch(err => {
    console.error('Failed to sync nutrition log deletion with backend:', err);
  });
};

export const getWeightHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.WEIGHT_HISTORY)) || [];
  } catch (e) {
    return [];
  }
};

export const addWeightLog = (weightVal) => {
  const history = getWeightHistory();
  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = history.filter(h => h.date !== todayStr);
  filtered.push({ date: todayStr, weight: parseFloat(weightVal) });
  filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  localStorage.setItem(KEYS.WEIGHT_HISTORY, JSON.stringify(filtered));

  const user = getUser();
  if (user) {
    user.currentWeight = parseFloat(weightVal);
    user.weight = parseFloat(weightVal);
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  }

  window.dispatchEvent(new Event('fitmitra_db_update'));

  // Sync weight log asynchronously in the background
  makeRequest('/weight', 'POST', { weight: parseFloat(weightVal) }).then(res => {
    if (res.weightHistory) {
      localStorage.setItem(KEYS.WEIGHT_HISTORY, JSON.stringify(res.weightHistory));
    }
    if (res.user) {
      localStorage.setItem(KEYS.USER, JSON.stringify(res.user));
    }
    window.dispatchEvent(new Event('fitmitra_db_update'));
  }).catch(err => {
    console.error('Failed to sync weight log with backend:', err);
  });
};
