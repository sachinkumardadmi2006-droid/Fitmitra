// Structured Programs Tab — mirrors frontend Programs.jsx
// Displays the user's active fitness program, today's workout, and timeline
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Clock,
  Target,
  Play,
  CheckCircle2,
  Sparkles,
  Dumbbell,
  Calendar,
  Layers,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useAppTheme } from '../../theme/ThemeContext';
import { spacing, radius } from '../../theme/tokens';
import { workoutService } from '../../services';
import { queryKeys } from '../../constants/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../utils/i18n';
import Skeleton, { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

export default function ProgramsTab() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const lang = user?.language || 'en';

  // 1. Fetch Current User Program
  const {
    data: currentData,
    isLoading: isProgramLoading,
    isError: isProgramError,
    error: programError,
    refetch: refetchCurrent,
  } = useQuery({
    queryKey: queryKeys.currentProgram,
    queryFn: () => workoutService.getCurrentProgram(),
    staleTime: 60000,
  });

  const currentProgram = currentData?.program || null;
  const programId = currentProgram?.id;

  // 2. Fetch Full Program Details (weeks & days timeline)
  const {
    data: programDetails,
    isLoading: isDetailsLoading,
  } = useQuery({
    queryKey: queryKeys.program(programId),
    queryFn: () => workoutService.getProgram(programId),
    enabled: Boolean(programId),
    staleTime: 60000,
  });

  // 3. Fetch Today's Scheduled Workout
  const {
    data: todayData,
    isLoading: isTodayLoading,
    refetch: refetchToday,
  } = useQuery({
    queryKey: queryKeys.todayWorkout,
    queryFn: () => workoutService.getTodayWorkout(),
    staleTime: 60000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCurrent(), refetchToday()]);
    setRefreshing(false);
  }, [refetchCurrent, refetchToday]);

  // Loading State
  if (isProgramLoading) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Skeleton width="60%" height={28} style={{ marginBottom: spacing.xs }} />
          <Skeleton width="85%" height={14} />
        </View>
        <SkeletonCard lines={4} style={{ marginBottom: spacing.lg }} />
        <SkeletonCard lines={3} style={{ marginBottom: spacing.lg }} />
        <SkeletonCard lines={5} />
      </ScrollView>
    );
  }

  // Error State
  if (isProgramError) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ErrorState
          error={programError}
          message="Failed to load your assigned fitness program."
          onRetry={onRefresh}
        />
      </View>
    );
  }

  // Empty State: No active program assigned
  if (!currentProgram) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <EmptyState
          icon="dumbbell"
          title="No Active Program Assigned"
          message="Complete your onboarding profile to get a personalized workout routine."
          actionLabel="Complete Onboarding"
          onAction={() => router.push('/(auth)/onboarding')}
        />
      </View>
    );
  }

  const durationWeeks = currentProgram.durationWeeks || 4;
  const currentWeekNum = currentData?.weekNumber || 1;
  const currentDayNum = currentData?.dayNumber || 1;
  const programWeeks = programDetails?.weeks || [];

  const isRestDayToday = Boolean(todayData?.programDay?.restDay);
  const isCompletedToday = Boolean(todayData?.hasCompletedToday);
  const todayWorkoutTitle =
    todayData?.programDay?.title ||
    todayData?.program?.name ||
    'Scheduled Routine';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.custom.primaryStrong}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {t('fitnessPrograms', lang)}
        </Text>
        <Text
          style={[
            styles.headerSubtitle,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Structured periodized training plan built for your goals
        </Text>
      </View>

      {/* Program Summary Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.levelBadge,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Text
              style={[
                styles.levelBadgeText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {currentProgram.level || 'ALL LEVELS'}
            </Text>
          </View>
          <View
            style={[
              styles.activeTag,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Sparkles size={11} color={theme.colors.onPrimaryContainer} />
            <Text
              style={[
                styles.activeTagText,
                { color: theme.colors.onPrimaryContainer },
              ]}
            >
              Active Plan
            </Text>
          </View>
        </View>

        <Text style={[styles.programTitle, { color: theme.colors.onSurface }]}>
          {currentProgram.title || currentProgram.name}
        </Text>
        <Text
          style={[
            styles.programGoal,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Goal: {currentProgram.goal || 'General Fitness'}
        </Text>

        {/* Quick Metrics */}
        <View
          style={[
            styles.metricStrip,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <View style={styles.metricBox}>
            <Text
              style={[
                styles.metricVal,
                { color: theme.custom.primaryStrong },
              ]}
            >
              {durationWeeks}
            </Text>
            <Text
              style={[
                styles.metricLbl,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Total Weeks
            </Text>
          </View>
          <View
            style={[
              styles.metricDivider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
          <View style={styles.metricBox}>
            <Text
              style={[
                styles.metricVal,
                { color: theme.custom.primaryStrong },
              ]}
            >
              Week {currentWeekNum}
            </Text>
            <Text
              style={[
                styles.metricLbl,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Current Week
            </Text>
          </View>
          <View
            style={[
              styles.metricDivider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
          <View style={styles.metricBox}>
            <Text
              style={[
                styles.metricVal,
                { color: theme.custom.primaryStrong },
              ]}
            >
              Day {currentDayNum}
            </Text>
            <Text
              style={[
                styles.metricLbl,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Today
            </Text>
          </View>
        </View>
      </View>

      {/* Today's Workout Section */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.todayHeaderRow}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurface },
            ]}
          >
            Today's Session
          </Text>
          {isRestDayToday ? (
            <View
              style={[
                styles.tag,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Rest Day
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.tag,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: theme.colors.onPrimaryContainer },
                ]}
              >
                Workout Day
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.workoutTitle,
            { color: theme.colors.onSurface },
          ]}
        >
          {todayWorkoutTitle}
        </Text>

        <Text
          style={[
            styles.workoutSubtitle,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {isRestDayToday
            ? 'Scheduled recovery day — stay hydrated and get adequate rest to let muscle tissues adapt.'
            : todayData?.programDay?.exercises?.length
            ? `${todayData.programDay.exercises.length} Exercises scheduled for today's routine`
            : `Week ${currentWeekNum}, Day ${currentDayNum} session`}
        </Text>

        {/* Action States */}
        {isCompletedToday ? (
          <View
            style={[
              styles.completedBanner,
              {
                backgroundColor: theme.colors.primaryContainer,
                borderColor: theme.colors.primary,
              },
            ]}
          >
            <CheckCircle2 size={18} color={theme.colors.onPrimaryContainer} />
            <Text
              style={[
                styles.completedBannerText,
                { color: theme.colors.onPrimaryContainer },
              ]}
            >
              Today's workout completed! Great work!
            </Text>
          </View>
        ) : isRestDayToday ? (
          <View
            style={[
              styles.restBanner,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <Sparkles size={18} color={theme.custom.accentText} />
            <Text
              style={[
                styles.restBannerText,
                { color: theme.colors.onSurface },
              ]}
            >
              Enjoy your rest day! Active recovery or stretching recommended.
            </Text>
          </View>
        ) : (
          <Pressable
            style={[
              styles.startWorkoutBtn,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => router.push('/workout/today')}
          >
            <Play size={16} color={theme.colors.onPrimary} fill={theme.colors.onPrimary} />
            <Text
              style={[
                styles.startWorkoutBtnText,
                { color: theme.colors.onPrimary },
              ]}
            >
              Start Today's Workout
            </Text>
          </Pressable>
        )}
      </View>

      {/* Week-by-Week & Day-by-Day Timeline */}
      <Text
        style={[
          styles.timelineHeading,
          { color: theme.colors.onSurface },
        ]}
      >
        Program Timeline
      </Text>

      {isDetailsLoading && programWeeks.length === 0 ? (
        <SkeletonCard lines={4} />
      ) : programWeeks.length > 0 ? (
        programWeeks.map((week) => {
          const isCurrentWeek = week.weekNumber === currentWeekNum;
          return (
            <View
              key={week._id || `week_${week.weekNumber}`}
              style={[
                styles.weekCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: isCurrentWeek
                    ? theme.colors.primary
                    : theme.colors.outlineVariant,
                },
              ]}
            >
              <View style={styles.weekHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Calendar
                    size={16}
                    color={
                      isCurrentWeek
                        ? theme.custom.primaryStrong
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      styles.weekTitle,
                      {
                        color: isCurrentWeek
                          ? theme.custom.primaryStrong
                          : theme.colors.onSurface,
                      },
                    ]}
                  >
                    {week.title || `Week ${week.weekNumber}`}
                  </Text>
                </View>
                {isCurrentWeek && (
                  <View
                    style={[
                      styles.currentWeekTag,
                      { backgroundColor: theme.colors.primaryContainer },
                    ]}
                  >
                    <Text
                      style={[
                        styles.currentWeekTagText,
                        { color: theme.colors.onPrimaryContainer },
                      ]}
                    >
                      Current Week
                    </Text>
                  </View>
                )}
              </View>

              {/* Days in this week */}
              <View style={styles.daysList}>
                {(week.days || []).map((day) => {
                  const isToday =
                    isCurrentWeek && day.dayNumber === currentDayNum;
                  return (
                    <View
                      key={day._id || `day_${day.dayNumber}`}
                      style={[
                        styles.dayRow,
                        { borderBottomColor: theme.colors.outlineVariant },
                      ]}
                    >
                      <View style={styles.dayLeft}>
                        <View
                          style={[
                            styles.dayNumBadge,
                            {
                              backgroundColor: isToday
                                ? theme.colors.primaryContainer
                                : theme.colors.surfaceVariant,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayNumText,
                              {
                                color: isToday
                                  ? theme.colors.onPrimaryContainer
                                  : theme.colors.onSurfaceVariant,
                              },
                            ]}
                          >
                            D{day.dayNumber}
                          </Text>
                        </View>
                        <View>
                          <Text
                            style={[
                              styles.dayTitle,
                              { color: theme.colors.onSurface },
                            ]}
                          >
                            {day.title || (day.restDay ? 'Rest Day' : 'Workout')}
                          </Text>
                          <Text
                            style={[
                              styles.daySub,
                              { color: theme.colors.onSurfaceVariant },
                            ]}
                          >
                            {day.restDay
                              ? 'Recovery & Rest'
                              : `${day.exercises?.length || 0} exercises`}
                          </Text>
                        </View>
                      </View>

                      <View>
                        {isToday ? (
                          <View
                            style={[
                              styles.todayPill,
                              { backgroundColor: theme.colors.primaryContainer },
                            ]}
                          >
                            <Text
                              style={[
                                styles.todayPillText,
                                { color: theme.colors.onPrimaryContainer },
                              ]}
                            >
                              TODAY
                            </Text>
                          </View>
                        ) : day.restDay ? (
                          <View
                            style={[
                              styles.restPill,
                              { backgroundColor: theme.colors.surfaceVariant },
                            ]}
                          >
                            <Text
                              style={[
                                styles.restPillText,
                                { color: theme.colors.onSurfaceVariant },
                              ]}
                            >
                              Rest
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.workoutPill,
                              { backgroundColor: theme.colors.surfaceVariant },
                            ]}
                          >
                            <Dumbbell size={11} color={theme.colors.onSurfaceVariant} />
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })
      ) : (
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
              styles.workoutSubtitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {durationWeeks} weeks planned for this curriculum. Full schedule synced with daily workouts.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 18,
    marginBottom: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  programTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  programGoal: {
    fontSize: 13,
    marginBottom: spacing.md,
  },
  metricStrip: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: spacing.md,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: '70%',
    alignSelf: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricLbl: {
    fontSize: 11,
    marginTop: 2,
  },
  todayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  workoutTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  workoutSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.md,
  },
  startWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  startWorkoutBtnText: {
    fontWeight: '800',
    fontSize: 14,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  completedBannerText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  restBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  restBannerText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  timelineHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  weekCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: spacing.md,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  currentWeekTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  currentWeekTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  daysList: {
    marginTop: spacing.xs,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dayNumBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dayTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  daySub: {
    fontSize: 11,
    marginTop: 2,
  },
  todayPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  todayPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  restPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  restPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  workoutPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
