import { api } from './api';

export const progressService = {
  /**
   * Fetch aggregate progress summary (weight progress, volume, personal records)
   * @param {number} days 30 | 90 | 180 | 365
   */
  async getProgressSummary(days = 90) {
    const res = await api.get('/progress/summary', { days });
    const data = res?.data || res || {};
    const weight = data.weight || {
      startingKg: null,
      currentKg: null,
      targetKg: null,
      changeKg: null,
      percentToGoal: null,
    };
    return {
      weight,
      // Backward compatibility alias:
      weightSummary: weight,
      volume: Array.isArray(data.volume) ? data.volume : [],
      personalBests: Array.isArray(data.personalBests) ? data.personalBests : [],
    };
  },

  /**
   * Fetch weight history entries and targets
   * @param {number} days 30 | 90 | 180 | 365
   */
  async getWeightHistory(days = 90) {
    const res = await api.get('/progress/weight', { days });
    const data = res?.data || res || {};
    const rawList = Array.isArray(data.entries)
      ? data.entries
      : Array.isArray(data.history)
      ? data.history
      : Array.isArray(data)
      ? data
      : [];

    const entries = rawList.map((item) => ({
      id: String(item._id || item.id || ''),
      _id: String(item._id || item.id || ''),
      dateKey: item.dateKey || (item.loggedAt ? new Date(item.loggedAt).toISOString().split('T')[0] : ''),
      weightKg: Number(item.weightKg || 0),
    }));

    return {
      entries,
      // Backward compatibility alias for any consumer expecting `history`:
      history: entries,
      startingWeightKg: data.startingWeightKg ?? null,
      currentWeightKg: data.currentWeightKg ?? null,
      targetWeightKg: data.targetWeightKg ?? null,
    };
  },

  /**
   * Log a new weight entry
   * @param {number} weightKg weight in kilograms (20 - 400)
   * @param {string} [dateKey] Optional YYYY-MM-DD date key
   */
  async logWeight(weightKg, dateKey) {
    const payload = { weightKg: Number(weightKg) };
    if (dateKey) payload.dateKey = dateKey;
    const res = await api.post('/progress/weight', payload);
    return res?.data || res;
  },

  /**
   * Delete a weight log entry by ID
   */
  async deleteWeight(id) {
    return api.delete(`/progress/weight/${id}`);
  },

  /**
   * Fetch body measurements history & changes
   * @param {object|number} [options] { limit: number } or number limit
   */
  async getMeasurements(options = 30) {
    const limit = typeof options === 'number' ? options : options?.limit || 30;
    const res = await api.get('/progress/measurements', { limit });
    const data = res?.data || res || {};
    const entries = Array.isArray(data.entries) ? data.entries : Array.isArray(data) ? data : [];
    return {
      entries,
      changes: data.changes || {},
    };
  },

  /**
   * Log body measurements (chest, waist, arms, thighs)
   * @param {object} measurementsData { dateKey?: string, chestCm?: number, waistCm?: number, armsCm?: number, thighsCm?: number }
   */
  async logMeasurements(measurementsData) {
    const res = await api.post('/progress/measurements', measurementsData);
    return res?.data || res;
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
    const res = await api.post('/progress/photos/upload-url', body);
    return res?.data || res;
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
    const res = await api.post('/progress/photos/confirm', payload);
    return res?.data || res;
  },

  /**
   * Fetch transformation photo gallery
   * @param {object} params { limit?: number, cursor?: string }
   */
  async getPhotos(params = {}) {
    const res = await api.get('/progress/photos', params);
    const data = res?.data || res || {};
    return {
      photos: Array.isArray(data.photos) ? data.photos : Array.isArray(data) ? data : [],
      nextCursor: data.nextCursor ?? null,
    };
  },

  /**
   * Delete a transformation photo entry
   */
  async deletePhoto(id) {
    return api.delete(`/progress/photos/${id}`);
  },
};
