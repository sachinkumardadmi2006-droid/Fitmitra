import { api } from './api';

export const subscriptionService = {
  /**
   * Fetch active subscription tiers
   */
  async getPlans() {
    return api.get('/subscriptions/plans');
  },

  /**
   * Get authenticated user's current subscription status
   */
  async getMySubscription() {
    return api.get('/subscriptions/me');
  },

  /**
   * Create a subscription order on the server
   * @param {object} planData { planId: string, billingCycle: 'MONTHLY' | 'ANNUAL' }
   */
  async createSubscription(planData) {
    return api.post('/subscriptions/create', planData);
  },

  /**
   * Verify Razorpay payment signature
   * @param {object} paymentData { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   */
  async verifyPayment(paymentData) {
    return api.post('/payments/verify', paymentData);
  },

  /**
   * Fetch payment history
   */
  async getPaymentHistory() {
    return api.get('/payments/history');
  },
};
