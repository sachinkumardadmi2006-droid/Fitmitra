import React, { useState, useEffect, useRef } from 'react';
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
import { authService } from '../../services/authService';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  AuthHero,
  AuthInput,
  PasswordRules,
  GradientButton,
  authSizes,
  authTypography,
} from '../../components/auth';

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useAppTheme();

  const resetToken = params.resetToken ? String(params.resetToken).trim() : '';

  useEffect(() => {
    if (!resetToken) {
      router.replace('/forgot-password');
    }
  }, [resetToken, router]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const newPasswordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const allRulesPassed = hasMinLength && hasNumber && hasSpecial;
  const passwordsMatch = Boolean(newPassword && newPassword === confirmPassword);

  const confirmError =
    confirmPasswordTouched && !passwordsMatch
      ? 'Passwords do not match.'
      : '';

  const handleResetPassword = async () => {
    setNewPasswordTouched(true);
    setConfirmPasswordTouched(true);

    if (!allRulesPassed) {
      setError('Please satisfy all password requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setIsSessionExpired(false);
    setLoading(true);

    try {
      await authService.resetPassword(resetToken, newPassword);
      router.replace('/reset-success');
    } catch (apiErr) {
      const serverMessage = apiErr?.message || 'Failed to update password. Please try again.';
      setError(serverMessage);

      if (
        apiErr?.status === 400 ||
        /invalid or expired reset session/i.test(serverMessage)
      ) {
        setIsSessionExpired(true);
      }
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
        {/* Top Hero Section (Plain Header, NO image so there is room for keyboard) */}
        <AuthHero
          showBack
          onBack={() => router.back()}
          title="Reset Your Password"
          subtitle="Set a new password for your account."
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
              ref={newPasswordInputRef}
              icon="lock"
              placeholder="New password"
              secureTextEntry
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
              blurOnSubmit={false}
              value={newPassword}
              onChangeText={(val) => {
                setNewPassword(val);
                if (newPasswordTouched) setError('');
              }}
              editable={!loading}
            />

            {/* Real-time Password Rules Checklist (Only shows unsatisfied rules) */}
            <PasswordRules password={newPassword} />

            <AuthInput
              ref={confirmPasswordInputRef}
              icon="lock"
              placeholder="Confirm new password"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleResetPassword}
              value={confirmPassword}
              onChangeText={(val) => {
                setConfirmPassword(val);
                if (confirmPasswordTouched) setError('');
              }}
              error={confirmError}
              editable={!loading}
            />

            {/* Error Message Box & Session Expired Link */}
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
                {isSessionExpired ? (
                  <Pressable
                    onPress={() => router.replace('/forgot-password')}
                    hitSlop={10}
                    style={styles.startAgainButton}
                    accessibilityRole="link"
                    accessibilityLabel="Start again"
                  >
                    <Text style={[styles.startAgainText, { color: primaryAccent }]}>
                      Start again
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {/* Primary Action Button */}
            <View style={styles.buttonSpacing}>
              <GradientButton
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                disabled={!allRulesPassed || !passwordsMatch}
              />
            </View>
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
  startAgainButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  startAgainText: {
    fontSize: authTypography.smallSize,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  buttonSpacing: {
    marginTop: 12,
  },
});
