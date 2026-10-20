import { api } from './api';

export const progressService = {
  /**
   * Fetch aggregate progress summary (weight progress, volume, personal records)
   * @param {number} days 30 | 90 | 180 | 365
   */
  async getProgressSummary(days = 90) {
    return api.get('/progress/summary', { days });
  },

  /**
   * Fetch weight history entries
   * @param {number} days 30 | 90 | 180 | 365
   */
  async getWeightHistory(days = 90) {
    return api.get('/progress/weight', { days });
  },

  /**
   * Log a new weight entry
   * @param {number} weightKg weight in kilograms (30 - 300)
   * @param {string} [dateKey] Optional YYYY-MM-DD date key
   */
  async logWeight(weightKg, dateKey) {
    const payload = { weightKg: Number(weightKg) };
    if (dateKey) payload.dateKey = dateKey;
    return api.post('/progress/weight', payload);
  },

  /**
   * Delete a weight log entry by ID
   */
  async deleteWeight(id) {
    return api.delete(`/progress/weight/${id}`);
  },

  /**
   * Fetch body measurements history
   * @param {number} days 30 | 90 | 180 | 365
   */
  async getMeasurements(days = 90) {
    return api.get('/progress/measurements', { days });
  },

  /**
   * Log body measurements (chest, waist, arms, thighs, hips)
   */
  async logMeasurements(measurementsData) {
    return api.post('/progress/measurements', measurementsData);
  },
};
