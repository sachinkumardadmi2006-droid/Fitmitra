import React, { useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  Dumbbell,
  CheckCircle2,
  Calendar,
  Crown,
  MapPin,
  Activity,
  Sparkles,
} from 'lucide-react-native';
import { workoutService } from '../../services/workoutService';
import { queryKeys } from '../../constants/queryKeys';
import { useAppTheme } from '../../theme/ThemeContext';
import { SkeletonCard } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import ErrorState from '../ui/ErrorState';

export default function StepWorkoutPlanSelection({
  selectedProgram,
  selectedWorkoutPlan,
  setSelectedWorkoutPlan,
  preferredWorkoutDays = 5,
  preferredWorkoutLocation = 'GYM',
}) {
  const { theme, isDark } = useAppTheme();
  const { colors, custom } = theme;

  const programId = selectedProgram?._id || selectedProgram?.id || '';

  const {
    data: plansData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.programWorkoutPlans(programId),
    queryFn: async () => {
      if (!programId) return [];
      const res = await workoutService.getWorkoutPlansByProgram(programId);
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
            ? res.items
            : [];
      return list;
    },
    enabled: Boolean(programId),
    staleTime: 60 * 1000,
  });

  const plans = useMemo(() => plansData || [], [plansData]);

  // Auto-select best matching plan if none selected or if selection no longer exists
  useEffect(() => {
    if (plans.length > 0 && !selectedWorkoutPlan) {
      const match =
        plans.find(
          (p) =>
            Number(p.daysPerWeek) === Number(preferredWorkoutDays) &&
            String(p.location).toUpperCase() === String(preferredWorkoutLocation).toUpperCase()
        ) ||
        plans.find((p) => Number(p.daysPerWeek) === Number(preferredWorkoutDays)) ||
        plans[0];

      if (match) {
        setSelectedWorkoutPlan(match);
      }
    }
  }, [plans, selectedWorkoutPlan, preferredWorkoutDays, preferredWorkoutLocation, setSelectedWorkoutPlan]);

  if (!selectedProgram) {
    return (
      <EmptyState
        icon="dumbbell"
        title="No Program Selected"
        message="Please go back to the previous step and select your primary goal program."
      />
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonCard lines={3} style={styles.skeletonItem} />
        <SkeletonCard lines={3} style={styles.skeletonItem} />
      </View>
    );
  }

  if (isError) {
    return (
      <ErrorState
        error={error}
        message="Unable to load workout plans for this program. Please check your connection and retry."
        onRetry={refetch}
      />
    );
  }

  if (plans.length === 0) {
    return (
      <EmptyState
        icon="dumbbell"
        title="No Plans Available"
        message="Workout plans for this program are being synced with the server. Please tap retry to refresh."
        actionLabel="Refresh Plans"
        onAction={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Program Summary Pill */}
      <View
        style={[
          styles.programPill,
          {
            backgroundColor: isDark ? colors.elevation.level2 : colors.surfaceVariant,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <Sparkles size={16} color={custom.primaryStrong || colors.primary} />
        <Text style={[styles.programPillText, { color: colors.onSurface }]}>
          Selected Program: <Text style={{ fontWeight: '700' }}>{selectedProgram.name || selectedProgram.title}</Text>
        </Text>
      </View>

      <View style={styles.list}>
        {plans.map((plan) => {
          const planId = plan._id || plan.id;
          const isSelected = selectedWorkoutPlan?._id === planId || selectedWorkoutPlan?.id === planId;
          const isPremium = Boolean(plan.isPremium);

          return (
            <Pressable
              key={planId}
              onPress={() => setSelectedWorkoutPlan(plan)}
              style={[
                styles.planCard,
                {
                  backgroundColor: isSelected
                    ? colors.primaryContainer
                    : isDark
                      ? colors.elevation.level1
                      : colors.surface,
                  borderColor: isSelected
                    ? (custom.primaryStrong || colors.primary)
                    : colors.outlineVariant,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.planIconWrap,
                    {
                      backgroundColor: isSelected
                        ? (custom.primaryStrong || colors.primary)
                        : isDark
                          ? colors.elevation.level2
                          : colors.surfaceVariant,
                    },
                  ]}
                >
                  <Dumbbell
                    size={22}
                    color={isSelected ? colors.onPrimary : colors.onSurface}
                  />
                </View>

                <View style={styles.cardHeaderRight}>
                  {isSelected ? (
                    <CheckCircle2 size={22} color={custom.primaryStrong || colors.primary} />
                  ) : (
                    <View
                      style={[
                        styles.unselectedRadio,
                        { borderColor: colors.outlineVariant },
                      ]}
                    />
                  )}
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.planTitle,
                      { color: isSelected ? colors.onPrimaryContainer : colors.onSurface },
                    ]}
                  >
                    {plan.name || plan.title}
                  </Text>
                  {isPremium ? (
                    <View style={[styles.badge, styles.proBadge]}>
                      <Crown size={12} color="#FFF" />
                      <Text style={styles.proBadgeText}>FitMitra Pro</Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: isDark ? 'rgba(74, 222, 128, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                          borderColor: isDark ? '#4ADE80' : '#22C55E',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.freeBadgeText,
                          { color: isDark ? '#4ADE80' : '#15803D' },
                        ]}
                      >
                        Free Plan
                      </Text>
                    </View>
                  )}
                </View>

                {plan.description ? (
                  <Text
                    style={[
                      styles.planDesc,
                      { color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant },
                    ]}
                    numberOfLines={2}
                  >
                    {plan.description}
                  </Text>
                ) : null}

                {/* Plan Meta Tags */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Calendar size={13} color={colors.onSurfaceVariant} />
                    <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                      {plan.daysPerWeek || 5} Days / week
                    </Text>
                  </View>

                  {plan.difficulty || plan.level ? (
                    <View style={styles.metaItem}>
                      <Activity size={13} color={colors.onSurfaceVariant} />
                      <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                        {plan.difficulty || plan.level}
                      </Text>
                    </View>
                  ) : null}

                  {plan.location ? (
                    <View style={styles.metaItem}>
                      <MapPin size={13} color={colors.onSurfaceVariant} />
                      <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                        {plan.location}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  skeletonItem: {
    height: 120,
    borderRadius: 16,
  },
  programPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  programPillText: {
    fontSize: 13,
    flex: 1,
  },
  list: {
    gap: 14,
  },
  planCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  cardBody: {
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    letterSpacing: -0.2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  proBadge: {
    backgroundColor: '#7C3AED',
    borderColor: '#9333EA',
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  freeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  planDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
