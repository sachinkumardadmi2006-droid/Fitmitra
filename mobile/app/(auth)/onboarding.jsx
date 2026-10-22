import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Target, UserCheck, Flame, ArrowLeft } from 'lucide-react-native';
import { profileService, authService } from '../../services';
import { emitDbUpdate } from '../../utils/events';
import { useAppTheme } from '../../theme/ThemeContext';
import { AppButton, AppCard } from '../../components/ui';

export default function Onboarding() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Selected values (preserved across steps)
  const [goal, setGoal] = useState('Muscle Gain');
  const [experience, setExperience] = useState('Intermediate');
  const [age, setAge] = useState('24');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('72');
  const [gender, setGender] = useState('Male');
  const [activity, setActivity] = useState('Moderately Active');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const goals = [
    {
      key: 'Muscle Gain',
      enumVal: 'MUSCLE_GAIN',
      icon: Flame,
      title: 'Muscle Gain',
      desc: 'Build lean muscle mass, optimize recovery, and gain strength.',
    },
    {
      key: 'Fat Loss',
      enumVal: 'WEIGHT_LOSS',
      icon: Target,
      title: 'Fat Loss',
      desc: 'Shred body fat, lean out, and improve cardiovascular health.',
    },
    {
      key: 'General Fitness',
      enumVal: 'GENERAL_FITNESS',
      icon: UserCheck,
      title: 'General Fitness',
      desc: 'Build consistent athletic habits, mobility, and overall stamina.',
    },
  ];

  const experiences = [
    {
      key: 'Beginner',
      enumVal: 'BEGINNER',
      num: '1',
      title: 'Beginner',
      desc: '0 to 6 months of structured resistance training.',
    },
    {
      key: 'Intermediate',
      enumVal: 'INTERMEDIATE',
      num: '2',
      title: 'Intermediate',
      desc: '6 months to 2 years of regular training.',
    },
    {
      key: 'Advanced',
      enumVal: 'ADVANCED',
      num: '3',
      title: 'Advanced',
      desc: '2+ years of consistent high-intensity training.',
    },
  ];

  const genders = ['Male', 'Female', 'Other'];
  const activities = ['Sedentary', 'Moderately Active', 'Very Active'];

  const validateStep3 = () => {
    const a = parseInt(age, 10);
    if (!a || isNaN(a) || a < 14 || a > 100) {
      return 'Please enter a valid age between 14 and 100.';
    }
    const h = parseInt(height, 10);
    if (!h || isNaN(h) || h < 50 || h > 250) {
      return 'Please enter a valid height between 50 cm and 250 cm.';
    }
    const w = parseFloat(weight);
    if (!w || isNaN(w) || w < 20 || w > 300) {
      return 'Please enter a valid weight between 20 kg and 300 kg.';
    }
    return '';
  };

  const nextStep = () => {
    setError('');
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    const validationError = validateStep3();
    if (validationError) {
      setError(validationError);
      return;
    }

    const w = parseFloat(weight) || 70;
    const h = parseInt(height, 10) || 170;
    const a = parseInt(age, 10) || 24;

    // Daily calorie & macro target estimation
    const baseCal =
      gender === 'Male'
        ? 10 * w + 6.25 * h - 5 * a + 5
        : 10 * w + 6.25 * h - 5 * a - 161;
    const multiplier =
      activity === 'Moderately Active' ? 1.4 : activity === 'Very Active' ? 1.6 : 1.2;
    let targetCal = Math.round(baseCal * multiplier);
    if (goal === 'Fat Loss') targetCal -= 450;
    else if (goal === 'Muscle Gain') targetCal += 350;

    const targetProtein = Math.round(w * 2.0);
    const targetFats = Math.round((targetCal * 0.25) / 9);
    const targetCarbs = Math.round((targetCal - targetProtein * 4 - targetFats * 9) / 4);

    const matchedGoal = goals.find((g) => g.key === goal);
    const goalEnum = matchedGoal ? matchedGoal.enumVal : 'GENERAL_FITNESS';

    const matchedExp = experiences.find((e) => e.key === experience);
    const expEnum = matchedExp ? matchedExp.enumVal : 'INTERMEDIATE';

    setError('');
    setLoading(true);

    try {
      // Prompt 4B verified payload: send all required fields to backend
      const dob = a ? new Date(new Date().getFullYear() - a, 0, 1).toISOString() : null;
      const calculatedTargetWeight =
        goal === 'Fat Loss'
          ? Math.round(w * 0.9)
          : goal === 'Muscle Gain'
            ? Math.round(w * 1.08)
            : Math.round(w);
      const safeTargetWeight = Math.min(300, Math.max(20, calculatedTargetWeight));

      await profileService.updateProfile({
        heightCm: h,
        weightKg: w,
        goal: goalEnum,
        experienceLevel: expEnum,
        gender,
        activityLevel: activity,
        dateOfBirth: dob,
        targetWeightKg: safeTargetWeight,
      });

      // Update local user and establish onboarded state
      const currentUser = (await authService.getLocalUser()) || {};
      const updatedUser = {
        ...currentUser,
        isOnboarded: true,
        fitnessGoal: goal,
        experienceLevel: experience,
        age: a,
        height: h,
        weight: w,
        currentWeight: w,
        startingWeight: w,
        goalWeight:
          goal === 'Fat Loss'
            ? Math.round(w * 0.9)
            : goal === 'Muscle Gain'
              ? Math.round(w * 1.08)
              : w,
        gender,
        activityLevel: activity,
        targetCal,
        targetProtein,
        targetCarbs,
        targetFats,
      };

      await authService.saveLocalUser(updatedUser);
      await authService.setOnboardedStatus(true);
      emitDbUpdate();

      // Auth gate in _layout detects isOnboarded = true and navigates to tabs
      router.replace('/(tabs)');
    } catch (e) {
      console.warn('Onboarding profile sync error:', e?.message || e);
      setError(e?.message || 'Failed to save onboarding details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step Indicator Header */}
        <View style={styles.header}>
          <View style={styles.stepRow}>
            <Text style={[styles.stepCount, { color: theme.custom.primaryStrong || theme.colors.primary }]}>
              STEP {step} OF {totalSteps}
            </Text>
            {step > 1 && (
              <Pressable
                onPress={prevStep}
                hitSlop={8}
                style={[
                  styles.headerBackBtn,
                  { backgroundColor: isDark ? theme.colors.elevation.level1 : theme.colors.surfaceVariant },
                ]}
              >
                <ArrowLeft size={16} color={theme.colors.onSurface} />
              </Pressable>
            )}
          </View>

          {/* Progress Bar */}
          <View
            style={[
              styles.progressBarTrack,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${(step / totalSteps) * 100}%`,
                  backgroundColor: theme.custom.primaryStrong || theme.colors.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Error Banner */}
        {error ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: theme.colors.errorContainer,
                borderColor: theme.colors.error,
              },
            ]}
          >
            <Text style={[styles.errorBannerText, { color: theme.colors.onErrorContainer }]}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* STEP 1: Fitness Goal */}
        {step === 1 && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              Select Your Primary Goal
            </Text>
            <Text style={[styles.sectionDesc, { color: theme.colors.onSurfaceVariant }]}>
              We calibrate your daily workouts, calorie requirements, and macronutrients based on your objective.
            </Text>

            <View style={{ gap: 12 }}>
              {goals.map((g) => {
                const isSelected = goal === g.key;
                const IconComponent = g.icon;
                return (
                  <Pressable
                    key={g.key}
                    onPress={() => setGoal(g.key)}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primaryContainer
                          : theme.colors.surface,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.outlineVariant,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconWrap,
                        {
                          backgroundColor: isSelected
                            ? (theme.custom.primaryStrong || theme.colors.primary)
                            : (isDark ? theme.colors.elevation.level2 : theme.colors.surfaceVariant),
                        },
                      ]}
                    >
                      <IconComponent
                        size={22}
                        color={isSelected ? theme.colors.onPrimary : theme.colors.onSurface}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.optionTitle,
                          {
                            color: isSelected
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurface,
                          },
                        ]}
                      >
                        {g.title}
                      </Text>
                      <Text
                        style={[
                          styles.optionDesc,
                          {
                            color: isSelected
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurfaceVariant,
                          },
                        ]}
                      >
                        {g.desc}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 2: Experience Level */}
        {step === 2 && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              Select Experience Level
            </Text>
            <Text style={[styles.sectionDesc, { color: theme.colors.onSurfaceVariant }]}>
              We tailor exercise complexity, volume, and recovery cycles according to your lifting background.
            </Text>

            <View style={{ gap: 12 }}>
              {experiences.map((e) => {
                const isSelected = experience === e.key;
                return (
                  <Pressable
                    key={e.key}
                    onPress={() => setExperience(e.key)}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primaryContainer
                          : theme.colors.surface,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.outlineVariant,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.numBadge,
                        {
                          backgroundColor: isSelected
                            ? (theme.custom.primaryStrong || theme.colors.primary)
                            : (isDark ? theme.colors.elevation.level2 : theme.colors.surfaceVariant),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.numText,
                          {
                            color: isSelected ? theme.colors.onPrimary : theme.colors.onSurface,
                          },
                        ]}
                      >
                        {e.num}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.optionTitle,
                          {
                            color: isSelected
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurface,
                          },
                        ]}
                      >
                        {e.title}
                      </Text>
                      <Text
                        style={[
                          styles.optionDesc,
                          {
                            color: isSelected
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurfaceVariant,
                          },
                        ]}
                      >
                        {e.desc}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 3: Details & Biometrics */}
        {step === 3 && (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              Enter Your Biometrics
            </Text>
            <Text style={[styles.sectionDesc, { color: theme.colors.onSurfaceVariant }]}>
              Accurate details ensure our nutrition and workout algorithms provide optimal targets.
            </Text>

            <AppCard
              variant="elevated"
              style={[styles.formCard, { backgroundColor: theme.colors.surface }]}
              padded={false}
            >
              <View style={styles.formCardPadding}>
                {/* Age & Height */}
                <View style={styles.formRow}>
                  <View style={styles.formHalf}>
                    <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                      Age (years)
                    </Text>
                    <View
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDark ? theme.colors.elevation.level1 : theme.colors.background,
                          borderColor: theme.colors.outlineVariant,
                        },
                      ]}
                    >
                      <TextInput
                        style={[styles.textInput, { color: theme.colors.onSurface }]}
                        keyboardType="number-pad"
                        placeholder="24"
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        value={age}
                        onChangeText={setAge}
                        maxLength={3}
                        accessibilityLabel="Age input"
                      />
                    </View>
                  </View>

                  <View style={styles.formHalf}>
                    <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                      Height (cm)
                    </Text>
                    <View
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDark ? theme.colors.elevation.level1 : theme.colors.background,
                          borderColor: theme.colors.outlineVariant,
                        },
                      ]}
                    >
                      <TextInput
                        style={[styles.textInput, { color: theme.colors.onSurface }]}
                        keyboardType="number-pad"
                        placeholder="175"
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        value={height}
                        onChangeText={setHeight}
                        maxLength={3}
                        accessibilityLabel="Height input"
                      />
                    </View>
                  </View>
                </View>

                {/* Weight */}
                <View style={[styles.formRow, { marginTop: 14 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>
                      Weight (kg)
                    </Text>
                    <View
                      style={[
                        styles.inputContainer,
                        {
                          backgroundColor: isDark ? theme.colors.elevation.level1 : theme.colors.background,
                          borderColor: theme.colors.outlineVariant,
                        },
                      ]}
                    >
                      <TextInput
                        style={[styles.textInput, { color: theme.colors.onSurface }]}
                        keyboardType="decimal-pad"
                        placeholder="72"
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        value={weight}
                        onChangeText={setWeight}
                        maxLength={5}
                        accessibilityLabel="Weight input"
                      />
                    </View>
                  </View>
                </View>

                {/* Gender / Sex */}
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface, marginBottom: 8 }]}>
                    Biological Sex / Gender
                  </Text>
                  <View style={styles.chipRow}>
                    {genders.map((g) => {
                      const isActive = gender === g;
                      return (
                        <Pressable
                          key={g}
                          onPress={() => setGender(g)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isActive
                                ? (theme.custom.primaryStrong || theme.colors.primary)
                                : (isDark ? theme.colors.elevation.level1 : theme.colors.surfaceVariant),
                              borderColor: isActive
                                ? (theme.custom.primaryStrong || theme.colors.primary)
                                : theme.colors.outlineVariant,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: isActive
                                  ? theme.colors.onPrimary
                                  : theme.colors.onSurface,
                              },
                            ]}
                          >
                            {g}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Activity Level */}
                <View style={{ marginTop: 18 }}>
                  <Text style={[styles.inputLabel, { color: theme.colors.onSurface, marginBottom: 8 }]}>
                    Activity Level
                  </Text>
                  <View style={styles.chipRow}>
                    {activities.map((a) => {
                      const isActive = activity === a;
                      return (
                        <Pressable
                          key={a}
                          onPress={() => setActivity(a)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isActive
                                ? (theme.custom.primaryStrong || theme.colors.primary)
                                : (isDark ? theme.colors.elevation.level1 : theme.colors.surfaceVariant),
                              borderColor: isActive
                                ? (theme.custom.primaryStrong || theme.colors.primary)
                                : theme.colors.outlineVariant,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: isActive
                                  ? theme.colors.onPrimary
                                  : theme.colors.onSurface,
                              },
                            ]}
                          >
                            {a}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            </AppCard>
          </View>
        )}

        {/* Step Navigation Controls */}
        <View style={styles.footerControls}>
          {step > 1 ? (
            <View style={{ flex: 1, marginRight: 10 }}>
              <AppButton
                label="Back"
                onPress={prevStep}
                mode="outlined"
                disabled={loading}
              />
            </View>
          ) : null}

          <View style={{ flex: step > 1 ? 2 : 1 }}>
            <AppButton
              label={step === totalSteps ? 'Finish Profile' : 'Continue'}
              onPress={nextStep}
              mode="contained"
              loading={loading}
              disabled={loading}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCount: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  sectionDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    fontSize: 16,
    fontWeight: '800',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  formCard: {
    width: '100%',
    borderRadius: 16,
    marginBottom: 10,
  },
  formCardPadding: {
    padding: 18,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputContainer: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    height: '100%',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
});
