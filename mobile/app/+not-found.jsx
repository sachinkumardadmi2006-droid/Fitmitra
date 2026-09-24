import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Dumbbell } from 'lucide-react-native';
import { Colors } from '../constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Dumbbell size={56} color={Colors.primaryNeon} />
        <Text style={styles.title}>Screen Not Found</Text>
        <Text style={styles.subtitle}>This screen doesn't exist.</Text>

        <Link href="/" asChild>
          <Pressable style={styles.link}>
            <Text style={styles.linkText}>Go to Home screen</Text>
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
    backgroundColor: Colors.bgDarkBase,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  link: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.primaryNeon,
    borderRadius: 10,
  },
  linkText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '800',
  },
});
