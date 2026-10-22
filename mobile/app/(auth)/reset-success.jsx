import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  AuthLogo,
  GradientButton,
  authTypography,
} from '../../components/auth';

export default function ResetSuccess() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Block Android hardware back button and force redirect to /login
  useEffect(() => {
    const backAction = () => {
      router.replace('/login');
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [router]);

  const successColor = theme.custom?.success || theme.colors.primary;
  const circleBg = theme.colors.primaryContainer;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top-left Brand Logo */}
        <View style={styles.headerRow}>
          <AuthLogo />
        </View>

        {/* Centered Graphic and Success Card */}
        <View style={styles.centerContainer}>
          <View style={styles.badgeWrapper}>
            {/* Decorative Sparkle Dots / Lines */}
            <View style={[styles.sparkleDot, styles.dotTopLeft, { backgroundColor: successColor }]} />
            <View style={[styles.sparkleDot, styles.dotTopRight, { backgroundColor: successColor }]} />
            <View style={[styles.sparkleDot, styles.dotBottomLeft, { backgroundColor: successColor }]} />
            <View style={[styles.sparkleDot, styles.dotBottomRight, { backgroundColor: successColor }]} />

            {/* Main Success Circle */}
            <View style={[styles.successCircle, { backgroundColor: circleBg }]}>
              <Feather name="check" size={44} color={successColor} />
            </View>
          </View>

          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Password Reset Successful!
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Your password has been updated successfully. You can now log in to your account.
          </Text>
        </View>

        {/* Bottom CTA Button */}
        <View style={styles.footerAction}>
          <GradientButton
            title="Go to Login"
            onPress={() => router.replace('/login')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  headerRow: {
    marginBottom: 24,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  badgeWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 130,
    height: 130,
    marginBottom: 28,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotTopLeft: {
    top: 14,
    left: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotTopRight: {
    top: 12,
    right: 18,
    width: 6,
    height: 6,
  },
  dotBottomLeft: {
    bottom: 16,
    left: 16,
    width: 7,
    height: 7,
  },
  dotBottomRight: {
    bottom: 12,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: authTypography.headingSize,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: authTypography.bodySize,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  footerAction: {
    width: '100%',
    paddingBottom: 8,
  },
});
