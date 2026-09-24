// Backend API URL configuration
// Change this to your machine's LAN IP when testing on a physical device
// e.g., 'http://192.168.1.100:5000/api'
// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator, localhost works fine

import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  if (__DEV__) {
    // When running on a physical device, debuggerHost/hostUri contains the dev machine IP
    const hostUri = Constants.expoConfig?.hostUri;
    const hostIp = hostUri ? hostUri.split(':')[0] : null;

    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:5000/api`;
    }

    // Android emulator uses 10.0.2.2 to reach host machine's localhost
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://localhost:5000/api';
  }
  // Production URL
  return 'http://localhost:5000/api';
};

export const API_URL = getBaseUrl();

