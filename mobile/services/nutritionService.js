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
   * Fetch recipe catalog
   */
  async getRecipes(params = {}) {
    return api.get('/nutrition/recipes', params);
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
   * Get hydration (water intake in ml) for date YYYY-MM-DD
   * Note: Cached on client until backend schema extends INutritionLog
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

