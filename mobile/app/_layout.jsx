import React, { useEffect, useState, useCallback } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';
import { onDbUpdate } from '../utils/events';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function RootNavigator() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const { colors, isDark } = useTheme();

  const checkAuth = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('fitmitra_token');
      const userStr = await AsyncStorage.getItem('fitmitra_user');
      const isAuthenticated = Boolean(token && userStr);
      setIsLoggedIn(isAuthenticated);
    } catch (e) {
      setIsLoggedIn(false);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    checkAuth();
    const unsub = onDbUpdate(checkAuth);
    return unsub;
  }, [checkAuth]);

  // Protect routes — redirect appropriately based on auth & onboarding status
  useEffect(() => {
    if (!isReady) return;

    const inProtectedGroup =
      segments[0] === '(tabs)' ||
      segments[0] === 'workout' ||
      segments[0] === 'premium' ||
      segments[0] === 'notifications' ||
      segments[0] === 'leaderboard' ||
      segments[0] === 'settings';

    if (!isLoggedIn && inProtectedGroup) {
      router.replace('/login');
    } else if (isLoggedIn && (segments[1] === 'login' || segments[1] === 'signup')) {
      // Check onboarding status
      AsyncStorage.getItem('fitmitra_onboarded').then((onboarded) => {
        if (onboarded === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      });
    }
  }, [isReady, isLoggedIn, segments]);

  if (!isReady) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bgBase }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgBase },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="ai-coach" />
        <Stack.Screen name="store" />
        <Stack.Screen name="premium" />
        <Stack.Screen name="workout/[workoutId]" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgDarkBase,
  },
});
