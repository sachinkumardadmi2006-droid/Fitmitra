/**
 * FitMitra — App Metadata & Configuration Service
 *
 * Interfaces with `GET /api/v1/app/config` to resolve backend-driven
 * feature flags for Store and Shipping availability.
 */

import { api } from './api';

export const appConfigService = {
  /**
   * Fetch live app configuration and strictly validate boolean flags
   * @returns {Promise<{ storeEnabled: boolean, shippingEnabled: boolean }>}
   */
  async getConfig() {
    const data = await api.get('/app/config');

    // Strict boolean parser to prevent string "false" from evaluating as true
    const parseBoolean = (val) => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        const lower = val.trim().toLowerCase();
        if (lower === 'true' || lower === '1') return true;
        if (lower === 'false' || lower === '0') return false;
      }
      if (typeof val === 'number') return val === 1;
      return false;
    };

    return {
      storeEnabled: parseBoolean(data?.storeEnabled),
      shippingEnabled: parseBoolean(data?.shippingEnabled),
    };
  },
};
