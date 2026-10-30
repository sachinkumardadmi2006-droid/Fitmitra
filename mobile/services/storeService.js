import { api } from './api';

const generateIdempotencyKey = () => {
  const chars = 'abcdef0123456789';
  let result = 'fm_';
  for (let i = 0; i < 29; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result; // 32 characters (well within 16-64 char requirement)
};

export const storeService = {
  /**
   * Fetch supplements catalog
   * @param {object} params { category, search, page, limit }
   */
  async getProducts(params = {}) {
    return api.get('/store/products', params);
  },

  /**
   * Fetch single product details by slug
   */
  async getProduct(slug) {
    return api.get(`/store/products/${slug}`);
  },

  /**
   * Create an order paid via Cash (Razorpay order initiated on server)
   * @param {object} orderData { items: [{ productId, quantity }], deliveryAddress: {...} }
   * @param {string} [idempotencyKey] 16-64 char string
   */
  async createCashOrder(orderData, idempotencyKey) {
    const key = (typeof idempotencyKey === 'string' && idempotencyKey.trim().length >= 16 && idempotencyKey.trim().length <= 64)
      ? idempotencyKey.trim()
      : generateIdempotencyKey();

    return api.post('/store/orders', orderData, {
      headers: { 'Idempotency-Key': key },
    });
  },

  /**
   * Redeem product using Reward Points (⚡)
   * @param {object} orderData { items: [{ productId, quantity }], deliveryAddress: {...} }
   * @param {string} [idempotencyKey] 16-64 char string
   */
  async createPointsOrder(orderData, idempotencyKey) {
    const key = (typeof idempotencyKey === 'string' && idempotencyKey.trim().length >= 16 && idempotencyKey.trim().length <= 64)
      ? idempotencyKey.trim()
      : generateIdempotencyKey();

    return api.post('/store/orders/redeem', orderData, {
      headers: { 'Idempotency-Key': key },
    });
  },

  /**
   * Fetch user's orders history
   */
  async getMyOrders() {
    return api.get('/store/orders');
  },

  /**
   * Fetch specific order details
   */
  async getOrder(orderId) {
    return api.get(`/store/orders/${orderId}`);
  },

  /**
   * Live Shiprocket AWB shipment tracking
   * @param {string} awb Tracking code / Air Waybill number
   */
  async trackShipment(awb) {
    return api.get(`/shipping/track/${awb}`);
  },
};
