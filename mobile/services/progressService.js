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
   * @param {object|number} [options] { limit: number } or number limit
   */
  async getMeasurements(options = 30) {
    const limit = typeof options === 'number' ? options : options?.limit || 30;
    return api.get('/progress/measurements', { limit });
  },

  /**
   * Log body measurements (chest, waist, arms, thighs)
   */
  async logMeasurements(measurementsData) {
    return api.post('/progress/measurements', measurementsData);
  },

  /**
   * Delete a measurement log entry by ID
   */
  async deleteMeasurement(id) {
    return api.delete(`/progress/measurements/${id}`);
  },

  /**
   * Get pre-signed URL for transformation photo upload
   * @param {object} payload { contentType: 'image/jpeg' | 'image/png' | 'image/webp', dateKey?: string }
   */
  async getPhotoUploadUrl(payload = {}) {
    const contentType = payload.contentType || 'image/jpeg';
    const body = { contentType };
    if (payload.dateKey) body.dateKey = payload.dateKey;
    return api.post('/progress/photos/upload-url', body);
  },

  /**
   * Upload binary image to pre-signed S3 URL with 45s timeout
   */
  async uploadPhotoToS3(uploadUrl, imageBlob, contentType = 'image/jpeg') {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: imageBlob,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) {
        throw new Error(`S3 upload failed with status ${response.status}`);
      }
      return true;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  },

  /**
   * Confirm photo upload and register entry in database
   * @param {object} payload { photoKey: string, weightKg?: number, note?: string }
   */
  async confirmPhoto(payload) {
    return api.post('/progress/photos/confirm', payload);
  },

  /**
   * Fetch transformation photo gallery
   * @param {object} params { limit?: number, cursor?: string }
   */
  async getPhotos(params = {}) {
    return api.get('/progress/photos', params);
  },

  /**
   * Delete a transformation photo entry
   */
  async deletePhoto(id) {
    return api.delete(`/progress/photos/${id}`);
  },
};
