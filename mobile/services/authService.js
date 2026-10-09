import { api, setStoredToken, getStoredToken, clearAuthData } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitDbUpdate } from '../utils/events';
import {
  auth,
  isFirebaseConfigured,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from './firebase';

const USER_KEY = 'fitmitra_user';
const ONBOARDED_KEY = 'fitmitra_onboarded';

/**
 * Format human-readable Firebase Auth error messages
 */
export const formatAuthError = (err) => {
  const code = err?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'The email address is invalid.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Please sign in.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/popup-closed-by-user':
      return 'Google Sign-In was cancelled.';
    default:
      return err?.message || 'Authentication failed. Please try again.';
  }
};

export const authService = {
  /**
   * Check if Firebase is configured with active keys
   */
  isConfigured() {
    return isFirebaseConfigured;
  },

  /**
   * Synchronize authenticated session with backend
   * @param {string} idToken Firebase JWT or dev token
   * @param {object} profileData Optional initial profile data
   */
  async syncUser(idToken, profileData = {}) {
    await setStoredToken(idToken);

    const sanitizedData = {};
    if (profileData.displayName?.trim()) {
      sanitizedData.displayName = profileData.displayName.trim();
    }
    if (profileData.photoUrl) {
      sanitizedData.photoUrl = profileData.photoUrl;
    }
    if (profileData.language && ['en', 'kn'].includes(profileData.language)) {
      sanitizedData.language = profileData.language;
    }

    const result = await api.post('/auth/sync', sanitizedData);

    if (result?.user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
    }

    // Check if user has already completed onboarding
    const hasBiometrics = Boolean(result?.profile?.heightCm && result?.profile?.weightKg);
    if (hasBiometrics) {
      await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    }

    emitDbUpdate();
    return {
      user: result?.user,
      profile: result?.profile,
      isOnboarded: hasBiometrics,
    };
  },

  /**
   * Sign in with Email & Password via Firebase Auth
   */
  async loginWithEmail(email, password) {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        'Firebase is not configured. Please add your EXPO_PUBLIC_FIREBASE_* keys to the .env file.'
      );
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      const idToken = await userCredential.user.getIdToken();
      return await this.syncUser(idToken, {
        displayName: userCredential.user.displayName || undefined,
        photoUrl: userCredential.user.photoURL || undefined,
      });
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  },

  /**
   * Sign up with Name, Email & Password via Firebase Auth
   */
  async signupWithEmail(name, email, password) {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        'Firebase is not configured. Please add your EXPO_PUBLIC_FIREBASE_* keys to the .env file.'
      );
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      // Attach displayName to Firebase user profile
      if (name.trim()) {
        try {
          await updateFirebaseProfile(userCredential.user, {
            displayName: name.trim(),
          });
        } catch (_) {}
      }

      const idToken = await userCredential.user.getIdToken();
      const syncResult = await this.syncUser(idToken, {
        displayName: name.trim(),
      });

      // Newly registered users must complete onboarding
      return {
        ...syncResult,
        isOnboarded: false,
      };
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  },

  /**
   * Authenticate with Google ID Token via Firebase Auth
   * @param {string} googleIdToken Google OAuth ID Token
   * @param {string} [accessToken] Optional Google Access Token
   */
  async signInWithGoogleCredential(googleIdToken, accessToken = null) {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        'Firebase is not configured. Please add your EXPO_PUBLIC_FIREBASE_* keys to the .env file.'
      );
    }

    try {
      const credential = GoogleAuthProvider.credential(googleIdToken, accessToken);
      const userCredential = await signInWithCredential(auth, credential);
      const idToken = await userCredential.user.getIdToken();

      return await this.syncUser(idToken, {
        displayName: userCredential.user.displayName || undefined,
        photoUrl: userCredential.user.photoURL || undefined,
      });
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  },

  /**
   * Development Quick Login (bypasses Firebase during testing)
   */
  async devLogin() {
    return this.syncUser('dev-token');
  },

  /**
   * Check if onboarding has been completed locally or via profile
   */
  async getOnboardedStatus() {
    try {
      const stored = await AsyncStorage.getItem(ONBOARDED_KEY);
      return stored === 'true';
    } catch (_) {
      return false;
    }
  },

  /**
   * Mark onboarding as complete
   */
  async setOnboardedStatus(status = true) {
    try {
      if (status) {
        await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
      } else {
        await AsyncStorage.removeItem(ONBOARDED_KEY);
      }
      emitDbUpdate();
    } catch (_) {}
  },

  /**
   * Get currently authenticated user details from server
   */
  async getCurrentUser() {
    return api.get('/users/me');
  },

  /**
   * Get cached local user
   */
  async getLocalUser() {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (_) {
      return null;
    }
  },

  /**
   * Save or update local cached user
   */
  async saveLocalUser(user) {
    if (!user) {
      await AsyncStorage.removeItem(USER_KEY);
    } else {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    emitDbUpdate();
  },

  /**
   * Sign out and clear all stored session tokens and profile
   */
  async logout() {
    try {
      if (auth) {
        await firebaseSignOut(auth).catch(() => {});
      }
    } catch (_) {}
    await clearAuthData();
    emitDbUpdate();
  },

  getStoredToken,
  setStoredToken,
};
