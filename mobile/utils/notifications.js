import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Determine if the app is currently running inside the Expo Go sandbox client.
 * In Expo Go, native push notifications via FCM are not supported, and importing
 * expo-notifications can trigger native context crashes.
 */
export function isExpoGo() {
  try {
    if (Constants.appOwnership === 'expo') {
      return true;
    }
    // Fallback check for execution environment
    if (
      Constants.executionEnvironment === ExecutionEnvironment?.StoreClient &&
      Constants.appOwnership === 'expo'
    ) {
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

let cachedNotificationsModule = null;
let attemptedModuleLoad = false;

/**
 * Safely retrieve the `expo-notifications` module.
 *
 * Guaranteed not to crash the JavaScript runtime during bundle evaluation.
 * Returns `null` on Web, in Expo Go, or if the native module is unavailable.
 */
export function getNotificationsModule() {
  if (Platform.OS === 'web') {
    return null;
  }

  // Skip in Expo Go to avoid [The ExpoContext of expo.modules.application.ApplicationModule is closed]
  if (isExpoGo()) {
    return null;
  }

  if (attemptedModuleLoad) {
    return cachedNotificationsModule;
  }
  attemptedModuleLoad = true;

  try {
    cachedNotificationsModule = require('expo-notifications');
    return cachedNotificationsModule;
  } catch (err) {
    console.warn(
      '[Notifications] expo-notifications could not be loaded in current native runtime:',
      err?.message || err
    );
    return null;
  }
}

