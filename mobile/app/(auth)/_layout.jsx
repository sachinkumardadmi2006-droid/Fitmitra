import React from 'react';
import { Stack } from 'expo-router';
import { useAppTheme } from '../../theme/ThemeContext';

export default function AuthLayout() {
  const { theme } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}

