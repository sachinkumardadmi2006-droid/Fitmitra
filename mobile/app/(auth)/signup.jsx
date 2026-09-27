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
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Mail, Lock, CheckSquare, Square, ArrowRight, Dumbbell } from 'lucide-react-native';
import { syncAuth } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, BorderRadius } from '../../constants/theme';

export default function Signup() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the Terms & Privacy Policy.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const result = await syncAuth('dev-token', {
        displayName: name.trim(),
        email: email.trim().toLowerCase(),
      });
      if (result?.user) {
        await AsyncStorage.setItem('fitmitra_user', JSON.stringify(result.user));
      }
      router.replace('/(tabs)');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgBase }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.brandHero}>
          <View style={[styles.brandIconWrap, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '33' }]}>
            <Dumbbell size={30} color={colors.primary} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
            JOIN <Text style={{ color: colors.primary }}>FITMITRA</Text>
          </Text>
          <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
            Start your personalized fitness transformation today.
          </Text>
        </View>

        {/* Signup Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.error + '18', borderColor: colors.error + '44' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          {/* Google Sign-In */}
          <Pressable
            style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF' }]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <Path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.33 24 12 24z"/>
              <Path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
              <Path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </Svg>
            <Text style={[styles.googleBtnText, { color: colors.textPrimary }]}>
              Sign Up with Google
            </Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>
              OR REGISTER WITH EMAIL
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name</Text>
            <View style={[styles.inputField, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <User size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="Sachin Kumar"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
            <View style={[styles.inputField, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="athlete@fitmitra.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password */}
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Password</Text>
            <View style={[styles.inputField, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Confirm Password */}
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Confirm Password</Text>
            <View style={[styles.inputField, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          {/* Terms Checkbox */}
          <Pressable
            style={styles.termsRow}
            onPress={() => setAgreeTerms(!agreeTerms)}
          >
            {agreeTerms ? (
              <CheckSquare size={20} color={colors.primary} />
            ) : (
              <Square size={20} color={colors.textMuted} />
            )}
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              I agree to the FitMitra{' '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Terms of Service</Text> &{' '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Privacy Policy</Text>
            </Text>
          </Pressable>

          {/* Submit Button */}
          <Pressable
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.submitBtnText}>Create Account</Text>
                <ArrowRight size={18} color="#000" />
              </View>
            )}
          </Pressable>

          {/* Footer to Login */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text style={[styles.linkText, { color: colors.primary }]}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 36,
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandIconWrap: {
    width: 58,
    height: 58,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 22,
  },
  errorBox: {
    padding: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: 14,
  },
  errorText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 50,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  googleBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: FontSize.sm,
    height: '100%',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  termsText: {
    flex: 1,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  submitBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: '#000',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    fontSize: FontSize.sm,
  },
  linkText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
});
