import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  Home,
  Dumbbell,
  CheckCircle2,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Clock,
  Calendar,
} from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from '../ui/AppCard';

const DAYS_OPTIONS = [
  { label: '3 Days / wk', value: 3, desc: 'Ideal for busy schedules' },
  { label: '4 Days / wk', value: 4, desc: 'Balanced upper / lower split' },
  { label: '5 Days / wk', value: 5, desc: 'Recommended optimal volume' },
  { label: '6 Days / wk', value: 6, desc: 'High frequency push / pull / legs' },
];

const TIME_OPTIONS = [
  {
    key: 'EARLY_MORNING',
    label: 'Early Morning',
    time: '5:00 AM – 8:00 AM',
    icon: Sunrise,
  },
  {
    key: 'MORNING',
    label: 'Morning',
    time: '8:00 AM – 12:00 PM',
    icon: Sun,
  },
  {
    key: 'EVENING',
    label: 'Evening',
    time: '4:00 PM – 8:00 PM',
    icon: Sunset,
  },
  {
    key: 'NIGHT',
    label: 'Night',
    time: '8:00 PM – 11:00 PM',
    icon: Moon,
  },
];

export default function StepWorkoutPreferences({
  workoutLocation,
  setWorkoutLocation,
  preferredWorkoutDays,
  setPreferredWorkoutDays,
  preferredWorkoutTime,
  setPreferredWorkoutTime,
}) {
  const { theme, isDark } = useAppTheme();
  const { colors, custom } = theme;

  return (
    <View style={styles.container}>
      {/* 1. Workout Location Cards */}
      <View style={styles.section}>
        <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
          Training Environment
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
          Where will you be training most of the time?
        </Text>

        <View style={styles.locationGrid}>
          {/* Home Option */}
          <Pressable
            onPress={() => setWorkoutLocation('HOME')}
            style={[
              styles.locationCard,
              {
                backgroundColor: workoutLocation === 'HOME'
                  ? colors.primaryContainer
                  : isDark
                    ? colors.elevation.level1
                    : colors.surface,
                borderColor: workoutLocation === 'HOME'
                  ? (custom.primaryStrong || colors.primary)
                  : colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: workoutLocation === 'HOME'
                      ? (custom.primaryStrong || colors.primary)
                      : isDark
                        ? colors.elevation.level2
                        : colors.surfaceVariant,
                  },
                ]}
              >
                <Home
                  size={22}
                  color={workoutLocation === 'HOME' ? colors.onPrimary : colors.onSurface}
                />
              </View>
              {workoutLocation === 'HOME' && (
                <CheckCircle2 size={20} color={custom.primaryStrong || colors.primary} />
              )}
            </View>

            <Text
              style={[
                styles.locationTitle,
                {
                  color: workoutLocation === 'HOME'
                    ? colors.onPrimaryContainer
                    : colors.onSurface,
                },
              ]}
            >
              Home Workout
            </Text>
            <Text
              style={[
                styles.locationDesc,
                {
                  color: workoutLocation === 'HOME'
                    ? colors.onPrimaryContainer
                    : colors.onSurfaceVariant,
                },
              ]}
            >
              Minimal equipment, resistance bands, dumbbells & bodyweight movements.
            </Text>
          </Pressable>

          {/* Gym Option */}
          <Pressable
            onPress={() => setWorkoutLocation('GYM')}
            style={[
              styles.locationCard,
              {
                backgroundColor: workoutLocation === 'GYM'
                  ? colors.primaryContainer
                  : isDark
                    ? colors.elevation.level1
                    : colors.surface,
                borderColor: workoutLocation === 'GYM'
                  ? (custom.primaryStrong || colors.primary)
                  : colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: workoutLocation === 'GYM'
                      ? (custom.primaryStrong || colors.primary)
                      : isDark
                        ? colors.elevation.level2
                        : colors.surfaceVariant,
                  },
                ]}
              >
                <Dumbbell
                  size={22}
                  color={workoutLocation === 'GYM' ? colors.onPrimary : colors.onSurface}
                />
              </View>
              {workoutLocation === 'GYM' && (
                <CheckCircle2 size={20} color={custom.primaryStrong || colors.primary} />
              )}
            </View>

            <Text
              style={[
                styles.locationTitle,
                {
                  color: workoutLocation === 'GYM'
                    ? colors.onPrimaryContainer
                    : colors.onSurface,
                },
              ]}
            >
              Gym Training
            </Text>
            <Text
              style={[
                styles.locationDesc,
                {
                  color: workoutLocation === 'GYM'
                    ? colors.onPrimaryContainer
                    : colors.onSurfaceVariant,
                },
              ]}
            >
              Full gym setup: barbells, heavy dumbbells, cables, and machines.
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 2. Weekly Training Frequency */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Calendar size={16} color={custom.primaryStrong || colors.primary} />
          <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
            Workout Frequency
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
          How many days per week can you commit to lifting?
        </Text>

        <View style={styles.frequencyList}>
          {DAYS_OPTIONS.map((item) => {
            const isSelected = preferredWorkoutDays === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => setPreferredWorkoutDays(item.value)}
                style={[
                  styles.frequencyCard,
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
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.frequencyTitle,
                      {
                        color: isSelected
                          ? colors.onPrimaryContainer
                          : colors.onSurface,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.frequencyDesc,
                      {
                        color: isSelected
                          ? colors.onPrimaryContainer
                          : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {item.desc}
                  </Text>
                </View>

                {isSelected ? (
                  <CheckCircle2 size={18} color={custom.primaryStrong || colors.primary} />
                ) : (
                  <View
                    style={[
                      styles.unselectedCircle,
                      { borderColor: colors.outlineVariant },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 3. Preferred Workout Time of Day */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Clock size={16} color={custom.primaryStrong || colors.primary} />
          <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
            Preferred Workout Time
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
          We schedule notifications and energy recommendations around this window.
        </Text>

        <View style={styles.timeGrid}>
          {TIME_OPTIONS.map((t) => {
            const isSelected = preferredWorkoutTime === t.key;
            const IconComp = t.icon;
            return (
              <Pressable
                key={t.key}
                onPress={() => setPreferredWorkoutTime(t.key)}
                style={[
                  styles.timeCard,
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
                <View style={styles.timeCardTop}>
                  <IconComp
                    size={20}
                    color={
                      isSelected
                        ? (custom.primaryStrong || colors.primary)
                        : colors.onSurfaceVariant
                    }
                  />
                  {isSelected && (
                    <CheckCircle2 size={16} color={custom.primaryStrong || colors.primary} />
                  )}
                </View>
                <Text
                  style={[
                    styles.timeLabel,
                    {
                      color: isSelected
                        ? colors.onPrimaryContainer
                        : colors.onSurface,
                    },
                  ]}
                >
                  {t.label}
                </Text>
                <Text
                  style={[
                    styles.timeWindow,
                    {
                      color: isSelected
                        ? colors.onPrimaryContainer
                        : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {t.time}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  section: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
    marginBottom: 12,
  },
  locationGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  locationCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  locationDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  frequencyList: {
    gap: 8,
  },
  frequencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  frequencyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  frequencyDesc: {
    fontSize: 12,
  },
  unselectedCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeCard: {
    width: '48%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  timeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  timeWindow: {
    fontSize: 11,
    fontWeight: '600',
  },
});
