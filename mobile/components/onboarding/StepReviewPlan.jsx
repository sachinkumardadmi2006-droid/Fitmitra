import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  User,
  Dumbbell,
  Target,
  Award,
  Utensils,
  ShieldCheck,
  Edit3,
  Flame,
  CheckCircle2,
} from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from '../ui/AppCard';
import AppButton from '../ui/AppButton';

export default function StepReviewPlan({
  // State from previous steps
  name,
  gender,
  age,
  height,
  weight,
  workoutLocation,
  preferredWorkoutDays,
  preferredWorkoutTime,
  selectedProgram,
  selectedWorkoutPlan,
  experienceLevel,
  dietType,
  dailyBudgetInr,
  isSubscriptionVerified,
  // Navigation / Submit handlers
  onJumpToStep,
  onSubmitPlan,
  isSubmitting,
}) {
  const { theme, isDark } = useAppTheme();
  const { colors, custom } = theme;

  // Calculate target daily calories & macros
  const targets = useMemo(() => {
    const w = parseFloat(weight) || 70;
    const h = parseInt(height, 10) || 170;
    const a = parseInt(age, 10) || 24;

    // BMR (Mifflin-St Jeor formula)
    let bmr = 10 * w + 6.25 * h - 5 * a;
    if (gender === 'Male') bmr += 5;
    else if (gender === 'Female') bmr -= 161;
    else bmr -= 80;

    // Activity multiplier based on days per week
    const multiplier =
      preferredWorkoutDays >= 6
        ? 1.65
        : preferredWorkoutDays >= 5
          ? 1.55
          : preferredWorkoutDays >= 4
            ? 1.45
            : 1.35;

    let cal = Math.round(bmr * multiplier);
    const goalUpper = String(selectedProgram?.goal || '').toUpperCase();
    if (goalUpper.includes('FAT') || goalUpper.includes('WEIGHT') || goalUpper.includes('LOSS')) {
      cal -= 450;
    } else if (goalUpper.includes('MUSCLE') || goalUpper.includes('STRENGTH') || goalUpper.includes('GAIN')) {
      cal += 350;
    }

    const protein = Math.round(w * 2.0);
    const fats = Math.round((cal * 0.25) / 9);
    const carbs = Math.max(50, Math.round((cal - protein * 4 - fats * 9) / 4));

    // Live BMI
    const hMeters = h / 100;
    const bmi = (w / (hMeters * hMeters)).toFixed(1);

    return { cal, protein, carbs, fats, bmi };
  }, [weight, height, age, gender, preferredWorkoutDays, selectedProgram]);

  const formatLocation = (loc) => (loc === 'HOME' ? 'Home (Bands & Bodyweight)' : 'Gym (Full Equipment)');
  const formatTime = (timeKey) => {
    switch (timeKey) {
      case 'EARLY_MORNING':
        return 'Early Morning (5 AM – 8 AM)';
      case 'MORNING':
        return 'Morning (8 AM – 12 PM)';
      case 'EVENING':
        return 'Evening (4 PM – 8 PM)';
      case 'NIGHT':
        return 'Night (8 PM – 11 PM)';
      default:
        return timeKey || 'Morning';
    }
  };
  const formatDiet = (d) => {
    switch (d) {
      case 'VEG':
        return 'Vegetarian';
      case 'EGG':
        return 'Eggetarian';
      case 'NON_VEG':
        return 'Non-Vegetarian';
      default:
        return d || 'Vegetarian';
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Daily Calorie & Macro Target Banner */}
      <AppCard
        variant="elevated"
        style={[
          styles.targetCard,
          {
            backgroundColor: colors.primaryContainer,
            borderColor: custom.primaryStrong || colors.primary,
          },
        ]}
        padded={false}
      >
        <View style={styles.targetPadding}>
          <View style={styles.targetHeader}>
            <View style={styles.targetHeaderLeft}>
              <Flame size={18} color={custom.primaryStrong || colors.primary} />
              <Text
                style={[
                  styles.targetHeadline,
                  { color: custom.primaryStrong || colors.primary },
                ]}
              >
                YOUR DAILY CALIBRATION
              </Text>
            </View>
            <View
              style={[
                styles.calBadge,
                { backgroundColor: colors.surface },
              ]}
            >
              <Text
                style={[
                  styles.calBadgeText,
                  { color: custom.primaryStrong || colors.primary },
                ]}
              >
                {targets.cal} kcal / day
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.targetDesc,
              { color: colors.onPrimaryContainer },
            ]}
          >
            Calibrated for your {selectedProgram?.name || selectedProgram?.title || 'program'} and {preferredWorkoutDays}-day training schedule.
          </Text>

          {/* Macro Breakdown Grid */}
          <View style={styles.macroGrid}>
            <View
              style={[
                styles.macroTile,
                { backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.macroLabel, { color: colors.onSurfaceVariant }]}>
                PROTEIN
              </Text>
              <Text
                style={[
                  styles.macroValue,
                  { color: custom.primaryStrong || colors.primary },
                ]}
              >
                {targets.protein}g
              </Text>
            </View>

            <View
              style={[
                styles.macroTile,
                { backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.macroLabel, { color: colors.onSurfaceVariant }]}>
                CARBS
              </Text>
              <Text style={[styles.macroValue, { color: colors.onSurface }]}>
                {targets.carbs}g
              </Text>
            </View>

            <View
              style={[
                styles.macroTile,
                { backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.macroLabel, { color: colors.onSurfaceVariant }]}>
                FATS
              </Text>
              <Text style={[styles.macroValue, { color: colors.onSurface }]}>
                {targets.fats}g
              </Text>
            </View>
          </View>
        </View>
      </AppCard>

      {/* 2. Structured Section Summaries with Jump-To-Edit */}
      <View style={styles.summaryList}>
        {/* Personal Details */}
        <AppCard
          variant="elevated"
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? colors.elevation.level1 : colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}
          padded={false}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <User size={16} color={custom.primaryStrong || colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Personal Profile
              </Text>
            </View>
            <Pressable
              onPress={() => onJumpToStep(1)}
              hitSlop={8}
              style={styles.editBtn}
            >
              <Edit3 size={13} color={custom.primaryStrong || colors.primary} />
              <Text
                style={[
                  styles.editText,
                  { color: custom.primaryStrong || colors.primary },
                ]}
              >
                Edit
              </Text>
            </Pressable>
          </View>
          <View style={styles.sectionBody}>
            <Text style={[styles.summaryMainText, { color: colors.onSurface }]}>
              {name || 'Athlete'} • {gender} • {age} yrs
            </Text>
            <Text style={[styles.summarySubText, { color: colors.onSurfaceVariant }]}>
              Height: {height} cm • Weight: {weight} kg • BMI: {targets.bmi}
            </Text>
          </View>
        </AppCard>

        {/* Workout Preferences */}
        <AppCard
          variant="elevated"
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? colors.elevation.level1 : colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}
          padded={false}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Dumbbell size={16} color={custom.primaryStrong || colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Workout Routine
              </Text>
            </View>
            <Pressable
              onPress={() => onJumpToStep(2)}
              hitSlop={8}
              style={styles.editBtn}
            >
              <Edit3 size={13} color={custom.primaryStrong || colors.primary} />
              <Text
                style={[
                  styles.editText,
                  { color: custom.primaryStrong || colors.primary },
                ]}
              >
                Edit
              </Text>
            </Pressable>
          </View>
          <View style={styles.sectionBody}>
            <Text style={[styles.summaryMainText, { color: colors.onSurface }]}>
              {formatLocation(workoutLocation)}
            </Text>
            <Text style={[styles.summarySubText, { color: colors.onSurfaceVariant }]}>
              {preferredWorkoutDays} Days / Week • {formatTime(preferredWorkoutTime)}
            </Text>
          </View>
        </AppCard>

        {/* Goal & Program */}
        <AppCard
          variant="elevated"
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? colors.elevation.level1 : colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}
          padded={false}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Target size={16} color={custom.primaryStrong || colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Goal & Program
              </Text>
            </View>
            <Pressable
              onPress={() => onJumpToStep(3)}
              hitSlop={8}
              style={styles.editBtn}
            >
              <Edit3 size={13} color={custom.primaryStrong || colors.primary} />
              <Text
                style={[
                  styles.editText,
                  { color: custom.primaryStrong || colors.primary },
                ]}
              >
                Edit
              </Text>
            </Pressable>
          </View>
          <View style={styles.sectionBody}>
            <Text style={[styles.summaryMainText, { color: colors.onSurface }]}>
              {selectedProgram?.name || selectedProgram?.title || 'Selected Program'}
            </Text>
            <Text style={[styles.summarySubText, { color: colors.onSurfaceVariant }]}>
              Plan: {selectedWorkoutPlan?.name || selectedWorkoutPlan?.title || 'Standard Plan'} • {selectedWorkoutPlan?.daysPerWeek || preferredWorkoutDays} Days/Wk
            </Text>
          </View>
        </AppCard>

        {/* Fitness Level */}
        <AppCard
          variant="elevated"
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? colors.elevation.level1 : colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}
          padded={false}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Award size={16} color={custom.primaryStrong || colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Lifting Experience
              </Text>
            </View>
            <Pressable
              onPress={() => onJumpToStep(4)}
              hitSlop={8}
              style={styles.editBtn}
            >
              <Edit3 size={13} color={custom.primaryStrong || colors.primary} />
              <Text
                style={[
                  styles.editText,
                  { color: custom.primaryStrong || colors.primary },
                ]}
              >
                Edit
              </Text>
            </Pressable>
          </View>
          <View style={styles.sectionBody}>
            <Text style={[styles.summaryMainText, { color: colors.onSurface }]}>
              {experienceLevel} Level
            </Text>
            <Text style={[styles.summarySubText, { color: colors.onSurfaceVariant }]}>
              Calibrated exercise complexity and volume curve
            </Text>
          </View>
        </AppCard>

        {/* Diet & Budget */}
        <AppCard
          variant="elevated"
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? colors.elevation.level1 : colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}
          padded={false}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Utensils size={16} color={custom.primaryStrong || colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Nutrition & Budget
              </Text>
            </View>
            <Pressable
              onPress={() => onJumpToStep(5)}
              hitSlop={8}
              style={styles.editBtn}
            >
              <Edit3 size={13} color={custom.primaryStrong || colors.primary} />
              <Text
                style={[
                  styles.editText,
                  { color: custom.primaryStrong || colors.primary },
                ]}
              >
                Edit
              </Text>
            </Pressable>
          </View>
          <View style={styles.sectionBody}>
            <Text style={[styles.summaryMainText, { color: colors.onSurface }]}>
              {formatDiet(dietType)}
            </Text>
            <Text style={[styles.summarySubText, { color: colors.onSurfaceVariant }]}>
              Budget: ₹{dailyBudgetInr} / day (~₹{dailyBudgetInr * 30} / month)
            </Text>
          </View>
        </AppCard>

        {/* Subscription Gate Badge */}
        <AppCard
          variant="elevated"
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? colors.elevation.level1 : colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}
          padded={false}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <ShieldCheck size={16} color={custom.primaryStrong || colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                FitMitra Membership
              </Text>
            </View>
            <View
              style={[
                styles.activeBadge,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <CheckCircle2
                size={12}
                color={custom.primaryStrong || colors.primary}
              />
              <Text
                style={[
                  styles.activeBadgeText,
                  { color: custom.primaryStrong || colors.primary },
                ]}
              >
                Active
              </Text>
            </View>
          </View>
          <View style={styles.sectionBody}>
            <Text style={[styles.summaryMainText, { color: colors.onSurface }]}>
              Verified Pro Membership
            </Text>
            <Text style={[styles.summarySubText, { color: colors.onSurfaceVariant }]}>
              All workouts, AI coach queries, and meal plans are unlocked
            </Text>
          </View>
        </AppCard>
      </View>

      {/* Primary Action Button */}
      <View style={styles.footerAction}>
        <AppButton
          label="Create My Plan"
          onPress={onSubmitPlan}
          loading={isSubmitting}
          disabled={isSubmitting}
          icon="check-bold"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  targetCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  targetPadding: {
    padding: 16,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetHeadline: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  calBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  calBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  targetDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  macroTile: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  summaryList: {
    gap: 10,
    marginBottom: 20,
  },
  sectionCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionBody: {
    paddingLeft: 22,
  },
  summaryMainText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  summarySubText: {
    fontSize: 12,
    lineHeight: 16,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  footerAction: {
    marginTop: 4,
  },
});
