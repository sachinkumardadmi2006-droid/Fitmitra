import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Dumbbell,
  Sparkles,
  VideoOff,
  Zap,
} from 'lucide-react-native';
import { useAppTheme } from '../../../theme/ThemeContext';
import { workoutService, normalizeTodayWorkout } from '../../../services/workoutService';
import { queryKeys } from '../../../constants/queryKeys';
import { emitDbUpdate } from '../../../utils/events';
import { PointsCelebrationModal } from '../../../components/modals/PointsCelebrationModal';

/**
 * ExerciseVideoArea
 * Renders video player using expo-video, or clean "Video Coming Soon" placeholder.
 */
function ExerciseVideoArea({ videoUrl, thumbnail, colors, radius }) {
  const player = useVideoPlayer(videoUrl || null, (p) => {
    if (p && videoUrl) {
      p.loop = true;
      p.muted = true;
      p.play();
    }
  });

  if (!videoUrl) {
    return (
      <View style={[styles.videoContainer, { backgroundColor: colors.surfaceVariant, borderRadius: radius.lg }]}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={[styles.videoFill, { borderRadius: radius.lg }]} resizeMode="cover" />
        ) : (
          <View style={styles.noVideoPlaceholder}>
            <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
              <VideoOff size={28} color={colors.primary} />
            </View>
            <Text style={[styles.noVideoTitle, { color: colors.onSurface }]}>
              Video Coming Soon
            </Text>
            <Text style={[styles.noVideoSub, { color: colors.onSurfaceVariant }]}>
              Proper form guide and exercise demonstration video will be available shortly.
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.videoContainer, { borderRadius: radius.lg }]}>
      <VideoView
        player={player}
        style={[styles.videoFill, { borderRadius: radius.lg }]}
        contentFit="cover"
        nativeControls={true}
      />
    </View>
  );
}

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const { exerciseId, index: rawIndex, total: rawTotal } = useLocalSearchParams();

  const [completing, setCompleting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(5);
  const [totalPoints, setTotalPoints] = useState(0);

  // 1. Fetch Today's Workout Data to access the full exercise list
  const todayQuery = useQuery({
    queryKey: queryKeys.todayWorkout,
    queryFn: async () => {
      const res = await workoutService.getTodayWorkout();
      return res ? normalizeTodayWorkout(res) : null;
    },
    staleTime: 60 * 1000,
  });

  const todayData = todayQuery.data || null;
  const exercises = useMemo(() => todayData?.workout?.exercises || [], [todayData]);

  // Determine current exercise and index
  const currentIndex = useMemo(() => {
    if (rawIndex !== undefined && rawIndex !== null && rawIndex !== '') {
      return parseInt(rawIndex, 10);
    }
    const idx = exercises.findIndex((e) => String(e.exerciseId) === String(exerciseId));
    return idx >= 0 ? idx : 0;
  }, [rawIndex, exercises, exerciseId]);

  const currentExercise = useMemo(() => {
    if (exercises[currentIndex]) return exercises[currentIndex];
    return exercises.find((e) => String(e.exerciseId) === String(exerciseId)) || null;
  }, [exercises, currentIndex, exerciseId]);

  const totalExercises = useMemo(() => {
    if (exercises.length > 0) return exercises.length;
    if (rawTotal) return parseInt(rawTotal, 10);
    return 1;
  }, [exercises.length, rawTotal]);

  const isLastExercise = currentIndex + 1 >= totalExercises;

  // Handle "Complete Exercise" -> saves to database, then auto-navigates to next exercise
  const handleCompleteExercise = async () => {
    if (completing || !currentExercise) return;
    setCompleting(true);

    try {
      // 1. Ensure active session exists in database
      const sessionResult = await workoutService.ensureActiveSession({
        programDayId: todayData?.programDay?.id || todayData?.workout?.id,
        programId: todayData?.program?.id,
        title: todayData?.workout?.title || "Today's Workout",
      });

      const activeSessionId = sessionResult?.sessionId;

      if (activeSessionId) {
        // 2. Log exercise completion to database
        const targetSetsCount = Number(currentExercise.sets || 3);
        const targetRepsNum = parseInt(currentExercise.reps, 10) || 12;

        const setsPayload = Array.from({ length: targetSetsCount }).map((_, sIdx) => ({
          setNumber: sIdx + 1,
          reps: targetRepsNum,
          completed: true,
        }));

        await workoutService.logExerciseCompletion(
          activeSessionId,
          currentExercise.exerciseId,
          setsPayload
        );

        // 3. Invalidate query cache & emit DB event so progress updates everywhere
        await queryClient.invalidateQueries({ queryKey: queryKeys.todayWorkout });
        emitDbUpdate();

        // 4. Auto-navigation or Routine completion
        if (isLastExercise) {
          // Final exercise: complete the workout session on server
          try {
            const completeRes = await workoutService.completeWorkout(activeSessionId, {
              durationSeconds: (todayData?.session?.durationSeconds || 1200) + 180,
            });
            const completeData = completeRes?.data || completeRes;
            setEarnedPoints(completeData?.rewardPointsEarned || 5);
            setTotalPoints(completeData?.rewardPointsBalance || 0);
          } catch (completeErr) {
            console.warn('[CompleteWorkout] Error completing routine:', completeErr);
          }
          setShowCelebration(true);
        } else {
          // Navigate to next exercise in today's routine
          const nextIndex = currentIndex + 1;
          const nextEx = exercises[nextIndex];
          if (nextEx) {
            router.replace(
              `/workout/exercise/${nextEx.exerciseId}?index=${nextIndex}&total=${totalExercises}`
            );
          } else {
            router.replace('/(tabs)/workouts');
          }
        }
      }
    } catch (err) {
      console.error('[handleCompleteExercise] Failed to complete exercise:', err);
    } finally {
      setCompleting(false);
    }
  };

  // Handle "Next Exercise" (skip or preview ahead without recording completion)
  const handleNextExercise = () => {
    if (isLastExercise) {
      router.replace('/(tabs)/workouts');
      return;
    }
    const nextIndex = currentIndex + 1;
    const nextEx = exercises[nextIndex];
    if (nextEx) {
      router.replace(
        `/workout/exercise/${nextEx.exerciseId}?index=${nextIndex}&total=${totalExercises}`
      );
    }
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    router.replace('/(tabs)/workouts');
  };

  if (todayQuery.isLoading && !currentExercise) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          Loading exercise details...
        </Text>
      </View>
    );
  }

  if (!currentExercise) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.background, padding: 24 }]}>
        <Dumbbell size={48} color={colors.onSurfaceVariant} />
        <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
          Exercise Not Found
        </Text>
        <Text style={[styles.emptySub, { color: colors.onSurfaceVariant }]}>
          Could not find the scheduled exercise in your routine.
        </Text>
        <Pressable
          style={[styles.backBtnAlt, { backgroundColor: colors.primaryContainer }]}
          onPress={() => router.replace('/(tabs)/workouts')}
        >
          <Text style={[styles.backBtnAltText, { color: colors.onPrimaryContainer }]}>
            Back to Workouts
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { borderBottomColor: colors.outlineVariant }]}>
        <Pressable style={styles.headerBackBtn} onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.onSurface} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerProgressText, { color: colors.primary }]}>
            Exercise {currentIndex + 1} of {totalExercises}
          </Text>
          <Text style={[styles.headerSubText, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {todayData?.workout?.title || "Today's Routine"}
          </Text>
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Video Area / Fallback */}
        <ExerciseVideoArea
          videoUrl={currentExercise.videoUrl}
          thumbnail={currentExercise.thumbnailUrl}
          colors={colors}
          radius={custom.radius}
        />

        {/* Title and Badge Row */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={[styles.exerciseTitle, { color: colors.onSurface }]}>
              {currentExercise.name}
            </Text>
            {currentExercise.difficulty && (
              <View style={[styles.difficultyBadge, { backgroundColor: colors.secondaryContainer }]}>
                <Text style={[styles.difficultyText, { color: colors.onSecondaryContainer }]}>
                  {currentExercise.difficulty}
                </Text>
              </View>
            )}
          </View>
          {todayData?.workout?.programName && (
            <Text style={[styles.programNameSubtitle, { color: colors.onSurfaceVariant }]}>
              Part of {todayData.workout.programName}
            </Text>
          )}
        </View>

        {/* Target Metrics Cards */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: colors.surfaceVariant, borderRadius: custom.radius.md }]}>
            <Dumbbell size={18} color={colors.primary} />
            <Text style={[styles.metricValue, { color: colors.onSurface }]}>
              {currentExercise.sets || 3}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
              Target Sets
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surfaceVariant, borderRadius: custom.radius.md }]}>
            <Zap size={18} color={colors.secondary} />
            <Text style={[styles.metricValue, { color: colors.onSurface }]}>
              {currentExercise.reps || '10-12'}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
              Target Reps
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surfaceVariant, borderRadius: custom.radius.md }]}>
            <Clock size={18} color={colors.primary} />
            <Text style={[styles.metricValue, { color: colors.onSurface }]}>
              {currentExercise.restSec || 60}s
            </Text>
            <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
              Rest Interval
            </Text>
          </View>
        </View>

        {/* Muscle Groups */}
        {currentExercise.muscleGroups && currentExercise.muscleGroups.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
              Target Muscle Groups
            </Text>
            <View style={styles.tagWrap}>
              {currentExercise.muscleGroups.map((mg, i) => (
                <View
                  key={i}
                  style={[styles.tagPill, { backgroundColor: colors.surfaceVariant }]}
                >
                  <Text style={[styles.tagText, { color: colors.onSurfaceVariant }]}>
                    {mg}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Equipment Needed */}
        {currentExercise.equipment && currentExercise.equipment.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
              Equipment Needed
            </Text>
            <View style={styles.tagWrap}>
              {currentExercise.equipment.map((eq, i) => (
                <View
                  key={i}
                  style={[styles.tagPill, { backgroundColor: colors.surfaceVariant }]}
                >
                  <Text style={[styles.tagText, { color: colors.onSurfaceVariant }]}>
                    {eq}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Step-by-Step Instructions */}
        {currentExercise.instructions && currentExercise.instructions.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
              How To Perform
            </Text>
            {currentExercise.instructions.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepNumberCircle, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.stepNumberText, { color: colors.onPrimary }]}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={[styles.stepText, { color: colors.onSurfaceVariant }]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Safety Notes & Form Tips */}
        {currentExercise.safetyNotes && currentExercise.safetyNotes.length > 0 && (
          <View style={styles.infoSection}>
            <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
              Safety Notes & Form Tips
            </Text>
            {currentExercise.safetyNotes.map((note, i) => (
              <View
                key={i}
                style={[
                  styles.safetyNoteCard,
                  { backgroundColor: colors.surfaceVariant, borderRadius: custom.radius.md },
                ]}
              >
                <Sparkles size={16} color={colors.secondary} style={{ marginTop: 2, marginRight: 8 }} />
                <Text style={[styles.safetyNoteText, { color: colors.onSurfaceVariant }]}>
                  {note}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Fixed Bottom Action Buttons */}
      <View
        style={[
          styles.bottomActionBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.outlineVariant,
          },
        ]}
      >
        <Pressable
          style={[
            styles.completeBtn,
            { backgroundColor: colors.primary },
            completing && { opacity: 0.75 },
          ]}
          onPress={handleCompleteExercise}
          disabled={completing}
        >
          {completing ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <>
              <Check size={18} color={colors.onPrimary} style={{ marginRight: 6 }} />
              <Text style={[styles.completeBtnText, { color: colors.onPrimary }]}>
                {isLastExercise ? 'Complete Routine' : 'Complete Exercise'}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.nextBtn,
            {
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.outlineVariant,
            },
          ]}
          onPress={handleNextExercise}
          disabled={completing}
        >
          <Text style={[styles.nextBtnText, { color: colors.onSurface }]}>
            {isLastExercise ? 'Finish' : 'Next'}
          </Text>
          <ChevronRight size={18} color={colors.onSurface} style={{ marginLeft: 2 }} />
        </Pressable>
      </View>

      {/* Routine Completion Points Celebration Modal */}
      <PointsCelebrationModal
        visible={showCelebration}
        pointsEarned={earnedPoints}
        totalPoints={totalPoints}
        onClose={handleCelebrationClose}
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  backBtnAlt: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnAltText: {
    fontSize: 14,
    fontWeight: '700',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerProgressText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSubText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  headerRightSpacer: {
    width: 36,
  },
  scrollContent: {
    padding: 16,
  },
  videoContainer: {
    width: '100%',
    height: 220,
    overflow: 'hidden',
    marginBottom: 16,
  },
  videoFill: {
    width: '100%',
    height: '100%',
  },
  noVideoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  noVideoTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  noVideoSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  titleSection: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  exerciseTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  programNameSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumberCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  safetyNoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginBottom: 8,
  },
  safetyNoteText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  completeBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
  },
  completeBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
