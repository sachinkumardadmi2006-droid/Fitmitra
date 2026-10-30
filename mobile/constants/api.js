import { Platform } from 'react-native';
import Constants from 'expo-constants';

const DEV_MACHINE_LAN_IP = '10.51.225.53';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api/v1';
  }

  // 1. If explicit EXPO_PUBLIC_API_URL is configured in .env with a valid non-localhost URL, prioritize it
  if (process.env.EXPO_PUBLIC_API_URL) {
    const envUrl = process.env.EXPO_PUBLIC_API_URL.trim();
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      console.log('[FitMitra API] Using EXPO_PUBLIC_API_URL:', envUrl);
      return envUrl;
    }
  }

  if (__DEV__) {
    // 2. In Expo Go on physical device (LAN mode), debuggerHost/hostUri contains the dev machine IP
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.manifest2?.extra?.expoGo?.debuggerHost ||
      Constants.manifest?.debuggerHost;

    if (hostUri) {
      const sanitized = hostUri
        .replace(/^https?:\/\//, '')
        .replace(/^exp:\/\//, '');
      const parts = sanitized.split(':');
      const ip = parts[0];

      // Only use hostUri if it is a real numeric IPv4 address (LAN mode).
      // When running in tunnel mode (expo start --tunnel), hostUri is "*.exp.direct" or "*.ngrok"
      // which DOES NOT forward port 5000 and causes all network requests to hang!
      const isNumericIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
      if (isNumericIPv4 && ip !== '127.0.0.1') {
        const resolved = `http://${ip}:5000/api/v1`;
        console.log('[FitMitra API] Resolved from Expo hostUri:', resolved);
        return resolved;
      }
    }

    // 3. Android emulator fallback
    if (Platform.OS === 'android' && !Constants.isDevice) {
      return 'http://10.0.2.2:5000/api/v1';
    }

    // 4. Physical Device on Wi-Fi fallback (use actual PC LAN IP)
    return `http://${DEV_MACHINE_LAN_IP}:5000/api/v1`;
  }

  // Production fallback
  return `http://${DEV_MACHINE_LAN_IP}:5000/api/v1`;
};

export const API_URL = getBaseUrl();
console.log('[FitMitra API] Active API_URL:', API_URL);



