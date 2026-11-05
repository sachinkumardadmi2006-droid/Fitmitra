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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Scale,
  Flame,
  Clock,
  Dumbbell,
  CheckCircle2,
  Plus,
  Trash2,
  X,
  Zap,
  Trophy,
  Ruler,
  Camera,
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
import { Skeleton } from '../../components/ui/Skeleton';
import {
  WeightTrendChart,
  VolumeBarChart,
  PersonalBestsCard,
  BodyMeasurementsCard,
  TransformationPhotosCard,
  UploadPhotoModal,
} from '../../components/progress';

const TIMEFRAMES = [
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '180D', days: 180 },
  { label: '1 Year', days: 365 },
];

const TABS = [
  { key: 'WEIGHT', label: 'Weight', icon: Scale },
  { key: 'VOLUME', label: 'Volume', icon: Dumbbell },
  { key: 'PRS', label: 'PRs', icon: Trophy },
  { key: 'BODY', label: 'Body', icon: Ruler },
  { key: 'PHOTOS', label: 'Photos', icon: Camera },
];

export default function ProgressScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile: authProfile } = useAuth();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  // Selected timeframe (days)
  const [selectedDays, setSelectedDays] = useState(90);

  // Active segmented tab
  const [activeTab, setActiveTab] = useState('WEIGHT');

  // Modals state: Log Weight
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [submittingWeight, setSubmittingWeight] = useState(false);

  // Modals state: Log Body Measurements
  const [measurementsModalVisible, setMeasurementsModalVisible] = useState(false);
  const [chestInput, setChestInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [armsInput, setArmsInput] = useState('');
  const [thighsInput, setThighsInput] = useState('');
  const [submittingMeasurements, setSubmittingMeasurements] = useState(false);

  // Modals state: Upload Transformation Photo
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  // 1. Progress Summary Query
  const summaryQuery = useQuery({
    queryKey: queryKeys.progressSummary(selectedDays),
    queryFn: async () => {
      const res = await progressService.getProgressSummary(selectedDays);
      return res?.data || res || null;
    },
    staleTime: 60 * 1000,
  });

  // 2. Weight History Query
  const weightQuery = useQuery({
    queryKey: queryKeys.progressWeight(selectedDays),
    queryFn: async () => {
      const res = await progressService.getWeightHistory(selectedDays);
      const wData = res?.data || res;
      return Array.isArray(wData?.entries)
        ? wData.entries
        : Array.isArray(wData?.history)
        ? wData.history
        : Array.isArray(wData)
        ? wData
        : [];
    },
    staleTime: 60 * 1000,
  });

  // 3. Body Measurements Query
  const measurementsQuery = useQuery({
    queryKey: queryKeys.progressMeasurements(30),
    queryFn: async () => {
      const res = await progressService.getMeasurements(30);
      return res?.data || res || { entries: [], changes: {} };
    },
    staleTime: 60 * 1000,
  });

  // 4. Transformation Photos Query
  const photosQuery = useQuery({
    queryKey: queryKeys.progressPhotos(30),
    queryFn: async () => {
      const res = await progressService.getPhotos({ limit: 30 });
      return res?.photos || [];
    },
    staleTime: 60 * 1000,
  });

  // 5. Workout Stats Query
  const statsQuery = useQuery({
    queryKey: queryKeys.workoutStats,
    queryFn: async () => {
      const res = await workoutService.getWorkoutStats();
      return res?.data || res || null;
    },
    staleTime: 60 * 1000,
  });

  // 6. Workout History Query
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

  // 7. Profile Query
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
  const measurementsData = measurementsQuery.data || { entries: [], changes: {} };
  const photos = photosQuery.data || [];
  const workoutStats = statsQuery.data || null;
  const workoutHistory = historyQuery.data || [];
  const profile = profileQuery.data || authProfile || null;

  const loading =
    summaryQuery.isLoading &&
    !summaryQuery.data &&
    weightQuery.isLoading &&
    !weightQuery.data;

  const refreshing =
    summaryQuery.isRefetching ||
    weightQuery.isRefetching ||
    measurementsQuery.isRefetching ||
    photosQuery.isRefetching ||
    statsQuery.isRefetching ||
    historyQuery.isRefetching;

  const onRefresh = useCallback(async () => {
    await Promise.all([
      summaryQuery.refetch(),
      weightQuery.refetch(),
      measurementsQuery.refetch(),
      photosQuery.refetch(),
      statsQuery.refetch(),
      historyQuery.refetch(),
      profileQuery.refetch(),
    ]);
  }, [summaryQuery, weightQuery, measurementsQuery, photosQuery, statsQuery, historyQuery, profileQuery]);

  // Handle Weight Modal
  const handleOpenWeightModal = () => {
    const currentWeight =
      summary?.weight?.currentKg ||
      summary?.weightSummary?.currentKg ||
      profile?.weightKg ||
      '';
    setWeightInput(currentWeight ? String(currentWeight) : '');
    setWeightModalVisible(true);
  };

  const handleSaveWeight = async () => {
    const numericWeight = parseFloat(weightInput.trim());
    if (isNaN(numericWeight) || numericWeight < 20 || numericWeight > 400) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight between 20 kg and 400 kg.');
      return;
    }

    setSubmittingWeight(true);
    try {
      await progressService.logWeight(numericWeight);
      setWeightModalVisible(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.progressWeight(selectedDays) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progressSummary(selectedDays) }),
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
        queryClient.invalidateQueries({ queryKey: queryKeys.progressWeight(selectedDays) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progressSummary(selectedDays) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to remove weight record.');
    }
  };

  // Handle Body Measurements Modal
  const handleOpenMeasurementsModal = () => {
    const changes = measurementsData?.changes || {};
    setChestInput(changes.chestCm?.latest ? String(changes.chestCm.latest) : '');
    setWaistInput(changes.waistCm?.latest ? String(changes.waistCm.latest) : '');
    setArmsInput(changes.armsCm?.latest ? String(changes.armsCm.latest) : '');
    setThighsInput(changes.thighsCm?.latest ? String(changes.thighsCm.latest) : '');
    setMeasurementsModalVisible(true);
  };

  const handleSaveMeasurements = async () => {
    const payload = {};
    if (chestInput.trim()) payload.chestCm = parseFloat(chestInput.trim());
    if (waistInput.trim()) payload.waistCm = parseFloat(waistInput.trim());
    if (armsInput.trim()) payload.armsCm = parseFloat(armsInput.trim());
    if (thighsInput.trim()) payload.thighsCm = parseFloat(thighsInput.trim());

    if (Object.keys(payload).length === 0) {
      Alert.alert('Missing Input', 'Please enter at least one measurement (chest, waist, arms, or thighs).');
      return;
    }

    setSubmittingMeasurements(true);
    try {
      await progressService.logMeasurements(payload);
      setMeasurementsModalVisible(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.progressMeasurements(30) });
      Alert.alert('Logged', 'Body measurements recorded successfully.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to record measurements.');
    } finally {
      setSubmittingMeasurements(false);
    }
  };

  const handleDeleteMeasurement = async (id) => {
    if (!id) return;
    try {
      await progressService.deleteMeasurement(id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.progressMeasurements(30) });
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to remove measurement.');
    }
  };

  const handleDeletePhoto = async (id) => {
    if (!id) return;
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this transformation photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await progressService.deletePhoto(id);
              await queryClient.invalidateQueries({ queryKey: queryKeys.progressPhotos(30) });
            } catch (err) {
              Alert.alert('Error', err?.message || 'Failed to delete photo.');
            }
          },
        },
      ]
    );
  };

  // Metrics from summary / profile
  const weightSummary = summary?.weight || summary?.weightSummary || {};
  const currentKg = weightSummary.currentKg ?? profile?.weightKg ?? null;
  const startingKg = weightSummary.startingKg ?? profile?.startingWeightKg ?? null;
  const targetKg = weightSummary.targetKg ?? profile?.targetWeightKg ?? null;
  const changeKg =
    weightSummary.changeKg ??
    (currentKg && startingKg ? Math.round((currentKg - startingKg) * 10) / 10 : null);
  const percentToGoal = weightSummary.percentToGoal ?? null;

  // Real workout stats
  const totalWorkouts =
    workoutStats?.totalWorkouts ?? workoutStats?.completedSessions ?? workoutHistory.length;
  const totalMinutes =
    workoutStats?.totalDurationMinutes ??
    workoutStats?.totalMinutes ??
    Math.round((workoutStats?.totalDurationSeconds || 0) / 60);
  const totalCalories =
    workoutStats?.totalCalories ??
    workoutStats?.totalCaloriesBurned ??
    workoutStats?.caloriesEstimate ??
    Math.round(totalMinutes * 7.5);
  const currentStreak = profile?.currentStreak ?? workoutStats?.currentStreak ?? 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TopBar title="Fitness Progress" subtitle="Body weight, tonnage & records" />

      {/* Top Filter & Segmented Tabs Bar */}
      <View
        style={[
          styles.topControlsWrap,
          { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant },
        ]}
      >
        {/* Timeframe Chips */}
        <View style={styles.timeframeRow}>
          {TIMEFRAMES.map((tf) => {
            const isSelected = selectedDays === tf.days;
            return (
              <Pressable
                key={`tf-${tf.days}`}
                style={[
                  styles.timeframeChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                    borderColor: isSelected ? colors.primary : colors.outlineVariant,
                  },
                ]}
                onPress={() => setSelectedDays(tf.days)}
              >
                <Text
                  style={[
                    styles.timeframeChipText,
                    { color: isSelected ? colors.onPrimary : colors.onSurfaceVariant },
                  ]}
                >
                  {tf.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Segmented Navigation Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <Pressable
                key={tab.key}
                style={[
                  styles.tabBtn,
                  isSelected && [styles.tabBtnActive, { borderBottomColor: colors.primary }],
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Icon
                  size={16}
                  color={isSelected ? colors.primary : colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    {
                      color: isSelected ? colors.primary : colors.onSurfaceVariant,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

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
        {loading && !summary && weightHistory.length === 0 ? (
          <View style={styles.skeletonWrap}>
            <Skeleton height={180} radius={custom.radius.lg} style={styles.mbLg} />
            <Skeleton height={200} radius={custom.radius.lg} style={styles.mbLg} />
            <Skeleton height={140} radius={custom.radius.lg} />
          </View>
        ) : (
          <>
            {/* ─── TAB 1: WEIGHT ────────────────────────────────────────── */}
            {activeTab === 'WEIGHT' && (
              <>
                {/* 1. Body Weight & Goal Progress Card */}
                <AppCard variant="elevated" style={styles.weightCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.rowAlign}>
                      <Scale size={18} color={colors.primary} />
                      <Text style={[styles.cardHeaderTitle, { color: colors.onSurface }]}>
                        Weight Overview
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
                        {'No weight entries recorded yet. Tap "Log Weight" to start tracking your body transformation.'}
                      </Text>
                    </View>
                  )}
                </AppCard>

                {/* 2. Weight Trend Graph */}
                <AppCard variant="elevated" style={styles.chartCard}>
                  <WeightTrendChart
                    data={weightHistory}
                    targetWeight={targetKg}
                    height={210}
                  />
                </AppCard>

                {/* 3. Weight History Logs List */}
                <SectionHeader title={`Weigh-in History (${weightHistory.length})`} />

                {weightHistory.length > 0 ? (
                  weightHistory.map((item, idx) => (
                    <AppCard
                      key={String(item._id || item.id || idx)}
                      variant="outlined"
                      style={styles.historyCard}
                    >
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
                              {item.dateKey || 'Recorded'}
                            </Text>
                          </View>
                        </View>

                        {(item._id || item.id) && (
                          <Pressable
                            style={styles.trashBtn}
                            onPress={() => handleDeleteWeight(item._id || item.id)}
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
                    description="Keep track of your regular weigh-ins to plot your weight progression over time."
                  />
                )}
              </>
            )}

            {/* ─── TAB 2: VOLUME & WORKOUTS ──────────────────────────────── */}
            {activeTab === 'VOLUME' && (
              <>
                {/* 1. Workout Consistency & Aggregate Statistics */}
                <AppCard variant="outlined" style={styles.statsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.rowAlign}>
                      <Dumbbell size={18} color={colors.primary} />
                      <Text style={[styles.cardHeaderTitle, { color: colors.onSurface }]}>
                        Workout Summary
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
                        Workouts
                      </Text>
                    </View>

                    <View style={[styles.statTile, { backgroundColor: colors.surfaceVariant }]}>
                      <Clock size={18} color={colors.primary} />
                      <Text style={[styles.statNum, { color: colors.onSurface }]}>
                        {totalMinutes}
                      </Text>
                      <Text style={[styles.statDesc, { color: colors.onSurfaceVariant }]}>
                        Minutes
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

                {/* 2. Weekly Training Volume Bar Chart */}
                <AppCard variant="elevated" style={styles.chartCard}>
                  <VolumeBarChart
                    data={summary?.volume || []}
                    height={200}
                  />
                </AppCard>

                {/* 3. Workout Completion History */}
                <SectionHeader
                  title={`Completed Workouts (${workoutHistory.length})`}
                  style={{ marginTop: 8 }}
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

                    const durationMins = Math.max(
                      1,
                      Math.round((session.durationSeconds || 1800) / 60)
                    );

                    return (
                      <AppCard
                        key={String(session._id || session.id || idx)}
                        variant="outlined"
                        style={styles.sessionCard}
                        onPress={() =>
                          router.push(`/workout/${session._id || session.id}?kind=session`)
                        }
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
                            <Text
                              style={[styles.sessionTitle, { color: colors.onSurface }]}
                              numberOfLines={1}
                            >
                              {session.title || session.routineName || 'Completed Workout'}
                            </Text>
                            <Text style={[styles.sessionSub, { color: colors.onSurfaceVariant }]}>
                              {dateLabel} • {durationMins} mins •{' '}
                              {session.caloriesEstimate || Math.round(durationMins * 7)} kcal
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.pointsBadge,
                              { backgroundColor: colors.surfaceVariant },
                            ]}
                          >
                            <Zap size={12} color={colors.secondary} />
                            <Text
                              style={[styles.pointsBadgeText, { color: colors.onSurface }]}
                            >
                              +5 pts
                            </Text>
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

            {/* ─── TAB 3: PERSONAL BESTS (PRS) ──────────────────────────── */}
            {activeTab === 'PRS' && (
              <PersonalBestsCard personalBests={summary?.personalBests || []} />
            )}

            {/* ─── TAB 4: BODY MEASUREMENTS ─────────────────────────────── */}
            {activeTab === 'BODY' && (
              <>
                <BodyMeasurementsCard
                  measurementsData={measurementsData}
                  onOpenLogModal={handleOpenMeasurementsModal}
                />

                <SectionHeader
                  title={`Measurement Logs (${measurementsData?.entries?.length || 0})`}
                  style={{ marginTop: 8 }}
                />

                {measurementsData?.entries?.length > 0 ? (
                  measurementsData.entries.map((entry, idx) => (
                    <AppCard
                      key={String(entry._id || entry.id || idx)}
                      variant="outlined"
                      style={styles.historyCard}
                    >
                      <View style={styles.historyRow}>
                        <View style={styles.rowAlign}>
                          <View
                            style={[
                              styles.scaleIconWrap,
                              { backgroundColor: colors.secondaryContainer },
                            ]}
                          >
                            <Ruler size={16} color={colors.onSecondaryContainer} />
                          </View>
                          <View>
                            <Text style={[styles.historyWeightVal, { color: colors.onSurface }]}>
                              {entry.dateKey || 'Recorded'}
                            </Text>
                            <Text style={[styles.historyDate, { color: colors.onSurfaceVariant }]}>
                              {[
                                entry.chestCm ? `Chest: ${entry.chestCm}cm` : null,
                                entry.waistCm ? `Waist: ${entry.waistCm}cm` : null,
                                entry.armsCm ? `Arms: ${entry.armsCm}cm` : null,
                                entry.thighsCm ? `Thighs: ${entry.thighsCm}cm` : null,
                              ]
                                .filter(Boolean)
                                .join(' • ') || 'No metrics entered'}
                            </Text>
                          </View>
                        </View>

                        {(entry._id || entry.id) && (
                          <Pressable
                            style={styles.trashBtn}
                            onPress={() => handleDeleteMeasurement(entry._id || entry.id)}
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
                    icon="ruler"
                    title="No Measurements Recorded"
                    description="Tap '+ Log' on the card above to track your chest, waist, arms, and thighs circumferences."
                  />
                )}
              </>
            )}

            {/* ─── TAB 5: TRANSFORMATION PHOTOS ─────────────────────────── */}
            {activeTab === 'PHOTOS' && (
              <TransformationPhotosCard
                photos={photos}
                onOpenUploadModal={() => setPhotoModalVisible(true)}
                onDeletePhoto={handleDeletePhoto}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Log Weight Modal */}
      <Modal
        visible={weightModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWeightModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        >
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
              Enter your weight in kilograms. Regular weigh-ins accurately chart your progress curve.
            </Text>

            <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
              Weight (kg) *
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.outlineVariant,
                  color: colors.onSurface,
                },
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
        </KeyboardAvoidingView>
      </Modal>

      {/* Log Body Measurements Modal */}
      <Modal
        visible={measurementsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMeasurementsModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        >
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
                Record Body Measurements
              </Text>
              <Pressable onPress={() => setMeasurementsModalVisible(false)} hitSlop={8}>
                <X size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <Text style={[styles.modalSub, { color: colors.onSurfaceVariant }]}>
              Enter your circumferences in centimeters. Enter at least one field.
            </Text>

            <View style={styles.measurementsGrid}>
              <View style={styles.halfInputCol}>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                  Chest (cm)
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.outlineVariant,
                      color: colors.onSurface,
                    },
                  ]}
                  placeholder="e.g., 98"
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="numeric"
                  value={chestInput}
                  onChangeText={setChestInput}
                />
              </View>

              <View style={styles.halfInputCol}>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                  Waist (cm)
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.outlineVariant,
                      color: colors.onSurface,
                    },
                  ]}
                  placeholder="e.g., 82"
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="numeric"
                  value={waistInput}
                  onChangeText={setWaistInput}
                />
              </View>

              <View style={styles.halfInputCol}>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                  Arms (cm)
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.outlineVariant,
                      color: colors.onSurface,
                    },
                  ]}
                  placeholder="e.g., 36"
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="numeric"
                  value={armsInput}
                  onChangeText={setArmsInput}
                />
              </View>

              <View style={styles.halfInputCol}>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                  Thighs (cm)
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.outlineVariant,
                      color: colors.onSurface,
                    },
                  ]}
                  placeholder="e.g., 56"
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="numeric"
                  value={thighsInput}
                  onChangeText={setThighsInput}
                />
              </View>
            </View>

            <View style={styles.modalActionWrap}>
              <AppButton
                tone="primary"
                label="Save Measurements"
                loading={submittingMeasurements}
                onPress={handleSaveMeasurements}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Upload Transformation Photo Modal */}
      <UploadPhotoModal
        visible={photoModalVisible}
        onClose={() => setPhotoModalVisible(false)}
        onPhotoUploaded={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.progressPhotos(30) });
        }}
        defaultWeight={currentKg}
      />
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
  topControlsWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
  },
  timeframeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  timeframeChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  timeframeChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomWidth: 2,
  },
  tabBtnText: {
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  skeletonWrap: {
    paddingVertical: 12,
  },
  mbLg: {
    marginBottom: 16,
  },
  weightCard: {
    marginBottom: 14,
  },
  chartCard: {
    marginBottom: 16,
    paddingHorizontal: 8,
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
    flex: 1,
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
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  statTile: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: {
    fontSize: 15,
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
    fontSize: 14,
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
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  halfInputCol: {
    width: '48%',
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
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  modalActionWrap: {
    marginTop: 4,
    marginBottom: 16,
  },
});
