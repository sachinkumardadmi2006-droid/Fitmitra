import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, ArrowRight, X } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../theme/ThemeContext';
import { authService } from '../../services/authService';

export default function EmailVerificationBanner({ style }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  const [isDismissed, setIsDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  // If not authenticated or dismissed for this session, hide
  if (!user || isDismissed) {
    return null;
  }

  // Check if email already verified
  const isVerified = Boolean(user.emailVerified || profile?.emailVerified);
  if (isVerified) {
    return null;
  }

  // Email verification is required ONLY when auth provider is password.
  // If user signed up/in with Google, there is NO need to verify email.
  const isGoogle = Boolean(
    user.authProviders?.includes('GOOGLE') || user.authProvider === 'GOOGLE'
  );
  const isPassword = Boolean(
    user.authProviders?.includes('PASSWORD') || (!isGoogle && user.authProvider !== 'GOOGLE')
  );

  if (isGoogle || !isPassword) {
    return null;
  }

  const handleVerifyNow = async () => {
    setSending(true);
    try {
      await authService.sendVerificationEmail();
      router.push({
        pathname: '/(auth)/otp',
        params: { email: user.email },
      });
    } catch (err) {
      // If rate limited or sent already, still navigate to OTP so user can enter the code they received
      if (/rate limit|too many/i.test(err?.message || '')) {
        router.push({
          pathname: '/(auth)/otp',
          params: { email: user.email },
        });
      } else {
        Alert.alert(
          'Verification Email',
          err?.message || 'Failed to send verification code. Please try again.',
          [
            {
              text: 'Enter Code Anyway',
              onPress: () =>
                router.push({
                  pathname: '/(auth)/otp',
                  params: { email: user.email },
                }),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.secondaryContainer,
          borderColor: colors.secondary,
        },
        style,
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: custom?.primaryStrong || colors.primary },
          ]}
        >
          <Mail size={16} color={colors.onPrimary} />
        </View>

        <View style={styles.textCol}>
          <Text
            style={[
              styles.title,
              { color: colors.onSecondaryContainer || colors.onSurface },
            ]}
          >
            Verify your email address
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.onSurfaceVariant },
            ]}
            numberOfLines={2}
          >
            Confirm {user.email || 'your email'} to secure your account and receive summaries.
          </Text>
        </View>

        <Pressable
          hitSlop={10}
          onPress={() => setIsDismissed(true)}
          style={styles.dismissBtn}
          accessibilityLabel="Dismiss email verification notice"
        >
          <X size={16} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={handleVerifyNow}
          disabled={sending}
          style={[
            styles.verifyBtn,
            { backgroundColor: custom?.primaryStrong || colors.primary },
          ]}
          accessibilityLabel="Verify email address now"
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <>
              <Text style={[styles.verifyBtnText, { color: colors.onPrimary }]}>
                Verify Now
              </Text>
              <ArrowRight size={14} color={colors.onPrimary} />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  textCol: {
    flex: 1,
    marginRight: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  dismissBtn: {
    padding: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  verifyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
