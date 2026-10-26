import React, { useState, useCallback } from 'react';
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
  Lock,
  ChevronRight,
  Sparkles,
  Award,
  Zap,
} from 'lucide-react-native';
import { Chip } from 'react-native-paper';
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

const GOAL_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'MUSCLE_GAIN', label: 'Muscle Gain' },
  { key: 'WEIGHT_LOSS', label: 'Weight Loss' },
  { key: 'GENERAL_FITNESS', label: 'General Fitness' },
];

export default function WorkoutsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const { isAuthenticated } = useAuth();

  const [selectedFilter, setSelectedFilter] = useState('ALL');

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

  // 3. Programs Query (cached per goal filter)
  const programsQuery = useQuery({
    queryKey: queryKeys.programs(selectedFilter),
    queryFn: async () => {
      const programParams = {};
      if (selectedFilter && selectedFilter !== 'ALL') {
        programParams.goal = selectedFilter;
      }
      const res = await workoutService.getPrograms(programParams);
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

  // 4. Workout History Query
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
  const programs = programsQuery.data || [];
  const history = historyQuery.data || [];

  const loading =
    (todayQuery.isLoading && !todayQuery.data) ||
    (programsQuery.isLoading && !programsQuery.data);

  const refreshing =
    todayQuery.isRefetching ||
    currentProgramQuery.isRefetching ||
    programsQuery.isRefetching ||
    historyQuery.isRefetching;

  const onRefresh = useCallback(async () => {
    await Promise.all([
      todayQuery.refetch(),
      currentProgramQuery.refetch(),
      programsQuery.refetch(),
      historyQuery.refetch(),
    ]);
  }, [todayQuery, currentProgramQuery, programsQuery, historyQuery]);

  const handleFilterChange = (key) => {
    setSelectedFilter(key);
  };

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
                {isWorkoutCompleted ? (
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

              <Text style={[styles.levelBadge, { color: colors.onSurfaceVariant }]}>
                {todayWorkout.workout.level || 'Standard'}
              </Text>
            </View>

            <Text style={[styles.todayTitle, { color: colors.onSurface }]}>
              {isRestDay ? 'Rest & Muscle Recovery' : todayWorkout.workout.title}
            </Text>

            <Text style={[styles.todaySub, { color: colors.onSurfaceVariant }]}>
              {isRestDay
                ? 'Your muscles repair and strengthen during rest days. Hydrate and eat high-protein meals.'
                : todayWorkout.workout.programName
                ? `Part of ${todayWorkout.workout.programName}`
                : 'Follow the exercise sets and log each exercise to track your performance.'}
            </Text>

            {!isRestDay && (
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Clock size={15} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.onSurface }]}>
                    ~{todayWorkout.workout.estimatedMin || 40} mins
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Dumbbell size={15} color={colors.primary} />
                  <Text style={[styles.metaText, { color: colors.onSurface }]}>
                    {todayWorkout.workout.exercises?.length || 0} exercises
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
              {isWorkoutCompleted ? (
                <AppButton
                  mode="outlined"
                  label="Review Completed Routine"
                  icon="check-circle"
                  onPress={() => router.push(`/workout/${todayWorkoutId}?kind=today`)}
                />
              ) : isRestDay ? (
                <AppButton
                  mode="outlined"
                  label="Explore Workout Programs"
                  icon="compass"
                  onPress={() => {}}
                />
              ) : isWorkoutInProgress ? (
                <AppButton
                  tone="primary"
                  label="Resume Workout Session"
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
              onPress={() => router.push(`/workout/${currentProgram.program.id}?kind=program`)}
            />
          </AppCard>
        )}

        {/* 3. Program Discovery Section */}
        <SectionHeader title="Explore Programs" />

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipRow}
        >
          {GOAL_FILTERS.map((f) => {
            const isSelected = selectedFilter === f.key;
            return (
              <Chip
                key={f.key}
                selected={isSelected}
                onPress={() => handleFilterChange(f.key)}
                style={[
                  styles.filterChip,
                  isSelected
                    ? { backgroundColor: colors.primaryContainer }
                    : { backgroundColor: colors.surfaceVariant },
                ]}
                textStyle={{
                  color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                  fontWeight: isSelected ? '700' : '500',
                  fontSize: 13,
                }}
              >
                {f.label}
              </Chip>
            );
          })}
        </ScrollView>

        {/* Programs List */}
        {loading && programs.length === 0 ? (
          <View style={styles.skeletonWrap}>
            <Skeleton height={140} radius={custom.radius.lg} style={styles.mbMd} />
            <Skeleton height={140} radius={custom.radius.lg} style={styles.mbMd} />
            <Skeleton height={140} radius={custom.radius.lg} style={styles.mbMd} />
          </View>
        ) : programs.length > 0 ? (
          programs.map((prog, pIdx) => {
            const progId = String(prog._id?._id || prog._id || prog.id || pIdx);
            const isLocked = Boolean(prog.locked);

            return (
              <AppCard
                key={progId}
                variant="elevated"
                onPress={() => router.push(`/workout/${progId}?kind=program`)}
                style={styles.programCard}
              >
                <View style={styles.programCardTop}>
                  <View style={styles.programTitleCol}>
                    <Text style={[styles.programTitle, { color: colors.onSurface }]} numberOfLines={1}>
                      {prog.name}
                    </Text>
                    <Text style={[styles.programDesc, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                      {prog.description || 'Structured strength and conditioning plan tailored to build endurance and muscle.'}
                    </Text>
                  </View>

                  {isLocked && (
                    <View
                      style={[
                        styles.lockBadge,
                        { backgroundColor: colors.surfaceVariant },
                      ]}
                    >
                      <Lock size={14} color={colors.secondary} />
                      <Text style={[styles.lockText, { color: colors.secondary }]}>PRO</Text>
                    </View>
                  )}
                </View>

                {/* Metadata Pills */}
                <View style={styles.progMetaRow}>
                  <View style={[styles.progPill, { backgroundColor: colors.surfaceVariant }]}>
                    <Text style={[styles.progPillText, { color: colors.onSurfaceVariant }]}>
                      {formatGoal(prog.goal)}
                    </Text>
                  </View>

                  <View style={[styles.progPill, { backgroundColor: colors.surfaceVariant }]}>
                    <Text style={[styles.progPillText, { color: colors.onSurfaceVariant }]}>
                      {formatLevel(prog.level)}
                    </Text>
                  </View>

                  <View style={[styles.progPill, { backgroundColor: colors.surfaceVariant }]}>
                    <Clock size={12} color={colors.onSurfaceVariant} style={{ marginRight: 4 }} />
                    <Text style={[styles.progPillText, { color: colors.onSurfaceVariant }]}>
                      {prog.durationWeeks ? `${prog.durationWeeks} Wks` : '4 Wks'}
                    </Text>
                  </View>
                </View>

                <View style={styles.progFooterRow}>
                  <Text style={[styles.progDaysMeta, { color: colors.onSurfaceVariant }]}>
                    {prog.daysPerWeek ? `${prog.daysPerWeek} days / week` : 'Structured schedule'}
                  </Text>
                  <View style={styles.rowAlign}>
                    <Text style={[styles.viewDetailsText, { color: custom.primaryStrong }]}>
                      {isLocked ? 'View Details' : 'Start Workout'}
                    </Text>
                    <ChevronRight size={16} color={custom.primaryStrong} />
                  </View>
                </View>
              </AppCard>
            );
          })
        ) : (
          <EmptyState
            icon="dumbbell"
            title="No Programs Found"
            description="No training programs match the selected filter. Try selecting 'All' to browse available routines."
            actionLabel="Reset Filters"
            onAction={() => handleFilterChange('ALL')}
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

            return (
              <AppCard
                key={String(session._id?._id || session._id || session.id || index)}
                variant="outlined"
                style={styles.historyCard}
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
  filterChip: {
    borderRadius: 20,
  },
  skeletonWrap: {
    paddingVertical: 8,
  },
  mbMd: {
    marginBottom: 12,
  },
  programCard: {
    marginBottom: 12,
  },
  programCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  programTitleCol: {
    flex: 1,
    marginRight: 8,
  },
  programTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  programDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lockText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  progPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 10,
    marginTop: 2,
  },
  progDaysMeta: {
    fontSize: 12,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
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
