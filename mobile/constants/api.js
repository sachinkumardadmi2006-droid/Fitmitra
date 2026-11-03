import { Platform } from 'react-native';

// Current active PC Wi-Fi IP address
const DEV_MACHINE_LAN_IP = '10.123.158.53';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api/v1';
  }

  // 1. In development on physical phone / Expo Go, use current LAN IP directly
  if (__DEV__) {
    const activeUrl = `http://${DEV_MACHINE_LAN_IP}:5000/api/v1`;
    console.log('[FitMitra API] Using active DEV_MACHINE_LAN_IP:', activeUrl);
    return activeUrl;
  }

  // 2. Production or explicit env
  if (process.env.EXPO_PUBLIC_API_URL) {
    const envUrl = process.env.EXPO_PUBLIC_API_URL.trim();
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
  }

  return `http://${DEV_MACHINE_LAN_IP}:5000/api/v1`;
};

export const API_URL = getBaseUrl();
console.log('[FitMitra API] Active API_URL:', API_URL);
