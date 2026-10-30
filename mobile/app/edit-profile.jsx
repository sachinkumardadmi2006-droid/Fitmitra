import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  User,
  Calendar,
  Ruler,
  Scale,
  Dumbbell,
  Utensils,
  IndianRupee,
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAppTheme } from '../theme/ThemeContext';
import { spacing, radius } from '../theme/tokens';
import { authService, profileService } from '../services';
import { api } from '../services/api';
import { queryKeys } from '../constants/queryKeys';
import { useAuth } from '../context/AuthContext';
import { emitDbUpdate } from '../utils/events';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
];

const EXPERIENCE_OPTIONS = [
  { label: 'Beginner', value: 'BEGINNER' },
  { label: 'Intermediate', value: 'INTERMEDIATE' },
  { label: 'Advanced', value: 'ADVANCED' },
];

const LOCATION_OPTIONS = [
  { label: 'Home', value: 'HOME' },
  { label: 'Gym', value: 'GYM' },
];

const DAYS_OPTIONS = [
  { label: '5 Days / week', value: 5 },
  { label: '6 Days / week', value: 6 },
];

const TIME_SLOT_OPTIONS = [
  { label: 'Early Morning', value: 'EARLY_MORNING' },
  { label: 'Morning', value: 'MORNING' },
  { label: 'Evening', value: 'EVENING' },
  { label: 'Night', value: 'NIGHT' },
];

