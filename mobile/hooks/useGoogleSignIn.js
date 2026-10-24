import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { authService } from '../services/authService';

let GoogleSignin = null;
let statusCodes = {};
let isErrorWithCode = () => false;
let isSuccessResponse = () => false;
let isNativeModuleAvailable = false;

// Safely probe for native RNGoogleSignin module to prevent crashing Expo Go
try {
  const { TurboModuleRegistry, NativeModules } = require('react-native');
  const hasTurbo =
    typeof TurboModuleRegistry?.get === 'function' &&
    Boolean(TurboModuleRegistry.get('RNGoogleSignin'));
  const hasLegacy = Boolean(NativeModules?.RNGoogleSignin);

  if (hasTurbo || hasLegacy) {
    const mod = require('@react-native-google-signin/google-signin');
    GoogleSignin = mod.GoogleSignin;
    statusCodes = mod.statusCodes || {};
    isErrorWithCode = mod.isErrorWithCode || (() => false);
    isSuccessResponse = mod.isSuccessResponse || (() => false);
    isNativeModuleAvailable = true;
  }
} catch {
  // Expo Go or web environment where RNGoogleSignin is absent
  isNativeModuleAvailable = false;
}

const rawWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const webClientId = rawWebClientId.trim();

// Configure Google Sign-In at module level only if native binary is present
if (isNativeModuleAvailable && GoogleSignin && webClientId) {
  try {
    GoogleSignin.configure({ webClientId });
  } catch (err) {
    console.warn('[GoogleSignin] Configuration warning:', err?.message || err);
  }
}

export const isConfigured = Boolean(
  isNativeModuleAvailable &&
  webClientId &&
  !webClientId.includes('your-web-client-id')
);

/**
 * Custom hook for native Google Sign-In via @react-native-google-signin/google-signin
 * Exchanges Google idToken with FitMitra backend (/auth/google)
 */
export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signIn = useCallback(async () => {
    setError('');

    if (!isNativeModuleAvailable || !GoogleSignin) {
      const notice =
        'Google Sign-In requires a custom development build (eas build / npx expo run:android) and is not supported inside Expo Go. Please sign in with email and password.';
      setError(notice);
      Alert.alert('Expo Go Notice', notice);
      return;
    }

    if (!isConfigured) {
      setError('Google sign-in is not configured yet.');
      return;
    }

    setLoading(true);

    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      // Sign out first (ignoring errors) to ensure account picker appears
      try {
        await GoogleSignin.signOut();
      } catch {
        // Ignore sign-out errors
      }

      const response = await GoogleSignin.signIn();

      if (response?.type === 'cancelled') {
        return;
      }

      const idToken =
        (isSuccessResponse && isSuccessResponse(response)
          ? response.data?.idToken
          : response?.data?.idToken || response?.idToken) || null;

      if (!idToken) {
        setError('Google did not return an ID token');
        return;
      }

      await authService.googleLogin(idToken);
      // Global route guard automatically redirects on authenticated user state change
    } catch (err) {
      if (isErrorWithCode && isErrorWithCode(err)) {
        if (
          err.code === statusCodes.SIGN_IN_CANCELLED ||
          err.code === 'SIGN_IN_CANCELLED' ||
          err.code === '12501'
        ) {
          // User cancelled the sign-in flow - do nothing, no error
          return;
        }
        if (
          err.code === statusCodes.IN_PROGRESS ||
          err.code === 'ASYNC_OP_IN_PROGRESS' ||
          err.code === 'IN_PROGRESS'
        ) {
          // Operation already in progress - ignore
          return;
        }
        if (
          err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE ||
          err.code === 'PLAY_SERVICES_NOT_AVAILABLE'
        ) {
          setError('Google Play Services is not available on this device.');
          return;
        }
        if (
          err.code === '10' ||
          err.code === statusCodes.DEVELOPER_ERROR ||
          err.code === 'DEVELOPER_ERROR'
        ) {
          setError(
            'Google sign-in setup error (DEVELOPER_ERROR). Check the Android SHA-1 and the web client ID.'
          );
          return;
        }
      }

      // Check for cancelled response object or message
      if (err?.code === '12501' || err?.message?.includes('cancelled')) {
        return;
      }

      // Server or network response message
      const serverMsg =
        err?.response?.data?.message || err?.message || 'Failed to sign in with Google';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    signIn,
    loading,
    error,
    isConfigured,
  };
}
