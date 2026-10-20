import { Platform } from 'react-native';
import Constants from 'expo-constants';

const DEV_MACHINE_LAN_IP = '10.171.199.53';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api/v1';
  }

  if (__DEV__) {
    // 1. In Expo Go on physical device, debuggerHost/hostUri contains the dev machine IP
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

      if (ip && ip !== 'localhost' && ip !== '127.0.0.1' && ip !== 'http' && ip !== 'https') {
        const resolved = `http://${ip}:5000/api/v1`;
        console.log('[FitMitra API] Resolved from Expo hostUri:', resolved);
        return resolved;
      }
    }
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log('[FitMitra API] Using EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (__DEV__) {
    // 2. Android emulator fallback
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000/api/v1';
    }

    // 3. Physical Device on Wi-Fi fallback (use actual PC LAN IP)
    return `http://${DEV_MACHINE_LAN_IP}:5000/api/v1`;
  }

  // Production fallback
  return `http://${DEV_MACHINE_LAN_IP}:5000/api/v1`;
};

export const API_URL = getBaseUrl();
console.log('[FitMitra API] Active API_URL:', API_URL);



