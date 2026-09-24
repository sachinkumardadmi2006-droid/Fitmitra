import React, { useEffect, useState, useCallback } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/theme';
import { onDbUpdate } from '../utils/events';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const checkAuth = useCallback(async () => {
    try {
      const userStr = await AsyncStorage.getItem('fitmitra_user');
      setIsLoggedIn(!!userStr);
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

  // Protect routes — redirect to login if not authenticated
  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'onboarding' || segments[0] === 'profile' || segments[0] === 'workout' || segments[0] === 'premium';
    
    if (!isLoggedIn && inAuthGroup) {
      router.replace('/login');
    }
  }, [isReady, isLoggedIn, segments]);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primaryNeon} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bgDarkBase },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="premium" />
        <Stack.Screen name="workout/[workoutId]" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
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
