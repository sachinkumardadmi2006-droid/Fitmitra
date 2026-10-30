import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export const nutritionService = {
  /**
   * Fetch user personalized daily nutrition and hydration targets
   */
  async getTargets() {
    const res = await api.get('/nutrition/targets');
    const data = res?.data || res || {};
    return {
      ...data,
      calories: Number(data.calories ?? 0),
      protein: Number(data.proteinG ?? data.protein ?? 0),
      carbs: Number(data.carbsG ?? data.carbs ?? 0),
      fat: Number(data.fatsG ?? data.fat ?? 0),
      proteinG: Number(data.proteinG ?? data.protein ?? 0),
      carbsG: Number(data.carbsG ?? data.carbs ?? 0),
      fatsG: Number(data.fatsG ?? data.fat ?? 0),
      waterMl: Number(data.waterMl ?? 0),
      hasActivePlan: Boolean(data.hasActivePlan),
    };
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
   * Normalizes input into backend logMealSchema format with singular fat
   * @param {object} logData { mealType, name, calories, protein, carbs, fat|fats, date, servingSize|unit, quantity, items }
   */
  async addNutritionLog(logData) {
    const today = new Date().toISOString().split('T')[0];
    const date = logData.date || today;
    const mealType = (logData.mealType || 'SNACK').toUpperCase();

    let items = [];
    if (Array.isArray(logData.items) && logData.items.length > 0) {
      items = logData.items.map((it) => ({
        name: it.name || 'Food item',
        calories: Number(it.calories || 0),
        protein: Number(it.protein || 0),
        carbs: Number(it.carbs || 0),
        fat: Number(it.fat ?? it.fats ?? it.fatG ?? 0),
        fiber: Number(it.fiber || 0),
        quantity: typeof it.quantity === 'number' ? it.quantity : 1,
        unit: it.unit || it.servingSize || 'serving',
        source: it.source || 'CUSTOM',
        estimatedBy: it.estimatedBy || 'USER',
        ...(it.recipeId ? { recipeId: it.recipeId } : {}),
      }));
    } else {
      items = [
        {
          name: logData.name || 'Food item',
          calories: Number(logData.calories || 0),
          protein: Number(logData.protein || 0),
          carbs: Number(logData.carbs || 0),
          fat: Number(logData.fat ?? logData.fats ?? logData.fatG ?? 0),
          fiber: Number(logData.fiber || 0),
          quantity: typeof logData.quantity === 'number' ? logData.quantity : 1,
          unit: logData.unit || logData.servingSize || 'serving',
          source: logData.source || 'CUSTOM',
          estimatedBy: logData.estimatedBy || 'USER',
          ...(logData.recipeId ? { recipeId: logData.recipeId } : {}),
        },
      ];
    }

    return api.post('/nutrition/logs', {
      date,
      mealType,
      items,
    });
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

  /**
   * Fetch currently active AI Diet Plan
   */
  async getCurrentDietPlan() {
    const res = await api.get('/nutrition/diet-plan');
    return res?.data !== undefined ? res.data : (res || null);
  },

  /**
   * Generate a new AI Diet Plan
   * @param {string} reason
   */
  async generateDietPlan(reason) {
    const res = await api.post('/nutrition/diet-plan/generate', reason ? { reason } : {});
    return res?.data || res;
  },

  /**
   * Fetch historical AI diet plans
   */
  async getDietPlanHistory(page = 1, limit = 20) {
    const res = await api.get('/nutrition/diet-plan/history', { page, limit });
    return res?.data || res || [];
  },
};