const DIET_OPTIONS = [
  { label: 'Vegetarian', value: 'VEG' },
  { label: 'Non-Vegetarian', value: 'NON_VEG' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const { refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [gender, setGender] = useState('MALE');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // Fitness Preferences
  const [experienceLevel, setExperienceLevel] = useState('INTERMEDIATE');
  const [location, setLocation] = useState('GYM');
  const [workoutDays, setWorkoutDays] = useState(5);
  const [workoutTime, setWorkoutTime] = useState('MORNING');

  // Nutrition Preferences
  const [dietType, setDietType] = useState('VEG');
  const [dietBudget, setDietBudget] = useState('250');

  // Load current live profile data
  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const localUser = await authService.getLocalUser();
      if (localUser) {
        setName(localUser.displayName || localUser.name || '');
      }

      const p = await profileService.getProfile().catch(() => null);
      if (p) {
        if (p.gender) setGender(p.gender);
        if (p.age) setAge(String(p.age));
        if (p.heightCm) setHeight(String(p.heightCm));
        if (p.weight || p.weightKg) setWeight(String(p.weight || p.weightKg));
        if (p.experienceLevel) setExperienceLevel(p.experienceLevel);
        if (p.preferredWorkoutLocation) setLocation(p.preferredWorkoutLocation);
        if (p.preferredWorkoutDays) setWorkoutDays(p.preferredWorkoutDays);
        if (p.preferredWorkoutTime) setWorkoutTime(p.preferredWorkoutTime);
        if (p.dietType) setDietType(p.dietType);
        if (p.dailyDietBudget !== undefined && p.dailyDietBudget !== null) {
          setDietBudget(String(p.dailyDietBudget));
        }
      }
    } catch (err) {
      console.warn('Failed to load profile for edit:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        loadProfileData();
      }
    });
    return () => {
      ignore = true;
    };
  }, [loadProfileData]);

  // Handle Save
  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }

    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 14 || ageNum > 100) {
      Alert.alert('Validation Error', 'Age must be between 14 and 100.');
      return;
    }

    const heightNum = parseFloat(height);
    if (!height || isNaN(heightNum) || heightNum < 50 || heightNum > 250) {
      Alert.alert('Validation Error', 'Height must be between 50 and 250 cm.');
      return;
    }

    const weightNum = parseFloat(weight);
    if (!weight || isNaN(weightNum) || weightNum < 20 || weightNum > 400) {
      Alert.alert('Validation Error', 'Weight must be between 20 and 400 kg.');
      return;
    }

    const budgetNum = dietBudget.trim() ? parseFloat(dietBudget) : 0;
    if (isNaN(budgetNum) || budgetNum < 0) {
      Alert.alert('Validation Error', 'Daily diet budget must be a non-negative number.');
      return;
    }

    try {
      setSaving(true);

      // 1. Update Profile fields on server (PATCH /profiles/me)
      const profilePayload = {
        gender: gender || null,
        age: ageNum,
        heightCm: heightNum,
        weight: weightNum,
        experienceLevel,
        preferredWorkoutLocation: location,
        preferredWorkoutDays: workoutDays,
        preferredWorkoutTime: workoutTime,
        dietType,
        dailyDietBudget: budgetNum,
      };

      await profileService.updateProfile(profilePayload);

      // 2. Synchronize user's displayName to users collection (POST /auth/sync)
      try {
        await api.post('/auth/sync', { displayName: trimmedName });
      } catch (syncErr) {
        console.warn('User displayName sync error:', syncErr?.message || syncErr);
      }

      // 3. Update local user cache
      const localUser = await authService.getLocalUser();
      const updatedUser = {
        ...localUser,
        name: trimmedName,
        displayName: trimmedName,
        age: ageNum,
        height: heightNum,
        weight: weightNum,
        currentWeight: weightNum,
      };
      await authService.saveLocalUser(updatedUser);

      // 4. Invalidate TanStack query cache and refresh in-memory AuthContext
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progress }),
      ]);
      await refreshProfile();
      emitDbUpdate();

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const h = parseFloat(height) || 0;
  const w = parseFloat(weight) || 0;
  const bmi = h > 0 && w > 0 ? (w / ((h / 100) * (h / 100))).toFixed(1) : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outlineVariant,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}
      >
        <Pressable
          style={[styles.backBtn, { backgroundColor: theme.colors.surfaceVariant }]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <ArrowLeft size={20} color={theme.colors.onSurface} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          Edit Profile
        </Text>

        <Pressable
          style={[
            styles.saveBtn,
            {
              backgroundColor: theme.custom.primaryStrong,
              opacity: saving ? 0.7 : 1,
            },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save</Text>
            </View>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={theme.custom.primaryStrong} />
          <Text style={[styles.loaderText, { color: theme.colors.onSurfaceVariant }]}>
            Loading your profile...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section 1: Personal Details */}
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <User size={18} color={theme.custom.primaryStrong} />
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Personal Details
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: theme.colors.outlineVariant,
                    color: theme.colors.onSurface,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Gender</Text>
              <View style={styles.pillsRow}>
                {GENDER_OPTIONS.map((opt) => {
                  const selected = gender === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: selected
                            ? theme.colors.primaryContainer
                            : theme.colors.surfaceVariant,
                          borderColor: selected
                            ? theme.colors.primary
                            : theme.colors.outlineVariant,
                        },
                      ]}
                      onPress={() => setGender(opt.value)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color: selected
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurface,
                            fontWeight: selected ? '700' : '500',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Age (years)</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderColor: theme.colors.outlineVariant,
                      color: theme.colors.onSurface,
                    },
                  ]}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  placeholder="e.g. 24"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                />
                <Calendar size={18} color={theme.colors.onSurfaceVariant} style={styles.iconInside} />
              </View>
            </View>
          </View>

          {/* Section 2: Biometrics & BMI Preview */}
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Scale size={18} color={theme.custom.primaryStrong} />
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Body Measurements
              </Text>
            </View>

            <View style={styles.rowTwo}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Height (cm)</Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.surfaceVariant,
                        borderColor: theme.colors.outlineVariant,
                        color: theme.colors.onSurface,
                      },
                    ]}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    placeholder="e.g. 175"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                  <Ruler size={16} color={theme.colors.onSurfaceVariant} style={styles.iconInside} />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Weight (kg)</Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.surfaceVariant,
                        borderColor: theme.colors.outlineVariant,
                        color: theme.colors.onSurface,
                      },
                    ]}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder="e.g. 72.5"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                  <Scale size={16} color={theme.colors.onSurfaceVariant} style={styles.iconInside} />
                </View>
              </View>
            </View>

            {bmi && (
              <View
                style={[
                  styles.bmiBanner,
                  {
                    backgroundColor: theme.colors.primaryContainer,
                    borderColor: theme.colors.primary,
                  },
                ]}
              >
                <Text style={[styles.bmiTitle, { color: theme.colors.onPrimaryContainer }]}>
                  Calculated BMI: <Text style={{ fontWeight: '800' }}>{bmi}</Text>
                </Text>
                <Text style={[styles.bmiSub, { color: theme.colors.onPrimaryContainer }]}>
                  {parseFloat(bmi) < 18.5
                    ? 'Underweight'
                    : parseFloat(bmi) <= 24.9
                    ? 'Normal / Healthy weight'
                    : parseFloat(bmi) <= 29.9
                    ? 'Overweight'
                    : 'Obese'}
                </Text>
              </View>
            )}
          </View>

          {/* Section 3: Training Preferences */}
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Dumbbell size={18} color={theme.custom.primaryStrong} />
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Workout Preferences
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Experience Level</Text>
              <View style={styles.pillsRow}>
                {EXPERIENCE_OPTIONS.map((opt) => {
                  const selected = experienceLevel === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: selected
                            ? theme.colors.primaryContainer
                            : theme.colors.surfaceVariant,
                          borderColor: selected
                            ? theme.colors.primary
                            : theme.colors.outlineVariant,
                        },
                      ]}
                      onPress={() => setExperienceLevel(opt.value)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color: selected
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurface,
                            fontWeight: selected ? '700' : '500',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Workout Location</Text>
              <View style={styles.pillsRow}>
                {LOCATION_OPTIONS.map((opt) => {
                  const selected = location === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: selected
                            ? theme.colors.primaryContainer
                            : theme.colors.surfaceVariant,
                          borderColor: selected
                            ? theme.colors.primary
                            : theme.colors.outlineVariant,
                        },
                      ]}
                      onPress={() => setLocation(opt.value)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color: selected
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurface,
                            fontWeight: selected ? '700' : '500',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Workout Days / Week</Text>
              <View style={styles.pillsRow}>
                {DAYS_OPTIONS.map((opt) => {
                  const selected = workoutDays === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: selected
                            ? theme.colors.primaryContainer
                            : theme.colors.surfaceVariant,
                          borderColor: selected
                            ? theme.colors.primary
                            : theme.colors.outlineVariant,
                        },
                      ]}
                      onPress={() => setWorkoutDays(opt.value)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color: selected
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurface,
                            fontWeight: selected ? '700' : '500',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Preferred Workout Time</Text>
              <View style={styles.pillsRow}>
                {TIME_SLOT_OPTIONS.map((opt) => {
                  const selected = workoutTime === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: selected
                            ? theme.colors.primaryContainer
                            : theme.colors.surfaceVariant,
                          borderColor: selected
                            ? theme.colors.primary
                            : theme.colors.outlineVariant,
                        },
                      ]}
                      onPress={() => setWorkoutTime(opt.value)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color: selected
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurface,
                            fontWeight: selected ? '700' : '500',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Section 4: Diet & Nutrition Preferences */}
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Utensils size={18} color={theme.custom.primaryStrong} />
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Nutrition Preferences
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>Diet Type</Text>
              <View style={styles.pillsRow}>
                {DIET_OPTIONS.map((opt) => {
                  const selected = dietType === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: selected
                            ? theme.colors.primaryContainer
                            : theme.colors.surfaceVariant,
                          borderColor: selected
                            ? theme.colors.primary
                            : theme.colors.outlineVariant,
                        },
                      ]}
                      onPress={() => setDietType(opt.value)}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          {
                            color: selected
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurface,
                            fontWeight: selected ? '700' : '500',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                Daily Diet Budget (₹/day)
              </Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderColor: theme.colors.outlineVariant,
                      color: theme.colors.onSurface,
                    },
                  ]}
                  value={dietBudget}
                  onChangeText={setDietBudget}
                  keyboardType="numeric"
                  placeholder="e.g. 250"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                />
                <IndianRupee size={16} color={theme.colors.onSurfaceVariant} style={styles.iconInside} />
              </View>
            </View>
          </View>

          {/* Bottom Primary Action Button */}
          <Pressable
            style={[
              styles.bottomSaveBtn,
              {
                backgroundColor: theme.custom.primaryStrong,
                opacity: saving ? 0.7 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Check size={18} color="#FFFFFF" />
                <Text style={styles.bottomSaveBtnText}>Save Changes</Text>
              </View>
            )}
          </Pressable>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loaderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  inputWithIcon: {
    position: 'relative',
    justifyContent: 'center',
  },
  iconInside: {
    position: 'absolute',
    right: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bmiBanner: {
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bmiTitle: {
    fontSize: 13,
  },
  bmiSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSaveBtn: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  bottomSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
