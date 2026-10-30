import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { profileService, authService } from '../../services';
import { clearUserCache } from '../../services/queryClient';
import { emitDbUpdate } from '../../utils/events';
import { AppButton } from '../../components/ui';

import {
  OnboardingProgressHeader,
  StepPersonalDetails,
  StepWorkoutPreferences,
  StepGoalSelection,
  StepWorkoutPlanSelection,
  StepFitnessLevel,
  StepDietBudget,
  StepSubscriptionGate,
  StepReviewPlan,
} from '../../components/onboarding';

export default function Onboarding() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const { user, profile, syncSession, refreshProfile } = useAuth();

  const [step, setStep] = useState(1);
  const totalSteps = 8;

  // Step 1: Personal Details
  const [name, setName] = useState(
    () => user?.name || user?.displayName || profile?.displayName || ''
  );
  const [gender, setGender] = useState(
    () => (profile?.gender ? String(profile.gender).toUpperCase() : 'MALE')
  );
  const [age, setAge] = useState('24');
  const [height, setHeight] = useState(
    () => (profile?.heightCm ? String(profile.heightCm) : '175')
  );
  const [weight, setWeight] = useState(
    () => (profile?.weight || profile?.weightKg ? String(profile.weight || profile.weightKg) : '72')
  );

  // Step 2: Workout Preferences
  const [workoutLocation, setWorkoutLocation] = useState('GYM');
  const [preferredWorkoutDays, setPreferredWorkoutDays] = useState(5);
  const [preferredWorkoutTime, setPreferredWorkoutTime] = useState('MORNING');

  // Step 3a: Dynamic Goals / Program
  const [selectedProgram, setSelectedProgram] = useState(null);

  // Step 3b: Workout Plan
  const [selectedWorkoutPlan, setSelectedWorkoutPlan] = useState(null);

  // Step 5: Fitness Level
  const [experienceLevel, setExperienceLevel] = useState('INTERMEDIATE');

  // Step 6: Diet & Budget
  const [dietType, setDietType] = useState('VEG');
  const [dailyBudgetInr, setDailyBudgetInr] = useState(200);

  // Step 7: Subscription Gate
  const [isSubscriptionVerified, setIsSubscriptionVerified] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getDraftKey = useCallback(async () => {
    const local = await authService.getLocalUser();
    const uId = user?._id || user?.id || local?._id || local?.id || profile?.userId;
    return uId ? `fitmitra_onboarding_draft_${uId}` : 'fitmitra_onboarding_draft';
  }, [user, profile]);

  // Hydrate user-scoped draft on mount
  useEffect(() => {
    let isMounted = true;
    const hydrateDraft = async () => {
      try {
        const key = await getDraftKey();
        const saved = await AsyncStorage.getItem(key);
        if (saved && isMounted) {
          const parsed = JSON.parse(saved);
          if (parsed.step && Number(parsed.step) >= 1 && Number(parsed.step) <= totalSteps) {
            setStep(Number(parsed.step));
          }
          if (parsed.name) setName(parsed.name);
          if (parsed.gender) setGender(parsed.gender);
          if (parsed.age) setAge(String(parsed.age));
          if (parsed.height) setHeight(String(parsed.height));
          if (parsed.weight) setWeight(String(parsed.weight));
          if (parsed.workoutLocation) setWorkoutLocation(parsed.workoutLocation);
          if (parsed.preferredWorkoutDays) setPreferredWorkoutDays(Number(parsed.preferredWorkoutDays));
          if (parsed.preferredWorkoutTime) setPreferredWorkoutTime(parsed.preferredWorkoutTime);
          if (parsed.selectedProgram) setSelectedProgram(parsed.selectedProgram);
          if (parsed.selectedWorkoutPlan) setSelectedWorkoutPlan(parsed.selectedWorkoutPlan);
          if (parsed.experienceLevel) setExperienceLevel(parsed.experienceLevel);
          if (parsed.dietType) setDietType(parsed.dietType);
          if (parsed.dailyBudgetInr) setDailyBudgetInr(Number(parsed.dailyBudgetInr));
        }
      } catch (err) {
        console.warn('[Onboarding] Failed to hydrate draft:', err?.message || err);
      }
    };
    hydrateDraft();
    return () => {
      isMounted = false;
    };
  }, [getDraftKey]);

  const saveCurrentDraft = useCallback(
    async (nextStep = null, extraFields = {}) => {
      try {
        const key = await getDraftKey();
        const draft = {
          step: nextStep !== null ? nextStep : step,
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
          ...extraFields,
        };
        await AsyncStorage.setItem(key, JSON.stringify(draft));
      } catch (_) { }
    },
    [
      getDraftKey,
      step,
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
    ]
  );

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
    if (!selectedWorkoutPlan) {
      return 'Please select a workout plan under your chosen program.';
    }
    return '';
  };

  const validateStep5 = () => {
    if (!experienceLevel) return 'Please select your lifting experience level.';
    return '';
  };

  const validateStep6 = () => {
    if (!dietType) return 'Please select your dietary preference.';
    if (!dailyBudgetInr) return 'Please select your daily grocery / food budget.';
    return '';
  };

  const validateStep7 = () => {
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
    } else if (step === 7) {
      const err = validateStep7();
      if (err) {
        setError(err);
        return;
      }
    }

    if (step < totalSteps) {
      const nextStep = step + 1;
      setStep(nextStep);
      saveCurrentDraft(nextStep);
    }
  };

  const handlePrev = () => {
    setError('');
    if (step > 1) {
      const prevStep = step - 1;
      setStep(prevStep);
      saveCurrentDraft(prevStep);
    }
  };

  const handleJumpToStep = (targetStep) => {
    setError('');
    if (targetStep >= 1 && targetStep <= totalSteps) {
      setStep(targetStep);
      saveCurrentDraft(targetStep);
    }
  };

  // Final plan submission (Step 8)
  const handleFinalSubmit = async () => {
    const err1 = validateStep1();
    if (err1) {
      setStep(1);
      setError(err1);
      return;
    }
    const err3 = validateStep3();
    if (err3) {
      setStep(3);
      setError(err3);
      return;
    }
    const err4 = validateStep4();
    if (err4) {
      setStep(4);
      setError(err4);
      return;
    }
    const err7 = validateStep7();
    if (err7) {
      setStep(7);
      setError(err7);
      return;
    }

    const w = parseFloat(weight) || 70;
    const h = parseInt(height, 10) || 170;
    const a = parseInt(age, 10) || 24;

    setError('');
    setLoading(true);

    try {
      // 1. Submit complete onboarding atomically to backend
      const onboardingPayload = {
        name: name.trim(),
        gender: String(gender).toUpperCase(),
        age: a,
        heightCm: h,
        weight: w,
        selectedGoal: String(selectedProgram?._id || selectedProgram?.id),
        selectedWorkoutPlan: String(selectedWorkoutPlan?._id || selectedWorkoutPlan?.id),
        experienceLevel: experienceLevel,
        preferredWorkoutLocation: workoutLocation,
        preferredWorkoutDays: Number(preferredWorkoutDays) === 6 ? 6 : 5,
        preferredWorkoutTime: preferredWorkoutTime,
        dietType: dietType === 'NON_VEG' ? 'NON_VEG' : 'VEG',
        dailyDietBudget: Number(dailyBudgetInr) || 0,
        notificationSettings: {
          workoutReminders: true,
          pointsAlerts: true,
          offersAndNews: true,
        },
      };

      const result = await profileService.completeOnboarding(onboardingPayload);

      // 2. Clear draft upon verified completion
      try {
        const key = await getDraftKey();
        await AsyncStorage.removeItem(key);
        await AsyncStorage.removeItem('fitmitra_onboarding_draft');
      } catch (_) { }

      // 3. Save updated user locally
      const currentUser = (await authService.getLocalUser()) || {};
      const updatedUser = {
        ...currentUser,
        name: name.trim(),
        displayName: name.trim(),
        isOnboarded: true,
        fitnessGoal: selectedProgram?.goal || 'GENERAL_FITNESS',
        programId: selectedProgram?._id || selectedProgram?.id || null,
        programName: selectedProgram?.name || selectedProgram?.title || null,
        workoutPlanId: selectedWorkoutPlan?._id || selectedWorkoutPlan?.id || null,
        workoutPlanName: selectedWorkoutPlan?.name || selectedWorkoutPlan?.title || null,
        workoutLocation,
        preferredWorkoutDays: Number(preferredWorkoutDays) === 6 ? 6 : 5,
        preferredWorkoutTime,
        experienceLevel,
        dietType: dietType === 'NON_VEG' ? 'NON_VEG' : 'VEG',
        dailyBudgetInr: Number(dailyBudgetInr) || 0,
        age: a,
        height: h,
        weight: w,
        gender: String(gender).toUpperCase(),
      };

      await clearUserCache();
      await authService.saveLocalUser(updatedUser);
      await authService.setOnboardedStatus(true, true);
      emitDbUpdate();

      if (syncSession) {
        await syncSession(updatedUser, result?.profile, true);
      } else {
        await refreshProfile?.();
      }

      router.replace('/(tabs)');
    } catch (e) {
      console.warn('[Onboarding] Error submitting profile plan:', e?.message || e);
      if (e?.status === 403 || /forbidden|pro|subscription/i.test(String(e?.message || ''))) {
        await saveCurrentDraft(7);
        router.push({ pathname: '/premium', params: { returnTo: '/(auth)/onboarding' } });
        return;
      }
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
          subtitle: 'Select the primary training program that aligns with your fitness ambition.',
        };
      case 4:
        return {
          category: 'Plan',
          title: 'Select Workout Plan',
          subtitle: 'Pick the workout split and schedule under your selected fitness program.',
        };
      case 5:
        return {
          category: 'Experience',
          title: 'Fitness Level',
          subtitle: 'Select your lifting background so we can modulate exercise difficulty, set volume, and recovery cycles.',
        };
      case 6:
        return {
          category: 'Nutrition',
          title: 'Diet & Budget',
          subtitle: 'We calibrate daily meal suggestions and grocery splits matching your nutrition preferences and budget.',
        };
      case 7:
        return {
          category: 'Membership',
          title: 'Membership & Access',
          subtitle: 'Review your access level or unlock tailored Pro workout programs, AI coaching, and macro targets.',
        };
      case 8:
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

        {/* Step 3: Dynamic Goals / Program Selection */}
        {step === 3 && (
          <StepGoalSelection
            selectedProgram={selectedProgram}
            setSelectedProgram={(prog) => {
              setSelectedProgram(prog);
              setSelectedWorkoutPlan(null);
            }}
          />
        )}

        {/* Step 4: Workout Plan Selection under Selected Program */}
        {step === 4 && (
          <StepWorkoutPlanSelection
            selectedProgram={selectedProgram}
            selectedWorkoutPlan={selectedWorkoutPlan}
            setSelectedWorkoutPlan={setSelectedWorkoutPlan}
            preferredWorkoutDays={preferredWorkoutDays}
            preferredWorkoutLocation={workoutLocation}
          />
        )}

        {/* Step 5: Fitness Level */}
        {step === 5 && (
          <StepFitnessLevel
            experienceLevel={experienceLevel}
            setExperienceLevel={setExperienceLevel}
          />
        )}

        {/* Step 6: Diet & Budget */}
        {step === 6 && (
          <StepDietBudget
            dietType={dietType}
            setDietType={setDietType}
            dailyBudgetInr={dailyBudgetInr}
            setDailyBudgetInr={setDailyBudgetInr}
          />
        )}

        {/* Step 7: Subscription Verification Gate */}
        {step === 7 && (
          <StepSubscriptionGate
            isVerified={isSubscriptionVerified}
            setIsVerified={setIsSubscriptionVerified}
            selectedProgram={selectedProgram}
            selectedWorkoutPlan={selectedWorkoutPlan}
          />
        )}

        {/* Step 8: Review & Finalize Plan */}
        {step === 8 && (
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
            selectedWorkoutPlan={selectedWorkoutPlan}
            experienceLevel={experienceLevel}
            dietType={dietType}
            dailyBudgetInr={dailyBudgetInr}
            isSubscriptionVerified={isSubscriptionVerified}
            onJumpToStep={handleJumpToStep}
            onSubmitPlan={handleFinalSubmit}
            isSubmitting={loading}
          />
        )}

        {/* Footer Navigation Controls (Steps 1 to 7) */}
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
                label={step === 7 ? 'Continue to Review' : 'Continue'}
                onPress={handleNext}
                mode="contained"
                disabled={loading}
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
