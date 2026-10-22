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
  PasswordRules,
  authSizes,
  authTypography,
} from '../../components/auth';
import { signupHero } from '../../components/auth/authImages';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';

export default function Signup() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { signIn: googleSignIn, loading: googleLoading, error: googleError } = useGoogleSignIn();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Field touched states for validation
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // Input refs for keyboard navigation
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  const validateName = (val) => {
    if (!val || !val.trim()) return 'Full name is required.';
    if (val.trim().length < 2) return 'Name must be at least 2 characters.';
    return '';
  };

  const validateEmail = (val) => {
    if (!val || !val.trim()) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) return 'Please enter a valid email address.';
    return '';
  };

  const validatePassword = (val) => {
    if (!val) return 'Password is required.';
    if (val.length < 8) return 'Password must be at least 8 characters.';
    if (!/\d/.test(val)) return 'Password must contain at least one number.';
    if (!/[^A-Za-z0-9]/.test(val)) return 'Password must contain at least one special character.';
    return '';
  };

  const validateConfirmPassword = (val, pass) => {
    if (!val) return 'Please confirm your password.';
    if (val !== pass) return 'Passwords do not match.';
    return '';
  };

  const nameError = nameTouched ? validateName(name) : '';
  const emailError = emailTouched ? validateEmail(email) : '';
  const passwordError = passwordTouched ? validatePassword(password) : '';
  const confirmPasswordError = confirmPasswordTouched
    ? validateConfirmPassword(confirmPassword, password)
    : '';

  const handleSignup = async () => {
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(confirmPassword, password);

    if (nameErr || emailErr || passErr || confirmErr) {
      setError(nameErr || emailErr || passErr || confirmErr);
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authService.signupWithEmail(name.trim(), email.trim(), password);
      // New user accounts proceed to onboarding wizard
      router.replace('/(auth)/onboarding');
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.');
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
          title="Start Your Fitness Journey"
          subtitle="Create your account and take the first step towards a healthier you."
          image={signupHero}
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
            Create Account
          </Text>
          <Text style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
            Join FitMitra and unlock a better you
          </Text>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <AuthInput
              ref={nameInputRef}
              icon="user"
              placeholder="Full name"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailInputRef.current?.focus()}
              blurOnSubmit={false}
              value={name}
              onChangeText={(val) => {
                setName(val);
                if (nameTouched) setError('');
              }}
              error={nameError}
              editable={!loading && !googleLoading}
            />

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
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
              blurOnSubmit={false}
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (passwordTouched) setError('');
              }}
              error={passwordError}
              editable={!loading && !googleLoading}
            />

            {/* Real-time Password Rules Checklist (Only shows unsatisfied rules) */}
            <PasswordRules password={password} />

            <AuthInput
              ref={confirmPasswordInputRef}
              icon="lock"
              placeholder="Confirm password"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignup}
              value={confirmPassword}
              onChangeText={(val) => {
                setConfirmPassword(val);
                if (confirmPasswordTouched) setError('');
              }}
              error={confirmPasswordError}
              editable={!loading && !googleLoading}
            />

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
              </View>
            ) : null}

            {/* Primary Action Button */}
            <View style={styles.buttonSpacing}>
              <GradientButton
                title="Create Account"
                onPress={handleSignup}
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

          {/* Footer Login Link */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
              Already have an account?{' '}
            </Text>
            <Pressable
              onPress={() => router.push('/login')}
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
    marginTop: 28,
  },
  footerText: {
    fontSize: authTypography.bodySize,
  },
  loginLink: {
    fontSize: authTypography.bodySize,
    fontWeight: '700',
  },
});
