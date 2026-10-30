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
  GoogleButton,
  OrDivider,
  authSizes,
  authTypography,
} from '../../components/auth';
import { loginHero } from '../../components/auth/authImages';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { syncSession, retrySession } = useAuth();
  const { signIn: googleSignIn, loading: googleLoading, error: googleError } = useGoogleSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isCredentialError, setIsCredentialError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Field validation touched states
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Input refs for keyboard navigation
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

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
      setIsCredentialError(false);
      return;
    }

    setError('');
    setIsCredentialError(false);
    setLoading(true);

    try {
      const result = await authService.loginWithEmail(email.trim(), password);
      if (syncSession) {
        await syncSession(result.user, result.profile, result.isOnboarded);
      } else {
        await retrySession?.();
      }

      // Route based on emailVerified and isOnboarded status
      if (!result?.user?.emailVerified && !result?.user?.authProviders?.includes('GOOGLE') && result?.user?.authProvider !== 'GOOGLE') {
        router.replace({ pathname: '/(auth)/otp', params: { email: email.trim().toLowerCase() } });
      } else if (result?.isOnboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/onboarding');
      }
    } catch (err) {
      const serverMessage = err?.message || 'Authentication failed. Please try again.';
      setError(serverMessage);

      // Check for 401 or wrong credential indicator
      const isInvalidCredentials =
        err?.status === 401 ||
        /invalid.*credential|incorrect.*password|user not found|unauthorized/i.test(serverMessage);
      setIsCredentialError(isInvalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  const primaryAccent = theme.custom?.primaryStrong || theme.colors.primary;
  const activeError = error || googleError;

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
          title=""
          subtitle=""
          image={loginHero}
        />

        {/* Overlapping Rounded Surface Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.heading, { color: theme.colors.onSurface }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
            Login to continue your fitness journey
          </Text>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <AuthInput
              ref={emailInputRef}
              icon="mail"
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              blurOnSubmit={false}
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (emailTouched) setError('');
              }}
              error={emailError}
              editable={!loading && !googleLoading}
            />

            <AuthInput
              ref={passwordInputRef}
              icon="lock"
              placeholder="Password"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleEmailLogin}
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (passwordTouched) setError('');
              }}
              error={passwordError}
              editable={!loading && !googleLoading}
            />

            {/* Right-aligned Forgot Password link */}
            <View style={styles.forgotRow}>
              <Pressable
                onPress={() => router.push('/forgot-password')}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Forgot password?"
              >
                <Text style={[styles.forgotText, { color: primaryAccent }]}>
                  Forgot password?
                </Text>
              </Pressable>
            </View>

            {/* Error Message Area */}
            {activeError ? (
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
                  {activeError}
                </Text>
                {isCredentialError ? (
                  <Text style={[styles.hintText, { color: theme.colors.onSurfaceVariant }]}>
                    Signed up with Google? Use Continue with Google, or tap Forgot password to set a password.
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* Primary Action Button */}
            <View style={styles.buttonSpacing}>
              <GradientButton
                title="Login"
                onPress={handleEmailLogin}
                loading={loading}
                disabled={googleLoading}
              />
            </View>

            {/* Separator */}
            <OrDivider />

            {/* Google Sign-In */}
            <GoogleButton
              onPress={googleSignIn}
              loading={googleLoading}
              disabled={loading}
            />
          </View>

          {/* Footer Signup Link */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
              {"Don't have an account? "}
            </Text>
            <Pressable
              onPress={() => router.push('/signup')}
              hitSlop={10}
              accessibilityRole="link"
              accessibilityLabel="Sign Up"
            >
              <Text style={[styles.signupLink, { color: primaryAccent }]}>
                Sign Up
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
  heading: {
    fontSize: authTypography.headingSize,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subheading: {
    fontSize: authTypography.bodySize,
    lineHeight: 20,
    marginBottom: 24,
  },
  formContainer: {
    width: '100%',
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotText: {
    fontSize: authTypography.smallSize,
    fontWeight: '600',
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
  hintText: {
    fontSize: authTypography.smallSize,
    marginTop: 6,
    lineHeight: 16,
  },
  buttonSpacing: {
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: authTypography.bodySize,
  },
  signupLink: {
    fontSize: authTypography.bodySize,
    fontWeight: '700',
  },
});
