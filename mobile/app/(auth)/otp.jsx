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
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Dumbbell } from 'lucide-react-native';
import { syncAuth } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, BorderRadius } from '../../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OtpVerification() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDark } = useTheme();

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
      const result = await syncAuth('dev-token');
      if (result?.user) {
        await AsyncStorage.setItem('fitmitra_user', JSON.stringify(result.user));
      }
      router.replace('/(auth)/onboarding');
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000000' }}
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
          <View style={styles.topVignette} />
          <View style={styles.bottomVignette} />

          <SafeAreaView style={styles.safeHeader}>
            <View style={styles.headerRow}>
              <Pressable
                style={styles.backBtn}
                onPress={() => router.back()}
                hitSlop={10}
              >
                <ArrowLeft size={18} color="#FFFFFF" />
              </Pressable>

              <View style={styles.brandRow}>
                <Dumbbell size={18} color="#B7FF00" />
                <Text style={styles.brandText}>
                  fit<Text style={{ color: '#B7FF00' }}>mitra</Text>
                </Text>
              </View>
              <View style={{ width: 36 }} />
            </View>
          </SafeAreaView>
        </ImageBackground>

        {/* Bottom Sheet Card Container */}
        <View style={[styles.bottomCard, { backgroundColor: isDark ? '#10131A' : '#FFFFFF' }]}>
          <Text style={[styles.cardTag, { color: isDark ? '#A8AFBA' : '#6B7280' }]}>
            Signup
          </Text>

          <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111111' }]}>
            Enter the 6-digit code send to your at{' '}
            <Text style={{ fontWeight: '800' }}>{maskedEmail}</Text>
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
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
                    backgroundColor: isDark ? '#171B24' : '#F9FAFB',
                    borderColor: digit
                      ? isDark ? '#B7FF00' : '#111111'
                      : isDark ? '#252B36' : '#E5E7EB',
                  },
                ]}
              >
                <TextInput
                  ref={inputRefs[index]}
                  style={[styles.otpInput, { color: isDark ? '#FFFFFF' : '#111111' }]}
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

          {/* Black Pill Continue Button */}
          <Pressable
            style={[
              styles.primaryBtn,
              { backgroundColor: isDark ? '#B7FF00' : '#111111' },
            ]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={isDark ? '#000000' : '#FFFFFF'} />
            ) : (
              <Text
                style={[
                  styles.primaryBtnText,
                  { color: isDark ? '#000000' : '#FFFFFF' },
                ]}
              >
                Continue
              </Text>
            )}
          </Pressable>

          {/* Interactive Resend Code link */}
          <Pressable style={styles.resendBtn} onPress={() => setOtp(['', '', '', '', '', ''])}>
            <Text style={[styles.resendText, { color: isDark ? '#A8AFBA' : '#6B7280' }]}>
              Didn't receive code?{' '}
              <Text style={{ color: isDark ? '#B7FF00' : '#111111', fontWeight: '800' }}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    height: '60%',
  },
  bottomVignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  bottomCard: {
    flex: 1,
    marginTop: -28,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
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
    marginBottom: 24,
  },
  errorBox: {
    padding: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 92, 105, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 105, 0.3)',
    marginBottom: 16,
  },
  errorText: {
    color: '#FF5C69',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 28,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderRadius: 14,
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
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  resendBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
  },
});

