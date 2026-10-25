import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CheckCircle2, Zap, Shield, Flame } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';

const LEVELS = [
  {
    key: 'BEGINNER',
    title: 'Beginner',
    tag: '0 – 6 Months Experience',
    desc: 'New to structured resistance training. Focus on proper exercise form, fundamental movement mechanics, and building consistent workout habits.',
    badge: 'Foundations',
    icon: Shield,
  },
  {
    key: 'INTERMEDIATE',
    title: 'Intermediate',
    tag: '6 Months – 2 Years Experience',
    desc: 'Comfortable with standard compound lifts (squats, deadlifts, presses). Ready for progressive overload cycles, volume optimization, and hypertrophy.',
    badge: 'Progressive Overload',
    icon: Zap,
  },
  {
    key: 'ADVANCED',
    title: 'Advanced',
    tag: '2+ Years Regular Lifting',
    desc: 'High training proficiency and work capacity. Familiar with RPE scale, periodization cycles, fatigue management, and advanced intensity techniques.',
    badge: 'High Performance',
    icon: Flame,
  },
];

export default function StepFitnessLevel({
  experienceLevel,
  setExperienceLevel,
}) {
  const { theme, isDark } = useAppTheme();
  const { colors, custom } = theme;

  return (
    <View style={styles.container}>
      <View style={styles.list}>
        {LEVELS.map((lvl) => {
          const isSelected = experienceLevel === lvl.key;
          const IconComp = lvl.icon;

          return (
            <Pressable
              key={lvl.key}
              onPress={() => setExperienceLevel(lvl.key)}
              style={[
                styles.levelCard,
                {
                  backgroundColor: isSelected
                    ? colors.primaryContainer
                    : isDark
                      ? colors.elevation.level1
                      : colors.surface,
                  borderColor: isSelected
                    ? (custom.primaryStrong || colors.primary)
                    : colors.outlineVariant,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isSelected
                        ? (custom.primaryStrong || colors.primary)
                        : isDark
                          ? colors.elevation.level2
                          : colors.surfaceVariant,
                    },
                  ]}
                >
                  <IconComp
                    size={20}
                    color={isSelected ? colors.onPrimary : colors.onSurface}
                  />
                </View>

                <View style={styles.headerRight}>
                  <View
                    style={[
                      styles.tagBadge,
                      {
                        backgroundColor: isSelected
                          ? colors.surface
                          : isDark
                            ? colors.elevation.level2
                            : colors.surfaceVariant,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagBadgeText,
                        {
                          color: isSelected
                            ? (custom.primaryStrong || colors.primary)
                            : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {lvl.badge}
                    </Text>
                  </View>

                  {isSelected ? (
                    <CheckCircle2 size={20} color={custom.primaryStrong || colors.primary} />
                  ) : (
                    <View
                      style={[
                        styles.unselectedRing,
                        { borderColor: colors.outlineVariant },
                      ]}
                    />
                  )}
                </View>
              </View>

              <Text
                style={[
                  styles.title,
                  {
                    color: isSelected
                      ? colors.onPrimaryContainer
                      : colors.onSurface,
                  },
                ]}
              >
                {lvl.title}
              </Text>

              <Text
                style={[
                  styles.tagText,
                  {
                    color: isSelected
                      ? (custom.primaryStrong || colors.primary)
                      : colors.onSurfaceVariant,
                  },
                ]}
              >
                {lvl.tag}
              </Text>

              <Text
                style={[
                  styles.desc,
                  {
                    color: isSelected
                      ? colors.onPrimaryContainer
                      : colors.onSurfaceVariant,
                  },
                ]}
              >
                {lvl.desc}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  list: {
    gap: 12,
  },
  levelCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  unselectedRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
