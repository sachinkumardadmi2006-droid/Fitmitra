import { api } from './api';

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
   * @param {string} [idempotencyKey]
   */
  async createCashOrder(orderData, idempotencyKey) {
    const options = idempotencyKey
      ? { headers: { 'Idempotency-Key': String(idempotencyKey).trim() } }
      : {};
    return api.post('/store/orders/cash', orderData, options);
  },

  /**
   * Redeem product using Reward Points (⚡)
   * @param {object} orderData { items: [{ productId, quantity }], deliveryAddress: {...} }
   * @param {string} [idempotencyKey]
   */
  async createPointsOrder(orderData, idempotencyKey) {
    const options = idempotencyKey
      ? { headers: { 'Idempotency-Key': String(idempotencyKey).trim() } }
      : {};
    return api.post('/store/orders/points', orderData, options);
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
