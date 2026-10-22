import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  Target,
  Scale,
  Calendar,
  Flame,
  Clock,
  Dumbbell,
  CheckCircle2,
  Plus,
  Trash2,
  X,
  Zap,
} from 'lucide-react-native';
import { ProgressBar } from 'react-native-paper';
import { progressService } from '../../services/progressService';
import { workoutService } from '../../services/workoutService';
import { profileService } from '../../services/profileService';
import { queryKeys } from '../../constants/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { TopBar } from '../../components/common/TopBar';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';

export default function ProgressScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile: authProfile } = useAuth();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  // Log Weight Modal
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [submittingWeight, setSubmittingWeight] = useState(false);

  // 1. Progress Summary Query
  const summaryQuery = useQuery({
    queryKey: queryKeys.progressSummary(90),
    queryFn: async () => {
      const res = await progressService.getProgressSummary(90);
      return res?.data || res || null;
    },
    staleTime: 60 * 1000,
  });

  // 2. Weight History Query
  const weightQuery = useQuery({
    queryKey: queryKeys.progressWeight(90),
    queryFn: async () => {
      const res = await progressService.getWeightHistory(90);
      const wData = res?.data || res;
      return Array.isArray(wData?.history)
        ? wData.history
        : Array.isArray(wData)
        ? wData
        : [];
    },
    staleTime: 60 * 1000,
  });

  // 3. Workout Stats Query
  const statsQuery = useQuery({
    queryKey: queryKeys.workoutStats,
    queryFn: async () => {
      const res = await workoutService.getWorkoutStats();
      return res?.data || res || null;
    },
    staleTime: 60 * 1000,
  });

  // 4. Workout History Query
  const historyQuery = useQuery({
    queryKey: queryKeys.workoutHistory(10),
    queryFn: async () => {
      const res = await workoutService.getWorkoutHistory({ limit: 10 });
      const hData = res?.data || res;
      return Array.isArray(hData?.items)
        ? hData.items
        : Array.isArray(hData)
        ? hData
        : [];
    },
    staleTime: 60 * 1000,
  });

  // 5. Profile Query (fallback to AuthContext profile if available)
  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const res = await profileService.getProfile();
      return res?.data || res || null;
    },
    initialData: authProfile || undefined,
    staleTime: 60 * 1000,
  });

  const summary = summaryQuery.data || null;
  const weightHistory = weightQuery.data || [];
  const workoutStats = statsQuery.data || null;
  const workoutHistory = historyQuery.data || [];
  const profile = profileQuery.data || authProfile || null;

  const loading =
    (summaryQuery.isLoading && !summaryQuery.data) &&
    (weightQuery.isLoading && !weightQuery.data);

  const refreshing =
    summaryQuery.isRefetching ||
    weightQuery.isRefetching ||
    statsQuery.isRefetching ||
    historyQuery.isRefetching;

  const onRefresh = useCallback(async () => {
    await Promise.all([
      summaryQuery.refetch(),
      weightQuery.refetch(),
      statsQuery.refetch(),
      historyQuery.refetch(),
      profileQuery.refetch(),
    ]);
  }, [summaryQuery, weightQuery, statsQuery, historyQuery, profileQuery]);

  const handleOpenWeightModal = () => {
    const currentWeight = summary?.weightSummary?.currentKg || profile?.weightKg || '';
    setWeightInput(currentWeight ? String(currentWeight) : '');
    setWeightModalVisible(true);
  };

  const handleSaveWeight = async () => {
    const numericWeight = parseFloat(weightInput.trim());
    if (isNaN(numericWeight) || numericWeight < 30 || numericWeight > 300) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight between 30 kg and 300 kg.');
      return;
    }

    setSubmittingWeight(true);
    try {
      await progressService.logWeight(numericWeight);
      setWeightModalVisible(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.progressWeight(90) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progressSummary(90) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
      ]);
      Alert.alert('Weight Recorded', `Logged ${numericWeight} kg for today.`);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to record weight on server.');
    } finally {
      setSubmittingWeight(false);
    }
  };

  const handleDeleteWeight = async (id) => {
    if (!id) return;
    try {
      await progressService.deleteWeight(id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.progressWeight(90) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progressSummary(90) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to remove weight record.');
    }
  };

  const weightSummary = summary?.weightSummary || {};
  const currentKg = weightSummary.currentKg ?? profile?.weightKg ?? null;
  const startingKg = weightSummary.startingKg ?? profile?.startingWeightKg ?? null;
  const targetKg = weightSummary.targetKg ?? profile?.targetWeightKg ?? null;
  const changeKg = weightSummary.changeKg ?? (currentKg && startingKg ? Math.round((currentKg - startingKg) * 10) / 10 : null);
  const percentToGoal = weightSummary.percentToGoal ?? null;

  // Real workout stats
  const totalWorkouts = workoutStats?.totalWorkouts ?? workoutStats?.completedSessions ?? workoutHistory.length;
  const totalMinutes = workoutStats?.totalMinutes ?? Math.round((workoutStats?.totalDurationSeconds || 0) / 60);
  const totalCalories = workoutStats?.totalCaloriesBurned ?? workoutStats?.caloriesEstimate ?? Math.round(totalMinutes * 7.5);
  const currentStreak = profile?.currentStreak ?? workoutStats?.currentStreak ?? 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TopBar title="Fitness Progress" subtitle="Body weight, workouts & consistency" />

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
        {loading && !summary && workoutHistory.length === 0 ? (
          <View style={styles.skeletonWrap}>
            <Skeleton height={180} radius={custom.radius.lg} style={styles.mbLg} />
            <Skeleton height={120} radius={custom.radius.lg} style={styles.mbLg} />
            <Skeleton height={140} radius={custom.radius.lg} />
          </View>
        ) : (
          <>
            {/* 1. Body Weight & Goal Progress Card */}
            <AppCard variant="elevated" style={styles.weightCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.rowAlign}>
                  <Scale size={18} color={colors.primary} />
                  <Text style={[styles.cardHeaderTitle, { color: colors.onSurface }]}>
                    Weight Progress
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.logWeightBtn,
                    { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
                  ]}
                  onPress={handleOpenWeightModal}
                >
                  <Plus size={14} color={colors.onPrimaryContainer} />
                  <Text style={[styles.logWeightBtnText, { color: colors.onPrimaryContainer }]}>
                    Log Weight
                  </Text>
                </Pressable>
              </View>

              {currentKg !== null ? (
                <>
                  <View style={styles.weightMetricsRow}>
                    <View style={styles.weightCol}>
                      <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                        Current
                      </Text>
                      <Text style={[styles.weightLargeVal, { color: colors.onSurface }]}>
                        {currentKg} <Text style={styles.weightUnit}>kg</Text>
                      </Text>
                    </View>

                    {startingKg !== null && (
                      <View style={styles.weightCol}>
                        <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                          Starting
                        </Text>
                        <Text style={[styles.weightMedVal, { color: colors.onSurface }]}>
                          {startingKg} kg
                        </Text>
                      </View>
                    )}

                    {targetKg !== null && (
                      <View style={styles.weightCol}>
                        <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                          Target
                        </Text>
                        <Text style={[styles.weightMedVal, { color: colors.onSurface }]}>
                          {targetKg} kg
                        </Text>
                      </View>
                    )}

                    {changeKg !== null && (
                      <View style={styles.weightCol}>
                        <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                          Net Change
                        </Text>
                        <Text
                          style={[
                            styles.weightMedVal,
                            { color: changeKg <= 0 ? colors.primary : colors.secondary },
                          ]}
                        >
                          {changeKg > 0 ? `+${changeKg}` : changeKg} kg
                        </Text>
                      </View>
                    )}
                  </View>

                  {percentToGoal !== null && (
                    <View style={styles.goalProgressWrap}>
                      <View style={styles.goalProgressLabels}>
                        <Text style={[styles.goalProgressTitle, { color: colors.onSurfaceVariant }]}>
                          Goal Progress
                        </Text>
                        <Text style={[styles.goalProgressPct, { color: colors.onSurface }]}>
                          {percentToGoal}% to target
                        </Text>
                      </View>
                      <ProgressBar
                        progress={Math.min(Math.max(percentToGoal / 100, 0), 1)}
                        color={colors.primary}
                        style={styles.goalProgressBar}
                      />
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noWeightWrap}>
                  <Text style={[styles.noWeightText, { color: colors.onSurfaceVariant }]}>
                    No weight entries recorded yet. Tap "Log Weight" to start tracking your body transformation.
                  </Text>
                </View>
              )}
            </AppCard>

            {/* 2. Workout Consistency & Aggregate Statistics */}
            <AppCard variant="outlined" style={styles.statsCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.rowAlign}>
                  <Dumbbell size={18} color={colors.primary} />
                  <Text style={[styles.cardHeaderTitle, { color: colors.onSurface }]}>
                    Workout Stats & Consistency
                  </Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={[styles.statTile, { backgroundColor: colors.surfaceVariant }]}>
                  <CheckCircle2 size={18} color={colors.primary} />
                  <Text style={[styles.statNum, { color: colors.onSurface }]}>
                    {totalWorkouts}
                  </Text>
                  <Text style={[styles.statDesc, { color: colors.onSurfaceVariant }]}>
                    Workouts Done
                  </Text>
                </View>

                <View style={[styles.statTile, { backgroundColor: colors.surfaceVariant }]}>
                  <Clock size={18} color={colors.primary} />
                  <Text style={[styles.statNum, { color: colors.onSurface }]}>
                    {totalMinutes}
                  </Text>
                  <Text style={[styles.statDesc, { color: colors.onSurfaceVariant }]}>
                    Total Minutes
                  </Text>
                </View>

                <View style={[styles.statTile, { backgroundColor: colors.surfaceVariant }]}>
                  <Flame size={18} color={colors.secondary} />
                  <Text style={[styles.statNum, { color: colors.onSurface }]}>
                    {totalCalories}
                  </Text>
                  <Text style={[styles.statDesc, { color: colors.onSurfaceVariant }]}>
                    kcal Burned
                  </Text>
                </View>

                <View style={[styles.statTile, { backgroundColor: colors.surfaceVariant }]}>
                  <Zap size={18} color={colors.secondary} />
                  <Text style={[styles.statNum, { color: colors.onSurface }]}>
                    {currentStreak}
                  </Text>
                  <Text style={[styles.statDesc, { color: colors.onSurfaceVariant }]}>
                    Day Streak
                  </Text>
                </View>
              </View>
            </AppCard>

            {/* 3. Weight History Logs */}
            <SectionHeader title={`Weight Log History (${weightHistory.length})`} />

            {weightHistory.length > 0 ? (
              weightHistory.map((item, idx) => (
                <AppCard key={String(item._id?._id || item._id || item.id || idx)} variant="elevated" style={styles.historyCard}>
                  <View style={styles.historyRow}>
                    <View style={styles.rowAlign}>
                      <View style={[styles.scaleIconWrap, { backgroundColor: colors.primaryContainer }]}>
                        <Scale size={16} color={colors.onPrimaryContainer} />
                      </View>
                      <View>
                        <Text style={[styles.historyWeightVal, { color: colors.onSurface }]}>
                          {item.weightKg} kg
                        </Text>
                        <Text style={[styles.historyDate, { color: colors.onSurfaceVariant }]}>
                          {item.dateKey || (item.loggedAt ? new Date(item.loggedAt).toLocaleDateString() : 'Recorded')}
                        </Text>
                      </View>
                    </View>

                    {item._id && (
                      <Pressable
                        style={styles.trashBtn}
                        onPress={() => handleDeleteWeight(item._id)}
                        hitSlop={8}
                      >
                        <Trash2 size={16} color={colors.error} />
                      </Pressable>
                    )}
                  </View>
                </AppCard>
              ))
            ) : (
              <EmptyState
                icon="scale"
                title="No Weight Records"
                description="Keep track of your weekly weigh-ins to see your body recomposition trends over time."
              />
            )}

            {/* 4. Workout Completion Records */}
            <SectionHeader
              title={`Workout Records (${workoutHistory.length})`}
              style={{ marginTop: 20 }}
            />

            {workoutHistory.length > 0 ? (
              workoutHistory.map((session, idx) => {
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

                const durationMins = Math.max(1, Math.round((session.durationSeconds || 1800) / 60));

                return (
                  <AppCard
                    key={String(session._id?._id || session._id || session.id || idx)}
                    variant="outlined"
                    style={styles.sessionCard}
                  >
                    <View style={styles.sessionRow}>
                      <View
                        style={[
                          styles.sessionIconWrap,
                          { backgroundColor: colors.primaryContainer },
                        ]}
                      >
                        <Dumbbell size={18} color={colors.onPrimaryContainer} />
                      </View>
                      <View style={styles.sessionMetaCol}>
                        <Text style={[styles.sessionTitle, { color: colors.onSurface }]} numberOfLines={1}>
                          {session.title || session.routineName || 'Completed Workout'}
                        </Text>
                        <Text style={[styles.sessionSub, { color: colors.onSurfaceVariant }]}>
                          {dateLabel} • {durationMins} mins • {session.caloriesEstimate || Math.round(durationMins * 7)} kcal
                        </Text>
                      </View>

                      <View style={[styles.pointsBadge, { backgroundColor: colors.surfaceVariant }]}>
                        <Zap size={12} color={colors.secondary} />
                        <Text style={[styles.pointsBadgeText, { color: colors.onSurface }]}>+5 pts</Text>
                      </View>
                    </View>
                  </AppCard>
                );
              })
            ) : (
              <EmptyState
                icon="dumbbell"
                title="No Workout Records"
                description="Workouts you finish in the Workout Session Player will automatically appear here."
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Log Weight Modal */}
      <Modal visible={weightModalVisible} transparent animationType="slide" onRequestClose={() => setWeightModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                Record Current Weight
              </Text>
              <Pressable onPress={() => setWeightModalVisible(false)} hitSlop={8}>
                <X size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <Text style={[styles.modalSub, { color: colors.onSurfaceVariant }]}>
              Enter your weight in kilograms. Regular weigh-ins help accurately track your body progress.
            </Text>

            <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Weight (kg) *</Text>
            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant, color: colors.onSurface },
              ]}
              placeholder="e.g., 68.5"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="numeric"
              value={weightInput}
              onChangeText={setWeightInput}
            />

            <View style={styles.modalActionWrap}>
              <AppButton
                tone="primary"
                label="Save Weight"
                loading={submittingWeight}
                onPress={handleSaveWeight}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  skeletonWrap: {
    paddingVertical: 12,
  },
  mbLg: {
    marginBottom: 16,
  },
  weightCard: {
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logWeightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  logWeightBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  weightMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  weightCol: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  weightLargeVal: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  weightMedVal: {
    fontSize: 15,
    fontWeight: '700',
  },
  weightUnit: {
    fontSize: 14,
    fontWeight: '500',
  },
  goalProgressWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 10,
  },
  goalProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalProgressTitle: {
    fontSize: 12,
  },
  goalProgressPct: {
    fontSize: 12,
    fontWeight: '700',
  },
  goalProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  noWeightWrap: {
    paddingVertical: 8,
  },
  noWeightText: {
    fontSize: 13,
    lineHeight: 18,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  statTile: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 2,
  },
  statDesc: {
    fontSize: 10,
    textAlign: 'center',
  },
  historyCard: {
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scaleIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  historyWeightVal: {
    fontSize: 15,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: 12,
  },
  trashBtn: {
    padding: 6,
  },
  sessionCard: {
    marginBottom: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionMetaCol: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  sessionSub: {
    fontSize: 12,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pointsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalActionWrap: {
    marginTop: 4,
    marginBottom: 16,
  },
});
