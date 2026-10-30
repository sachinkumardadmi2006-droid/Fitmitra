import React, { useState, useRef, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Dumbbell, MailCheck } from 'lucide-react-native';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../theme/ThemeContext';
import { spacing, radius } from '../../theme/tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OtpVerification() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useAppTheme();
  const { user, profile, refreshProfile, logout, syncSession } = useAuth();

  const rawEmail = (params.email || user?.email || 'user@example.com').toString();

  const maskEmail = (emailStr) => {
    if (!emailStr || !emailStr.includes('@')) return '*****@fitmitra.com';
    const [local, domain] = emailStr.split('@');
    if (local.length <= 3) return `*****@${domain}`;
    return `${local.substring(0, 2)}*****${local.substring(local.length - 2)}@${domain}`;
  };

  const maskedEmail = maskEmail(rawEmail);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [initialSending, setInitialSending] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const inputRefs = useRef([]);
  const hasAutoSentRef = useRef(false);

  // Automatically dispatch verification email on initial arrival if not verified
  useEffect(() => {
    if (hasAutoSentRef.current) return;
    hasAutoSentRef.current = true;

    let isMounted = true;
    const sendInitialCode = async () => {
      // Must have stored access token and user
      const token = await authService.getStoredToken();
      if (!token || !user || user?.emailVerified) return;

      try {
        setInitialSending(true);
        setError('');
        await authService.sendVerificationEmail();
        if (isMounted) {
          setResendCooldown(60);
          setInfoMessage(`Verification code sent to ${rawEmail}`);
        }
      } catch (err) {
        const msg = err?.message || '';
        // If 401 or unauthorized (e.g. user logged out or session expired), ignore silently
        if (err?.status === 401 || /unauthorized|authorization/i.test(msg)) {
          return;
        }
        if (/wait|rate limit|too many/i.test(msg)) {
          if (isMounted) {
            setResendCooldown(60);
            setInfoMessage(`A verification code was recently sent to ${rawEmail}`);
          }
        } else {
          if (isMounted) {
            setError(msg || 'Failed to send verification code. Please tap Resend.');
          }
        }
      } finally {
        if (isMounted) {
          setInitialSending(false);
        }
      }
    };

    sendInitialCode();
    return () => {
      isMounted = false;
    };
  }, [rawEmail, user, user?.emailVerified]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);

  const handleVerify = async (manualCode) => {
    const code = (typeof manualCode === 'string' ? manualCode : otp.join('')).trim();
    if (code.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (loading) return;

    setError('');
    setLoading(true);
    try {
      const verifyRes = await authService.verifyEmail(code);
      const updatedProfile = await refreshProfile?.();
      const local = await authService.getLocalUser();
      const userOnboarded = Boolean(
        local?.isOnboarded ||
        updatedProfile?.selectedWorkoutPlan ||
        user?.isOnboarded
      );

      if (syncSession) {
        await syncSession(
          verifyRes?.user || { ...user, emailVerified: true },
          updatedProfile || profile,
          userOnboarded
        );
      }

      // Direct immediate navigation to tabs or onboarding
      if (userOnboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/onboarding');
      }
    } catch (err) {
      setError(err?.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto focus next input box
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify as soon as the 6th digit is typed
    if (text && index === 5) {
      const fullCode = newOtp.join('');
      if (fullCode.length === 6 && !loading) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending || initialSending) return;
    setResending(true);
    setError('');
    setInfoMessage('');
    try {
      await authService.sendVerificationEmail();
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setInfoMessage(`Fresh verification code sent to ${rawEmail}`);
      Alert.alert('Code Sent', `A fresh 6-digit verification code has been sent to ${rawEmail}.`);
    } catch (err) {
      setError(err?.message || 'Failed to resend verification email. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleSwitchAccount = async () => {
    try {
      hasAutoSentRef.current = true;
      await logout?.();
      router.replace('/(auth)/login');
    } catch (_) {
      router.replace('/(auth)/login');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
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
          <View style={[styles.topVignette, { backgroundColor: theme.colors.backdrop }]} />
          <View style={[styles.bottomVignette, { backgroundColor: theme.colors.backdrop }]} />

          <SafeAreaView style={styles.safeHeader}>
            <View style={styles.headerRow}>
              <Pressable
                style={[
                  styles.backBtn,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.outlineVariant,
                    borderWidth: 1,
                  },
                ]}
                onPress={handleBack}
                hitSlop={10}
              >
                <ArrowLeft size={18} color={theme.colors.onSurface} />
              </Pressable>

              <View
                style={[
                  styles.brandRow,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.outlineVariant,
                    borderWidth: 1,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 6,
                    borderRadius: radius.pill,
                  },
                ]}
              >
                <Dumbbell size={18} color={theme.custom.primaryStrong} />
                <Text style={[styles.brandText, { color: theme.colors.onSurface }]}>
                  fit<Text style={{ color: theme.custom.primaryStrong }}>mitra</Text>
                </Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </ImageBackground>

        {/* Bottom Sheet Card Container */}
        <View
          style={[
            styles.bottomCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
              borderWidth: 1,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTag,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Email Verification
          </Text>

          <Text
            style={[
              styles.cardTitle,
              { color: theme.colors.onSurface },
            ]}
          >
            Enter the 6-digit verification code sent to{' '}
            <Text style={{ fontWeight: '800' }}>{maskedEmail}</Text>
          </Text>

          {/* Initial Sending / Success Banner */}
          {initialSending ? (
            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: spacing.sm }} />
              <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
                Sending verification code to your email...
              </Text>
            </View>
          ) : infoMessage && !error ? (
            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: theme.colors.primaryContainer,
                  borderColor: theme.colors.primary,
                },
              ]}
            >
              <MailCheck size={16} color={theme.colors.onPrimaryContainer} style={{ marginRight: spacing.sm }} />
              <Text style={[styles.infoText, { color: theme.colors.onPrimaryContainer, flex: 1 }]}>
                {infoMessage}
              </Text>
            </View>
          ) : null}

          {error ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: theme.colors.errorContainer,
                  borderColor: theme.colors.error,
                },
              ]}
            >
              <Text
                style={[
                  styles.errorText,
                  { color: theme.colors.onErrorContainer },
                ]}
              >
                {error}
              </Text>
            </View>
          ) : null}

          {/* 6 Individual Digit Input Boxes side-by-side with auto focus */}
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  {
                    backgroundColor: digit
                      ? theme.colors.primaryContainer
                      : theme.colors.surfaceVariant,
                    borderColor: digit
                      ? theme.colors.primary
                      : theme.colors.outlineVariant,
                  },
                ]}
              >
                <TextInput
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  style={[
                    styles.otpInput,
                    {
                      color: digit
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurface,
                    },
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  selectTextOnFocus
                />
              </View>
            ))}
          </View>

          {/* Primary Pill Continue Button */}
          <Pressable
            style={[
              styles.primaryBtn,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            ) : (
              <Text
                style={[
                  styles.primaryBtnText,
                  { color: theme.colors.onPrimary },
                ]}
              >
                Continue
              </Text>
            )}
          </Pressable>

          {/* Interactive Resend Code link */}
          <Pressable
            style={styles.resendBtn}
            onPress={handleResend}
            disabled={resending || initialSending || resendCooldown > 0}
          >
            <Text
              style={[
                styles.resendText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {"Didn't receive code? "}
              <Text
                style={{
                  color: resendCooldown > 0 ? theme.colors.outline : theme.custom.primaryStrong,
                  fontWeight: '800',
                }}
              >
                {resending
                  ? 'Sending...'
                  : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend Code'}
              </Text>
            </Text>
          </Pressable>

          {/* Wrong Account / Log Out Option */}
          <Pressable
            style={styles.switchAccountBtn}
            onPress={handleSwitchAccount}
            hitSlop={10}
          >
            <Text style={[styles.switchAccountText, { color: theme.colors.onSurfaceVariant }]}>
              Wrong email address?{' '}
              <Text style={{ color: theme.custom.primaryStrong, fontWeight: '700' }}>
                Log in with another account
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
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
    height: '60%',
  },
  bottomVignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  bottomCard: {
    flex: 1,
    marginTop: -28,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.xl,
    paddingTop: 28,
    paddingBottom: 32,
  },
  cardTag: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: spacing.xl,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpInput: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  primaryBtn: {
    height: 52,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  resendBtn: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
  },
  switchAccountBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  switchAccountText: {
    fontSize: 13,
  },
});
