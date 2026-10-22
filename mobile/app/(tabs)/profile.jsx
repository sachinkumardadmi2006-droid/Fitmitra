// Profile & Settings Screen — mirrors frontend Profile.jsx
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
  Modal,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  LogOut,
  Sparkles,
  CheckCircle2,
  Trash2,
  Globe,
  Award,
  ChevronRight,
  Shield,
  CreditCard,
  X,
  Check,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppTheme } from '../../theme/ThemeContext';
import { spacing, radius } from '../../theme/tokens';
import { authService, profileService } from '../../services';
import { subscriptionService } from '../../services/subscriptionService';
import { queryKeys } from '../../constants/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { initDb } from '../../utils/db';
import { t } from '../../utils/i18n';

const GOALS = ['Muscle Gain', 'Fat Loss', 'Strength', 'General Fitness'];
const EXPERIENCES = ['Beginner', 'Intermediate', 'Advanced'];
const ACTIVITIES = [
  'Sedentary',
  'Lightly Active',
  'Moderately Active',
  'Very Active',
];

export default function ProfileTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const { points, refreshProfile } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('Muscle Gain');
  const [experience, setExperience] = useState('Intermediate');
  const [activity, setActivity] = useState('Moderately Active');
  const [language, setLanguage] = useState('en');

  // Live subscription query
  const subQuery = useQuery({
    queryKey: queryKeys.subscriptionCurrent,
    queryFn: async () => {
      try {
        const res = await subscriptionService.getMySubscription();
        const data = res?.data || res;
        return data && (data.status === 'ACTIVE' || data.status === 'TRIALING') ? data : null;
      } catch (_) {
        return null;
      }
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const isPremiumUser = Boolean(user?.isPremium || subQuery.data);

  const loadData = useCallback(async () => {
    try {
      const u = await authService.getLocalUser();
      setUser(u || {});

      try {
        const p = await profileService.getProfile();
        if (p) {
          if (p.heightCm) setHeight(String(p.heightCm));
          if (p.weightKg) setWeight(String(p.weightKg));
          if (p.goal) {
            setGoal(
              p.goal === 'MUSCLE_GAIN'
                ? 'Muscle Gain'
                : p.goal === 'WEIGHT_LOSS'
                ? 'Fat Loss'
                : 'General Fitness'
            );
          }
          if (p.experienceLevel) {
            setExperience(
              p.experienceLevel === 'BEGINNER'
                ? 'Beginner'
                : p.experienceLevel === 'ADVANCED'
                ? 'Advanced'
                : 'Intermediate'
            );
          }
        }
      } catch (_) {}

      if (u) {
        setName(u.name || '');
        setAge(u.age ? String(u.age) : '');
        setHeight((prev) => (!prev && u.height ? String(u.height) : prev));
        setWeight((prev) => (!prev && (u.weight || u.currentWeight) ? String(u.weight || u.currentWeight) : prev));
        setActivity(u.activityLevel || 'Moderately Active');
        setLanguage(u.language || 'en');
      }
    } catch (e) {
      console.warn('Error loading profile:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadData(),
        subQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadData, subQuery]);

  const handleSaveProfile = async () => {
    if (!name.trim() || !height.trim() || !weight.trim()) {
      Alert.alert('Validation Error', 'Please fill in Name, Height, and Weight.');
      return;
    }

    try {
      setSaving(true);
      const hNum = parseInt(height, 10);
      const wNum = parseFloat(weight);

      const goalEnum =
        goal === 'Fat Loss'
          ? 'WEIGHT_LOSS'
          : goal === 'Muscle Gain'
          ? 'MUSCLE_GAIN'
          : 'GENERAL_FITNESS';

      const expEnum =
        experience === 'Beginner'
          ? 'BEGINNER'
          : experience === 'Advanced'
          ? 'ADVANCED'
          : 'INTERMEDIATE';

      // Update server profile
      try {
        await profileService.updateProfile({
          heightCm: hNum || undefined,
          weightKg: wNum || undefined,
          goal: goalEnum,
          experienceLevel: expEnum,
        });
      } catch (err) {
        console.warn('Server profile update error:', err.message);
      }

      // Update local storage
      const updated = {
        ...user,
        name: name.trim(),
        age: parseInt(age, 10) || user?.age,
        height: hNum || user?.height,
        weight: wNum || user?.weight,
        currentWeight: wNum || user?.currentWeight,
        fitnessGoal: goal,
        experienceLevel: experience,
        activityLevel: activity,
        language: language,
      };

      await authService.saveLocalUser(updated);
      setUser(updated);
      refreshProfile();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of FitMitra?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Data',
      'Are you sure you want to reset all workout history, weight tracking, and meals to initial defaults? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await initDb(true);
            await loadData();
            Alert.alert('Reset Complete', 'All metrics reset to factory defaults.');
          },
        },
      ]
    );
  };



  if (loading || !user) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.custom.primaryStrong} />
        <Text
          style={[
            styles.loadingText,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Loading profile...
        </Text>
      </View>
    );
  }

  const h = Number(height) || 175;
  const w = Number(weight) || 72;
  const bmi = (w / ((h / 100) * (h / 100))).toFixed(1);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.custom.primaryStrong}
        />
      }
    >
      {/* User Header Profile Card */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: theme.colors.tertiaryContainer },
          ]}
        >
          <Text
            style={[
              styles.avatarLetter,
              { color: theme.colors.onTertiaryContainer },
            ]}
          >
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={[
                styles.heroName,
                { color: theme.colors.onSurface },
              ]}
            >
              {user.name || 'Athlete'}
            </Text>
            {isPremiumUser ? (
              <View
                style={[
                  styles.proTag,
                  { backgroundColor: theme.colors.secondary },
                ]}
              >
                <Sparkles size={10} color={theme.colors.onSecondary} />
                <Text
                  style={[
                    styles.proTagText,
                    { color: theme.colors.onSecondary },
                  ]}
                >
                  PRO
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.freeTag,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <Text
                  style={[
                    styles.freeTagText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  FREE
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.heroEmail,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {user.email || user.phone || 'fitmitra@app'}
          </Text>
        </View>
      </View>

      {/* Health Stats Summary Bar */}
      <View
        style={[
          styles.statStrip,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.statBox}>
          <Text
            style={[
              styles.statVal,
              { color: theme.custom.primaryStrong },
            ]}
          >
            {height || 0} cm
          </Text>
          <Text
            style={[
              styles.statLbl,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Height
          </Text>
        </View>
        <View
          style={[
            styles.statDivider,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <View style={styles.statBox}>
          <Text
            style={[
              styles.statVal,
              { color: theme.custom.primaryStrong },
            ]}
          >
            {weight || 0} kg
          </Text>
          <Text
            style={[
              styles.statLbl,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Weight
          </Text>
        </View>
        <View
          style={[
            styles.statDivider,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <View style={styles.statBox}>
          <Text
            style={[
              styles.statVal,
              { color: theme.custom.primaryStrong },
            ]}
          >
            {bmi}
          </Text>
          <Text
            style={[
              styles.statLbl,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            BMI
          </Text>
        </View>
        <View
          style={[
            styles.statDivider,
            { backgroundColor: theme.colors.outlineVariant },
          ]}
        />
        <Pressable
          style={styles.statBox}
          onPress={() => router.push('/(tabs)/store')}
        >
          <Text
            style={[
              styles.statVal,
              { color: theme.custom.accentText },
            ]}
          >
            ⚡ {points}
          </Text>
          <Text
            style={[
              styles.statLbl,
              { color: theme.custom.accentText },
            ]}
          >
            Points
          </Text>
        </Pressable>
      </View>

      {/* PRO Membership Banner */}
      {!isPremiumUser ? (
        <Pressable
          style={[
            styles.upgradeBanner,
            {
              backgroundColor: theme.colors.secondaryContainer,
              borderColor: theme.colors.secondary,
            },
          ]}
          onPress={() => router.push('/premium')}
        >
          <View
            style={[
              styles.upgradeIcon,
              { backgroundColor: theme.colors.secondary },
            ]}
          >
            <Sparkles size={22} color={theme.colors.onSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.upgradeTitle,
                { color: theme.colors.onSecondaryContainer },
              ]}
            >
              Upgrade to FitMitra PRO
            </Text>
            <Text
              style={[
                styles.upgradeSub,
                { color: theme.colors.onSecondaryContainer },
              ]}
            >
              Unlock custom diets, audio coach, video routines & analytics
            </Text>
          </View>
          <ChevronRight size={18} color={theme.colors.onSecondaryContainer} />
        </Pressable>
      ) : (
        <View
          style={[
            styles.activeProCard,
            {
              backgroundColor: theme.colors.primaryContainer,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <Award size={20} color={theme.colors.onPrimaryContainer} />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.activeProTitle,
                { color: theme.colors.onPrimaryContainer },
              ]}
            >
              {subQuery.data?.planId?.name || 'FitMitra PRO Active'}
            </Text>
            <Text
              style={[
                styles.activeProSub,
                { color: theme.colors.onPrimaryContainer },
              ]}
            >
              {subQuery.data?.currentPeriodEnd
                ? `Valid until ${new Date(subQuery.data.currentPeriodEnd).toLocaleDateString()}`
                : 'Unlimited access to all workouts, recipes & training plans'}
            </Text>
          </View>
        </View>
      )}

      {/* Edit Form */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Text
          style={[
            styles.cardTitle,
            { color: theme.colors.onSurface },
          ]}
        >
          Personal Information
        </Text>

        <Text
          style={[
            styles.inputLabel,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Full Name
        </Text>
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
          placeholder="Your full name"
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />

        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.inputLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Age
            </Text>
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
              placeholder="Age"
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.inputLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Height (cm)
            </Text>
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
              placeholder="cm"
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.inputLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Weight (kg)
            </Text>
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
              placeholder="kg"
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>
        </View>

        {/* Primary Fitness Goal */}
        <Text
          style={[
            styles.inputLabel,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Primary Goal
        </Text>
        <View style={styles.chipsWrap}>
          {GOALS.map((g) => (
            <Pressable
              key={g}
              style={[
                styles.chip,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.outlineVariant,
                },
                goal === g && {
                  backgroundColor: theme.colors.primaryContainer,
                  borderColor: theme.colors.primary,
                },
              ]}
              onPress={() => setGoal(g)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: theme.colors.onSurfaceVariant },
                  goal === g && {
                    color: theme.colors.onPrimaryContainer,
                    fontWeight: '700',
                  },
                ]}
              >
                {g}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Experience Level */}
        <Text
          style={[
            styles.inputLabel,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Experience Level
        </Text>
        <View style={styles.chipsWrap}>
          {EXPERIENCES.map((exp) => (
            <Pressable
              key={exp}
              style={[
                styles.chip,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.outlineVariant,
                },
                experience === exp && {
                  backgroundColor: theme.colors.primaryContainer,
                  borderColor: theme.colors.primary,
                },
              ]}
              onPress={() => setExperience(exp)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: theme.colors.onSurfaceVariant },
                  experience === exp && {
                    color: theme.colors.onPrimaryContainer,
                    fontWeight: '700',
                  },
                ]}
              >
                {exp}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Activity Level */}
        <Text
          style={[
            styles.inputLabel,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Daily Activity Level
        </Text>
        <View style={styles.chipsWrap}>
          {ACTIVITIES.map((act) => (
            <Pressable
              key={act}
              style={[
                styles.chip,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.outlineVariant,
                },
                activity === act && {
                  backgroundColor: theme.colors.primaryContainer,
                  borderColor: theme.colors.primary,
                },
              ]}
              onPress={() => setActivity(act)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: theme.colors.onSurfaceVariant },
                  activity === act && {
                    color: theme.colors.onPrimaryContainer,
                    fontWeight: '700',
                  },
                ]}
              >
                {act}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Language Selection */}
        <Text
          style={[
            styles.inputLabel,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Preferred Language
        </Text>
        <View style={styles.langRow}>
          <Pressable
            style={[
              styles.langBtn,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outlineVariant,
              },
              language === 'en' && {
                backgroundColor: theme.colors.tertiaryContainer,
                borderColor: theme.colors.tertiary,
              },
            ]}
            onPress={() => setLanguage('en')}
          >
            <Text
              style={[
                styles.langBtnText,
                { color: theme.colors.onSurfaceVariant },
                language === 'en' && {
                  color: theme.colors.onTertiaryContainer,
                  fontWeight: '700',
                },
              ]}
            >
              English (EN)
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.langBtn,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outlineVariant,
              },
              language === 'kn' && {
                backgroundColor: theme.colors.tertiaryContainer,
                borderColor: theme.colors.tertiary,
              },
            ]}
            onPress={() => setLanguage('kn')}
          >
            <Text
              style={[
                styles.langBtnText,
                { color: theme.colors.onSurfaceVariant },
                language === 'kn' && {
                  color: theme.colors.onTertiaryContainer,
                  fontWeight: '700',
                },
              ]}
            >
              ಕನ್ನಡ (Kannada)
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.saveBtn,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.onPrimary} />
          ) : (
            <Text
              style={[
                styles.saveBtnText,
                { color: theme.colors.onPrimary },
              ]}
            >
              Save Profile Changes
            </Text>
          )}
        </Pressable>
      </View>

      {/* Danger Zone & Account Actions */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Text
          style={[
            styles.cardTitle,
            { color: theme.colors.onSurface },
          ]}
        >
          Account Settings
        </Text>

        <Pressable style={styles.actionRow} onPress={handleResetData}>
          <View
            style={[
              styles.actionIconCircle,
              { backgroundColor: theme.colors.errorContainer },
            ]}
          >
            <Trash2 size={18} color={theme.colors.onErrorContainer} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.actionRowTitle,
                { color: theme.colors.onSurface },
              ]}
            >
              Reset App Data
            </Text>
            <Text
              style={[
                styles.actionRowSub,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Clear logged workouts, weights and food journal
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={[
            styles.actionRow,
            {
              borderTopWidth: 1,
              borderTopColor: theme.colors.outlineVariant,
            },
          ]}
          onPress={handleLogout}
        >
          <View
            style={[
              styles.actionIconCircle,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <LogOut size={18} color={theme.colors.onSurfaceVariant} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.actionRowTitle,
                { color: theme.colors.error },
              ]}
            >
              Log Out
            </Text>
            <Text
              style={[
                styles.actionRowSub,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Sign out of your session on this device
            </Text>
          </View>
        </Pressable>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingTop: 48,
    paddingBottom: 90,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: spacing.lg,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '800',
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
  },
  heroEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  proTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  freeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statStrip: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '70%',
    alignSelf: 'center',
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  upgradeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  upgradeSub: {
    fontSize: 11,
    marginTop: 2,
  },
  activeProCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  activeProTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  activeProSub: {
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    fontWeight: '800',
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionRowSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
