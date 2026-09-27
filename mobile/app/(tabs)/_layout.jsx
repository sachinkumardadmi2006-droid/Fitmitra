import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Dumbbell, Utensils, TrendingUp, LayoutGrid } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // Android Navigation bar inset fix: ensure bottom padding clears system buttons/gesture bar
  const bottomPadding = Math.max(insets.bottom, 10);
  const barHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: barHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          elevation: isDark ? 0 : 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0 : 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      {/* 1. HOME TAB */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />

      {/* 2. WORKOUT TAB */}
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color, size }) => <Dumbbell size={size} color={color} />,
        }}
      />

      {/* 3. DIET TAB */}
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Diet',
          tabBarIcon: ({ color, size }) => <Utensils size={size} color={color} />,
        }}
      />

      {/* 4. PROGRESS TAB */}
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
        }}
      />

      {/* 5. MORE TAB (FEATURE HUB) */}
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />,
        }}
      />

      {/* Hidden route aliases inside (tabs) group */}
      <Tabs.Screen
        name="store"
        options={{
          href: null, // Accessible via router.push('/store') or More hub
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Accessible via router.push('/profile') or More hub
        }}
      />
      <Tabs.Screen
        name="programs"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
