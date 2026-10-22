import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Dumbbell } from 'lucide-react-native';
import { authService } from '../../services/authService';
import { useAppTheme } from '../../theme/ThemeContext';
import { spacing, radius } from '../../theme/tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OtpVerification() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, isDark } = useAppTheme();

  const rawEmail = (params.email || 'alexsmith.mobbin@gmail.com').toString();

  const maskEmail = (emailStr) => {
    if (!emailStr || !emailStr.includes('@')) return '*****in@gmail.com';
    const [local, domain] = emailStr.split('@');
    if (local.length <= 3) return `*****@${domain}`;
    return `${local.substring(0, 2)}*****${local.substring(local.length - 2)}@${domain}`;
  };

  const maskedEmail = maskEmail(rawEmail);

  const [otp, setOtp] = useState(['2', '3', '5', '1', '7', '3']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto focus next input box
    if (text && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      if (!__DEV__) {
        throw new Error('Phone verification is not yet available in production.');
      }
      const result = await authService.devLogin();
      if (result?.isOnboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/onboarding');
      }
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
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
                onPress={() => router.back()}
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
            Signup
          </Text>

          <Text
            style={[
              styles.cardTitle,
              { color: theme.colors.onSurface },
            ]}
          >
            Enter the 6-digit code send to your at{' '}
            <Text style={{ fontWeight: '800' }}>{maskedEmail}</Text>
          </Text>

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
                  ref={inputRefs[index]}
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
            onPress={() => setOtp(['', '', '', '', '', ''])}
          >
            <Text
              style={[
                styles.resendText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Didn't receive code?{' '}
              <Text
                style={{
                  color: theme.custom.primaryStrong,
                  fontWeight: '800',
                }}
              >
                Resend Code
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
});


