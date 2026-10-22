import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { authService } from '../../services/authService';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  AuthHero,
  OtpInput,
  GradientButton,
  authSizes,
  authTypography,
} from '../../components/auth';

export default function ResetOtp() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useAppTheme();

  const rawEmail = params.email ? String(params.email).trim().toLowerCase() : '';

  useEffect(() => {
    if (!rawEmail) {
      router.replace('/forgot-password');
    }
  }, [rawEmail, router]);

  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [countdown, setCountdown] = useState(60);

  // 60-second countdown interval with cleanup
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const formatTimer = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleVerify = useCallback(
    async (codeToVerify) => {
      const code = codeToVerify || otpCode;
      if (!code || code.length < 6 || loading) return;

      setError('');
      setInfoMessage('');
      setLoading(true);

      try {
        const resetToken = await authService.verifyResetOtp(rawEmail, code);
        router.push({
          pathname: '/reset-password',
          params: { resetToken },
        });
      } catch (apiErr) {
        setError(apiErr?.message || 'Invalid or expired code');
        setResetKey((prev) => prev + 1);
        setOtpCode('');
      } finally {
        setLoading(false);
      }
    },
    [otpCode, loading, rawEmail, router]
  );

  const handleResend = async () => {
    if (countdown > 0 || loading) return;

    setError('');
    setInfoMessage('');

    try {
      await authService.forgotPassword(rawEmail);
      setCountdown(60);
      setResetKey((prev) => prev + 1);
      setOtpCode('');
      setInfoMessage('A new verification code has been sent.');
    } catch (apiErr) {
      // If 429 server cooldown, restart timer and show message in muted text
      setCountdown(60);
      setInfoMessage(apiErr?.message || 'Please wait before requesting another code.');
    }
  };

  const primaryAccent = theme.custom?.primaryStrong || theme.colors.primary;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {/* Top Hero Section (Plain Header, NO image so there is room for keyboard) */}
        <AuthHero
          showBack
          onBack={() => router.back()}
          title="Verify Your Email"
          subtitle="We've sent a 6-digit verification code to"
        />

        {/* Email Address Banner */}
        <View style={styles.emailBanner}>
          <Text style={[styles.emailText, { color: theme.colors.onSurface }]}>
            {rawEmail}
          </Text>
        </View>

        {/* Overlapping Surface Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          {/* Centered Mail Icon Circle */}
          <View style={styles.iconCircleWrapper}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Feather name="mail" size={32} color={primaryAccent} />
            </View>
          </View>

          {/* 6-box OTP Input */}
          <OtpInput
            length={6}
            onChangeCode={(val) => {
              setOtpCode(val);
              if (error) setError('');
            }}
            onComplete={(code) => handleVerify(code)}
            error={Boolean(error)}
            resetKey={resetKey}
          />

          {/* Error / Cooldown Message */}
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
              <Text style={[styles.errorText, { color: theme.colors.onErrorContainer }]}>
                {error}
              </Text>
            </View>
          ) : null}

          {infoMessage ? (
            <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
              {infoMessage}
            </Text>
          ) : null}

          {/* Countdown & Resend Row */}
          <View style={styles.resendRow}>
            <Text style={[styles.resendLabel, { color: theme.colors.onSurfaceVariant }]}>
              {"Didn't receive the code? "}
            </Text>
            {countdown > 0 ? (
              <Text style={[styles.countdownText, { color: primaryAccent }]}>
                Resend in {formatTimer(countdown)}
              </Text>
            ) : (
              <Pressable
                onPress={handleResend}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Resend code"
              >
                <Text style={[styles.resendAction, { color: primaryAccent }]}>
                  Resend
                </Text>
              </Pressable>
            )}
          </View>

          {/* Submit Action */}
          <View style={styles.buttonSpacing}>
            <GradientButton
              title="Verify OTP"
              onPress={() => handleVerify()}
              loading={loading}
              disabled={otpCode.length < 6}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  emailBanner: {
    paddingHorizontal: 24,
    marginTop: -28,
    marginBottom: 44,
  },
  emailText: {
    fontSize: authTypography.subheadingSize,
    fontWeight: '800',
  },
  card: {
    flexGrow: 1,
    marginTop: -24,
    borderTopLeftRadius: authSizes.cardRadius,
    borderTopRightRadius: authSizes.cardRadius,
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  iconCircleWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  resendLabel: {
    fontSize: authTypography.smallSize,
  },
  countdownText: {
    fontSize: authTypography.smallSize,
    fontWeight: '700',
  },
  resendAction: {
    fontSize: authTypography.smallSize,
    fontWeight: '800',
  },
  errorBox: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginVertical: 12,
  },
  errorText: {
    fontSize: authTypography.smallSize,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  infoText: {
    fontSize: authTypography.smallSize,
    textAlign: 'center',
    marginVertical: 8,
  },
  buttonSpacing: {
    width: '100%',
    marginTop: 8,
  },
});
