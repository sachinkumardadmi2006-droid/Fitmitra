import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Dumbbell,
  Flame,
  Zap,
  Play,
  CheckCircle2,
  Utensils,
  Plus,
  Droplets,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Target,
  ChevronRight,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dashboardService } from '../../services/dashboardService';
import { nutritionService } from '../../services/nutritionService';
import { workoutService } from '../../services/workoutService';
import { TopBar } from '../../components/common/TopBar';
import { MaterialCard } from '../../components/common/MaterialCard';
import { useTheme } from '../../context/ThemeContext';
import { FontSize, BorderRadius } from '../../constants/theme';

export default function HomeDashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [userName, setUserName] = useState('Athlete');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [waterMl, setWaterMl] = useState(1500);
  const [targetWaterMl] = useState(3000);
  const [todayRoutine, setTodayRoutine] = useState({
    title: 'Push Day',
    duration: '~45 min',
    exercisesCount: 6,
    target: 'Chest & Triceps',
    routineId: 'push-day-1',
  });
  const [isCompletedLocally, setIsCompletedLocally] = useState(false);


  const loadData = useCallback(async () => {
    try {
      // 1. Load user display name
      const userStr = await AsyncStorage.getItem('fitmitra_user');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        if (parsed.displayName) setUserName(parsed.displayName.split(' ')[0]);
      }

      // 2. Fetch live dashboard data
      const data = await dashboardService.getDashboard();
      if (data) {
        setDashboardData(data);
      }

      // 3. Fetch hydration data
      const hydration = await nutritionService.getHydration();
      if (hydration !== undefined) {
        setWaterMl(hydration || 1500);
      }

      // 4. Fetch workout exercises to customize hero card
      const exercises = await workoutService.getExercises();
      if (exercises && exercises.length > 0) {
        setTodayRoutine((prev) => ({
          ...prev,
          exercisesCount: exercises.length,
        }));
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(safetyTimer);
  }, [loadData]);


  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddWater = async () => {
    const nextWater = Math.min(waterMl + 250, 5000);
    setWaterMl(nextWater);
    await nutritionService.setHydration(nextWater);
  };

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const profile = dashboardData?.profile || {};
  const todayWorkout = dashboardData?.todayWorkout || {};
  const todayNutrition = dashboardData?.todayNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const points = profile?.points || 0;
  const streak = dashboardData?.stats?.workoutsLast7Days || 7;
  const isWorkoutCompleted = isCompletedLocally || !!todayWorkout?.hasCompletedToday;

  const handleToggleComplete = async () => {
    const nextVal = !isWorkoutCompleted;
    setIsCompletedLocally(nextVal);
    try {
      if (nextVal && workoutService?.completeWorkout) {
        await workoutService.completeWorkout('push-day-1');
      }
    } catch (err) {
      console.warn('Complete workout toggle:', err.message);
    }
  };

  // Calorie & macro targets based on profile or standard athlete target
  const targetCalories = 2200;
  const targetProtein = 140;
  const targetCarbs = 240;
  const targetFat = 65;

  const currentCalories = todayNutrition?.calories || 0;
  const currentProtein = todayNutrition?.protein || 0;
  const currentCarbs = todayNutrition?.carbs || 0;
  const currentFat = todayNutrition?.fat || 0;

  const proteinPct = Math.min(Math.round((currentProtein / targetProtein) * 100), 100);
  const carbsPct = Math.min(Math.round((currentCarbs / targetCarbs) * 100), 100);
  const fatPct = Math.min(Math.round((currentFat / targetFat) * 100), 100);

  if (loading && !dashboardData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bgBase }]}>
        <TopBar />
        <View style={styles.centerSpinner}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your dashboard...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      {/* 1. Context-Aware TopBar */}
      <TopBar />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Compact Greeting & Gamification Header */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.greetingName, { color: colors.textPrimary }]}>
              {userName} 👋
            </Text>
          </View>

          {/* Gamification Pill: Streak + Points */}
          <View style={[styles.gamePill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.pillItem}>
              <Flame size={15} color="#FF7A00" />
              <Text style={[styles.pillText, { color: colors.textPrimary }]}>
                {streak} <Text style={{ color: colors.textSecondary, fontSize: 11 }}>d</Text>
              </Text>
            </View>
            <View style={[styles.pillDivider, { backgroundColor: colors.border }]} />
            <Pressable
              style={styles.pillItem}
              onPress={() => router.push('/store')}
            >
              <Zap size={15} color={colors.primary} />
              <Text style={[styles.pillText, { color: colors.textPrimary }]}>
                {points} <Text style={{ color: colors.primary, fontSize: 11 }}>pts</Text>
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 3. TODAY'S WORKOUT HERO CARD (PUSH DAY DESIGN) */}
        <MaterialCard
          elevated
          style={[
            styles.workoutHero,
            {
              borderColor: isWorkoutCompleted ? colors.success + '66' : colors.primary + '55',
              backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
            },
          ]}
        >
          {isWorkoutCompleted ? (
            /* COMPLETED STATE */
            <View style={styles.heroContentContainer}>
              <View style={styles.workoutHeaderRow}>
                <View style={[styles.completedBadge, { backgroundColor: colors.success + '20', borderColor: colors.success + '44' }]}>
                  <Text style={[styles.completedBadgeText, { color: colors.success }]}>
                    🎉 Workout Complete!
                  </Text>
                </View>
                <View style={[styles.rewardBadge, { backgroundColor: colors.success + '18' }]}>
                  <Zap size={13} color={colors.success} />
                  <Text style={[styles.rewardBadgeText, { color: colors.success }]}>
                    ⚡ +5 pts Earned
                  </Text>
                </View>
              </View>

              <Text style={[styles.workoutTitle, { color: colors.textPrimary }]}>
                {todayRoutine.title || 'Push Day'}
              </Text>

              <Text style={[styles.workoutSubMeta, { color: colors.textSecondary }]}>
                {todayRoutine.exercisesCount || 6} exercises • 43 min
              </Text>

              <View style={styles.streakRow}>
                <Flame size={16} color="#FF7A00" />
                <Text style={[styles.streakText, { color: '#FF7A00' }]}>
                  {streak || 7} Day Streak
                </Text>
              </View>

              <Pressable
                style={[styles.completedStatusBtn, { backgroundColor: colors.success + '18', borderColor: colors.success }]}
                onPress={handleToggleComplete}
              >
                <CheckCircle2 size={18} color={colors.success} />
                <Text style={[styles.completedStatusBtnText, { color: colors.success }]}>
                  Completed today ✓
                </Text>
              </Pressable>
            </View>
          ) : (
            /* NOT COMPLETED STATE */
            <View style={styles.heroContentContainer}>
              <View style={styles.workoutHeaderRow}>
                <View style={[styles.tagBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '44' }]}>
                  <Dumbbell size={13} color={colors.primary} />
                  <Text style={[styles.tagText, { color: colors.primary }]}>
                    TODAY'S WORKOUT
                  </Text>
                </View>
                <View style={[styles.rewardBadge, { backgroundColor: colors.primary + '18' }]}>
                  <Zap size={13} color={colors.primary} />
                  <Text style={[styles.rewardBadgeText, { color: colors.primary }]}>
                    ⚡ +5 pts Available
                  </Text>
                </View>
              </View>

              <Text style={[styles.workoutTitle, { color: colors.textPrimary }]}>
                {todayRoutine.title || 'Push Day'}
              </Text>

              <Text style={[styles.workoutSubMeta, { color: colors.textSecondary }]}>
                {todayRoutine.exercisesCount || 6} exercises • {todayRoutine.duration || '~45 min'}
              </Text>

              <View style={styles.notCompletedRow}>
                <View style={[styles.emptyRadioCircle, { borderColor: colors.textMuted }]} />
                <Text style={[styles.notCompletedText, { color: colors.textSecondary }]}>
                  Not completed
                </Text>
              </View>

              <View style={styles.heroBtnRow}>
                <Pressable
                  style={[styles.heroStartBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push(`/workout/${todayRoutine.routineId || 'push-day-1'}`)}
                >
                  <Play size={16} color="#000" fill="#000" />
                  <Text style={styles.heroStartBtnText}>Start WorkOut</Text>
                </Pressable>

                <Pressable
                  style={[styles.heroDoneBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  onPress={handleToggleComplete}
                >
                  <CheckCircle2 size={16} color={colors.primary} />
                  <Text style={[styles.heroDoneBtnText, { color: colors.textPrimary }]}>
                    ✓ Mark as Done
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </MaterialCard>

        {/* 4. TODAY'S NUTRITION & MACROS OVERVIEW (MEDIUM) */}
        <MaterialCard style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.titleIconRow}>
              <Utensils size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Today's Nutrition
              </Text>
            </View>
            <Pressable
              style={[styles.smallActionBtn, { borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/nutrition')}
            >
              <Plus size={14} color={colors.primary} />
              <Text style={[styles.smallActionText, { color: colors.primary }]}>
                Log Meal
              </Text>
            </Pressable>
          </View>

          {/* Calories Split */}
          <View style={styles.calorieRow}>
            <View>
              <Text style={[styles.calorieNumber, { color: colors.textPrimary }]}>
                {currentCalories}{' '}
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textSecondary }}>
                  / {targetCalories} kcal
                </Text>
              </Text>
              <Text style={[styles.calorieSub, { color: colors.textMuted }]}>
                {Math.max(targetCalories - currentCalories, 0)} kcal remaining today
              </Text>
            </View>

            <View style={[styles.calorieBadge, { backgroundColor: colors.primary + '18' }]}>
              <Text style={[styles.caloriePct, { color: colors.primary }]}>
                {Math.round((currentCalories / targetCalories) * 100)}%
              </Text>
            </View>
          </View>

          {/* 3 Macro Bars (Protein, Carbs, Fats) */}
          <View style={styles.macroBarsContainer}>
            {/* Protein */}
            <View style={styles.macroBarCol}>
              <View style={styles.macroHeader}>
                <Text style={[styles.macroName, { color: colors.textSecondary }]}>Protein</Text>
                <Text style={[styles.macroVal, { color: colors.textPrimary }]}>
                  {currentProtein}g <Text style={{ color: colors.textMuted }}>/{targetProtein}g</Text>
                </Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.surfaceElevated }]}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${proteinPct}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
            </View>

            {/* Carbs */}
            <View style={styles.macroBarCol}>
              <View style={styles.macroHeader}>
                <Text style={[styles.macroName, { color: colors.textSecondary }]}>Carbs</Text>
                <Text style={[styles.macroVal, { color: colors.textPrimary }]}>
                  {currentCarbs}g <Text style={{ color: colors.textMuted }}>/{targetCarbs}g</Text>
                </Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.surfaceElevated }]}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${carbsPct}%`, backgroundColor: colors.accentAmber },
                  ]}
                />
              </View>
            </View>

            {/* Fats */}
            <View style={styles.macroBarCol}>
              <View style={styles.macroHeader}>
                <Text style={[styles.macroName, { color: colors.textSecondary }]}>Fats</Text>
                <Text style={[styles.macroVal, { color: colors.textPrimary }]}>
                  {currentFat}g <Text style={{ color: colors.textMuted }}>/{targetFat}g</Text>
                </Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.surfaceElevated }]}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${fatPct}%`, backgroundColor: colors.accentRose },
                  ]}
                />
              </View>
            </View>
          </View>
        </MaterialCard>

        {/* 5. DAILY GOALS CHECKLIST & HYDRATION (COMPACT) */}
        <MaterialCard style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.titleIconRow}>
              <Target size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Daily Goals
              </Text>
            </View>
          </View>

          {/* Goal 1: Workout */}
          <View style={[styles.goalItem, { borderColor: colors.borderLight }]}>
            <CheckCircle2
              size={20}
              color={isWorkoutCompleted ? colors.success : colors.textMuted}
            />
            <Text
              style={[
                styles.goalText,
                {
                  color: isWorkoutCompleted ? colors.textPrimary : colors.textSecondary,
                  textDecorationLine: isWorkoutCompleted ? 'line-through' : 'none',
                },
              ]}
            >
              Complete scheduled workout (+5 reward points)
            </Text>
          </View>

          {/* Goal 2: Protein Target */}
          <View style={[styles.goalItem, { borderColor: colors.borderLight }]}>
            <CheckCircle2
              size={20}
              color={currentProtein >= targetProtein ? colors.success : colors.textMuted}
            />
            <Text
              style={[
                styles.goalText,
                {
                  color: currentProtein >= targetProtein ? colors.textPrimary : colors.textSecondary,
                  textDecorationLine: currentProtein >= targetProtein ? 'line-through' : 'none',
                },
              ]}
            >
              Reach 140g daily protein goal ({currentProtein}g reached)
            </Text>
          </View>

          {/* Goal 3: Hydration Interactive Tracker */}
          <View style={[styles.goalItem, { borderColor: 'transparent', paddingBottom: 0 }]}>
            <Droplets size={20} color={colors.secondaryCyan} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.goalText, { color: colors.textPrimary }]}>
                Hydration Tracker ({waterMl / 1000}L / {targetWaterMl / 1000}L)
              </Text>
            </View>
            <Pressable
              style={[styles.waterAddBtn, { backgroundColor: colors.secondaryCyan + '20', borderColor: colors.secondaryCyan }]}
              onPress={handleAddWater}
            >
              <Plus size={12} color={colors.secondaryCyan} />
              <Text style={[styles.waterAddText, { color: colors.secondaryCyan }]}>
                +250ml
              </Text>
            </Pressable>
          </View>
        </MaterialCard>

        {/* 6. PROGRESS & CONSISTENCY SNAPSHOT (COMPACT) */}
        <MaterialCard
          style={[styles.sectionCard, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/(tabs)/progress')}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.titleIconRow}>
              <TrendingUp size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Transformation Snapshot
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </View>

          <View style={styles.progressRow}>
            <View>
              <Text style={[styles.progressMetric, { color: colors.textPrimary }]}>
                {profile?.weightKg || 72.4} kg
              </Text>
              <Text style={[styles.progressSub, { color: colors.textSecondary }]}>
                Target: {profile?.targetWeightKg || 70.0} kg • Goal: {profile?.goal || 'Muscle Gain'}
              </Text>
            </View>

            {/* 7-Day Consistency Dots */}
            <View style={styles.dotsContainer}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                const isActive = idx < streak;
                return (
                  <View key={idx} style={styles.dotCol}>
                    <View
                      style={[
                        styles.dotCircle,
                        {
                          backgroundColor: isActive ? colors.primary : colors.surfaceElevated,
                          borderColor: isActive ? colors.primary : colors.border,
                        },
                      ]}
                    />
                    <Text style={[styles.dotDay, { color: colors.textMuted }]}>{day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </MaterialCard>

        {/* 7. AI COACH PROMPT (MEDIUM) */}
        <MaterialCard
          style={[styles.aiCard, { borderColor: colors.primary + '44', backgroundColor: colors.surface }]}
          onPress={() => router.push('/ai-coach')}
        >
          <View style={styles.aiHeaderRow}>
            <View style={[styles.aiIconWrap, { backgroundColor: colors.primary + '20' }]}>
              <Sparkles size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aiTitle, { color: colors.textPrimary }]}>
                Ask FitMitra AI Coach
              </Text>
              <Text style={[styles.aiSub, { color: colors.textSecondary }]}>
                Powered by DeepSeek + LangGraph
              </Text>
            </View>
          </View>

          <View style={[styles.aiPromptChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
            <Text style={[styles.aiPromptText, { color: colors.textPrimary }]}>
              "💡 Suggest high-protein post-workout snacks under 300 kcal"
            </Text>
            <ArrowRight size={14} color={colors.primary} />
          </View>
        </MaterialCard>

        {/* 8. RECOMMENDED FOR YOU (HORIZONTAL SCROLL) */}
        <View style={styles.recommendedSection}>
          <Text style={[styles.recommendedHeading, { color: colors.textPrimary }]}>
            Recommended For You
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recScroll}>
            {/* Recommendation 1 */}
            <Pressable
              style={[styles.recCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/nutrition')}
            >
              <View style={[styles.recIconWrap, { backgroundColor: colors.accentAmber + '20' }]}>
                <Utensils size={18} color={colors.accentAmber} />
              </View>
              <Text style={[styles.recTitle, { color: colors.textPrimary }]}>
                Paneer Tikka Bowl
              </Text>
              <Text style={[styles.recSub, { color: colors.textSecondary }]}>
                32g Protein • 380 kcal
              </Text>
            </Pressable>

            {/* Recommendation 2 */}
            <Pressable
              style={[styles.recCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push('/store')}
            >
              <View style={[styles.recIconWrap, { backgroundColor: colors.primary + '20' }]}>
                <Zap size={18} color={colors.primary} />
              </View>
              <Text style={[styles.recTitle, { color: colors.textPrimary }]}>
                FitMitra Whey Isolate
              </Text>
              <Text style={[styles.recSub, { color: colors.textSecondary }]}>
                Redeem with ⚡ Points
              </Text>
            </Pressable>

            {/* Recommendation 3 */}
            <Pressable
              style={[styles.recCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push('/leaderboard')}
            >
              <View style={[styles.recIconWrap, { backgroundColor: colors.accentPurple + '20' }]}>
                <Flame size={18} color={colors.accentPurple} />
              </View>
              <Text style={[styles.recTitle, { color: colors.textPrimary }]}>
                Community Leaderboard
              </Text>
              <Text style={[styles.recSub, { color: colors.textSecondary }]}>
                Compete on streaks & reps
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  centerSpinner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greetingSub: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  gamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 8,
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  pillDivider: {
    width: 1,
    height: 12,
  },

  /* Workout Hero Card (PUSH DAY DESIGN) */
  workoutHero: {
    padding: 18,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  heroContentContainer: {
    gap: 8,
  },
  workoutHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  rewardBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  workoutTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  workoutSubMeta: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  notCompletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  emptyRadioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  notCompletedText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  heroBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  heroStartBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroStartBtnText: {
    color: '#000',
    fontSize: FontSize.sm,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  heroDoneBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroDoneBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  streakText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  completedStatusBtn: {
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  completedStatusBtnText: {
    fontSize: FontSize.md,
    fontWeight: '800',
  },

  /* Section Card */
  sectionCard: {
    marginBottom: 14,
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  smallActionText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  /* Calorie Row */
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  calorieNumber: {
    fontSize: 20,
    fontWeight: '900',
  },
  calorieSub: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  calorieBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  caloriePct: {
    fontSize: FontSize.md,
    fontWeight: '900',
  },

  /* Macro Bars */
  macroBarsContainer: {
    gap: 10,
  },
  macroBarCol: {
    gap: 4,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroName: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  macroVal: {
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  barTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },

  /* Goals */
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  goalText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    flex: 1,
  },
  waterAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  waterAddText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
  },

  /* Progress Row */
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressMetric: {
    fontSize: 22,
    fontWeight: '900',
  },
  progressSub: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dotCol: {
    alignItems: 'center',
    gap: 4,
  },
  dotCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
  },
  dotDay: {
    fontSize: 9,
    fontWeight: '800',
  },

  /* AI Card */
  aiCard: {
    borderWidth: 1.5,
    marginBottom: 16,
    padding: 16,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  aiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  aiSub: {
    fontSize: FontSize.xs,
  },
  aiPromptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  aiPromptText: {
    fontSize: FontSize.xs,
    fontStyle: 'italic',
    flex: 1,
    marginRight: 8,
  },

  /* Recommended Section */
  recommendedSection: {
    marginBottom: 20,
  },
  recommendedHeading: {
    fontSize: FontSize.md,
    fontWeight: '800',
    marginBottom: 12,
  },
  recScroll: {
    gap: 12,
  },
  recCard: {
    width: 170,
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  recIconWrap: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  recTitle: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    marginBottom: 4,
  },
  recSub: {
    fontSize: FontSize.xs,
  },
});
