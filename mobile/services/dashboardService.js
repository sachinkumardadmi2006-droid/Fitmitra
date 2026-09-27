import { api } from './api';

export const dashboardService = {
  /**
   * Fetch consolidated dashboard payload in 1 network call:
   * returns user points, today's workout, nutrition totals, recent sessions, and 7-day stats.
   */
  async getDashboard() {
    return api.get('/dashboard');
  },
};
