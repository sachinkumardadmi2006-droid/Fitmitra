import { api } from './api';

export const CHALLENGE_TYPES = {
  DAY_STREAK: 'DAY_STREAK',
  PROOF_BASED: 'PROOF_BASED',
};

export const PROOF_TYPES = {
  PHOTO: 'PHOTO',
  VIDEO_LINK: 'VIDEO_LINK',
};

export const USER_CHALLENGE_STATUS = {
  ACCEPTED: 'ACCEPTED',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
};

export const SUBMISSION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const challengeService = {
  /**
   * List published challenges with pagination and optional type filter
   * @param {object} params { type?: 'DAY_STREAK'|'PROOF_BASED'|'ALL', page?: number, limit?: number }
   */
  async getChallenges(params = {}) {
    const query = {};
    if (params.type && params.type !== 'ALL') {
      query.type = params.type;
    }
    if (params.page) {
      query.page = params.page;
    }
    if (params.limit) {
      query.limit = params.limit;
    }

    const res = await api.get('/challenges', query);
    const items = Array.isArray(res?.items)
      ? res.items
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];

    return {
      items,
      total: res?.total ?? items.length,
      page: res?.page ?? (params.page || 1),
      limit: res?.limit ?? (params.limit || 20),
      totalPages: res?.totalPages ?? 1,
    };
  },

  /**
   * Fetch user's active accepted challenges with auto streak updates & expiration checks
   */
  async getActiveChallenges() {
    const res = await api.get('/challenges/me/active');
    return Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.items)
      ? res.items
      : [];
  },

  /**
   * Fetch challenge details by ID with user's participation status
   * @param {string} id Challenge ObjectId
   */
  async getChallengeById(id) {
    if (!id) throw new Error('Challenge ID is required');
    const res = await api.get(`/challenges/${id}`);
    return res?.data || res;
  },

  /**
   * Join/accept a challenge
   * @param {string} id Challenge ObjectId
   */
  async acceptChallenge(id) {
    if (!id) throw new Error('Challenge ID is required');
    const res = await api.post(`/challenges/${id}/accept`);
    return res?.data || res;
  },

  /**
   * Request presigned R2 upload URL for challenge photo proof
   * @param {string} id Challenge ObjectId
   * @param {object} payload { mimeType?: string, fileName?: string }
   */
  async getProofUploadUrl(id, payload = {}) {
    if (!id) throw new Error('Challenge ID is required');
    const mimeType = payload.mimeType || 'image/jpeg';
    const body = { mimeType };
    if (payload.fileName) body.fileName = payload.fileName;
    const res = await api.post(`/challenges/${id}/proof-upload-url`, body);
    return res?.data || res;
  },

  /**
   * Upload binary image to presigned R2 URL with 45s timeout
   * @param {string} uploadUrl Presigned PUT URL
   * @param {Blob} imageBlob File Blob / binary
   * @param {string} contentType MIME type
   */
  async uploadPhotoToPresignedUrl(uploadUrl, imageBlob, contentType = 'image/jpeg') {
    if (!uploadUrl) throw new Error('Upload URL is required');
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
        throw new Error(`Proof upload failed with status ${response.status}`);
      }
      return true;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  },

  /**
   * Submit challenge proof (photoKey or video url)
   * @param {string} id Challenge ObjectId
   * @param {object} payload { type: 'PHOTO'|'VIDEO_LINK', photoKey?: string, url?: string }
   */
  async submitProof(id, payload) {
    if (!id) throw new Error('Challenge ID is required');
    if (!payload?.type) throw new Error('Proof type is required');

    const body = { type: payload.type };
    if (payload.photoKey) body.photoKey = payload.photoKey;
    if (payload.url) body.url = payload.url;

    const res = await api.post(`/challenges/${id}/submit-proof`, body);
    return res?.data || res;
  },
};

