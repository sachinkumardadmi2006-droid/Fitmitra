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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService, formatAuthError } from '../../services/authService';
import { Dumbbell, Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { AppButton, AppCard } from '../../components/ui';

export default function Signup() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Field touched states for validation
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

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
      // New user accounts must complete onboarding biometrics
      router.replace('/(auth)/onboarding');
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
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
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
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
            Create your account to start personalized workouts and nutrition tracking
          </Text>
        </View>

        {/* Main Signup Card */}
        <AppCard
          variant="elevated"
          style={[styles.signupCard, { backgroundColor: theme.colors.surface }]}
          padded={false}
        >
          <View style={styles.cardPadding}>
            <Text style={[styles.formHeading, { color: theme.colors.onSurface }]}>
              Create Account
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

            {/* Full Name Field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
                Full Name
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? theme.colors.elevation.level1 : theme.colors.background,
                    borderColor: nameError ? theme.colors.error : theme.colors.outlineVariant,
                  },
                ]}
              >
                <User
                  size={18}
                  color={nameError ? theme.colors.error : theme.colors.onSurfaceVariant}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.onSurface }]}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (nameTouched) setError('');
                  }}
                  onBlur={() => setNameTouched(true)}
                  editable={!loading}
                  accessibilityLabel="Full name input"
                />
              </View>
              {nameError ? (
                <Text style={[styles.fieldError, { color: theme.colors.error }]}>
                  {nameError}
                </Text>
              ) : null}
            </View>

            {/* Email Address Field */}
            <View style={[styles.fieldGroup, { marginTop: 14 }]}>
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
              <Text style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
                Password (min. 8 characters)
              </Text>
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
                  placeholder="••••••••"
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

            {/* Confirm Password Field */}
            <View style={[styles.fieldGroup, { marginTop: 14 }]}>
              <Text style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
                Confirm Password
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? theme.colors.elevation.level1 : theme.colors.background,
                    borderColor: confirmPasswordError ? theme.colors.error : theme.colors.outlineVariant,
                  },
                ]}
              >
                <Lock
                  size={18}
                  color={confirmPasswordError ? theme.colors.error : theme.colors.onSurfaceVariant}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.onSurface }]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (confirmPasswordTouched) setError('');
                  }}
                  onBlur={() => setConfirmPasswordTouched(true)}
                  editable={!loading}
                  accessibilityLabel="Confirm password input"
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                  accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color={theme.custom.primaryStrong || theme.colors.primary} />
                  ) : (
                    <Eye size={18} color={theme.colors.onSurfaceVariant} />
                  )}
                </Pressable>
              </View>
              {confirmPasswordError ? (
                <Text style={[styles.fieldError, { color: theme.colors.error }]}>
                  {confirmPasswordError}
                </Text>
              ) : null}
            </View>

            {/* Submit Button */}
            <View style={{ marginTop: 22 }}>
              <AppButton
                label="Create Account"
                onPress={handleSignup}
                mode="contained"
                loading={loading}
                disabled={loading}
              />
            </View>
          </View>
        </AppCard>

        {/* Footer Navigation to Login */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
            Already have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('/login')} hitSlop={8}>
            <Text
              style={[
                styles.loginLink,
                { color: theme.custom.primaryStrong || theme.colors.primary },
              ]}
            >
              Log in
            </Text>
          </Pressable>
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
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
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
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  signupCard: {
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
  fieldLabel: {
    fontSize: 13,
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
    marginTop: 22,
  },
  footerText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '800',
  },
});
