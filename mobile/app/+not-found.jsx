import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Dumbbell } from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/tokens';

export default function NotFoundScreen() {
  const { theme } = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Dumbbell size={56} color={theme.custom.primaryStrong} />
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Screen Not Found
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          This screen doesn't exist.
        </Text>

        <Link href="/" asChild>
          <Pressable
            style={[
              styles.link,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text
              style={[
                styles.linkText,
                { color: theme.colors.onPrimary },
              ]}
            >
              Go to Home screen
            </Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
  },
  link: {
    marginTop: 15,
    paddingVertical: spacing.md,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '800',
  },
});

