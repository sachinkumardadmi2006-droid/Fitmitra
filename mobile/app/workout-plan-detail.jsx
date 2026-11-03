import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Dumbbell,
  Flame,
  Info,
  MapPin,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { workoutService } from '../services/workoutService';
import { queryKeys } from '../constants/queryKeys';
import AppCard from '../components/ui/AppCard';

const DAYS_OF_WEEK = [
  { dayOfWeek: 1, name: 'Monday', short: 'MON' },
  { dayOfWeek: 2, name: 'Tuesday', short: 'TUE' },
  { dayOfWeek: 3, name: 'Wednesday', short: 'WED' },
  { dayOfWeek: 4, name: 'Thursday', short: 'THU' },
  { dayOfWeek: 5, name: 'Friday', short: 'FRI' },
  { dayOfWeek: 6, name: 'Saturday', short: 'SAT' },
  { dayOfWeek: 7, name: 'Sunday', short: 'SUN' },
];

const formatGoal = (goal) => {
  if (!goal) return 'General Fitness';
  switch (String(goal).toUpperCase()) {
    case 'MUSCLE_GAIN':
      return 'Muscle Gain';
    case 'WEIGHT_LOSS':
    case 'FAT_LOSS':
      return 'Weight Loss';
    case 'STRENGTH':
      return 'Strength Training';
    case 'ENDURANCE':
      return 'Endurance';
    case 'GENERAL_FITNESS':
      return 'General Fitness';
    default:
      return String(goal).replace(/_/g, ' ');
  }
};

