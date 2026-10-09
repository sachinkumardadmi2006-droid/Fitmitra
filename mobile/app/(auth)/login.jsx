import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Mail, Lock, Dumbbell, ArrowRight, AlertTriangle } from 'lucide-react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { authService } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, BorderRadius } from '../../constants/theme';

// Complete any pending browser auth redirect session
WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  const androidClientId = isExpoGo
    ? (process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID)
    : process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  // Google OAuth Hook via expo-auth-session
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  // Handle Google OAuth callback response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token, access_token } = response.params || {};
      const googleIdToken = id_token || response.authentication?.idToken;
      const accessToken = access_token || response.authentication?.accessToken;

      if (googleIdToken) {
        handleGoogleAuthSuccess(googleIdToken, accessToken);
      } else {
        setError('No ID token received from Google.');
        setLoading(false);
      }
    } else if (response?.type === 'error') {
      setError(response.error?.message || 'Google Sign-In failed.');
      setLoading(false);
    } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setLoading(false);
    }
  }, [response]);

  const handleGoogleAuthSuccess = async (googleIdToken, accessToken) => {
    setLoading(true);
    setError('');
    try {
      const result = await authService.signInWithGoogleCredential(googleIdToken, accessToken);
      if (result.isOnboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/onboarding');
      }
    } catch (err) {
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    if (!authService.isConfigured()) {
      setError(
        'Firebase is not configured. Please add your EXPO_PUBLIC_FIREBASE_* keys to your .env file, or use Quick Dev Login below.'
      );
      return;
    }

    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID && !process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) {
      setError(
        'Google Client IDs are missing in .env. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID / EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID.'
      );
      return;
    }

    if (!request) {
      setError('Google Sign-In is initializing. Please try again in a moment.');
      return;
    }

    setLoading(true);
    try {
      await promptAsync();
    } catch (err) {
      setError(err.message || 'Failed to launch Google Sign-In.');
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await authService.loginWithEmail(email.trim(), password);
      if (result.isOnboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/onboarding');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevQuickLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await authService.devLogin();
      router.replace('/(tabs)');
    } catch (err) {
      setError(err.message || 'Dev login failed.');
    } finally {
      setLoading(false);
    }
  };

  const isConfigured = authService.isConfigured();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgBase }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Hero */}
        <View style={styles.brandHero}>
          <View style={[styles.brandIconWrap, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '33' }]}>
            <Dumbbell size={32} color={colors.primary} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
            FIT<Text style={{ color: colors.primary }}>MITRA</Text>
          </Text>
          <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
            Welcome back! Sign in to continue your transformation.
          </Text>
        </View>

        {/* Missing Keys Notice in Development */}
        {__DEV__ && !isConfigured && (
          <View style={[styles.configNotice, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '40' }]}>
            <AlertTriangle size={18} color={colors.warning || '#f59e0b'} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.configNoticeTitle, { color: colors.warning || '#f59e0b' }]}>
                Firebase Keys Pending in .env
              </Text>
              <Text style={[styles.configNoticeText, { color: colors.textSecondary }]}>
                Add your Firebase & Google OAuth credentials to .env to enable production authentication. Use Quick Dev Login below for testing.
              </Text>
            </View>
          </View>
        )}

        {/* Auth Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.error + '18', borderColor: colors.error + '44' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          {/* Google Sign-In Button */}
          <Pressable
            style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF' }]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <Path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.33 24 12 24z"/>
                  <Path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                  <Path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </Svg>
                <Text style={[styles.googleBtnText, { color: colors.textPrimary }]}>
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>
              OR CONTINUE WITH EMAIL
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
            <View style={[styles.inputField, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="athlete@fitmitra.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={[styles.inputGroup, { marginTop: 14 }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Password</Text>
            <View style={[styles.inputField, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
            </View>
          </View>

          {/* Login Submit Button */}
          <Pressable
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleEmailLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.submitBtnText}>Sign In</Text>
                <ArrowRight size={18} color="#000" />
              </View>
            )}
          </Pressable>

          {/* Development-Only Quick Login (Gated via __DEV__) */}
          {__DEV__ && (
            <View style={styles.devSection}>
              <View style={[styles.devDivider, { backgroundColor: colors.borderLight }]} />
              <Pressable
                style={[styles.devBtn, { borderColor: colors.primary + '55', backgroundColor: colors.primary + '10' }]}
                onPress={handleDevQuickLogin}
                disabled={loading}
              >
                <Text style={[styles.devBtnText, { color: colors.primary }]}>
                  ⚡ Quick Dev Mode Login (__DEV__ only)
                </Text>
              </Pressable>
            </View>
          )}

          {/* Footer Link to Signup */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/signup')} disabled={loading}>
              <Text style={[styles.linkText, { color: colors.primary }]}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 36,
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandIconWrap: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 280,
  },
  configNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: 16,
  },
  configNoticeTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    marginBottom: 2,
  },
  configNoticeText: {
    fontSize: 11,
    lineHeight: 16,
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 24,
  },
  errorBox: {
    padding: 12,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  googleBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: FontSize.md,
    height: '100%',
  },
  submitBtn: {
    height: 50,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: '#000',
  },
  devSection: {
    marginTop: 18,
  },
  devDivider: {
    height: 1,
    marginBottom: 14,
  },
  devBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  devBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  footerText: {
    fontSize: FontSize.sm,
  },
  linkText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
});
