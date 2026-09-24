// Signup Screen — Name/Email/Password/Confirm Password
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { signupUser } from '../utils/db';
import { Colors } from '../constants/theme';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isFormValid =
    name.trim().length > 0 &&
    email.trim().includes('@') &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    agreeTerms;

  const handleSignup = async () => {
    if (!isFormValid) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signupUser(name.trim(), email.trim(), password);
      router.replace('/onboarding');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} disabled={loading}>
              <ChevronLeft size={24} color={Colors.authSubtext} />
            </Pressable>
            <Text style={styles.headerTitle}>Sign up</Text>
            <Pressable onPress={handleSignup} disabled={loading || !isFormValid}>
              <Text style={[styles.headerAction, isFormValid && { color: Colors.authBlue }]}>
                {loading ? '...' : 'Sign up'}
              </Text>
            </Pressable>
          </View>
          <View style={styles.formContent}>
            <Text style={styles.formTitle}>Let's get you started!</Text>
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            {/* NAME FIELD */}
            <View style={styles.fieldWrap}>
              <TextInput
                style={styles.fieldInput}
                placeholder="Name"
                placeholderTextColor="#A0AEC0"
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>

            {/* EMAIL FIELD */}
            <View style={[styles.fieldWrap, { marginTop: 16 }]}>
              <TextInput
                style={styles.fieldInput}
                placeholder="Email ID"
                placeholderTextColor="#A0AEC0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            {/* PASSWORD FIELD */}
            <View style={[styles.fieldWrap, { marginTop: 16 }]}>
              <TextInput
                style={styles.fieldInput}
                placeholder="Password"
                placeholderTextColor="#A0AEC0"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
            </View>

            {/* CONFIRM PASSWORD FIELD */}
            <View style={[styles.fieldWrap, { marginTop: 16 }]}>
              <TextInput
                style={styles.fieldInput}
                placeholder="Confirm Password"
                placeholderTextColor="#A0AEC0"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />
            </View>

            {/* TERMS CHECKBOX */}
            <Pressable style={styles.checkboxRow} onPress={() => setAgreeTerms(!agreeTerms)}>
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>I have read and agree to the Terms of Service and Privacy Policy.</Text>
            </Pressable>

            {/* SIGNUP BUTTON */}
            <Pressable
              style={[styles.submitBtn, isFormValid && styles.submitBtnActive, { marginTop: 24 }]}
              onPress={handleSignup}
              disabled={loading || !isFormValid}
            >
              <Text style={[styles.submitBtnText, isFormValid && styles.submitBtnTextActive]}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </Pressable>

            {/* LOGIN LINK */}
            <Text style={styles.loginFooter}>
              Already have an account?{' '}
              <Text style={styles.blueLink} onPress={() => router.push('/login')}>Login</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDarkBase },
  card: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 56, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: Colors.authBorderLight,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.authText },
  headerAction: { fontSize: 15, fontWeight: '600', color: '#A0AEC0' },
  formContent: { flex: 1, padding: 28 },
  formTitle: { fontSize: 20, fontWeight: '700', color: Colors.authText, marginBottom: 24 },
  errorBox: { backgroundColor: Colors.authErrorBg, borderWidth: 1, borderColor: Colors.authErrorBorder, padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { fontSize: 13, color: Colors.authError },
  fieldWrap: {
    borderWidth: 1.5, borderColor: Colors.authBorderLight, borderRadius: 12, height: 56,
    paddingHorizontal: 16, justifyContent: 'center', backgroundColor: Colors.white,
  },
  fieldInput: { fontSize: 15, color: Colors.authText },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 24 },
  checkbox: {
    width: 20, height: 20, borderWidth: 2, borderColor: Colors.authBorder, borderRadius: 4,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  checkboxChecked: { backgroundColor: Colors.authGold, borderColor: Colors.authGold },
  checkmark: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  checkboxLabel: { fontSize: 13, color: Colors.authSubtext, lineHeight: 20, flex: 1 },
  submitBtn: {
    height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.authBorderLight,
  },
  submitBtnActive: { backgroundColor: Colors.authText },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#A0AEC0' },
  submitBtnTextActive: { color: Colors.white },
  loginFooter: { textAlign: 'center', fontSize: 14, color: Colors.authSubtext, marginTop: 'auto', paddingTop: 32 },
  blueLink: { color: Colors.authBlue, fontWeight: '600' },
});

