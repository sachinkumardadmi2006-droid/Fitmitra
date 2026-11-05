import { api } from './api';

export const manualPaymentService = {
  /**
   * 1. Initialize manual UPI payment for Store Order or Subscription.
   * @param {object} payload { subscriptionPlanId?: string, storeOrderId?: string }
   */
  async createPaymentOrder(payload) {
    const res = await api.post('/payments/manual/create-order', payload);
    return res?.data || res;
  },

  /**
   * 2. Upload payment receipt screenshot to Cloudflare R2 / Storage.
   * @param {object} asset Result asset from expo-image-picker
   * @returns {Promise<string>} public URL of uploaded screenshot
   */
  async uploadPaymentProofScreenshot(asset) {
    if (!asset?.base64) {
      throw new Error('Image base64 data is missing. Please select the image again.');
    }

    const mimeType =
      asset.mimeType ||
      (asset.uri?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');

    const res = await api.post('/storage/upload', {
      folder: 'payment-proofs',
      prefix: 'payment-proofs',
      fileBase64: asset.base64,
      mimeType,
      fileName: `proof_${Date.now()}.jpg`,
    });

    const uploadedUrl =
      res?.data?.url ||
      res?.data?.publicUrl ||
      res?.url ||
      res?.publicUrl;

    if (!uploadedUrl) {
      throw new Error('Screenshot upload succeeded but server did not return a public URL.');
    }

    return uploadedUrl;
  },

  /**
   * 3. Submit payment verification proof (UTR Number + Screenshot URL).
   * @param {object} payload { paymentId?: string, orderId?: string, utrNumber: string, proofImageUrl: string, userNote?: string }
   */
  async submitPaymentProof(payload) {
    const res = await api.post('/payments/manual/submit-proof', payload);
    return res?.data || res;
  },

  /**
   * 4. Check status of a manual payment verification.
   * @param {string} paymentId
   */
  async getPaymentStatus(paymentId) {
    const res = await api.get(`/payments/manual/${paymentId}/status`);
    return res?.data || res;
  },
};

