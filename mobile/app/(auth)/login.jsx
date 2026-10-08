import React, { useState } from 'react';
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
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mail, Lock, Dumbbell, ArrowRight, Eye, EyeOff, KeyRound, X, CheckCircle2 } from 'lucide-react-native';
import { syncAuth } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, BorderRadius } from '../../constants/theme';

export default function Login() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password modal state
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await syncAuth('dev-token');
      if (result?.user) {
        await AsyncStorage.setItem('fitmitra_user', JSON.stringify(result.user));
      }
      router.replace('/(tabs)');
    } catch (err) {
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
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
      const result = await syncAuth('dev-token', { email: email.trim().toLowerCase() });
      if (result?.user) {
        await AsyncStorage.setItem('fitmitra_user', JSON.stringify(result.user));
      }
      router.replace('/(tabs)');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevQuickLogin = async () => {
    setLoading(true);
    try {
      const result = await syncAuth('dev-token');
      if (result?.user) {
        await AsyncStorage.setItem('fitmitra_user', JSON.stringify(result.user));
      }
      router.replace('/(tabs)');
    } catch (err) {
      setError(err.message || 'Dev login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasswordReset = () => {
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      return;
    }
    setResetLoading(true);
    setTimeout(() => {
      setResetLoading(false);
      setResetSuccess(true);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgBase }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header / Logo Section */}
        <View style={styles.topHeader}>
          <View style={[styles.logoIconWrap, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
            <Dumbbell size={24} color={colors.primary} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
            FIT<Text style={{ color: colors.primary }}>MITRA</Text>
          </Text>
        </View>

        {/* 2. Gym Photo Hero Section with Motivational Text */}
        <View style={[styles.gymPhotoCard, { borderColor: colors.border }]}>
          <Image
            source={require('../../assets/gym_hero.jpg')}
            style={styles.gymPhoto}
            resizeMode="cover"
          />
          <View style={styles.gymPhotoOverlay}>
            <Text style={styles.heroTaglineMain}>Train. Transform.</Text>
            <Text style={[styles.heroTaglineSub, { color: colors.primary }]}>Become Stronger.</Text>
          </View>
        </View>

        {/* 3. Auth Form Card Container */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardHeading, { color: colors.textPrimary }]}>
            Welcome back <Text style={{ color: colors.primary }}>👋</Text>
          </Text>
          <Text style={[styles.cardSubheading, { color: colors.textSecondary }]}>
            Sign in to access your workout plans and progress
          </Text>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.error + '18', borderColor: colors.error + '44' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
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
              />
            </View>
          </View>

          {/* Password Input with Visibility Toggle */}
          <View style={[styles.inputGroup, { marginTop: 14 }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Password</Text>
            <View style={[styles.inputField, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={8}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.primary} />
                ) : (
                  <Eye size={18} color={colors.textMuted} />
                )}
              </Pressable>
            </View>
          </View>

          {/* Login Primary Button */}
          <Pressable
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            onPress={handleEmailLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.loginBtnText}>Login</Text>
                <ArrowRight size={18} color="#000" />
              </View>
            )}
          </Pressable>

          {/* Forgot Password Link */}
          <Pressable
            style={styles.forgotBtn}
            onPress={() => {
              setResetEmail(email);
              setResetSuccess(false);
              setForgotModalVisible(true);
            }}
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
          </Pressable>

          {/* OR Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>
              ─── OR ───
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Google Login Button */}
          <Pressable
            style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF' }]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <Path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.33 24 12 24z"/>
              <Path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
              <Path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </Svg>
            <Text style={[styles.googleBtnText, { color: colors.textPrimary }]}>
              Google Login
            </Text>
          </Pressable>

          {/* Create Account Link */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/signup')}>
              <Text style={[styles.createAccountText, { color: colors.primary }]}>Create Account</Text>
            </Pressable>
          </View>

          {/* Development Quick Login (__DEV__ only) */}
          {__DEV__ && (
            <View style={styles.devSection}>
              <View style={[styles.devDivider, { backgroundColor: colors.borderLight }]} />
              <Pressable
                style={[styles.devBtn, { borderColor: colors.primary + '55', backgroundColor: colors.primary + '10' }]}
                onPress={handleDevQuickLogin}
              >
                <Text style={[styles.devBtnText, { color: colors.primary }]}>
                  ⚡ Quick Dev Mode Login (__DEV__ only)
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={forgotModalVisible}
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <KeyRound size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Reset Password</Text>
              </View>
              <Pressable onPress={() => setForgotModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {resetSuccess ? (
              <View style={styles.modalSuccessBody}>
                <CheckCircle2 size={44} color={colors.primary} style={{ alignSelf: 'center', marginBottom: 12 }} />
                <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Reset Link Sent!</Text>
                <Text style={[styles.successDesc, { color: colors.textSecondary }]}>
                  We emailed instructions to <Text style={{ color: colors.primary, fontWeight: '700' }}>{resetEmail}</Text>. Check your inbox to set a new password.
                </Text>
                <Pressable
                  style={[styles.modalPrimaryBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setForgotModalVisible(false)}
                >
                  <Text style={styles.modalPrimaryBtnText}>Back to Login</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
                  Enter your email address below to receive password recovery instructions.
                </Text>
                <View style={[styles.inputField, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, marginTop: 14 }]}>
                  <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="athlete@fitmitra.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={resetEmail}
                    onChangeText={setResetEmail}
                  />
                </View>
                <Pressable
                  style={[styles.modalPrimaryBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
                  onPress={handleSendPasswordReset}
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.modalPrimaryBtnText}>Send Reset Link</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 36,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  logoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  gymPhotoCard: {
    height: 190,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 20,
    position: 'relative',
    backgroundColor: '#10131A',
  },
  gymPhoto: {
    width: '100%',
    height: '100%',
  },
  gymPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 10, 15, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  heroTaglineMain: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroTaglineSub: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 22,
  },
  cardHeading: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  cardSubheading: {
    fontSize: FontSize.sm,
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 18,
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
  eyeBtn: {
    padding: 6,
  },
  loginBtn: {
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
  loginBtnText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: '#000',
  },
  forgotBtn: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 50,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  googleBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: FontSize.sm,
  },
  createAccountText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
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

  /* Modal Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    gap: 10,
  },
  modalDesc: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  modalPrimaryBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: '#000',
  },
  modalSuccessBody: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
});

