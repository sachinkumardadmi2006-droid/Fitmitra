import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { authService } from '../services/authService';

const rawWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const webClientId = rawWebClientId.trim();

// Configure Google Sign-In at module level with the Web Client ID only
if (webClientId) {
  GoogleSignin.configure({ webClientId });
}

export const isConfigured = Boolean(
  webClientId && !webClientId.includes('your-web-client-id')
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
