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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService, formatAuthError } from '../../services/authService';
import { Dumbbell, Mail, Lock, Eye, EyeOff, KeyRound, X, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { AppButton, AppCard } from '../../components/ui';

export default function Login() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Field-specific validation errors
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Forgot Password modal state
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const validateEmail = (val) => {
    if (!val || !val.trim()) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) return 'Please enter a valid email address.';
    return '';
  };

  const validatePassword = (val) => {
    if (!val) return 'Password is required.';
    return '';
  };

  const emailError = emailTouched ? validateEmail(email) : '';
  const passwordError = passwordTouched ? validatePassword(password) : '';

  const handleEmailLogin = async () => {
    setEmailTouched(true);
    setPasswordTouched(true);

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (emailErr || passErr) {
      setError(emailErr || passErr);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await authService.loginWithEmail(email.trim(), password);
      // Route guard in _layout handles destination based on isOnboarded
      if (result?.isOnboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/onboarding');
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDevQuickLogin = async () => {
    if (!__DEV__) return;
    setError('');
    setLoading(true);
    try {
      await authService.devLogin();
      router.replace('/(tabs)');
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setResetError('Please enter a valid email address.');
      return;
    }
    setResetError('');
    setResetLoading(true);
    try {
      await authService.forgotPassword(resetEmail.trim());
      setResetSuccess(true);
    } catch (err) {
      setResetError(formatAuthError(err));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor: theme.colors.primaryContainer,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <Dumbbell size={28} color={theme.custom.primaryStrong || theme.colors.primary} />
          </View>
          <Text style={[styles.brandTitle, { color: theme.colors.onBackground }]}>
            fit<Text style={{ color: theme.custom.primaryStrong || theme.colors.primary }}>mitra</Text>
          </Text>
          <Text style={[styles.brandSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Log in to continue your training and progress
          </Text>
        </View>

        {/* Main Login Card */}
        <AppCard
          variant="elevated"
          style={[styles.loginCard, { backgroundColor: theme.colors.surface }]}
          padded={false}
        >
          <View style={styles.cardPadding}>
            <Text style={[styles.formHeading, { color: theme.colors.onSurface }]}>
              Log In
            </Text>

            {/* Error Banner */}
            {error ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: theme.colors.errorContainer,
                    borderColor: theme.colors.error,
                  },
                ]}
              >
                <Text style={[styles.errorBannerText, { color: theme.colors.onErrorContainer }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
                Email address
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? theme.colors.elevation.level1 : theme.colors.background,
                    borderColor: emailError ? theme.colors.error : theme.colors.outlineVariant,
                  },
                ]}
              >
                <Mail
                  size={18}
                  color={emailError ? theme.colors.error : theme.colors.onSurfaceVariant}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.onSurface }]}
                  placeholder="name@example.com"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (emailTouched) setError('');
                  }}
                  onBlur={() => setEmailTouched(true)}
                  editable={!loading}
                  accessibilityLabel="Email address input"
                />
              </View>
              {emailError ? (
                <Text style={[styles.fieldError, { color: theme.colors.error }]}>
                  {emailError}
                </Text>
              ) : null}
            </View>

            {/* Password Field */}
            <View style={[styles.fieldGroup, { marginTop: 14 }]}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
                  Password
                </Text>
                <Pressable
                  onPress={() => {
                    setResetEmail(email);
                    setResetError('');
                    setResetSuccess(false);
                    setForgotModalVisible(true);
                  }}
                  hitSlop={8}
                >
                  <Text style={[styles.forgotLink, { color: theme.custom.primaryStrong || theme.colors.primary }]}>
                    Forgot?
                  </Text>
                </Pressable>
              </View>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? theme.colors.elevation.level1 : theme.colors.background,
                    borderColor: passwordError ? theme.colors.error : theme.colors.outlineVariant,
                  },
                ]}
              >
                <Lock
                  size={18}
                  color={passwordError ? theme.colors.error : theme.colors.onSurfaceVariant}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.onSurface }]}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (passwordTouched) setError('');
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  editable={!loading}
                  accessibilityLabel="Password input"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={theme.custom.primaryStrong || theme.colors.primary} />
                  ) : (
                    <Eye size={18} color={theme.colors.onSurfaceVariant} />
                  )}
                </Pressable>
              </View>
              {passwordError ? (
                <Text style={[styles.fieldError, { color: theme.colors.error }]}>
                  {passwordError}
                </Text>
              ) : null}
            </View>

            {/* Log In Button */}
            <View style={{ marginTop: 22 }}>
              <AppButton
                label="Log In"
                onPress={handleEmailLogin}
                mode="contained"
                loading={loading}
                disabled={loading}
              />
            </View>

            {/* Development Quick Login (strictly __DEV__ only) */}
            {__DEV__ && (
              <View style={{ marginTop: 12 }}>
                <AppButton
                  label="⚡ Dev Quick Login"
                  onPress={handleDevQuickLogin}
                  mode="outlined"
                  disabled={loading}
                />
              </View>
            )}
          </View>
        </AppCard>

        {/* Footer Navigation to Signup */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
            Don't have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('/signup')} hitSlop={8}>
            <Text
              style={[
                styles.signupLink,
                { color: theme.custom.primaryStrong || theme.colors.primary },
              ]}
            >
              Sign up
            </Text>
          </Pressable>
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
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <KeyRound size={20} color={theme.custom.primaryStrong || theme.colors.primary} />
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                  Reset Password
                </Text>
              </View>
              <Pressable
                onPress={() => setForgotModalVisible(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={theme.colors.onSurfaceVariant} />
              </Pressable>
            </View>

            {resetSuccess ? (
              <View style={styles.modalSuccessBody}>
                <CheckCircle2
                  size={44}
                  color={theme.custom.primaryStrong || theme.colors.primary}
                  style={{ alignSelf: 'center', marginBottom: 12 }}
                />
                <Text style={[styles.successTitle, { color: theme.colors.onSurface }]}>
                  Reset Email Sent!
                </Text>
                <Text style={[styles.successDesc, { color: theme.colors.onSurfaceVariant }]}>
                  We sent password recovery instructions to{' '}
                  <Text style={{ fontWeight: '700', color: theme.colors.onSurface }}>
                    {resetEmail}
                  </Text>
                  . Please check your inbox.
                </Text>
                <View style={{ width: '100%', marginTop: 18 }}>
                  <AppButton
                    label="Back to Log In"
                    onPress={() => {
                      setForgotModalVisible(false);
                    }}
                    mode="contained"
                  />
                </View>
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                <Text style={[styles.modalDesc, { color: theme.colors.onSurfaceVariant }]}>
                  Enter your registered email address to receive password reset instructions.
                </Text>

                {resetError ? (
                  <View
                    style={[
                      styles.errorBanner,
                      {
                        backgroundColor: theme.colors.errorContainer,
                        borderColor: theme.colors.error,
                      },
                    ]}
                  >
                    <Text style={[styles.errorBannerText, { color: theme.colors.onErrorContainer }]}>
                      {resetError}
                    </Text>
                  </View>
                ) : null}

                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? theme.colors.elevation.level1 : theme.colors.background,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <Mail size={18} color={theme.colors.onSurfaceVariant} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.onSurface }]}
                    placeholder="name@example.com"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={resetEmail}
                    onChangeText={(val) => {
                      setResetEmail(val);
                      setResetError('');
                    }}
                    editable={!resetLoading}
                  />
                </View>

                <View style={{ marginTop: 6 }}>
                  <AppButton
                    label="Send Reset Instructions"
                    onPress={handleSendPasswordReset}
                    mode="contained"
                    loading={resetLoading}
                    disabled={resetLoading}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  loginCard: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  cardPadding: {
    padding: 24,
  },
  formHeading: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  fieldError: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginLeft: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  modalSuccessBody: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  successDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
