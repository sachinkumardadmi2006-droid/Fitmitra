import { Platform } from 'react-native';

// Current active PC Wi-Fi IP address
// Over USB ADB reverse, 'localhost' routes directly through the USB cable
const DEV_MACHINE_LAN_IP = 'localhost';

const getBaseUrl = () => {
  // 1. Prioritize explicit production/staging backend URL if provided
  if (process.env.EXPO_PUBLIC_API_URL) {
    const envUrl = process.env.EXPO_PUBLIC_API_URL.trim();
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api/v1';
  }

  // 2. In development on physical phone / emulator over USB ADB reverse, use localhost:5000
  if (__DEV__) {
    const activeUrl = `http://${DEV_MACHINE_LAN_IP}:5000/api/v1`;
    console.log('[FitMitra API] Using active DEV_MACHINE_LAN_IP:', activeUrl);
    return activeUrl;
  }

  // 3. Fallback production / default
  return process.env.EXPO_PUBLIC_API_URL?.trim() || `http://${DEV_MACHINE_LAN_IP}:5000/api/v1`;
};

export const API_URL = getBaseUrl();
console.log('[FitMitra API] Active API_URL:', API_URL);
