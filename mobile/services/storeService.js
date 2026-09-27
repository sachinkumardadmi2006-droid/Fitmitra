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
   * @param {object} orderData { items: [{ product: id, quantity: num, variant: string }], shippingAddress: {...} }
   */
  async createCashOrder(orderData) {
    return api.post('/store/orders/cash', orderData);
  },

  /**
   * Redeem product using Reward Points (⚡)
   * @param {object} orderData { items: [{ product: id, quantity: num, variant: string }], shippingAddress: {...} }
   */
  async createPointsOrder(orderData) {
    return api.post('/store/orders/points', orderData);
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
