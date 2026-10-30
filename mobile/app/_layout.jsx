import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AppThemeProvider, useAppTheme } from '../theme/ThemeContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../services/queryClient';
import { LoadingScreen, SnackbarProvider } from '../components/ui';
import PaymentCheckoutModal from '../components/payment/PaymentCheckoutModal';

LogBox.ignoreLogs([
  'Cannot connect to Expo CLI',
  '[FitMitra API Error]',
  '[FitMitra API]',
  'Session expired',
  'Session refresh failed',
  '"textShadow*" style props are deprecated',
  '"shadow*" style props are deprecated',
  'props.pointerEvents is deprecated',
  'Animated: `useNativeDriver` is not supported',
  'Cannot record touch end without a touch start',
]);

function ThemedStack() {
  const { theme } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="ai-coach" />
      <Stack.Screen name="store" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="premium" />
      <Stack.Screen name="workout/[workoutId]" />
      <Stack.Screen name="workout/exercise/[exerciseId]" />
      <Stack.Screen name="recipe/[recipeId]" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function ThemedRoot({ children }) {
  const { user, profile } = useAuth();
  const language = profile?.language || user?.language || 'en';
  return (
    <AppThemeProvider language={language}>
      <SnackbarProvider>{children}</SnackbarProvider>
    </AppThemeProvider>
  );
}

function RootNavigator() {
  const {
    isLoading,
    isAuthenticated,
    isOnboarded,
    user,
    emailVerified,
    requiresEmailVerification,
  } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { isDark } = useTheme();

  // Authentication Gate: token -> emailVerified -> isOnboarded -> main tabs
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup =
      segments[0] === '(auth)' ||
      segments[0] === 'login' ||
      segments[0] === 'signup';
    const inOnboarding =
      segments[0] === 'onboarding' ||
      segments[1] === 'onboarding';
    const isOtpScreen =
      segments[0] === 'otp' ||
      segments[1] === 'otp';
    const isAtRoot = !segments[0] || segments[0] === 'index';

    if (!isAuthenticated) {
      // Unauthenticated -> gate protected routes and root, directing to login
      const inProtectedGroup =
        segments[0] === '(tabs)' ||
        segments[0] === 'workout' ||
        segments[0] === 'premium' ||
        segments[0] === 'notifications' ||
        segments[0] === 'leaderboard' ||
        segments[0] === 'settings' ||
        segments[0] === 'store' ||
        segments[0] === 'orders' ||
        segments[0] === 'ai-coach' ||
        segments[0] === 'recipe' ||
        segments[0] === 'profile';

      if (inProtectedGroup || isAtRoot) {
        router.replace('/login');
      }
    } else if (requiresEmailVerification || (user && !emailVerified && !user.authProviders?.includes('GOOGLE') && user.authProvider !== 'GOOGLE')) {
      // Authenticated but email verification required -> direct to OTP screen
      if (!isOtpScreen) {
        router.replace('/(auth)/otp');
      }
    } else if (!isOnboarded) {
      // Authenticated and verified but onboarding incomplete -> direct to onboarding wizard
      if (!inOnboarding) {
        router.replace('/(auth)/onboarding');
      }
    } else {
      // Authenticated, verified, and onboarded -> direct to main tabs
      if (isAtRoot || inAuthGroup || inOnboarding || isOtpScreen) {
        router.replace('/(tabs)');
      }
    }
  }, [isLoading, isAuthenticated, isOnboarded, emailVerified, requiresEmailVerification, segments, user, router]);

  if (isLoading) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <LoadingScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ThemedStack />
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ThemedRoot>
            <RootNavigator />
            <PaymentCheckoutModal />
          </ThemedRoot>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

