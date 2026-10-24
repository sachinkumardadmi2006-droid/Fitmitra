import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';

export default function OnboardingProgressHeader({
  step = 1,
  totalSteps = 7,
  category = '',
  title = '',
  subtitle = '',
  onBack,
}) {
  const { theme, isDark } = useAppTheme();
  const { colors, custom } = theme;

  const progressAnim = useRef(new Animated.Value(step / totalSteps)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / totalSteps,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [step, totalSteps, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Top Row: Step Indicator & Back Button */}
      <View style={styles.topRow}>
        <View style={styles.stepBadgeGroup}>
          <View
            style={[
              styles.stepBadge,
              {
                backgroundColor: colors.primaryContainer,
              },
            ]}
          >
            <Text
              style={[
                styles.stepBadgeText,
                { color: custom.primaryStrong || colors.primary },
              ]}
            >
              STEP {step} OF {totalSteps}
            </Text>
          </View>
          {category ? (
            <Text
              style={[
                styles.categoryText,
                { color: colors.onSurfaceVariant },
              ]}
            >
              • {category}
            </Text>
          ) : null}
        </View>

        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            accessibilityLabel="Go back to previous step"
            style={[
              styles.backButton,
              {
                backgroundColor: isDark
                  ? colors.elevation.level2
                  : colors.surfaceVariant,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <ArrowLeft size={18} color={colors.onSurface} />
          </Pressable>
        ) : null}
      </View>

      {/* Animated Progress Bar */}
      <View
        style={[
          styles.track,
          { backgroundColor: colors.outlineVariant },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              width: progressWidth,
              backgroundColor: custom.primaryStrong || colors.primary,
            },
          ]}
        />
      </View>

      {/* Header Titles */}
      {title ? (
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.onBackground }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  titleContainer: {
    marginTop: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
});
