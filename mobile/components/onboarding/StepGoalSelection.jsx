import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  Target,
  Flame,
  UserCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react-native';
import { workoutService } from '../../services/workoutService';
import { queryKeys } from '../../constants/queryKeys';
import { useAppTheme } from '../../theme/ThemeContext';
import Skeleton, { SkeletonCard } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import ErrorState from '../ui/ErrorState';

export default function StepGoalSelection({
  selectedProgram,
  setSelectedProgram,
}) {
  const { theme, isDark } = useAppTheme();
  const { colors, custom } = theme;

  const {
    data: programsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.programs('ALL'),
    queryFn: async () => {
      const res = await workoutService.getPrograms();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : Array.isArray(res?.programs)
            ? res.programs
            : [];
      return list;
    },
    staleTime: 60 * 1000,
  });

  const programs = programsData || [];

  const getGoalIcon = (goalKey = '') => {
    const k = String(goalKey).toUpperCase();
    if (k.includes('FAT') || k.includes('WEIGHT') || k.includes('LOSS')) {
      return Target;
    }
    if (k.includes('MUSCLE') || k.includes('BUILD') || k.includes('STRENGTH')) {
      return Flame;
    }
    return UserCheck;
  };

  const formatGoalLabel = (goalKey = '') => {
    const k = String(goalKey).toUpperCase();
    if (k === 'WEIGHT_LOSS') return 'Weight Loss';
    if (k === 'MUSCLE_GAIN') return 'Muscle Gain';
    if (k === 'GENERAL_FITNESS') return 'General Fitness';
    return goalKey || 'Fitness Goal';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonCard lines={2} style={styles.skeletonItem} />
        <SkeletonCard lines={2} style={styles.skeletonItem} />
        <SkeletonCard lines={2} style={styles.skeletonItem} />
      </View>
    );
  }

  if (isError) {
    return (
      <ErrorState
        error={error}
        message="Unable to load workout programs from server. Please check your connection and retry."
        onRetry={refetch}
      />
    );
  }

  if (programs.length === 0) {
    return (
      <EmptyState
        icon="dumbbell"
        title="No Programs Available"
        message="Fitness programs are currently being synced with the server. Please tap retry to refresh."
        actionLabel="Refresh Programs"
        onAction={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.list}>
        {programs.map((prog) => {
          const progId = prog._id || prog.id;
          const isSelected = selectedProgram?.id === progId || selectedProgram?._id === progId;
          const GoalIcon = getGoalIcon(prog.goal);

          return (
            <Pressable
              key={progId}
              onPress={() => setSelectedProgram(prog)}
              style={[
                styles.programCard,
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
                    styles.goalIconWrap,
                    {
                      backgroundColor: isSelected
                        ? (custom.primaryStrong || colors.primary)
                        : isDark
                          ? colors.elevation.level2
                          : colors.surfaceVariant,
                    },
                  ]}
                >
                  <GoalIcon
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
                        styles.unselectedRing,
                        { borderColor: colors.outlineVariant },
                      ]}
                    />
                  )}
                </View>
              </View>

              <Text
                style={[
                  styles.programTitle,
                  {
                    color: isSelected
                      ? colors.onPrimaryContainer
                      : colors.onSurface,
                  },
                ]}
              >
                {prog.name || prog.title}
              </Text>

              {prog.description ? (
                <Text
                  style={[
                    styles.programDesc,
                    {
                      color: isSelected
                        ? colors.onPrimaryContainer
                        : colors.onSurfaceVariant,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {prog.description}
                </Text>
              ) : null}

              {/* Meta Tags Row */}
              <View style={styles.metaRow}>
                {prog.goal ? (
                  <View
                    style={[
                      styles.metaBadge,
                      {
                        backgroundColor: isSelected
                          ? colors.surface
                          : isDark
                            ? colors.elevation.level2
                            : colors.surfaceVariant,
                      },
                    ]}
                  >
                    <Sparkles
                      size={12}
                      color={custom.primaryStrong || colors.primary}
                    />
                    <Text
                      style={[
                        styles.metaBadgeText,
                        {
                          color: isSelected
                            ? (custom.primaryStrong || colors.primary)
                            : colors.onSurface,
                        },
                      ]}
                    >
                      {formatGoalLabel(prog.goal)}
                    </Text>
                  </View>
                ) : null}

                {prog.durationWeeks ? (
                  <View
                    style={[
                      styles.metaBadge,
                      {
                        backgroundColor: isSelected
                          ? colors.surface
                          : isDark
                            ? colors.elevation.level2
                            : colors.surfaceVariant,
                      },
                    ]}
                  >
                    <Calendar
                      size={12}
                      color={colors.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.metaBadgeText,
                        { color: colors.onSurfaceVariant },
                      ]}
                    >
                      {prog.durationWeeks} Weeks
                    </Text>
                  </View>
                ) : null}

                {prog.level ? (
                  <View
                    style={[
                      styles.metaBadge,
                      {
                        backgroundColor: isSelected
                          ? colors.surface
                          : isDark
                            ? colors.elevation.level2
                            : colors.surfaceVariant,
                      },
                    ]}
                  >
                    <Layers
                      size={12}
                      color={colors.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.metaBadgeText,
                        { color: colors.onSurfaceVariant },
                      ]}
                    >
                      {prog.level}
                    </Text>
                  </View>
                ) : null}
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
    width: '100%',
  },
  loadingContainer: {
    width: '100%',
  },
  skeletonItem: {
    marginBottom: 12,
  },
  list: {
    gap: 12,
  },
  programCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  programTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  programDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
