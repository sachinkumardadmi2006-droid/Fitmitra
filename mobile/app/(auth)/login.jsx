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
  ImageBackground,
  Dimensions,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Dumbbell, Mail, Lock, Eye, EyeOff, KeyRound, X, CheckCircle2 } from 'lucide-react-native';
import { syncAuth } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, BorderRadius } from '../../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
      style={{ flex: 1, backgroundColor: '#000000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Header Image Area with gym_hero background */}
        <ImageBackground
          source={require('../../assets/gym_hero.jpg')}
          style={styles.heroBackground}
          resizeMode="cover"
        >
          <View style={styles.topVignette} />
          <View style={styles.bottomVignette} />

          <SafeAreaView style={styles.safeHeader}>
            <View style={styles.headerRow}>
              {/* Circular Back Button */}
              <Pressable
                style={styles.backBtn}
                onPress={() => router.back()}
                hitSlop={10}
              >
                <ArrowLeft size={18} color="#FFFFFF" />
              </Pressable>

              {/* Brand Logo */}
              <View style={styles.brandRow}>
                <Dumbbell size={18} color="#B7FF00" />
                <Text style={styles.brandText}>
                  fit<Text style={{ color: '#B7FF00' }}>mitra</Text>
                </Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </ImageBackground>

        {/* Bottom Sheet Modal Card Overlay */}
        <View style={[styles.bottomCard, { backgroundColor: isDark ? '#10131A' : '#FFFFFF' }]}>
          <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111111' }]}>
            Log in to account
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email input field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? '#A8AFBA' : '#4B5563' }]}>
              Email address
            </Text>
            <View
              style={[
                styles.inputField,
                {
                  backgroundColor: isDark ? '#171B24' : '#F9FAFB',
                  borderColor: isDark ? '#252B36' : '#E5E7EB',
                },
              ]}
            >
              <Mail size={18} color={isDark ? '#6F7783' : '#9CA3AF'} style={styles.fieldIcon} />
              <TextInput
                style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#111111' }]}
                placeholder="alexsmith.mobbin@gmail.com"
                placeholderTextColor={isDark ? '#6F7783' : '#9CA3AF'}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password input field */}
          <View style={[styles.inputGroup, { marginTop: 14 }]}>
            <Text style={[styles.inputLabel, { color: isDark ? '#A8AFBA' : '#4B5563' }]}>
              Password
            </Text>
            <View
              style={[
                styles.inputField,
                {
                  backgroundColor: isDark ? '#171B24' : '#F9FAFB',
                  borderColor: isDark ? '#252B36' : '#E5E7EB',
                },
              ]}
            >
              <Lock size={18} color={isDark ? '#6F7783' : '#9CA3AF'} style={styles.fieldIcon} />
              <TextInput
                style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#111111' }]}
                placeholder="••••••••"
                placeholderTextColor={isDark ? '#6F7783' : '#9CA3AF'}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? (
                  <EyeOff size={18} color={colors.primary} />
                ) : (
                  <Eye size={18} color={isDark ? '#6F7783' : '#9CA3AF'} />
                )}
              </Pressable>
            </View>
          </View>

          {/* Black Pill Continue Button */}
          <Pressable
            style={[
              styles.primaryBtn,
              { backgroundColor: isDark ? '#B7FF00' : '#111111' },
            ]}
            onPress={handleEmailLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={isDark ? '#000000' : '#FFFFFF'} />
            ) : (
              <Text
                style={[
                  styles.primaryBtnText,
                  { color: isDark ? '#000000' : '#FFFFFF' },
                ]}
              >
                Continue
              </Text>
            )}
          </Pressable>

          {/* Forgot password */}
          <Pressable
            style={styles.forgotBtn}
            onPress={() => {
              setResetEmail(email);
              setResetSuccess(false);
              setForgotModalVisible(true);
            }}
          >
            <Text style={[styles.forgotText, { color: isDark ? '#A8AFBA' : '#6B7280' }]}>
              Forgot password?
            </Text>
          </Pressable>

          {/* OR Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? '#252B36' : '#E5E7EB' }]} />
            <Text style={[styles.dividerText, { color: isDark ? '#6F7783' : '#9CA3AF' }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? '#252B36' : '#E5E7EB' }]} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialCol}>
            {/* Google */}
            <Pressable
              style={[
                styles.socialBtn,
                {
                  backgroundColor: isDark ? '#171B24' : '#FFFFFF',
                  borderColor: isDark ? '#252B36' : '#E5E7EB',
                },
              ]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <Path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.33 24 12 24z"/>
                <Path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                <Path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </Svg>
              <Text style={[styles.socialBtnText, { color: isDark ? '#FFFFFF' : '#111111' }]}>
                Continue with Google
              </Text>
            </Pressable>

            {/* Apple / Dev Quick Login */}
            <Pressable
              style={[
                styles.socialBtn,
                {
                  backgroundColor: isDark ? '#171B24' : '#FFFFFF',
                  borderColor: isDark ? '#252B36' : '#E5E7EB',
                },
              ]}
              onPress={handleDevQuickLogin}
              disabled={loading}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path
                  fill={isDark ? '#FFFFFF' : '#000000'}
                  d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.97.99-3.12-1 .04-2.2.67-2.91 1.5-.63.73-1.18 1.91-1.03 3.04 1.12.09 2.26-.59 2.95-1.42z"
                />
              </Svg>
              <Text style={[styles.socialBtnText, { color: isDark ? '#FFFFFF' : '#111111' }]}>
                Continue with Apple
              </Text>
            </Pressable>
          </View>

          {/* Footer prompt */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: isDark ? '#A8AFBA' : '#6B7280' }]}>
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/signup')}>
              <Text style={[styles.signupLink, { color: isDark ? '#B7FF00' : '#111111' }]}>
                Sign up
              </Text>
            </Pressable>
          </View>
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
              styles.modalContent,
              { backgroundColor: isDark ? '#10131A' : '#FFFFFF' },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <KeyRound size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111111' }]}>
                  Reset Password
                </Text>
              </View>
              <Pressable onPress={() => setForgotModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={isDark ? '#6F7783' : '#9CA3AF'} />
              </Pressable>
            </View>

            {resetSuccess ? (
              <View style={styles.modalSuccessBody}>
                <CheckCircle2 size={44} color={colors.primary} style={{ alignSelf: 'center', marginBottom: 12 }} />
                <Text style={[styles.successTitle, { color: isDark ? '#FFFFFF' : '#111111' }]}>
                  Reset Link Sent!
                </Text>
                <Text style={[styles.successDesc, { color: isDark ? '#A8AFBA' : '#4B5563' }]}>
                  We emailed instructions to{' '}
                  <Text style={{ color: isDark ? '#B7FF00' : '#111111', fontWeight: '700' }}>
                    {resetEmail}
                  </Text>
                  . Check your inbox to set a new password.
                </Text>
                <Pressable
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: isDark ? '#B7FF00' : '#111111', marginTop: 16 },
                  ]}
                  onPress={() => {
                    setForgotModalVisible(false);
                    router.push('/otp');
                  }}
                >
                  <Text
                    style={[
                      styles.primaryBtnText,
                      { color: isDark ? '#000000' : '#FFFFFF' },
                    ]}
                  >
                    Enter 6-Digit Code
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <Text style={[styles.modalDesc, { color: isDark ? '#A8AFBA' : '#4B5563' }]}>
                  Enter your email address below to receive password recovery instructions.
                </Text>
                <View
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: isDark ? '#171B24' : '#F9FAFB',
                      borderColor: isDark ? '#252B36' : '#E5E7EB',
                    },
                  ]}
                >
                  <Mail size={18} color={isDark ? '#6F7783' : '#9CA3AF'} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#111111' }]}
                    placeholder="alexsmith.mobbin@gmail.com"
                    placeholderTextColor={isDark ? '#6F7783' : '#9CA3AF'}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={resetEmail}
                    onChangeText={setResetEmail}
                  />
                </View>
                <Pressable
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: isDark ? '#B7FF00' : '#111111', marginTop: 8 },
                  ]}
                  onPress={handleSendPasswordReset}
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <ActivityIndicator size="small" color={isDark ? '#000000' : '#FFFFFF'} />
                  ) : (
                    <Text
                      style={[
                        styles.primaryBtnText,
                        { color: isDark ? '#000000' : '#FFFFFF' },
                      ]}
                    >
                      Send Reset Link
                    </Text>
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
  heroBackground: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.32,
    justifyContent: 'space-between',
  },
  topVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    height: '60%',
  },
  bottomVignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  safeHeader: {
    paddingTop: 36,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  bottomCard: {
    flex: 1,
    marginTop: -28,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  errorBox: {
    padding: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 92, 105, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 105, 0.3)',
    marginBottom: 16,
  },
  errorText: {
    color: '#FF5C69',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  fieldIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  forgotBtn: {
    alignSelf: 'center',
    marginTop: 14,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  socialCol: {
    gap: 12,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 50,
    borderRadius: 26,
    borderWidth: 1,
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: '700',
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
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
    fontSize: 14,
    lineHeight: 20,
  },
  modalSuccessBody: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

