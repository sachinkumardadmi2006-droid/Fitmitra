import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, ArrowRight, X, ShieldCheck, RefreshCw, ExternalLink } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../theme/ThemeContext';
import { authService } from '../../services/authService';

export default function EmailVerificationBanner({ style }) {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  const [isDismissed, setIsDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpError, setOtpError] = useState('');

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first input when modal opens
  useEffect(() => {
    if (showOtpModal) {
      setTimeout(() => {
        inputRefs[0]?.current?.focus();
      }, 300);
    }
  }, [showOtpModal]);

  // If not authenticated or dismissed for this session, hide
  if (!user || isDismissed) {
    return null;
  }

  // Check if email already verified
  const isVerified = Boolean(user.emailVerified || profile?.emailVerified);
  if (isVerified) {
    return null;
  }

  // Email verification is required ONLY when auth provider is password.
  // If user signed up/in with Google, there is NO need to verify email.
  const isGoogle = Boolean(
    user.authProviders?.includes('GOOGLE') || user.authProvider === 'GOOGLE'
  );
  const isPassword = Boolean(
    user.authProviders?.includes('PASSWORD') || (!isGoogle && user.authProvider !== 'GOOGLE')
  );

  if (isGoogle || !isPassword) {
    return null;
  }

  const handleVerifyNow = async () => {
    setSending(true);
    setOtpError('');
    try {
      await authService.sendVerificationEmail();
      setResendCooldown(60);
      setShowOtpModal(true);
    } catch (err) {
      // If rate limited or sent already, still open OTP modal so user can enter the code they received
      if (/rate limit|too many/i.test(err?.message || '')) {
        setShowOtpModal(true);
      } else {
        Alert.alert(
          'Verification Email',
          err?.message || 'Failed to send verification code. Please try again.',
          [
            {
              text: 'Enter Code Anyway',
              onPress: () => setShowOtpModal(true),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } finally {
      setSending(false);
    }
  };

  const handleOtpChange = (val, idx) => {
    setOtpError('');

    // Handle full pasted 6-digit code
    if (val.length > 1) {
      const sanitized = val.replace(/\D/g, '').slice(0, 6);
      if (sanitized.length === 6) {
        const chars = sanitized.split('');
        setOtp(chars);
        inputRefs[5]?.current?.focus();
        return;
      }
    }

    const singleDigit = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[idx] = singleDigit;
    setOtp(newOtp);

    if (singleDigit && idx < 5) {
      inputRefs[idx + 1]?.current?.focus();
    }
  };

  const handleKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs[idx - 1]?.current?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }

    setOtpError('');
    setOtpLoading(true);

    try {
      await authService.verifyEmail(code);
      await refreshProfile?.();
      setShowOtpModal(false);
      Alert.alert('Email Verified! 🎉', 'Your email address has been successfully verified.');
    } catch (err) {
      setOtpError(err?.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setOtpError('');
    try {
      await authService.sendVerificationEmail();
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs[0]?.current?.focus();
      Alert.alert('Code Sent', `A fresh 6-digit verification code has been sent to ${user.email}.`);
    } catch (err) {
      setOtpError(err?.message || 'Failed to resend verification email. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  const handleOpenFullscreen = () => {
    setShowOtpModal(false);
    router.push({
      pathname: '/(auth)/otp',
      params: { email: user.email },
    });
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.secondaryContainer,
            borderColor: colors.secondary,
          },
          style,
        ]}
      >
        <View style={styles.topRow}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: custom?.primaryStrong || colors.primary },
            ]}
          >
            <Mail size={16} color={colors.onPrimary} />
          </View>

          <View style={styles.textCol}>
            <Text
              style={[
                styles.title,
                { color: colors.onSecondaryContainer || colors.onSurface },
              ]}
            >
              Verify your email address
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: colors.onSurfaceVariant },
              ]}
              numberOfLines={2}
            >
              Confirm {user.email || 'your email'} to secure your account and receive summaries.
            </Text>
          </View>

          <Pressable
            hitSlop={10}
            onPress={() => setIsDismissed(true)}
            style={styles.dismissBtn}
            accessibilityLabel="Dismiss email verification notice"
          >
            <X size={16} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={handleVerifyNow}
            disabled={sending}
            style={[
              styles.verifyBtn,
              { backgroundColor: custom?.primaryStrong || colors.primary },
            ]}
            accessibilityLabel="Verify email address now"
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <>
                <Text style={[styles.verifyBtnText, { color: colors.onPrimary }]}>
                  Verify Now
                </Text>
                <ArrowRight size={14} color={colors.onPrimary} />
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* In-App OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIconBox,
                  { backgroundColor: custom?.primaryStrong || colors.primary },
                ]}
              >
                <ShieldCheck size={20} color={colors.onPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                  Enter Verification Code
                </Text>
                <Text style={[styles.modalSub, { color: colors.onSurfaceVariant }]}>
                  Code sent to {user.email}
                </Text>
              </View>
              <Pressable
                hitSlop={10}
                onPress={() => setShowOtpModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            {/* OTP Input Boxes */}
            <View style={styles.otpRow}>
              {otp.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={inputRefs[idx]}
                  style={[
                    styles.otpBox,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: digit
                        ? custom?.primaryStrong || colors.primary
                        : colors.outlineVariant,
                      color: colors.onSurface,
                    },
                  ]}
                  value={digit}
                  onChangeText={(val) => handleOtpChange(val, idx)}
                  onKeyPress={(e) => handleKeyPress(e, idx)}
                  keyboardType="number-pad"
                  maxLength={6}
                  selectTextOnFocus
                  textAlign="center"
                />
              ))}
            </View>

            {/* Error Message */}
            {otpError ? (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {otpError}
              </Text>
            ) : null}

            {/* Verify Button */}
            <Pressable
              style={[
                styles.modalVerifyBtn,
                {
                  backgroundColor: custom?.primaryStrong || colors.primary,
                  opacity: otp.join('').length === 6 ? 1 : 0.6,
                },
              ]}
              onPress={handleVerifyOtp}
              disabled={otpLoading || otp.join('').length < 6}
            >
              {otpLoading ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={[styles.modalVerifyText, { color: colors.onPrimary }]}>
                  Verify Email
                </Text>
              )}
            </Pressable>

            {/* Resend and Fullscreen Actions */}
            <View style={styles.modalFooter}>
              <Pressable
                onPress={handleResend}
                disabled={resendCooldown > 0 || resending}
                style={styles.resendBtn}
              >
                {resending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text
                    style={[
                      styles.resendText,
                      {
                        color:
                          resendCooldown > 0
                            ? colors.onSurfaceVariant
                            : custom?.primaryStrong || colors.primary,
                      },
                    ]}
                  >
                    {resendCooldown > 0
                      ? `Resend Code in ${resendCooldown}s`
                      : 'Resend Code'}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={handleOpenFullscreen}
                style={styles.fullscreenLink}
              >
                <Text style={[styles.fullscreenText, { color: colors.onSurfaceVariant }]}>
                  Open Fullscreen
                </Text>
                <ExternalLink size={12} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  textCol: {
    flex: 1,
    marginRight: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  dismissBtn: {
    padding: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  verifyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalSub: {
    fontSize: 12,
  },
  modalCloseBtn: {
    padding: 4,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    fontSize: 20,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalVerifyBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalVerifyText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  resendBtn: {
    paddingVertical: 4,
  },
  resendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fullscreenLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  fullscreenText: {
    fontSize: 12,
  },
});
