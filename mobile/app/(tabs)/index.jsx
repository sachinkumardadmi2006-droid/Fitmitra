import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dumbbell,
  Flame,
  Zap,
  RotateCcw,
  CheckCircle2,
  Utensils,
  Plus,
  Droplets,
  Sparkles,
  TrendingUp,
  Bot,
  Calendar,
  Clock,
  WifiOff,
  RefreshCw,
  User,
} from 'lucide-react-native';
import { ProgressBar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dashboardService } from '../../services/dashboardService';
import { nutritionService } from '../../services/nutritionService';
import { workoutService, normalizeTodayWorkout, getWeekConsistency } from '../../services/workoutService';
import { queryKeys } from '../../constants/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { TopBar } from '../../components/common/TopBar';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmailVerificationBanner } from '../../components/auth';

const CACHE_KEY_DASHBOARD = 'fitmitra_cache_dashboard';
const CACHE_KEY_TODAY_WORKOUT = 'fitmitra_cache_today_workout';

export default function HomeDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  const userName =
    user?.displayName?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'Athlete';

  const [loggingWater, setLoggingWater] = useState(false);

  // 1. Dashboard Summary Query
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const res = await dashboardService.getDashboard();
      if (res) {
        AsyncStorage.setItem(CACHE_KEY_DASHBOARD, JSON.stringify(res)).catch(() => {});
      }
      return res || null;
    },
    staleTime: 60 * 1000,
  });

  // 2. Today's Scheduled Workout Query
  const todayQuery = useQuery({
    queryKey: queryKeys.todayWorkout,
    queryFn: async () => {
      const res = await workoutService.getTodayWorkout();
      if (res) {
        AsyncStorage.setItem(CACHE_KEY_TODAY_WORKOUT, JSON.stringify(res)).catch(() => {});
      }
      return res ? normalizeTodayWorkout(res) : null;
    },
    staleTime: 60 * 1000,
  });

  // 3. Hydration Query
  const waterQuery = useQuery({
    queryKey: queryKeys.nutritionWater,
    queryFn: async () => {
      const res = await nutritionService.getWater();
      return res !== null && res !== undefined ? Number(res) : 0;
    },
    staleTime: 60 * 1000,
  });

  const dashboardData = dashboardQuery.data || null;
  const todayWorkout = todayQuery.data || null;
  const waterMl =
    waterQuery.data !== undefined
      ? waterQuery.data
      : Number(dashboardData?.waterMl || 0);

  const loading =
    (dashboardQuery.isLoading && !dashboardQuery.data) &&
    (todayQuery.isLoading && !todayQuery.data);

  const refreshing =
    dashboardQuery.isRefetching ||
    todayQuery.isRefetching ||
    waterQuery.isRefetching;

  const isOffline = dashboardQuery.isError && todayQuery.isError;

  const onRefresh = useCallback(async () => {
    await Promise.all([
      dashboardQuery.refetch(),
      todayQuery.refetch(),
      waterQuery.refetch(),
    ]);
  }, [dashboardQuery, todayQuery, waterQuery]);

  const handleAddWater = async () => {
    if (loggingWater) return;
    setLoggingWater(true);
    const added = 250;
    try {
      await nutritionService.logWater(added);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.nutritionWater }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    } catch (e) {
      console.warn('[Home] Failed to log water:', e.message);
    } finally {
      setLoggingWater(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const profile = dashboardData?.profile || {};
  const todayNutrition = dashboardData?.todayNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const nutritionTargets = dashboardData?.nutritionTargets || { calories: 2200, protein: 140, carbs: 240, fat: 65 };
  const targetWater = dashboardData?.waterTargetMl || nutritionTargets.waterMl || 3000;
  const recentWorkouts = dashboardData?.recentWorkouts || [];

  const points = profile?.points ?? 0;
  const streak = profile?.currentStreak ?? 0;

  // Session state from today workout
  const sessionStatus = todayWorkout?.session?.status || 'not_started';
  const isWorkoutCompleted = Boolean(todayWorkout?.hasCompletedToday || sessionStatus === 'completed');
  const isWorkoutInProgress = sessionStatus === 'in_progress';
  const isRestDay = Boolean(todayWorkout?.isRest || todayWorkout?.type === 'rest');
  const workoutId = todayWorkout?.workout?.id || 'today';

  // Nutrition calculations
  const targetCalories = Math.max(1200, nutritionTargets.calories || 2200);
  const targetProtein = Math.max(30, nutritionTargets.protein || 140);
  const targetCarbs = Math.max(50, nutritionTargets.carbs || 240);
  const targetFat = Math.max(20, nutritionTargets.fat || 65);

  const currentCalories = Math.round(todayNutrition.calories || 0);
  const currentProtein = Math.round(todayNutrition.protein || 0);
  const currentCarbs = Math.round(todayNutrition.carbs || 0);
  const currentFat = Math.round(todayNutrition.fat || 0);

  const calProgress = Math.min(Math.max(currentCalories / targetCalories, 0), 1);
  const proteinProgress = Math.min(Math.max(currentProtein / targetProtein, 0), 1);
  const waterProgress = Math.min(Math.max(waterMl / targetWater, 0), 1);

  // Weekly consistency dots
  const consistencyDots = getWeekConsistency(
    todayWorkout?.dateKey,
    recentWorkouts,
    isWorkoutCompleted
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TopBar />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={custom.primaryStrong}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {/* Offline Banner */}
        {isOffline && (
          <View
            style={[
              styles.offlineBanner,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <WifiOff size={16} color={colors.secondary} />
            <Text style={[styles.offlineText, { color: colors.onSurfaceVariant }]}>
              Offline mode • Showing cached workout & nutrition data
            </Text>
            <Pressable onPress={onRefresh} hitSlop={8} style={styles.offlineRetry}>
              <RefreshCw size={14} color={colors.primary} />
            </Pressable>
          </View>
        )}

        {/* 1. Header & Greeting Row */}
        <View style={styles.headerRow}>
          <View style={styles.greetingCol}>
            <Text style={[styles.greetingSub, { color: colors.onSurfaceVariant }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.greetingName, { color: colors.onSurface }]}>
              {userName}
            </Text>
          </View>

          {/* Gamification Badges: Streak & Points */}
          <View style={styles.badgeGroup}>
            <View
              style={[
                styles.badgePill,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <Flame size={16} color={colors.secondary} />
              <Text style={[styles.badgeText, { color: colors.onSurface }]}>
                {streak} {streak === 1 ? 'day' : 'days'}
              </Text>
            </View>

            <View
              style={[
                styles.badgePill,
                {
                  backgroundColor: colors.primaryContainer,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Zap size={15} color={colors.primary} fill={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.onPrimaryContainer, fontWeight: '800' }]}>
                {points}
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/(tabs)/more')}
              style={[
                styles.avatarBtn,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.outlineVariant,
                },
              ]}
              accessibilityLabel="Profile settings"
            >
              <User size={18} color={colors.onSurface} />
            </Pressable>
          </View>
        </View>

        {/* Email Verification Banner (Non-blocking Option B) */}
        <EmailVerificationBanner style={{ marginHorizontal: 0, marginBottom: 16 }} />

        {/* Loading Skeleton */}
        {loading && !dashboardData && !todayWorkout ? (
          <View style={styles.skeletonContainer}>
            <Skeleton height={180} radius={custom.radius.lg} style={styles.mbLg} />
            <Skeleton height={70} radius={custom.radius.lg} style={styles.mbLg} />
            <Skeleton height={140} radius={custom.radius.lg} style={styles.mbLg} />
          </View>
        ) : (
          <>
            {/* 2. Today's Workout Hero Card */}
            <AppCard
              variant="elevated"
              style={[
                styles.heroCard,
                isWorkoutCompleted
                  ? { borderColor: colors.primary, borderWidth: 1 }
                  : null,
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTagRow}>
                  {isWorkoutCompleted ? (
                    <View style={[styles.statusTag, { backgroundColor: colors.primaryContainer }]}>
                      <CheckCircle2 size={13} color={colors.onPrimaryContainer} />
                      <Text style={[styles.statusTagText, { color: colors.onPrimaryContainer }]}>
                        COMPLETED TODAY
                      </Text>
                    </View>
                  ) : isRestDay ? (
                    <View style={[styles.statusTag, { backgroundColor: colors.surfaceVariant }]}>
                      <Sparkles size={13} color={colors.onSurfaceVariant} />
                      <Text style={[styles.statusTagText, { color: colors.onSurfaceVariant }]}>
                        REST & RECOVERY
                      </Text>
                    </View>
                  ) : isWorkoutInProgress ? (
                    <View style={[styles.statusTag, { backgroundColor: colors.errorContainer }]}>
                      <RotateCcw size={13} color={colors.onErrorContainer} />
                      <Text style={[styles.statusTagText, { color: colors.onErrorContainer }]}>
                        IN PROGRESS
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.statusTag, { backgroundColor: colors.secondaryContainer }]}>
                      <Dumbbell size={13} color={colors.onSecondaryContainer} />
                      <Text style={[styles.statusTagText, { color: colors.onSecondaryContainer }]}>
                        {"TODAY'S WORKOUT"}
                      </Text>
                    </View>
                  )}
                </View>

                {todayWorkout?.workout?.level && (
                  <Text style={[styles.levelLabel, { color: colors.onSurfaceVariant }]}>
                    {todayWorkout.workout.level}
                  </Text>
                )}
              </View>

              <Text style={[styles.workoutTitle, { color: colors.onSurface }]}>
                {isRestDay
                  ? 'Take Time to Recover'
                  : todayWorkout?.workout?.title || 'Daily Training Routine'}
              </Text>

              <Text style={[styles.workoutSub, { color: colors.onSurfaceVariant }]}>
                {isRestDay
                  ? 'Active recovery builds stronger muscle tissue. Stay hydrated and stretch gently.'
                  : todayWorkout?.workout?.programName
                  ? `Program: ${todayWorkout.workout.programName}`
                  : 'Complete today’s exercises to maintain your streak & earn reward points.'}
              </Text>

              {/* Meta metrics row */}
              {!isRestDay && (
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Clock size={15} color={colors.primary} />
                    <Text style={[styles.metaText, { color: colors.onSurface }]}>
                      ~{todayWorkout?.workout?.estimatedMin || 40} mins
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Dumbbell size={15} color={colors.primary} />
                    <Text style={[styles.metaText, { color: colors.onSurface }]}>
                      {todayWorkout?.workout?.exercises?.length || 0} exercises
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Zap size={15} color={colors.secondary} />
                    <Text style={[styles.metaText, { color: colors.onSurface }]}>
                      +5 points
                    </Text>
                  </View>
                </View>
              )}

              {/* Action Button */}
              <View style={styles.heroActionContainer}>
                {isWorkoutCompleted ? (
                  <AppButton
                    mode="outlined"
                    label="View Completed Session"
                    icon="check-circle"
                    onPress={() => router.push(`/workout/${workoutId}?kind=today`)}
                  />
                ) : isRestDay ? (
                  <AppButton
                    mode="outlined"
                    label="Browse All Programs"
                    icon="compass"
                    onPress={() => router.push('/(tabs)/workouts')}
                  />
                ) : isWorkoutInProgress ? (
                  <AppButton
                    tone="primary"
                    label="Resume Workout"
                    icon="play"
                    onPress={() => router.push(`/workout/${workoutId}?kind=today`)}
                  />
                ) : (
                  <AppButton
                    tone="primary"
                    label="Start Today's Workout"
                    icon="play"
                    onPress={() => router.push(`/workout/${workoutId}?kind=today`)}
                  />
                )}
              </View>
            </AppCard>

            {/* 3. 7-Day Consistency Dots */}
            <AppCard variant="outlined" style={styles.consistencyCard}>
              <View style={styles.consistencyHeader}>
                <View style={styles.rowAlign}>
                  <Calendar size={16} color={colors.primary} />
                  <Text style={[styles.consistencyTitle, { color: colors.onSurface }]}>
                    Weekly Consistency
                  </Text>
                </View>
                <Text style={[styles.consistencyMeta, { color: colors.onSurfaceVariant }]}>
                  {consistencyDots.filter((d) => d.isCompleted).length} / 7 active
                </Text>
              </View>

              <View style={styles.dotsRow}>
                {consistencyDots.map((d, idx) => (
                  <View key={d.dateKey || idx} style={styles.dotCol}>
                    <View
                      style={[
                        styles.dotCircle,
                        d.isCompleted
                          ? { backgroundColor: colors.primary, borderColor: colors.primary }
                          : d.isToday
                          ? {
                              backgroundColor: colors.surfaceVariant,
                              borderColor: colors.primary,
                              borderWidth: 2,
                            }
                          : {
                              backgroundColor: colors.surfaceVariant,
                              borderColor: colors.outlineVariant,
                            },
                      ]}
                    >
                      {d.isCompleted ? (
                        <CheckCircle2 size={14} color={colors.onPrimary} />
                      ) : (
                        <Text
                          style={[
                            styles.dotLabel,
                            {
                              color: d.isToday ? colors.primary : colors.onSurfaceVariant,
                              fontWeight: d.isToday ? '800' : '500',
                            },
                          ]}
                        >
                          {d.label}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.dotDayName,
                        {
                          color: d.isToday ? colors.primary : colors.onSurfaceVariant,
                          fontWeight: d.isToday ? '700' : '400',
                        },
                      ]}
                    >
                      {d.name}
                    </Text>
                  </View>
                ))}
              </View>
            </AppCard>

            {/* 4. Quick Action Grid */}
            <View style={styles.quickGrid}>
              <Pressable
                style={[
                  styles.quickTile,
                  { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
                ]}
                onPress={() => router.push('/(tabs)/workouts')}
              >
                <View style={[styles.quickIcon, { backgroundColor: colors.primaryContainer }]}>
                  <Dumbbell size={20} color={colors.onPrimaryContainer} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.onSurface }]}>Workouts</Text>
                <Text style={[styles.quickSub, { color: colors.onSurfaceVariant }]}>
                  Plans & history
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.quickTile,
                  { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
                ]}
                onPress={() => router.push('/(tabs)/nutrition')}
              >
                <View style={[styles.quickIcon, { backgroundColor: colors.secondaryContainer }]}>
                  <Utensils size={20} color={colors.onSecondaryContainer} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.onSurface }]}>Diet</Text>
                <Text style={[styles.quickSub, { color: colors.onSurfaceVariant }]}>
                  Log meals & macros
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.quickTile,
                  { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
                ]}
                onPress={() => router.push('/(tabs)/progress')}
              >
                <View style={[styles.quickIcon, { backgroundColor: colors.surfaceVariant }]}>
                  <TrendingUp size={20} color={colors.primary} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.onSurface }]}>Progress</Text>
                <Text style={[styles.quickSub, { color: colors.onSurfaceVariant }]}>
                  Stats & weight
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.quickTile,
                  { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
                ]}
                onPress={() => router.push('/ai-coach')}
              >
                <View style={[styles.quickIcon, { backgroundColor: colors.surfaceVariant }]}>
                  <Bot size={20} color={colors.secondary} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.onSurface }]}>AI Coach</Text>
                <Text style={[styles.quickSub, { color: colors.onSurfaceVariant }]}>
                  Guidance & Q&A
                </Text>
              </Pressable>
            </View>

            {/* 5. Daily Nutrition & Hydration Snapshot */}
            <SectionHeader
              title="Daily Nutrition & Hydration"
              actionLabel="View Diet"
              onAction={() => router.push('/(tabs)/nutrition')}
            />

            <View style={styles.nutritionRow}>
              {/* Nutrition Snapshot Card */}
              <AppCard variant="elevated" style={styles.nutritionCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.snapshotTitle, { color: colors.onSurface }]}>
                    Calories & Macros
                  </Text>
                  <Text style={[styles.snapshotTarget, { color: colors.onSurfaceVariant }]}>
                    Target: {targetCalories} kcal
                  </Text>
                </View>

                <View style={styles.calProgressWrap}>
                  <ProgressBar
                    progress={calProgress}
                    color={colors.primary}
                    style={styles.calProgressBar}
                  />
                  <View style={styles.calMetaRow}>
                    <Text style={[styles.calCount, { color: colors.onSurface }]}>
                      {currentCalories} <Text style={styles.calSub}>kcal eaten</Text>
                    </Text>
                    <Text style={[styles.calRemaining, { color: colors.onSurfaceVariant }]}>
                      {Math.max(0, targetCalories - currentCalories)} left
                    </Text>
                  </View>
                </View>

                {/* Macro breakdown bars */}
                <View style={styles.macroGrid}>
                  <View style={styles.macroCol}>
                    <Text style={[styles.macroLabel, { color: colors.onSurfaceVariant }]}>
                      Protein
                    </Text>
                    <Text style={[styles.macroVal, { color: colors.onSurface }]}>
                      {currentProtein}/{targetProtein}g
                    </Text>
                    <ProgressBar
                      progress={proteinProgress}
                      color={colors.primary}
                      style={styles.macroBar}
                    />
                  </View>

                  <View style={styles.macroCol}>
                    <Text style={[styles.macroLabel, { color: colors.onSurfaceVariant }]}>
                      Carbs
                    </Text>
                    <Text style={[styles.macroVal, { color: colors.onSurface }]}>
                      {currentCarbs}/{targetCarbs}g
                    </Text>
                    <ProgressBar
                      progress={Math.min(currentCarbs / targetCarbs, 1)}
                      color={colors.secondary}
                      style={styles.macroBar}
                    />
                  </View>

                  <View style={styles.macroCol}>
                    <Text style={[styles.macroLabel, { color: colors.onSurfaceVariant }]}>
                      Fats
                    </Text>
                    <Text style={[styles.macroVal, { color: colors.onSurface }]}>
                      {currentFat}/{targetFat}g
                    </Text>
                    <ProgressBar
                      progress={Math.min(currentFat / targetFat, 1)}
                      color={colors.outline}
                      style={styles.macroBar}
                    />
                  </View>
                </View>
              </AppCard>

              {/* Hydration Card */}
              <AppCard variant="elevated" style={styles.hydrationCard}>
                <View style={styles.hydrationHeader}>
                  <View style={styles.rowAlign}>
                    <Droplets size={18} color={colors.primary} />
                    <Text style={[styles.snapshotTitle, { color: colors.onSurface }]}>
                      Hydration
                    </Text>
                  </View>
                  <Text style={[styles.waterValText, { color: colors.onSurface }]}>
                    {waterMl} <Text style={styles.waterTargetSub}>/ {targetWater} ml</Text>
                  </Text>
                </View>

                <ProgressBar
                  progress={waterProgress}
                  color={colors.primary}
                  style={styles.waterProgressBar}
                />

                <View style={styles.waterActionRow}>
                  <Text style={[styles.waterPct, { color: colors.onSurfaceVariant }]}>
                    {Math.round(waterProgress * 100)}% of daily target
                  </Text>
                  <Pressable
                    style={[
                      styles.addWaterBtn,
                      {
                        backgroundColor: colors.primaryContainer,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={handleAddWater}
                    disabled={loggingWater}
                  >
                    <Plus size={14} color={colors.onPrimaryContainer} />
                    <Text style={[styles.addWaterBtnText, { color: colors.onPrimaryContainer }]}>
                      +250 ml
                    </Text>
                  </Pressable>
                </View>
              </AppCard>
            </View>

            {/* 6. Recent Workouts Section */}
            <SectionHeader
              title="Recent Workout Activity"
              actionLabel="All Workouts"
              onAction={() => router.push('/(tabs)/workouts')}
            />

            {recentWorkouts.length > 0 ? (
              recentWorkouts.map((session, idx) => {
                const dateLabel = session.completedAt
                  ? new Date(session.completedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : session.startedAt
                  ? new Date(session.startedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Recent';

                const durationMins = Math.max(
                  1,
                  Math.round((session.durationSeconds || 1800) / 60)
                );

                return (
                  <AppCard
                    key={session._id || session.id || idx}
                    variant="outlined"
                    style={styles.recentSessionCard}
                  >
                    <View style={styles.recentRow}>
                      <View
                        style={[
                          styles.recentIconWrap,
                          { backgroundColor: colors.primaryContainer },
                        ]}
                      >
                        <Dumbbell size={18} color={colors.onPrimaryContainer} />
                      </View>
                      <View style={styles.recentMetaCol}>
                        <Text style={[styles.recentTitle, { color: colors.onSurface }]} numberOfLines={1}>
                          {session.title || session.routineName || 'Training Session'}
                        </Text>
                        <Text style={[styles.recentSub, { color: colors.onSurfaceVariant }]}>
                          {dateLabel} • {durationMins} mins • {session.caloriesEstimate || Math.round(durationMins * 7)} kcal
                        </Text>
                      </View>
                      <View style={[styles.completedBadge, { backgroundColor: colors.surfaceVariant }]}>
                        <CheckCircle2 size={13} color={colors.primary} />
                        <Text style={[styles.completedBadgeText, { color: colors.onSurface }]}>
                          Done
                        </Text>
                      </View>
                    </View>
                  </AppCard>
                );
              })
            ) : (
              <EmptyState
                icon="dumbbell"
                title="No Workouts Logged Yet"
                description="Start your first session today to track your progress and build your streak."
                actionLabel="Explore Workouts"
                onAction={() => router.push('/(tabs)/workouts')}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 36,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  offlineText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  offlineRetry: {
    padding: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
  },
  greetingCol: {
    flex: 1,
  },
  greetingSub: {
    fontSize: 13,
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonContainer: {
    paddingVertical: 12,
  },
  mbLg: {
    marginBottom: 16,
  },
  heroCard: {
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  workoutSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  heroActionContainer: {
    marginTop: 4,
  },
  consistencyCard: {
    marginBottom: 16,
  },
  consistencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  consistencyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  consistencyMeta: {
    fontSize: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dotCol: {
    alignItems: 'center',
    gap: 6,
  },
  dotCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLabel: {
    fontSize: 12,
  },
  dotDayName: {
    fontSize: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickTile: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickSub: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },
  nutritionRow: {
    gap: 12,
    marginBottom: 16,
  },
  nutritionCard: {
    marginBottom: 0,
  },
  snapshotTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  snapshotTarget: {
    fontSize: 12,
  },
  calProgressWrap: {
    marginTop: 8,
    marginBottom: 12,
  },
  calProgressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  calMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calCount: {
    fontSize: 15,
    fontWeight: '800',
  },
  calSub: {
    fontSize: 12,
    fontWeight: '400',
  },
  calRemaining: {
    fontSize: 12,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  macroCol: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  macroVal: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  macroBar: {
    height: 4,
    borderRadius: 2,
  },
  hydrationCard: {
    marginBottom: 0,
  },
  hydrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  waterValText: {
    fontSize: 15,
    fontWeight: '800',
  },
  waterTargetSub: {
    fontSize: 12,
    fontWeight: '400',
  },
  waterProgressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  waterActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterPct: {
    fontSize: 12,
  },
  addWaterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  addWaterBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  recentSessionCard: {
    marginBottom: 8,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentMetaCol: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  recentSub: {
    fontSize: 12,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
