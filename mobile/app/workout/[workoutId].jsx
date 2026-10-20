import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  Flame,
  Dumbbell,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Zap,
  Info,
  Check,
  FastForward,
} from 'lucide-react-native';
import { ProgressBar } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeContext';
import { workoutService, normalizeTodayWorkout } from '../../services/workoutService';
import { emitDbUpdate } from '../../utils/events';
import { PointsCelebrationModal } from '../../components/modals/PointsCelebrationModal';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import AppHeader from '../../components/ui/AppHeader';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Skeleton from '../../components/ui/Skeleton';

export default function WorkoutDetailAndPlayerScreen() {
  const { workoutId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);

  // Active Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState({}); // { '0_0': true }
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(60);
  const [initialRestDuration, setInitialRestDuration] = useState(60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [savingSession, setSavingSession] = useState(false);

  // Dialogs
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  // Points celebration
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [newPointsBalance, setNewPointsBalance] = useState(null);

  // Load workout routine
  useEffect(() => {
    let isMounted = true;

    const fetchWorkout = async () => {
      setLoading(true);
      try {
        // 1. If "today" or matches today, check today's workout endpoint first
        if (workoutId === 'today' || !workoutId) {
          const todayRes = await workoutService.getTodayWorkout();
          if (todayRes && isMounted) {
            const norm = normalizeTodayWorkout(todayRes);
            if (norm?.workout?.exercises?.length > 0) {
              setWorkout({
                id: norm.workout.id || 'today',
                title: norm.workout.title,
                programName: norm.workout.programName || 'Scheduled Routine',
                level: norm.workout.level || 'Beginner',
                estimatedMin: norm.workout.estimatedMin || 40,
                exercises: norm.workout.exercises,
              });
              if (norm.session?.id) {
                setSessionId(norm.session.id);
              }
              setLoading(false);
              return;
            }
          }
        }

        // 2. Try fetching as Program by ID
        try {
          const progRes = await workoutService.getProgram(workoutId);
          const prog = progRes?.data || progRes;
          if (prog && isMounted) {
            const firstRoutine = prog.weeks?.[0]?.days?.[0] || prog.routines?.[0] || {};
            const exercises = (firstRoutine.exercises || []).map((ex, idx) => ({
              exerciseId: String(ex.exerciseId || ex._id || ex.id || `ex_${idx}`),
              name: ex.name || 'Exercise',
              sets: Number(ex.sets || ex.targetSets || 3),
              reps: String(ex.reps || ex.targetReps || '10-12'),
              restSec: Number(ex.restSec || ex.restSeconds || 60),
              instructions: Array.isArray(ex.instructions) ? ex.instructions : [],
              muscleGroups: Array.isArray(ex.muscleGroups) ? ex.muscleGroups : [],
            }));

            setWorkout({
              id: prog._id || prog.id || workoutId,
              title: prog.name || 'Program Workout',
              programName: prog.name,
              level: prog.level || 'Beginner',
              estimatedMin: Math.max(25, exercises.length * 8),
              description: prog.description,
              exercises,
            });
            setLoading(false);
            return;
          }
        } catch (_) {}

        // 3. Fallback: check today's workout
        const todayRes = await workoutService.getTodayWorkout();
        if (todayRes && isMounted) {
          const norm = normalizeTodayWorkout(todayRes);
          if (norm?.workout?.exercises?.length > 0) {
            setWorkout({
              id: norm.workout.id || workoutId,
              title: norm.workout.title,
              programName: norm.workout.programName || 'Daily Routine',
              level: norm.workout.level || 'Beginner',
              estimatedMin: norm.workout.estimatedMin || 40,
              exercises: norm.workout.exercises,
            });
            if (norm.session?.id) {
              setSessionId(norm.session.id);
            }
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[WorkoutDetail] Fetch error:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWorkout();
    return () => {
      isMounted = false;
    };
  }, [workoutId]);

  // Elapsed Session Timer
  useEffect(() => {
    let timer;
    if (isPlaying && !isPaused) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, isPaused]);

  // Rest Countdown Timer
  useEffect(() => {
    let restTimer;
    if (isResting && restTimeLeft > 0) {
      restTimer = setInterval(() => {
        setRestTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isResting && restTimeLeft <= 0) {
      setIsResting(false);
    }
    return () => {
      if (restTimer) clearInterval(restTimer);
    };
  }, [isResting, restTimeLeft]);

  // Formatter for elapsed & rest time
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const exerciseList = workout?.exercises || [];
  const currentEx = exerciseList[currentExIndex];

  // Start workout session
  const handleStartWorkout = async () => {
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentExIndex(0);
    setCompletedSets({});
    setIsResting(false);
    setElapsedSeconds(0);

    try {
      if (!sessionId) {
        const startRes = await workoutService.startWorkout({
          programDayId: workout?.id !== 'today' ? workout?.id : undefined,
          title: workout?.title || 'Workout Session',
        });
        const sess = startRes?.data || startRes;
        if (sess?._id || sess?.id) {
          setSessionId(sess._id || sess.id);
          emitDbUpdate();
        }
      }
    } catch (err) {
      console.warn('[WorkoutSession] Session start error:', err.message);
    }
  };

  // Toggle set completion and trigger rest
  const handleToggleSet = async (setIdx) => {
    const key = `${currentExIndex}_${setIdx}`;
    const nextCompleted = !completedSets[key];

    setCompletedSets((prev) => ({
      ...prev,
      [key]: nextCompleted,
    }));

    if (nextCompleted) {
      // Trigger rest timer
      const restPeriod = currentEx?.restSec || 60;
      setInitialRestDuration(restPeriod);
      setRestTimeLeft(restPeriod);
      setIsResting(true);

      // Log exercise set to backend session
      if (sessionId && currentEx?.exerciseId) {
        try {
          const repsVal = parseInt(currentEx.reps, 10) || 10;
          await workoutService.logExercise(sessionId, {
            exerciseId: currentEx.exerciseId,
            sets: [
              {
                setNumber: setIdx + 1,
                reps: repsVal,
                completed: true,
              },
            ],
          });
        } catch (err) {
          console.warn('[WorkoutSession] Failed to log set:', err.message);
        }
      }
    }
  };

  const handleSkipRest = () => {
    setIsResting(false);
  };

  const handleAddRestTime = () => {
    setRestTimeLeft((prev) => prev + 30);
  };

  const handleNextExercise = () => {
    setIsResting(false);
    if (currentExIndex < exerciseList.length - 1) {
      setCurrentExIndex(currentExIndex + 1);
    } else {
      checkBeforeFinish();
    }
  };

  const handlePrevExercise = () => {
    setIsResting(false);
    if (currentExIndex > 0) {
      setCurrentExIndex(currentExIndex - 1);
    }
  };

  const checkBeforeFinish = () => {
    // Check if any sets are uncompleted
    let allDone = true;
    for (let eIdx = 0; eIdx < exerciseList.length; eIdx++) {
      const setsCount = Number(exerciseList[eIdx].sets || 3);
      for (let sIdx = 0; sIdx < setsCount; sIdx++) {
        if (!completedSets[`${eIdx}_${sIdx}`]) {
          allDone = false;
          break;
        }
      }
      if (!allDone) break;
    }

    if (!allDone) {
      setShowFinishConfirm(true);
    } else {
      executeFinishWorkout();
    }
  };

  const executeFinishWorkout = async () => {
    setShowFinishConfirm(false);
    setSavingSession(true);

    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    let pointsEarned = 5;
    let newBalance = null;

    if (sessionId) {
      try {
        const res = await workoutService.completeWorkout(sessionId, {
          durationSeconds: elapsedSeconds,
          caloriesEstimate: Math.max(50, Math.round(minutes * 7.5)),
        });

        const resData = res?.data || res;
        if (resData?.points) {
          pointsEarned = resData.points.pointsAdded ?? 5;
          newBalance = resData.points.newBalance ?? null;
        }
        emitDbUpdate();
      } catch (err) {
        console.warn('[WorkoutSession] Completion error:', err.message);
      }
    }

    setIsPlaying(false);
    setIsResting(false);
    setSavingSession(false);
    setEarnedPoints(pointsEarned);
    setNewPointsBalance(newBalance);
    setShowPointsModal(true);
  };

  const handleExitSession = () => {
    setShowExitConfirm(false);
    setIsPlaying(false);
    setIsResting(false);
  };

  const handlePointsModalClose = () => {
    setShowPointsModal(false);
    router.replace('/(tabs)/workouts');
  };

  // 1. Loading View
  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title="Workout Details" onBack={() => router.back()} />
        <View style={styles.contentWrap}>
          <Skeleton height={180} radius={custom.radius.lg} style={{ marginBottom: 16 }} />
          <Skeleton height={80} radius={custom.radius.lg} style={{ marginBottom: 12 }} />
          <Skeleton height={80} radius={custom.radius.lg} style={{ marginBottom: 12 }} />
          <Skeleton height={80} radius={custom.radius.lg} />
        </View>
      </View>
    );
  }

  // 2. Workout Not Found View
  if (!workout || exerciseList.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title="Workout" onBack={() => router.back()} />
        <View style={styles.centerWrap}>
          <EmptyState
            icon="dumbbell"
            title="Workout Routine Not Found"
            description="The selected workout plan or exercise routine could not be loaded."
            actionLabel="Return to Workouts"
            onAction={() => router.replace('/(tabs)/workouts')}
          />
        </View>
      </View>
    );
  }

  // 3. WORKOUT SESSION PLAYER (Active Mode)
  if (isPlaying) {
    const totalSets = Number(currentEx?.sets || 3);
    const completedForCurrentEx = Array.from({ length: totalSets }).filter(
      (_, i) => completedSets[`${currentExIndex}_${i}`]
    ).length;

    const sessionProgress = (currentExIndex + (completedForCurrentEx / totalSets)) / exerciseList.length;

    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Active Player Header */}
        <View
          style={[
            styles.playerHeader,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.outlineVariant,
            },
          ]}
        >
          <Pressable
            style={[styles.headerIconBtn, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => setShowExitConfirm(true)}
            hitSlop={8}
          >
            <X size={18} color={colors.onSurface} />
          </Pressable>

          {/* Elapsed Timer & Pause/Resume */}
          <View style={styles.timerPill}>
            <Clock size={15} color={colors.primary} />
            <Text style={[styles.timerText, { color: colors.onSurface }]}>
              {formatTime(elapsedSeconds)}
            </Text>
            <Pressable
              onPress={() => setIsPaused((prev) => !prev)}
              style={styles.pauseBtn}
              hitSlop={8}
            >
              {isPaused ? (
                <Play size={16} color={custom.primaryStrong} />
              ) : (
                <Pause size={16} color={colors.onSurfaceVariant} />
              )}
            </Pressable>
          </View>

          <Pressable
            style={[styles.finishHeaderBtn, { backgroundColor: colors.primaryContainer }]}
            onPress={checkBeforeFinish}
          >
            <Text style={[styles.finishHeaderText, { color: colors.onPrimaryContainer }]}>
              Finish
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.playerScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Pause Status Indicator */}
          {isPaused && (
            <View
              style={[
                styles.pausedBanner,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
              ]}
            >
              <Pause size={14} color={colors.secondary} />
              <Text style={[styles.pausedText, { color: colors.onSurface }]}>
                Workout Paused • Tap play icon above to resume
              </Text>
            </View>
          )}

          {/* Overall Session Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeaderRow}>
              <Text style={[styles.progressExerciseLabel, { color: colors.onSurface }]}>
                Exercise {currentExIndex + 1} of {exerciseList.length}
              </Text>
              <Text style={[styles.progressPct, { color: colors.onSurfaceVariant }]}>
                {Math.round(sessionProgress * 100)}% Complete
              </Text>
            </View>
            <ProgressBar
              progress={Math.min(Math.max(sessionProgress, 0), 1)}
              color={colors.primary}
              style={styles.playerProgressBar}
            />
          </View>

          {/* Current Exercise Card */}
          <AppCard variant="elevated" style={styles.currentExCard}>
            <View style={styles.exTagRow}>
              <View style={[styles.tagPill, { backgroundColor: colors.primaryContainer }]}>
                <Dumbbell size={12} color={colors.onPrimaryContainer} />
                <Text style={[styles.tagPillText, { color: colors.onPrimaryContainer }]}>
                  CURRENT EXERCISE
                </Text>
              </View>
              {currentEx?.muscleGroups?.[0] && (
                <Text style={[styles.muscleTag, { color: colors.onSurfaceVariant }]}>
                  {currentEx.muscleGroups[0]}
                </Text>
              )}
            </View>

            <Text style={[styles.currentExTitle, { color: colors.onSurface }]}>
              {currentEx?.name}
            </Text>

            <View style={styles.exMetaRow}>
              <Text style={[styles.exMetaText, { color: colors.onSurfaceVariant }]}>
                Target: {totalSets} Sets × {currentEx?.reps || '10-12'} Reps • {currentEx?.restSec || 60}s Rest
              </Text>
            </View>

            {/* Instructions box */}
            {currentEx?.instructions?.length > 0 && (
              <View
                style={[
                  styles.instructionsBox,
                  { backgroundColor: colors.surfaceVariant },
                ]}
              >
                <View style={styles.instructionsHeader}>
                  <Info size={14} color={colors.primary} />
                  <Text style={[styles.instructionsTitle, { color: colors.onSurface }]}>
                    Instructions
                  </Text>
                </View>
                <Text style={[styles.instructionsText, { color: colors.onSurfaceVariant }]}>
                  {currentEx.instructions[0]}
                </Text>
              </View>
            )}

            {/* Interactive Set Checklist */}
            <SectionHeader title="Log Sets" style={{ marginTop: 16 }} />

            <View style={styles.setsList}>
              {Array.from({ length: totalSets }).map((_, sIdx) => {
                const key = `${currentExIndex}_${sIdx}`;
                const isCompleted = Boolean(completedSets[key]);

                return (
                  <Pressable
                    key={sIdx}
                    onPress={() => handleToggleSet(sIdx)}
                    style={[
                      styles.setRow,
                      {
                        backgroundColor: isCompleted
                          ? colors.primaryContainer
                          : colors.surfaceVariant,
                        borderColor: isCompleted ? colors.primary : colors.outlineVariant,
                      },
                    ]}
                  >
                    <View style={styles.rowAlign}>
                      <View
                        style={[
                          styles.setCheckbox,
                          {
                            backgroundColor: isCompleted ? colors.primary : 'transparent',
                            borderColor: isCompleted ? colors.primary : colors.outline,
                          },
                        ]}
                      >
                        {isCompleted && <Check size={14} color={colors.onPrimary} />}
                      </View>
                      <Text
                        style={[
                          styles.setLabel,
                          {
                            color: isCompleted ? colors.onPrimaryContainer : colors.onSurface,
                            fontWeight: isCompleted ? '700' : '600',
                          },
                        ]}
                      >
                        Set {sIdx + 1}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.setReps,
                        {
                          color: isCompleted ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {currentEx?.reps || '12'} reps
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </AppCard>

          {/* Rest Countdown Card */}
          {isResting && (
            <AppCard
              variant="elevated"
              style={[
                styles.restCard,
                { borderColor: colors.secondary, borderWidth: 1.5 },
              ]}
            >
              <View style={styles.restHeader}>
                <View style={styles.rowAlign}>
                  <RotateCcw size={18} color={colors.secondary} />
                  <Text style={[styles.restTitle, { color: colors.onSurface }]}>
                    Rest Countdown
                  </Text>
                </View>
                <Text style={[styles.restCountdown, { color: colors.secondary }]}>
                  {restTimeLeft}s
                </Text>
              </View>

              <ProgressBar
                progress={Math.max(0, restTimeLeft / (initialRestDuration || 60))}
                color={colors.secondary}
                style={styles.restProgressBar}
              />

              <View style={styles.restActionsRow}>
                <Pressable
                  style={[
                    styles.restActionBtn,
                    { backgroundColor: colors.surfaceVariant },
                  ]}
                  onPress={handleAddRestTime}
                >
                  <Text style={[styles.restActionBtnText, { color: colors.onSurface }]}>
                    +30s Rest
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.restActionBtn,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                  onPress={handleSkipRest}
                >
                  <Text style={[styles.restActionBtnText, { color: colors.onPrimaryContainer }]}>
                    Skip Rest
                  </Text>
                </Pressable>
              </View>
            </AppCard>
          )}

          {/* Navigation Controls */}
          <View style={styles.playerNavRow}>
            <AppButton
              mode="outlined"
              label="Previous"
              icon="chevron-left"
              disabled={currentExIndex === 0}
              onPress={handlePrevExercise}
              style={{ flex: 1 }}
            />

            {currentExIndex < exerciseList.length - 1 ? (
              <AppButton
                tone="primary"
                label="Next Exercise"
                icon="chevron-right"
                onPress={handleNextExercise}
                style={{ flex: 1 }}
              />
            ) : (
              <AppButton
                tone="primary"
                label="Finish Workout"
                icon="check"
                loading={savingSession}
                onPress={checkBeforeFinish}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </ScrollView>

        {/* Exit Active Session Confirm Dialog */}
        <ConfirmDialog
          visible={showExitConfirm}
          title="Exit Workout Session?"
          message="Your progress and completed sets will be logged, but the routine will not be marked as fully completed."
          confirmLabel="Exit Session"
          cancelLabel="Keep Going"
          destructive
          onConfirm={handleExitSession}
          onCancel={() => setShowExitConfirm(false)}
        />

        {/* Incomplete Sets Finish Confirm Dialog */}
        <ConfirmDialog
          visible={showFinishConfirm}
          title="Finish Workout?"
          message="You still have unlogged sets in this routine. Would you like to finish and record the workout now?"
          confirmLabel="Yes, Finish"
          cancelLabel="Log Remaining"
          onConfirm={executeFinishWorkout}
          onCancel={() => setShowFinishConfirm(false)}
        />

        {/* Points Celebration Modal */}
        <PointsCelebrationModal
          visible={showPointsModal}
          pointsEarned={earnedPoints}
          totalPoints={newPointsBalance}
          onClose={handlePointsModalClose}
        />
      </View>
    );
  }

  // 4. WORKOUT DETAILS (Pre-Workout View)
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Workout Details" onBack={() => router.back()} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.detailScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <AppCard variant="elevated" style={styles.heroDetailCard}>
          <View style={styles.heroTopRow}>
            <View style={[styles.levelTag, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.levelTagText, { color: colors.onPrimaryContainer }]}>
                {workout.level.toUpperCase()}
              </Text>
            </View>

            <View style={[styles.pointsTag, { backgroundColor: colors.secondaryContainer }]}>
              <Zap size={13} color={colors.onSecondaryContainer} />
              <Text style={[styles.pointsTagText, { color: colors.onSecondaryContainer }]}>
                +5 REWARD PTS
              </Text>
            </View>
          </View>

          <Text style={[styles.detailTitle, { color: colors.onSurface }]}>
            {workout.title}
          </Text>

          <Text style={[styles.detailSub, { color: colors.onSurfaceVariant }]}>
            {workout.description ||
              (workout.programName
                ? `Structured routine from the ${workout.programName} program.`
                : 'Complete all exercises in order to maximize muscular stimulation and cardiovascular fitness.')}
          </Text>

          {/* Metrics summary row */}
          <View style={[styles.metricsRow, { borderColor: colors.outlineVariant }]}>
            <View style={styles.metricItem}>
              <Clock size={16} color={colors.primary} />
              <Text style={[styles.metricVal, { color: colors.onSurface }]}>
                ~{workout.estimatedMin} mins
              </Text>
              <Text style={[styles.metricLbl, { color: colors.onSurfaceVariant }]}>Duration</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.outlineVariant }]} />

            <View style={styles.metricItem}>
              <Dumbbell size={16} color={colors.primary} />
              <Text style={[styles.metricVal, { color: colors.onSurface }]}>
                {exerciseList.length} Exercises
              </Text>
              <Text style={[styles.metricLbl, { color: colors.onSurfaceVariant }]}>Routine</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.outlineVariant }]} />

            <View style={styles.metricItem}>
              <Flame size={16} color={colors.secondary} />
              <Text style={[styles.metricVal, { color: colors.onSurface }]}>
                ~{Math.round(workout.estimatedMin * 7.5)} kcal
              </Text>
              <Text style={[styles.metricLbl, { color: colors.onSurfaceVariant }]}>Burn Est.</Text>
            </View>
          </View>
        </AppCard>

        {/* Exercises Section */}
        <SectionHeader
          title={`Exercises (${exerciseList.length})`}
          style={{ marginTop: 20, marginBottom: 8 }}
        />

        {exerciseList.map((ex, index) => {
          const setsCount = Number(ex.sets || 3);
          const repsStr = ex.reps || '10-12';
          const restVal = ex.restSec || 60;

          return (
            <AppCard
              key={ex.exerciseId || index}
              variant="outlined"
              style={styles.exerciseCard}
            >
              <View style={styles.exerciseCardRow}>
                {/* Step Index Number */}
                <View
                  style={[
                    styles.stepBadge,
                    { backgroundColor: colors.surfaceVariant },
                  ]}
                >
                  <Text style={[styles.stepBadgeText, { color: colors.onSurface }]}>
                    {index + 1}
                  </Text>
                </View>

                <View style={styles.exerciseMetaCol}>
                  <Text style={[styles.exerciseCardTitle, { color: colors.onSurface }]}>
                    {ex.name}
                  </Text>

                  <View style={styles.rowAlign}>
                    <Text style={[styles.exerciseCardSub, { color: colors.onSurfaceVariant }]}>
                      {setsCount} sets × {repsStr} reps • {restVal}s rest
                    </Text>
                  </View>

                  {ex.instructions?.length > 0 && (
                    <Text
                      style={[styles.instructionSnippet, { color: colors.onSurfaceVariant }]}
                      numberOfLines={2}
                    >
                      {ex.instructions[0]}
                    </Text>
                  )}
                </View>
              </View>
            </AppCard>
          );
        })}
      </ScrollView>

      {/* Floating Sticky Start Workout Button */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.outlineVariant,
          },
        ]}
      >
        <AppButton
          tone="primary"
          label="Start Workout"
          icon="play"
          onPress={handleStartWorkout}
        />
      </View>

      {/* Points Celebration Modal */}
      <PointsCelebrationModal
        visible={showPointsModal}
        pointsEarned={earnedPoints}
        totalPoints={newPointsBalance}
        onClose={handlePointsModalClose}
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
  contentWrap: {
    padding: 16,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  detailScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 90,
  },
  heroDetailCard: {
    marginBottom: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  levelTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pointsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointsTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  detailSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  metricItem: {
    alignItems: 'center',
    gap: 2,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  metricLbl: {
    fontSize: 11,
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },
  exerciseCard: {
    marginBottom: 8,
  },
  exerciseCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseMetaCol: {
    flex: 1,
  },
  exerciseCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  exerciseCardSub: {
    fontSize: 12,
    marginBottom: 4,
  },
  instructionSnippet: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pauseBtn: {
    padding: 4,
    marginLeft: 4,
  },
  finishHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  finishHeaderText: {
    fontSize: 13,
    fontWeight: '700',
  },
  playerScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  pausedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  pausedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressExerciseLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressPct: {
    fontSize: 12,
  },
  playerProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  currentExCard: {
    marginBottom: 16,
  },
  exTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  muscleTag: {
    fontSize: 12,
    fontWeight: '600',
  },
  currentExTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  exMetaRow: {
    marginBottom: 12,
  },
  exMetaText: {
    fontSize: 13,
  },
  instructionsBox: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  instructionsTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  instructionsText: {
    fontSize: 12,
    lineHeight: 17,
  },
  setsList: {
    gap: 8,
    marginTop: 4,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  setCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  setLabel: {
    fontSize: 14,
  },
  setReps: {
    fontSize: 13,
    fontWeight: '600',
  },
  restCard: {
    marginBottom: 16,
  },
  restHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  restTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  restCountdown: {
    fontSize: 20,
    fontWeight: '800',
  },
  restProgressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
  },
  restActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  restActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  playerNavRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