const formatLevel = (level) => {
  if (!level) return 'All Levels';
  const str = String(level);
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function WorkoutPlanDetailPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const { planId } = useLocalSearchParams();

  // Determine current day of week (1=Mon ... 7=Sun)
  const todayDow = useMemo(() => {
    return ((new Date().getDay() + 6) % 7) + 1;
  }, []);

  // Track expanded schedule day cards
  const [expandedDays, setExpandedDays] = useState({ [todayDow]: true });
  const [refreshing, setRefreshing] = useState(false);

  const toggleDay = (dow) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dow]: !prev[dow],
    }));
  };

  // Fetch Current Workout Plan & Enrollment from Backend
  const {
    data: planResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: planId ? queryKeys.workoutPlan(planId) : queryKeys.currentWorkoutPlan,
    queryFn: async () => {
      if (planId) {
        const res = await workoutService.getWorkoutPlan(planId);
        return res?.data || res;
      }
      const res = await workoutService.getCurrentWorkoutPlan();
      return res?.data || res;
    },
    staleTime: 60 * 1000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  // Extract models
  const userWorkoutPlan = planResponse?.userWorkoutPlan || null;
  const workoutPlan = planResponse?.workoutPlan || (planId ? planResponse : null);
  const program = planResponse?.program || null;

  // Compute schedule list normalized to 7 days
  const scheduleDays = useMemo(() => {
    const rawSchedule = workoutPlan?.schedule || [];
    return DAYS_OF_WEEK.map((d) => {
      const match = rawSchedule.find((s) => Number(s.dayOfWeek) === d.dayOfWeek);
      if (match) {
        return {
          ...d,
          ...match,
          isRest: Boolean(match.isRest),
          title: match.title || (match.isRest ? 'Rest & Recovery' : `Day ${d.dayOfWeek} Routine`),
          muscleGroups: Array.isArray(match.muscleGroups) ? match.muscleGroups : [],
          exercises: Array.isArray(match.exercises) ? match.exercises : [],
        };
      }
      return {
        ...d,
        isRest: true,
        title: 'Rest & Recovery',
        muscleGroups: [],
        exercises: [],
      };
    });
  }, [workoutPlan]);

  // Calculations for enrollment timeline
  const timelineInfo = useMemo(() => {
    if (!userWorkoutPlan?.startDateKey) return null;
    try {
      const [y, m, d] = userWorkoutPlan.startDateKey.split('-').map(Number);
      const start = new Date(y, m - 1, d);
      const now = new Date();
      const diffTime = Math.max(0, now.getTime() - start.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const currentWeek = Math.floor(diffDays / 7) + 1;
      const totalWeeks = Number(program?.durationWeeks || 8);
      const progressPercent = Math.min(100, Math.round((currentWeek / totalWeeks) * 100));
      return {
        currentWeek,
        totalWeeks,
        dayOfCycle: (diffDays % 7) + 1,
        progressPercent,
      };
    } catch {
      return null;
    }
  }, [userWorkoutPlan, program]);

  const assignedGoal = userWorkoutPlan?.assignedForGoal || workoutPlan?.goal || program?.goal;
  const assignedLevel = userWorkoutPlan?.assignedForLevel || workoutPlan?.difficulty || program?.level;
  const assignedLocation = userWorkoutPlan?.assignedForLocation || workoutPlan?.location || 'GYM';
  const assignedDays = userWorkoutPlan?.assignedForDaysPerWeek || workoutPlan?.daysPerWeek || 5;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top > 0 ? insets.top + 8 : 16,
            backgroundColor: colors.surface,
            borderBottomColor: colors.outlineVariant,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={[styles.backBtn, { backgroundColor: colors.surfaceVariant }]}
        >
          <ArrowLeft size={18} color={colors.onSurface} />
        </Pressable>

        <View style={styles.topBarTitleWrap}>
          <Text style={[styles.topBarTitle, { color: colors.onSurface }]}>
            My Workout Plan
          </Text>
          <Text style={[styles.topBarSubtitle, { color: colors.onSurfaceVariant }]}>
            Enrolled Training Protocol
          </Text>
        </View>

        <View style={styles.topBarRightSpacer} />
      </View>

      {/* Loading State */}
      {isLoading && !workoutPlan ? (
        <View style={[styles.centerWrap, { paddingTop: insets.top + 40 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Loading your workout plan details...
          </Text>
        </View>
      ) : isError && !workoutPlan ? (
        <View style={[styles.centerWrap, { paddingHorizontal: 24 }]}>
          <Dumbbell size={48} color={colors.error || '#EF4444'} />
          <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
            Could Not Load Plan
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
            {error?.message || 'Failed to fetch your active workout plan from the server.'}
          </Text>
          <Pressable
            style={[styles.actionBtnPrimary, { backgroundColor: colors.primary }]}
            onPress={onRefresh}
          >
            <RotateCcw size={16} color={colors.onPrimary} style={{ marginRight: 6 }} />
            <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>Retry</Text>
          </Pressable>
        </View>
      ) : !workoutPlan ? (
        <View style={[styles.centerWrap, { paddingHorizontal: 24 }]}>
          <Sparkles size={48} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
            No Active Workout Plan
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
            You haven't enrolled in a workout plan yet. Choose a structured program to start training!
          </Text>
          <Pressable
            style={[styles.actionBtnPrimary, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/workouts')}
          >
            <Compass size={16} color={colors.onPrimary} style={{ marginRight: 6 }} />
            <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>
              Browse All Programs
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 110 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* 1. Hero Plan Identity Card */}
          <AppCard
            variant="elevated"
            style={[
              styles.heroCard,
              { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
            ]}
          >
            <View style={styles.heroTopRow}>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(53, 208, 127, 0.15)' }]}>
                <ShieldCheck size={14} color="#10B981" style={{ marginRight: 4 }} />
                <Text style={styles.statusBadgeText}>ACTIVE PROTOCOL</Text>
              </View>

              {userWorkoutPlan?.startDateKey && (
                <View style={styles.dateWrap}>
                  <Calendar size={13} color={colors.onSurfaceVariant} style={{ marginRight: 4 }} />
                  <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
                    Started {userWorkoutPlan.startDateKey}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.planTitle, { color: colors.onSurface }]}>
              {workoutPlan.name || 'Structured Workout Plan'}
            </Text>

            {program?.name && (
              <View style={styles.programNameRow}>
                <Award size={14} color={colors.primary} style={{ marginRight: 5 }} />
                <Text style={[styles.programNameText, { color: colors.primary }]}>
                  Part of {program.name}
                </Text>
              </View>
            )}

            {/* 4 Core Parameter Chips (Goal, Level, Location, Days/Week) */}
            <View style={styles.metricsGrid}>
              <View style={[styles.metricChip, { backgroundColor: colors.surfaceVariant }]}>
                <Target size={15} color={colors.primary} />
                <View style={styles.metricTextWrap}>
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>GOAL</Text>
                  <Text style={[styles.metricValue, { color: colors.onSurface }]} numberOfLines={1}>
                    {formatGoal(assignedGoal)}
                  </Text>
                </View>
              </View>

              <View style={[styles.metricChip, { backgroundColor: colors.surfaceVariant }]}>
                <Zap size={15} color="#F59E0B" />
                <View style={styles.metricTextWrap}>
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>LEVEL</Text>
                  <Text style={[styles.metricValue, { color: colors.onSurface }]} numberOfLines={1}>
                    {formatLevel(assignedLevel)}
                  </Text>
                </View>
              </View>

              <View style={[styles.metricChip, { backgroundColor: colors.surfaceVariant }]}>
                <MapPin size={15} color="#3B82F6" />
                <View style={styles.metricTextWrap}>
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>LOCATION</Text>
                  <Text style={[styles.metricValue, { color: colors.onSurface }]} numberOfLines={1}>
                    {String(assignedLocation).toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={[styles.metricChip, { backgroundColor: colors.surfaceVariant }]}>
                <Calendar size={15} color="#10B981" />
                <View style={styles.metricTextWrap}>
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>FREQUENCY</Text>
                  <Text style={[styles.metricValue, { color: colors.onSurface }]} numberOfLines={1}>
                    {assignedDays} Days / Wk
                  </Text>
                </View>
              </View>
            </View>

            {/* Program Timeline Progress Bar */}
            {timelineInfo && (
              <View style={[styles.progressSection, { borderTopColor: colors.outlineVariant }]}>
                <View style={styles.progressLabels}>
                  <Text style={[styles.progressSubtitle, { color: colors.onSurfaceVariant }]}>
                    Week {timelineInfo.currentWeek} of {timelineInfo.totalWeeks} • Cycle Day {timelineInfo.dayOfCycle}
                  </Text>
                  <Text style={[styles.progressPercent, { color: colors.primary }]}>
                    {timelineInfo.progressPercent}%
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${timelineInfo.progressPercent}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
              </View>
            )}
          </AppCard>

          {/* 2. Plan Overview & Description */}
          {Boolean(workoutPlan.description || program?.description) && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Info size={17} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Program Overview
                </Text>
              </View>
              <AppCard
                variant="outlined"
                style={[styles.descCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
              >
                <Text style={[styles.descText, { color: colors.onSurfaceVariant }]}>
                  {workoutPlan.description || program?.description}
                </Text>
              </AppCard>
            </View>
          )}

          {/* 3. 7-Day Weekly Training Split */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Flame size={17} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Weekly Training Split (7 Days)
              </Text>
            </View>

            {scheduleDays.map((day) => {
              const isToday = day.dayOfWeek === todayDow;
              const isExpanded = Boolean(expandedDays[day.dayOfWeek]);
              const exercises = day.exercises || [];

              return (
                <AppCard
                  key={day.dayOfWeek}
                  variant="outlined"
                  style={[
                    styles.dayCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isToday ? colors.primary : colors.outlineVariant,
                    },
                    isToday && styles.todayCardHighlight,
                  ]}
                >
                  <Pressable
                    style={styles.dayHeaderPressable}
                    onPress={() => toggleDay(day.dayOfWeek)}
                    hitSlop={6}
                  >
                    <View style={styles.dayHeaderLeft}>
                      <View style={styles.dayBadgeRow}>
                        <View
                          style={[
                            styles.dayDowBadge,
                            { backgroundColor: isToday ? colors.primary : colors.surfaceVariant },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayDowText,
                              { color: isToday ? colors.onPrimary : colors.onSurfaceVariant },
                            ]}
                          >
                            DAY {day.dayOfWeek} • {day.short}
                          </Text>
                        </View>

                        {isToday && (
                          <View style={[styles.todayTag, { backgroundColor: 'rgba(53, 208, 127, 0.15)' }]}>
                            <CheckCircle2 size={12} color="#10B981" style={{ marginRight: 3 }} />
                            <Text style={styles.todayTagText}>TODAY</Text>
                          </View>
                        )}

                        {day.isRest && (
                          <View style={[styles.restTag, { backgroundColor: colors.surfaceVariant }]}>
                            <Text style={[styles.restTagText, { color: colors.onSurfaceVariant }]}>
                              REST DAY
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={[styles.dayTitle, { color: colors.onSurface }]}>
                        {day.title}
                      </Text>

                      {/* Muscle Groups Chips or Rest Summary */}
                      {day.isRest ? (
                        <Text style={[styles.restSummaryText, { color: colors.onSurfaceVariant }]}>
                          Scheduled recovery for muscle repair and central nervous system adaptation.
                        </Text>
                      ) : (
                        <View style={styles.daySubRow}>
                          <Text style={[styles.dayMetaText, { color: colors.onSurfaceVariant }]}>
                            {exercises.length} {exercises.length === 1 ? 'Exercise' : 'Exercises'}
                          </Text>
                          {day.muscleGroups.length > 0 && (
                            <>
                              <Text style={[styles.bulletDot, { color: colors.onSurfaceVariant }]}>•</Text>
                              <Text style={[styles.muscleGroupText, { color: colors.primary }]} numberOfLines={1}>
                                {day.muscleGroups.join(', ')}
                              </Text>
                            </>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Expand/Collapse Chevron */}
                    {!day.isRest && exercises.length > 0 && (
                      <View style={[styles.chevronWrap, { backgroundColor: colors.surfaceVariant }]}>
                        {isExpanded ? (
                          <ChevronUp size={16} color={colors.onSurface} />
                        ) : (
                          <ChevronDown size={16} color={colors.onSurface} />
                        )}
                      </View>
                    )}
                  </Pressable>

                  {/* Expanded Exercise List */}
                  {!day.isRest && isExpanded && exercises.length > 0 && (
                    <View style={[styles.exerciseListWrap, { borderTopColor: colors.outlineVariant }]}>
                      {exercises.map((item, exIndex) => {
                        const exDoc = item.exerciseId || {};
                        const exName = exDoc.name || item.exerciseName || `Exercise ${exIndex + 1}`;
                        const muscleStr = Array.isArray(exDoc.muscleGroups) ? exDoc.muscleGroups.join(' • ') : '';

                        return (
                          <View
                            key={exIndex}
                            style={[
                              styles.exerciseItemRow,
                              exIndex < exercises.length - 1 && { borderBottomColor: colors.outlineVariant, borderBottomWidth: StyleSheet.hairlineWidth },
                            ]}
                          >
                            <View style={[styles.exOrderBox, { backgroundColor: colors.surfaceVariant }]}>
                              <Text style={[styles.exOrderText, { color: colors.onSurfaceVariant }]}>
                                {item.order || exIndex + 1}
                              </Text>
                            </View>

                            <View style={styles.exInfoCol}>
                              <Text style={[styles.exNameText, { color: colors.onSurface }]}>
                                {exName}
                              </Text>
                              <View style={styles.exMetricsRow}>
                                <Text style={[styles.exParamsText, { color: colors.primary }]}>
                                  {item.sets || 3} sets × {item.reps || '10-12'} reps
                                </Text>
                                <Text style={[styles.bulletDot, { color: colors.onSurfaceVariant }]}>•</Text>
                                <View style={styles.restPill}>
                                  <Clock size={11} color={colors.onSurfaceVariant} style={{ marginRight: 3 }} />
                                  <Text style={[styles.restTimeText, { color: colors.onSurfaceVariant }]}>
                                    {item.restSeconds || 60}s rest
                                  </Text>
                                </View>
                              </View>
                              {Boolean(muscleStr) && (
                                <Text style={[styles.exMuscleSub, { color: colors.onSurfaceVariant }]}>
                                  {muscleStr}
                                </Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </AppCard>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Floating Sticky Bottom Action Bar */}
      {Boolean(workoutPlan) && (
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.outlineVariant,
              paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 20,
            },
          ]}
        >
          <Pressable
            style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/workout/today')}
          >
            <Play size={16} color={colors.onPrimary} fill={colors.onPrimary} style={{ marginRight: 6 }} />
            <Text style={[styles.primaryActionBtnText, { color: colors.onPrimary }]}>
              Start Today's Workout
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.secondaryActionBtn,
              { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
            ]}
            onPress={() => router.push('/(tabs)/workouts')}
          >
            <Text style={[styles.secondaryActionBtnText, { color: colors.onSurface }]}>
              Back to Workouts
            </Text>
          </Pressable>
        </View>
      )}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleWrap: {
    alignItems: 'center',
    flex: 1,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  topBarSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  topBarRightSpacer: {
    width: 36,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    marginBottom: 16,
    borderRadius: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  planTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  programNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  programNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  metricChip: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
  },
  metricTextWrap: {
    marginLeft: 8,
    flex: 1,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  progressSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionWrap: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  descCard: {
    padding: 14,
    borderRadius: 14,
  },
  descText: {
    fontSize: 13,
    lineHeight: 19,
  },
  dayCard: {
    marginBottom: 10,
    borderRadius: 16,
  },
  todayCardHighlight: {
    borderWidth: 1.5,
  },
  dayHeaderPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  dayHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  dayBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dayDowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dayDowText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  todayTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  todayTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  restTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  restTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  restSummaryText: {
    fontSize: 12,
    lineHeight: 17,
  },
  daySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bulletDot: {
    marginHorizontal: 5,
    fontSize: 11,
  },
  muscleGroupText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseListWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  exerciseItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  exOrderBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  exOrderText: {
    fontSize: 11,
    fontWeight: '800',
  },
  exInfoCol: {
    flex: 1,
  },
  exNameText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  exMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exParamsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  restPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restTimeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  exMuscleSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryActionBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

