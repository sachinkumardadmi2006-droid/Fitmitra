import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { profileService, authService } from '../../services';
import { emitDbUpdate } from '../../utils/events';
import { AppButton } from '../../components/ui';

import {
  OnboardingProgressHeader,
  StepPersonalDetails,
  StepWorkoutPreferences,
  StepGoalSelection,
  StepFitnessLevel,
  StepDietBudget,
  StepSubscriptionGate,
  StepReviewPlan,
} from '../../components/onboarding';

export default function Onboarding() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const { colors, custom } = theme;
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();

  const [step, setStep] = useState(1);
  const totalSteps = 7;

  // Step 1: Personal Details
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('24');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('72');

  // Step 2: Workout Preferences
  const [workoutLocation, setWorkoutLocation] = useState('GYM');
  const [preferredWorkoutDays, setPreferredWorkoutDays] = useState(5);
  const [preferredWorkoutTime, setPreferredWorkoutTime] = useState('MORNING');

  // Step 3: Dynamic Goals / Program
  const [selectedProgram, setSelectedProgram] = useState(null);

  // Step 4: Fitness Level
  const [experienceLevel, setExperienceLevel] = useState('INTERMEDIATE');

  // Step 5: Diet & Budget
  const [dietType, setDietType] = useState('VEG');
  const [dailyBudgetInr, setDailyBudgetInr] = useState(200);

  // Step 6: Subscription Gate
  const [isSubscriptionVerified, setIsSubscriptionVerified] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill user details if available from profile or user state
  useEffect(() => {
    const existingName = user?.name || user?.displayName || profile?.displayName || '';
    if (existingName && !name) {
      setName(existingName);
    }
    if (profile?.gender) setGender(profile.gender);
    if (profile?.heightCm) setHeight(String(profile.heightCm));
    if (profile?.weightKg) setWeight(String(profile.weightKg));
  }, [user, profile]);

  // Validation functions per step
  const validateStep1 = () => {
    if (!name?.trim()) {
      return 'Please enter your full name.';
    }
    const a = parseInt(age, 10);
    if (!a || isNaN(a) || a < 14 || a > 100) {
      return 'Please enter a valid age between 14 and 100 years.';
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

  const validateStep2 = () => {
    if (!workoutLocation) return 'Please choose your preferred workout location.';
    if (!preferredWorkoutDays) return 'Please select how many days you can train per week.';
    if (!preferredWorkoutTime) return 'Please pick your preferred time of day.';
    return '';
  };

  const validateStep3 = () => {
    if (!selectedProgram) {
      return 'Please select a fitness program that aligns with your goal.';
    }
    return '';
  };

  const validateStep4 = () => {
    if (!experienceLevel) return 'Please select your lifting experience level.';
    return '';
  };

  const validateStep5 = () => {
    if (!dietType) return 'Please select your dietary preference.';
    if (!dailyBudgetInr) return 'Please select your daily grocery / food budget.';
    return '';
  };

  const validateStep6 = () => {
    if (!isSubscriptionVerified) {
      return 'An active FitMitra membership is required to proceed. Please subscribe to unlock your plan.';
    }
    return '';
  };

  const handleNext = () => {
    setError('');

    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
    } else if (step === 2) {
      const err = validateStep2();
      if (err) {
        setError(err);
        return;
      }
    } else if (step === 3) {
      const err = validateStep3();
      if (err) {
        setError(err);
        return;
      }
    } else if (step === 4) {
      const err = validateStep4();
      if (err) {
        setError(err);
        return;
      }
    } else if (step === 5) {
      const err = validateStep5();
      if (err) {
        setError(err);
        return;
      }
    } else if (step === 6) {
      const err = validateStep6();
      if (err) {
        setError(err);
        return;
      }
    }

    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleJumpToStep = (targetStep) => {
    setError('');
    if (targetStep >= 1 && targetStep <= totalSteps) {
      setStep(targetStep);
    }
  };

  // Final plan submission (Step 7)
  const handleFinalSubmit = async () => {
    const err1 = validateStep1();
    if (err1) {
      setStep(1);
      setError(err1);
      return;
    }
    const err6 = validateStep6();
    if (err6) {
      setStep(6);
      setError(err6);
      return;
    }

    const w = parseFloat(weight) || 70;
    const h = parseInt(height, 10) || 170;
    const a = parseInt(age, 10) || 24;

    // Daily calorie & macro calculation
    let bmr = 10 * w + 6.25 * h - 5 * a;
    if (gender === 'Male') bmr += 5;
    else if (gender === 'Female') bmr -= 161;
    else bmr -= 80;

    const multiplier =
      preferredWorkoutDays >= 6
        ? 1.65
        : preferredWorkoutDays >= 5
          ? 1.55
          : preferredWorkoutDays >= 4
            ? 1.45
            : 1.35;

    let targetCal = Math.round(bmr * multiplier);
    const goalUpper = String(selectedProgram?.goal || '').toUpperCase();
    if (goalUpper.includes('FAT') || goalUpper.includes('WEIGHT') || goalUpper.includes('LOSS')) {
      targetCal -= 450;
    } else if (goalUpper.includes('MUSCLE') || goalUpper.includes('STRENGTH') || goalUpper.includes('GAIN')) {
      targetCal += 350;
    }

    const targetProtein = Math.round(w * 2.0);
    const targetFats = Math.round((targetCal * 0.25) / 9);
    const targetCarbs = Math.max(50, Math.round((targetCal - targetProtein * 4 - targetFats * 9) / 4));

    const calculatedTargetWeight =
      goalUpper.includes('FAT') || goalUpper.includes('WEIGHT') || goalUpper.includes('LOSS')
        ? Math.round(w * 0.9)
        : goalUpper.includes('MUSCLE') || goalUpper.includes('GAIN')
          ? Math.round(w * 1.08)
          : Math.round(w);
    const safeTargetWeight = Math.min(300, Math.max(20, calculatedTargetWeight));

    const dob = a ? new Date(new Date().getFullYear() - a, 0, 1).toISOString() : null;

    setError('');
    setLoading(true);

    try {
      // 1. Update Profile on backend
      await profileService.updateProfile({
        heightCm: h,
        weightKg: w,
        goal: selectedProgram?.goal || 'GENERAL_FITNESS',
        experienceLevel: experienceLevel || 'INTERMEDIATE',
        gender,
        dateOfBirth: dob,
        targetWeightKg: safeTargetWeight,
      });

      // 2. Save complete state to local user cache
      const currentUser = (await authService.getLocalUser()) || {};
      const updatedUser = {
        ...currentUser,
        name: name.trim(),
        displayName: name.trim(),
        isOnboarded: true,
        fitnessGoal: selectedProgram?.goal || 'GENERAL_FITNESS',
        programId: selectedProgram?._id || selectedProgram?.id || null,
        programName: selectedProgram?.name || selectedProgram?.title || null,
        workoutLocation,
        preferredWorkoutDays,
        preferredWorkoutTime,
        experienceLevel,
        dietType,
        dailyBudgetInr,
        age: a,
        height: h,
        weight: w,
        currentWeight: w,
        startingWeight: w,
        goalWeight: safeTargetWeight,
        gender,
        targetCal,
        targetProtein,
        targetCarbs,
        targetFats,
      };

      await authService.saveLocalUser(updatedUser);
      await authService.setOnboardedStatus(true, true);
      emitDbUpdate();

      // 3. Route to main application tabs
      router.replace('/(tabs)');
    } catch (e) {
      console.warn('[Onboarding] Error submitting profile plan:', e?.message || e);
      setError(e?.message || 'Failed to save your plan. Please check your connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  const getStepMetadata = () => {
    switch (step) {
      case 1:
        return {
          category: 'Profile',
          title: 'Personal Details',
          subtitle: 'Accurate biometrics ensure our algorithms calculate the ideal calorie and training baseline for your body.',
        };
      case 2:
        return {
          category: 'Routine',
          title: 'Workout Preferences',
          subtitle: 'Choose where and how often you will be training so we can adapt movement patterns to your equipment.',
        };
      case 3:
        return {
          category: 'Goal',
          title: 'Choose Your Program',
          subtitle: 'Select the training program tailored to your primary fitness ambition.',
        };
      case 4:
        return {
          category: 'Experience',
          title: 'Fitness Level',
          subtitle: 'Select your lifting background so we can modulate exercise difficulty, set volume, and recovery cycles.',
        };
      case 5:
        return {
          category: 'Nutrition',
          title: 'Diet & Budget',
          subtitle: 'We calibrate daily meal suggestions and grocery splits matching your nutrition preferences and budget.',
        };
      case 6:
        return {
          category: 'Membership',
          title: 'FitMitra Pro Access',
          subtitle: 'Unlock tailored workout programs, smart AI coaching, and macro targets with an active membership.',
        };
      case 7:
        return {
          category: 'Review',
          title: 'Review & Create Plan',
          subtitle: 'Review your personalized configuration and daily targets before generating your customized plan.',
        };
      default:
        return { category: '', title: '', subtitle: '' };
    }
  };

  const stepMeta = getStepMetadata();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 28,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Progress Header */}
        <OnboardingProgressHeader
          step={step}
          totalSteps={totalSteps}
          category={stepMeta.category}
          title={stepMeta.title}
          subtitle={stepMeta.subtitle}
          onBack={step > 1 ? handlePrev : null}
        />

        {/* Global Error Banner */}
        {error ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.errorContainer,
                borderColor: colors.error,
              },
            ]}
          >
            <Text
              style={[
                styles.errorBannerText,
                { color: colors.onErrorContainer },
              ]}
            >
              {error}
            </Text>
          </View>
        ) : null}

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <StepPersonalDetails
            name={name}
            setName={setName}
            gender={gender}
            setGender={setGender}
            age={age}
            setAge={setAge}
            height={height}
            setHeight={setHeight}
            weight={weight}
            setWeight={setWeight}
          />
        )}

        {/* Step 2: Workout Preferences */}
        {step === 2 && (
          <StepWorkoutPreferences
            workoutLocation={workoutLocation}
            setWorkoutLocation={setWorkoutLocation}
            preferredWorkoutDays={preferredWorkoutDays}
            setPreferredWorkoutDays={setPreferredWorkoutDays}
            preferredWorkoutTime={preferredWorkoutTime}
            setPreferredWorkoutTime={setPreferredWorkoutTime}
          />
        )}

        {/* Step 3: Dynamic Goals Selection */}
        {step === 3 && (
          <StepGoalSelection
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
          />
        )}

        {/* Step 4: Fitness Level */}
        {step === 4 && (
          <StepFitnessLevel
            experienceLevel={experienceLevel}
            setExperienceLevel={setExperienceLevel}
          />
        )}

        {/* Step 5: Diet & Budget */}
        {step === 5 && (
          <StepDietBudget
            dietType={dietType}
            setDietType={setDietType}
            dailyBudgetInr={dailyBudgetInr}
            setDailyBudgetInr={setDailyBudgetInr}
          />
        )}

        {/* Step 6: Subscription Verification Gate */}
        {step === 6 && (
          <StepSubscriptionGate
            isVerified={isSubscriptionVerified}
            setIsVerified={setIsSubscriptionVerified}
          />
        )}

        {/* Step 7: Review & Finalize Plan */}
        {step === 7 && (
          <StepReviewPlan
            name={name}
            gender={gender}
            age={age}
            height={height}
            weight={weight}
            workoutLocation={workoutLocation}
            preferredWorkoutDays={preferredWorkoutDays}
            preferredWorkoutTime={preferredWorkoutTime}
            selectedProgram={selectedProgram}
            experienceLevel={experienceLevel}
            dietType={dietType}
            dailyBudgetInr={dailyBudgetInr}
            isSubscriptionVerified={isSubscriptionVerified}
            onJumpToStep={handleJumpToStep}
            onSubmitPlan={handleFinalSubmit}
            isSubmitting={loading}
          />
        )}

        {/* Footer Navigation Controls (Steps 1 to 6) */}
        {step < totalSteps && (
          <View style={styles.footerControls}>
            {step > 1 ? (
              <View style={styles.backBtnWrap}>
                <AppButton
                  label="Back"
                  onPress={handlePrev}
                  mode="outlined"
                  disabled={loading}
                />
              </View>
            ) : null}

            <View style={styles.continueBtnWrap}>
              <AppButton
                label={
                  step === 6
                    ? isSubscriptionVerified
                      ? 'Continue to Review'
                      : 'Subscription Required'
                    : 'Continue'
                }
                onPress={handleNext}
                mode="contained"
                disabled={loading || (step === 6 && !isSubscriptionVerified)}
                loading={loading}
              />
            </View>
          </View>
        )}
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
  footerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  backBtnWrap: {
    flex: 1,
  },
  continueBtnWrap: {
    flex: 2,
  },
});
