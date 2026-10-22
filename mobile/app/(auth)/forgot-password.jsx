import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../../services/authService';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  AuthHero,
  AuthInput,
  GradientButton,
  authSizes,
  authTypography,
} from '../../components/auth';
import { resetHero } from '../../components/auth/authImages';

export default function ForgotPassword() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailInputRef = useRef(null);

  const validateEmail = (val) => {
    if (!val || !val.trim()) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) return 'Please enter a valid email address.';
    return '';
  };

  const emailError = emailTouched ? validateEmail(email) : '';

  const handleSendOtp = async () => {
    setEmailTouched(true);
    const err = validateEmail(email);
    if (err) {
      setError(err);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      await authService.forgotPassword(normalizedEmail);
      router.push({
        pathname: '/reset-otp',
        params: { email: normalizedEmail },
      });
    } catch (apiErr) {
      setError(apiErr?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
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
        {/* Top Hero Section with Background Image */}
        <AuthHero
          showBack
          onBack={() => router.back()}
          title="Reset Your Password"
          subtitle="Secure your account and get back to your fitness journey."
          image={resetHero}
        />

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
          <View style={styles.formContainer}>
            <AuthInput
              ref={emailInputRef}
              icon="mail"
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSendOtp}
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (emailTouched) setError('');
              }}
              error={emailError}
              editable={!loading}
            />

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

            <View style={styles.buttonSpacing}>
              <GradientButton
                title="Send OTP"
                onPress={handleSendOtp}
                loading={loading}
              />
            </View>
          </View>

          {/* Footer Back to Login Link */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
              Remember your password?{' '}
            </Text>
            <Pressable
              onPress={() => router.replace('/login')}
              hitSlop={10}
              accessibilityRole="link"
              accessibilityLabel="Login"
            >
              <Text style={[styles.loginLink, { color: primaryAccent }]}>
                Login
              </Text>
            </Pressable>
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
  card: {
    flexGrow: 1,
    marginTop: -24,
    borderTopLeftRadius: authSizes.cardRadius,
    borderTopRightRadius: authSizes.cardRadius,
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  formContainer: {
    width: '100%',
  },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: authTypography.smallSize,
    fontWeight: '600',
    lineHeight: 18,
  },
  buttonSpacing: {
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: authTypography.bodySize,
  },
  loginLink: {
    fontSize: authTypography.bodySize,
    fontWeight: '700',
  },
});
