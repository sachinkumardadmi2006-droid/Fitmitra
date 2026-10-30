import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Dumbbell,
  RotateCcw,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Award,
  Zap,
  Play,
  VideoOff,
} from 'lucide-react-native';
import { workoutService, normalizeTodayWorkout } from '../../services/workoutService';
import { queryKeys } from '../../constants/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { TopBar } from '../../components/common/TopBar';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

export default function WorkoutsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const { isAuthenticated } = useAuth();

  // 1. Today's Workout Query
  const todayQuery = useQuery({
    queryKey: queryKeys.todayWorkout,
    queryFn: async () => {
      const res = await workoutService.getTodayWorkout();
      return res ? normalizeTodayWorkout(res) : null;
    },
    enabled: Boolean(isAuthenticated),
    staleTime: 60 * 1000,
  });

  // 2. Current Program Query
  const currentProgramQuery = useQuery({
    queryKey: queryKeys.currentProgram,
    queryFn: async () => {
      const res = await workoutService.getCurrentProgram();
      const progData = res?.data || res;
      return progData?.program ? progData : null;
    },
    enabled: Boolean(isAuthenticated),
    staleTime: 60 * 1000,
  });

  // 3. Workout History Query
  const historyQuery = useQuery({
    queryKey: queryKeys.workoutHistory(10),
    queryFn: async () => {
      const res = await workoutService.getWorkoutHistory({ limit: 10 });
      return Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
        ? res
        : [];
    },
    enabled: Boolean(isAuthenticated),
    staleTime: 60 * 1000,
  });

  const todayWorkout = todayQuery.data || null;
  const currentProgram = currentProgramQuery.data || null;
  const history = historyQuery.data || [];

  const todayExercises = useMemo(() => {
    const raw = todayWorkout?.workout?.exercises || [];
    const seen = new Set();
    const result = [];
    for (const ex of raw) {
      const rawId = typeof ex.exerciseId === 'object' ? (ex.exerciseId?._id || '') : (ex.exerciseId || ex._id || '');
      const key = rawId && !rawId.startsWith('ex_') ? rawId : (ex.slug || (ex.name || '').toLowerCase().trim());
      if (!seen.has(key)) {
        seen.add(key);
        result.push(ex);
      }
    }
    return result;
  }, [todayWorkout?.workout?.exercises]);

  const loading = todayQuery.isLoading && !todayQuery.data;

  const refreshing =
    todayQuery.isRefetching ||
    currentProgramQuery.isRefetching ||
    historyQuery.isRefetching;

  const onRefresh = useCallback(async () => {
    await Promise.all([
      todayQuery.refetch(),
      currentProgramQuery.refetch(),
      historyQuery.refetch(),
    ]);
  }, [todayQuery, currentProgramQuery, historyQuery]);

  const formatGoal = (goal) => {
    switch (goal) {
      case 'MUSCLE_GAIN':
        return 'Muscle Gain';
      case 'WEIGHT_LOSS':
        return 'Weight Loss';
      case 'GENERAL_FITNESS':
        return 'General Fitness';
      default:
        return goal || 'Fitness';
    }
  };

  const formatLevel = (level) => {
    if (!level) return 'All Levels';
    return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  };

  const hasProgram = todayWorkout?.hasProgram !== false && todayWorkout?.type !== 'no_program';
  const sessionStatus = todayWorkout?.session?.status || 'not_started';
  const isWorkoutCompleted = Boolean(todayWorkout?.hasCompletedToday || sessionStatus === 'completed');
  const isWorkoutInProgress = sessionStatus === 'in_progress';
  const isRestDay = Boolean(todayWorkout?.isRest || todayWorkout?.type === 'rest');
  const todayWorkoutId = todayWorkout?.workout?.id || 'today';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TopBar title="Workouts" subtitle="Structured plans & training tracking" />

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
        {/* 1. Today's Scheduled Training Card */}
        {todayWorkout && (
          <AppCard
            variant="elevated"
            style={[
              styles.todayCard,
              isWorkoutCompleted ? { borderColor: colors.primary, borderWidth: 1 } : null,
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.tagWrap}>
                {!hasProgram ? (
                  <View style={[styles.statusTag, { backgroundColor: colors.secondaryContainer }]}>
                    <Dumbbell size={13} color={colors.onSecondaryContainer} />
                    <Text style={[styles.statusTagText, { color: colors.onSecondaryContainer }]}>
                      GET STARTED
                    </Text>
                  </View>
                ) : isWorkoutCompleted ? (
                  <View style={[styles.statusTag, { backgroundColor: colors.primaryContainer }]}>
                    <CheckCircle2 size={13} color={colors.onPrimaryContainer} />
                    <Text style={[styles.statusTagText, { color: colors.onPrimaryContainer }]}>
                      {"TODAY'S WORKOUT COMPLETED"}
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
                      SESSION IN PROGRESS
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.statusTag, { backgroundColor: colors.secondaryContainer }]}>
                    <Dumbbell size={13} color={colors.onSecondaryContainer} />
                    <Text style={[styles.statusTagText, { color: colors.onSecondaryContainer }]}>
                      {"TODAY'S ROUTINE"}
                    </Text>
                  </View>
                )}
              </View>

              {hasProgram && todayWorkout.workout?.level && (
                <Text style={[styles.levelBadge, { color: colors.onSurfaceVariant }]}>
                  {todayWorkout.workout.level}
                </Text>
              )}
            </View>

            <Text style={[styles.todayTitle, { color: colors.onSurface }]}>
              {!hasProgram
                ? 'Choose Your Workout Plan'
                : isRestDay
                ? 'Rest & Muscle Recovery'
                : todayWorkout.workout?.title || 'Daily Training Routine'}
            </Text>

            <Text style={[styles.todaySub, { color: colors.onSurfaceVariant }]}>
              {!hasProgram
                ? 'Browse our structured programs below and choose a plan that fits your goal to start receiving daily workouts.'
                : isRestDay
                ? 'Your muscles repair and strengthen during rest days. Hydrate and eat high-protein meals.'
                : todayWorkout.workout?.programName
                ? `Part of ${todayWorkout.workout.programName}`
                : 'Follow the exercise sets and log each exercise to track your performance.'}
            </Text>

            {hasProgram && !isRestDay && (
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Clock size={15} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.onSurface }]}>
                    ~{todayWorkout.workout?.estimatedMin || 40} mins
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Dumbbell size={15} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.onSurface }]}>
                    {todayWorkout.workout?.exercises?.length || 0} exercises
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Zap size={15} color={colors.secondary} />
                  <Text style={[styles.metaText, { color: colors.onSurface }]}>
                    +5 reward pts
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.todayActionWrap}>
              {!hasProgram ? (
                <AppButton
                  tone="primary"
                  label="Setup Profile"
                  icon="account"
                  onPress={() => router.push('/profile')}
                />
              ) : isWorkoutCompleted ? (
                <AppButton
                  mode="outlined"
                  label="Review Today's Workout"
                  icon="check-circle"
                  onPress={() => router.push(`/workout/${todayWorkoutId}?kind=today`)}
                />
              ) : isRestDay ? (
                <View style={[styles.restTagRow, { backgroundColor: colors.surfaceVariant }]}>
                  <Sparkles size={14} color={colors.primary} />
                  <Text style={[styles.restTagText, { color: colors.onSurfaceVariant }]}>
                    Take time to rest & recover today
                  </Text>
                </View>
              ) : isWorkoutInProgress ? (
                <AppButton
                  tone="primary"
                  label="Resume Today's Workout"
                  icon="play"
                  onPress={() => router.push(`/workout/${todayWorkoutId}?kind=today`)}
                />
              ) : (
                <AppButton
                  tone="primary"
                  label="Start Today's Workout"
                  icon="play"
                  onPress={() => router.push(`/workout/${todayWorkoutId}?kind=today`)}
                />
              )}
            </View>
          </AppCard>
        )}

        {/* 2. Active Enrolled Program Banner */}
        {currentProgram?.program && (
          <AppCard variant="outlined" style={styles.activeProgramCard}>
            <View style={styles.activeProgramHeader}>
              <View style={styles.rowAlign}>
                <Award size={18} color={colors.primary} />
                <Text style={[styles.activeProgLabel, { color: colors.primary }]}>
                  CURRENT ENROLLED PROGRAM
                </Text>
              </View>
              <View
                style={[
                  styles.progressPill,
                  { backgroundColor: colors.primaryContainer },
                ]}
              >
                <Text style={[styles.progressPillText, { color: colors.onPrimaryContainer }]}>
                  Week {currentProgram.weekNumber || 1} • Day {currentProgram.dayNumber || 1}
                </Text>
              </View>
            </View>

            <Text style={[styles.activeProgTitle, { color: colors.onSurface }]}>
              {currentProgram.program.title}
            </Text>

            <Text style={[styles.activeProgMeta, { color: colors.onSurfaceVariant }]}>
              {formatGoal(currentProgram.program.goal)} • {formatLevel(currentProgram.program.level)} • {currentProgram.program.durationWeeks} Weeks
            </Text>

            <AppButton
              mode="text"
              label="View Program Details"
              icon="arrow-right"
              style={{ alignSelf: 'flex-start', marginTop: 4 }}
              onPress={() =>
                router.push(
                  `/workout/${currentProgram.program.id || currentProgram.program._id}?kind=program`
                )
              }
            />
          </AppCard>
        )}

        {/* 3. Today's Scheduled Exercises Section (Strictly Scoped) */}
        <SectionHeader
          title={isRestDay ? "Today's Schedule" : `Today's Exercises (${todayExercises.length})`}
        />

        {loading ? (
          <View style={styles.skeletonWrap}>
            <Skeleton height={90} radius={custom.radius.lg} style={styles.mbMd} />
            <Skeleton height={90} radius={custom.radius.lg} style={styles.mbMd} />
          </View>
        ) : isRestDay ? (
          <EmptyState
            icon="weather-night"
            title="Scheduled Rest Day"
            message="Recovery is essential for muscle repair and endurance. Hydrate well, do light stretching, and get ready for your next session!"
            actionLabel="Browse All Programs"
            onAction={() => router.push('/(tabs)/programs')}
          />
        ) : todayExercises.length > 0 ? (
          todayExercises.map((exercise, idx) => {
            const hasVideo = Boolean(exercise.videoUrl);
            const exerciseRawId = typeof exercise.exerciseId === 'object' ? (exercise.exerciseId?._id || '') : (exercise.exerciseId || exercise._id || '');
            const targetExerciseId = typeof exercise.exerciseId === 'object' ? (exercise.exerciseId?._id || exercise.exerciseId) : (exercise.exerciseId || exercise._id);
            const exNameKey = String(exercise.name || '').toLowerCase().trim();

            const isCompleted = Boolean(
              todayWorkout?.session?.completedSetsMap?.[`${idx}_0`] ||
              (exerciseRawId && todayWorkout?.session?.completedSetsMap?.[`${exerciseRawId}_0`]) ||
              (targetExerciseId && todayWorkout?.session?.completedSetsMap?.[`${targetExerciseId}_0`]) ||
              (exerciseRawId && todayWorkout?.session?.completedExerciseMap?.[exerciseRawId]) ||
              (targetExerciseId && todayWorkout?.session?.completedExerciseMap?.[targetExerciseId]) ||
              (exNameKey && todayWorkout?.session?.completedExerciseMap?.[exNameKey])
            );

            const exerciseKey = `today-ex-${exerciseRawId || 'item'}-${idx}`;

            return (
              <AppCard
                key={exerciseKey}
                variant="elevated"
                style={styles.exerciseCard}
                onPress={() =>
                  router.push(
                    `/workout/exercise/${targetExerciseId}?index=${idx}&total=${todayExercises.length}`
                  )
                }
              >
                <View style={styles.exCardHeader}>
                  <View style={styles.exCardLeft}>
                    <View
                      style={[
                        styles.exIndexBadge,
                        {
                          backgroundColor: isCompleted
                            ? colors.primaryContainer
                            : colors.surfaceVariant,
                        },
                      ]}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={14} color={colors.onPrimaryContainer} />
                      ) : (
                        <Text
                          style={[
                            styles.exIndexText,
                            { color: colors.onSurfaceVariant },
                          ]}
                        >
                          #{idx + 1}
                        </Text>
                      )}
                    </View>
                    <View style={styles.exTitleCol}>
                      <Text
                        style={[styles.exTitleText, { color: colors.onSurface }]}
                        numberOfLines={1}
                      >
                        {exercise.name}
                      </Text>
                      <View style={styles.exMetaRow}>
                        <Text
                          style={[styles.exMetaText, { color: colors.onSurfaceVariant }]}
                        >
                          {exercise.sets} Sets • {exercise.reps} Reps
                        </Text>
                        <View style={styles.dotSeparator} />
                        <Text
                          style={[styles.exMetaText, { color: colors.onSurfaceVariant }]}
                        >
                          {exercise.restSec}s rest
                        </Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.onSurfaceVariant} />
                </View>

                {/* Badges / Muscle tags row */}
                <View style={styles.exBottomRow}>
                  {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                    <View
                      style={[
                        styles.muscleTagPill,
                        { backgroundColor: colors.surfaceVariant },
                      ]}
                    >
                      <Text
                        style={[styles.muscleTagText, { color: colors.onSurfaceVariant }]}
                        numberOfLines={1}
                      >
                        {exercise.muscleGroups.slice(0, 2).join(', ')}
                      </Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.videoTagPill,
                      hasVideo
                        ? { backgroundColor: colors.primaryContainer }
                        : { backgroundColor: colors.surfaceVariant },
                    ]}
                  >
                    {hasVideo ? (
                      <>
                        <Play size={11} color={colors.onPrimaryContainer} style={{ marginRight: 3 }} />
                        <Text
                          style={[styles.videoTagText, { color: colors.onPrimaryContainer }]}
                        >
                          Video Available
                        </Text>
                      </>
                    ) : (
                      <>
                        <VideoOff size={11} color={colors.onSurfaceVariant} style={{ marginRight: 3 }} />
                        <Text
                          style={[styles.videoTagText, { color: colors.onSurfaceVariant }]}
                        >
                          Video Coming Soon
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </AppCard>
            );
          })
        ) : (
          <EmptyState
            icon="dumbbell"
            title="No Exercises Configured"
            description="There are no exercises configured for today's workout in your active plan."
          />
        )}

        {/* 4. Workout History Section */}
        <SectionHeader title="Workout History" />

        {history.length > 0 ? (
          history.map((session, index) => {
            const dateStr = session.completedAt || session.startedAt;
            const dateLabel = dateStr
              ? new Date(dateStr).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recent Session';

            const durationMins = Math.max(1, Math.round((session.durationSeconds || 1800) / 60));
            const calories = session.caloriesEstimate || Math.round(durationMins * 7.5);

            const sessionKey = `history-session-${String(session._id?._id || session._id || session.id || 'sess')}-${index}`;

            return (
              <AppCard
                key={sessionKey}
                variant="outlined"
                style={styles.historyCard}
                onPress={() => router.push(`/workout/${session._id || session.id}?kind=session`)}
              >
                <View style={styles.historyRow}>
                  <View
                    style={[
                      styles.historyIconWrap,
                      { backgroundColor: colors.primaryContainer },
                    ]}
                  >
                    <CheckCircle2 size={18} color={colors.onPrimaryContainer} />
                  </View>

                  <View style={styles.historyMetaCol}>
                    <Text style={[styles.historyTitle, { color: colors.onSurface }]} numberOfLines={1}>
                      {session.title || session.routineName || 'Completed Workout'}
                    </Text>
                    <Text style={[styles.historySub, { color: colors.onSurfaceVariant }]}>
                      {dateLabel} • {durationMins} mins • {calories} kcal
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.historyBadge,
                      { backgroundColor: colors.surfaceVariant },
                    ]}
                  >
                    <Zap size={13} color={colors.secondary} />
                    <Text style={[styles.historyBadgeText, { color: colors.onSurface }]}>
                      +5 pts
                    </Text>
                  </View>
                </View>
              </AppCard>
            );
          })
        ) : (
          <EmptyState
            icon="calendar"
            title="No Workout History"
            description="Sessions you complete will appear here with duration, calories burned, and points earned."
          />
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
    paddingBottom: 40,
  },
  todayCard: {
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tagWrap: {
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
  levelBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  todayTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  todaySub: {
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
  todayActionWrap: {
    marginTop: 4,
  },
  activeProgramCard: {
    marginBottom: 16,
  },
  activeProgramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  activeProgLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  progressPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  progressPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeProgTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  activeProgMeta: {
    fontSize: 13,
    marginBottom: 4,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
    paddingTop: 4,
  },
  exerciseCard: {
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  exCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  exIndexBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exIndexText: {
    fontSize: 12,
    fontWeight: '800',
  },
  exTitleCol: {
    flex: 1,
  },
  exTitleText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  exMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#888',
    marginHorizontal: 6,
  },
  exBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  muscleTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  muscleTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  videoTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  videoTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  restDayCard: {
    padding: 16,
    marginBottom: 12,
  },
  restDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restDayIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  restDayTextCol: {
    flex: 1,
  },
  restDayTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  restDayDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  restTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  restTagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyCard: {
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyMetaCol: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  historySub: {
    fontSize: 12,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
