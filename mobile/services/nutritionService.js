import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const nutritionService = {
  /**
   * Search food database
   */
  async getFoods(params = {}) {
    return api.get('/nutrition/foods', params);
  },

  /**
   * Fetch recipe catalog with automatic Kannada -> English fallback
   */
  async getRecipes(params = {}) {
    const res = await api.get('/nutrition/recipes', params);
    const items = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.items)
      ? res.items
      : Array.isArray(res)
      ? res
      : [];

    if (params.language === 'kn' && items.length === 0) {
      return api.get('/nutrition/recipes', { ...params, language: 'en' });
    }
    return res;
  },

  /**
   * Fetch single recipe by ID
   */
  async getRecipe(id) {
    return api.get(`/nutrition/recipes/${id}`);
  },

  /**
   * Fetch daily meal logs for a specific date (YYYY-MM-DD)
   */
  async getNutritionLogs(date) {
    return api.get('/nutrition/logs', date ? { date } : {});
  },

  /**
   * Log a meal item (Breakfast, Lunch, Dinner, Snack)
   * @param {object} logData { mealType, name, calories, protein, carbs, fats, date, servingSize }
   */
  async addNutritionLog(logData) {
    return api.post('/nutrition/logs', logData);
  },

  /**
   * Delete an item from a logged meal
   */
  async deleteNutritionLogItem(logId, itemId) {
    return api.delete(`/nutrition/logs/${logId}/items/${itemId}`);
  },

  /**
   * Get hydration (water intake in ml)
   */
  async getWater() {
    try {
      const res = await api.get('/nutrition/water');
      return res?.data?.totalMl ?? res?.totalMl ?? 0;
    } catch (_) {
      return this.getHydration();
    }
  },

  /**
   * Log water intake in ml via backend API
   */
  async logWater(amountMl) {
    try {
      const res = await api.post('/nutrition/water', { amountMl });
      const total = res?.data?.totalMl ?? res?.totalMl ?? amountMl;
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(`fitmitra_hydration_${today}`, String(total));
      return total;
    } catch (_) {
      return this.setHydration(amountMl);
    }
  },

  /**
   * Get hydration (water intake in ml) for date YYYY-MM-DD
   */
  async getHydration(date = new Date().toISOString().split('T')[0]) {
    try {
      const val = await AsyncStorage.getItem(`fitmitra_hydration_${date}`);
      return val ? parseInt(val, 10) : 0;
    } catch (_) {
      return 0;
    }
  },

  /**
   * Add / set hydration (water intake in ml) for date YYYY-MM-DD
   */
  async setHydration(amountMl, date = new Date().toISOString().split('T')[0]) {
    try {
      await AsyncStorage.setItem(`fitmitra_hydration_${date}`, String(amountMl));
      return amountMl;
    } catch (_) {
      return amountMl;
    }
  },
};

