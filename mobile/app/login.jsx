// Login Screen — Phone OTP + Email/Password (mirrors frontend Login.jsx)
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { loginUser, requestOtp, verifyOtp } from '../utils/db';
import { Colors, FontSize, BorderRadius, Spacing } from '../constants/theme';

export default function Login() {
  const router = useRouter();
  const [view, setView] = useState('phone'); // 'phone', 'email', 'otp'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const otpRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (view === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [view, timer]);

  const handlePhoneSubmit = async () => {
    if (phone.length < 10) { setError('Please enter a valid 10-digit phone number.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await requestOtp(phone, '', '', false);
      setEmail(res.email || '');
      setView('otp'); setTimer(30); setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) { setError(err.message || 'User not found. Please Sign Up.'); }
    finally { setLoading(false); }
  };

  const handleEmailSubmit = async () => {
    if (!email || !password) { setError('Please enter both email and password.'); return; }
    setError(''); setLoading(true);
    try {
      await loginUser(email, password);
      router.replace('/(tabs)');
    } catch (err) { setError(err.message || 'Invalid email or password.'); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (index, key) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp]; newOtp[index - 1] = ''; setOtp(newOtp);
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) { setError('Please enter all 6 digits.'); return; }
    setError(''); setLoading(true);
    try {
      await verifyOtp(phone, otpCode);
      router.replace('/(tabs)');
    } catch (err) { setError(err.message || 'Invalid OTP.'); }
    finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    try { await requestOtp(phone, '', '', false); setTimer(30); setOtp(['', '', '', '', '', '']); }
    catch (err) { setError(err.message || 'Failed to resend OTP.'); }
  };

  const isPhoneValid = phone.length === 10;
  const isOtpComplete = otp.join('').length === 6;

  // OTP Verification View
  if (view === 'otp') {
    return (
      <View style={styles.authViewport}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Pressable onPress={() => setView('phone')} disabled={loading}><ChevronLeft size={24} color={Colors.authSubtext} /></Pressable>
            <Text style={styles.headerTitle}>OTP Verification</Text>
            <Pressable onPress={handleVerifyOtp} disabled={loading || !isOtpComplete}>
              <Text style={[styles.headerAction, isOtpComplete && { color: Colors.authBlue }]}>{loading ? '...' : 'Verify'}</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.otpContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.otpDesc}>
              A 6-digit code has been sent to <Text style={styles.bold}>{phone}</Text> and <Text style={styles.bold}>{email || 'your email'}</Text>
            </Text>
            {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
            <View style={styles.otpRow}>
              {otp.map((digit, idx) => (
                <TextInput
                  key={idx} ref={el => (otpRefs.current[idx] = el)}
                  style={styles.otpInput} maxLength={1} keyboardType="number-pad"
                  value={digit} onChangeText={v => handleOtpChange(idx, v)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(idx, nativeEvent.key)}
                  editable={!loading}
                />
              ))}
            </View>
            <View style={styles.timerRow}>
              {timer > 0 ? (
                <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
              ) : (
                <Pressable onPress={handleResendOtp}><Text style={styles.resendLink}>Resend OTP</Text></Pressable>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // Phone / Email Login
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.authViewport} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* Gold Branding Header */}
          <View style={styles.brandingBar}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoFit}>FIT</Text>
              <Text style={styles.logoMitra}>MITRA</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formArea}>
            <Text style={styles.formTitle}>Login to FitMitra{'\n'}Health & Fitness</Text>
            <Text style={styles.formSubtitle}>Welcome back! Please enter your details.</Text>

            {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

            {view === 'phone' ? (
              <View>
                <View style={styles.phoneField}>
                  <Text style={styles.countryCode}>+91</Text>
                  <View style={styles.fieldDivider} />
                  <TextInput
                    style={styles.phoneInput} placeholder="Enter your phone" placeholderTextColor="#A0AEC0"
                    keyboardType="phone-pad" maxLength={10} value={phone}
                    onChangeText={v => setPhone(v.replace(/\D/g, '').substring(0, 10))} editable={!loading}
                  />
                </View>
                <Pressable
                  style={[styles.submitBtn, isPhoneValid && styles.submitBtnActive]}
                  onPress={handlePhoneSubmit} disabled={loading || !isPhoneValid}
                >
                  <Text style={[styles.submitBtnText, isPhoneValid && styles.submitBtnTextActive]}>
                    {loading ? 'Requesting...' : 'Request OTP'}
                  </Text>
                </Pressable>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} />
                </View>
                <Pressable onPress={() => { setView('email'); setError(''); }}>
                  <Text style={styles.switchLink}>Login using email</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.inputField} placeholder="sachin@fitmitra.com" placeholderTextColor="#A0AEC0"
                    keyboardType="email-address" autoCapitalize="none" value={email}
                    onChangeText={setEmail} editable={!loading}
                  />
                </View>
                <View style={[styles.inputGroup, { marginTop: 16 }]}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.inputField} placeholder="••••••••" placeholderTextColor="#A0AEC0"
                    secureTextEntry value={password} onChangeText={setPassword} editable={!loading}
                  />
                </View>
                <Pressable style={[styles.submitBtn, styles.submitBtnActive, { marginTop: 24 }]}
                  onPress={handleEmailSubmit} disabled={loading}
                >
                  <Text style={[styles.submitBtnText, styles.submitBtnTextActive]}>{loading ? 'Logging in...' : 'Log In'}</Text>
                </Pressable>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} />
                </View>
                <Pressable onPress={() => { setView('phone'); setError(''); }}>
                  <Text style={styles.switchLink}>Login using phone</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.signupFooter}>
              Not registered yet?{' '}
              <Text style={styles.blueLink} onPress={() => router.push('/signup')}>Sign up</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  authViewport: { flex: 1, backgroundColor: Colors.bgDarkBase },
  card: { flex: 1, backgroundColor: Colors.white, marginHorizontal: 0, borderRadius: 0 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 56, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: Colors.authBorderLight,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.authText },
  headerAction: { fontSize: 15, fontWeight: '600', color: '#A0AEC0' },
  otpContent: { padding: 24 },
  otpDesc: { fontSize: 15, color: Colors.authSubtext, lineHeight: 22, marginBottom: 32 },
  bold: { fontWeight: '600', color: Colors.authText },
  errorBox: { backgroundColor: Colors.authErrorBg, borderWidth: 1, borderColor: Colors.authErrorBorder, padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { fontSize: 13, color: Colors.authError, lineHeight: 18 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 32 },
  otpInput: {
    width: 48, height: 48, borderWidth: 1, borderColor: Colors.authBorder, borderRadius: 8,
    fontSize: 20, fontWeight: '700', textAlign: 'center', color: Colors.authText, backgroundColor: Colors.white,
  },
  timerRow: { alignItems: 'center', marginTop: 16 },
  timerText: { fontSize: 14, color: Colors.authMuted },
  resendLink: { fontSize: 14, fontWeight: '600', color: Colors.authBlue, textDecorationLine: 'underline' },
  brandingBar: {
    height: 200, backgroundColor: Colors.authGold, alignItems: 'center', justifyContent: 'center',
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
  },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
  },
  logoFit: { fontSize: 22, fontWeight: '900', color: Colors.authText },
  logoMitra: { fontSize: 16, fontWeight: '700', color: Colors.authGold, marginTop: -4 },
  formArea: { flex: 1, backgroundColor: Colors.authBg, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, padding: 28 },
  formTitle: { fontSize: 24, fontWeight: '700', color: Colors.authText, lineHeight: 30 },
  formSubtitle: { fontSize: 14, color: Colors.authMuted, marginTop: 8, marginBottom: 24 },
  phoneField: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.authBorder, borderRadius: 12, height: 52, paddingHorizontal: 16,
  },
  countryCode: { fontSize: 16, fontWeight: '700', color: Colors.authText },
  fieldDivider: { width: 1, height: 20, backgroundColor: Colors.authBorder, marginHorizontal: 12 },
  phoneInput: { flex: 1, fontSize: 16, color: Colors.authText },
  submitBtn: {
    marginTop: 16, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.authBorderLight,
  },
  submitBtnActive: { backgroundColor: Colors.authText },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#A0AEC0' },
  submitBtnTextActive: { color: Colors.white },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.authBorderLight },
  dividerText: { fontSize: 12, fontWeight: '600', color: '#A0AEC0', paddingHorizontal: 12 },
  switchLink: { fontSize: 15, fontWeight: '600', color: Colors.authBlue, textAlign: 'center' },
  signupFooter: { textAlign: 'center', fontSize: 14, color: Colors.authSubtext, marginTop: 32 },
  blueLink: { color: Colors.authBlue, fontWeight: '600' },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.authSubtext },
  inputField: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.authBorder,
    borderRadius: 12, height: 48, paddingHorizontal: 16, fontSize: 15, color: Colors.authText,
  },
});
