// Interactive Workout Player & Session Detail Screen — mirrors frontend WorkoutDetails.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  Flame,
  Dumbbell,
  Play,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { WORKOUTS, EXERCISES } from '../../data/mockData';
import { addWorkoutHistory } from '../../utils/db';

export default function WorkoutDetailScreen() {
  const { workoutId } = useLocalSearchParams();
  const router = useRouter();

  const [workout, setWorkout] = useState(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState({}); // { '0_0': true }
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);

  useEffect(() => {
    const found = WORKOUTS.find((w) => w.id === workoutId);
    if (found) {
      setWorkout(found);
    }
  }, [workoutId]);

  // Elapsed timer
  useEffect(() => {
    let timer;
    if (isPlaying && !isFinished) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isFinished]);

  // Rest countdown
  useEffect(() => {
    let restTimer;
    if (isResting && restTimeLeft > 0) {
      restTimer = setInterval(() => {
        setRestTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isResting && restTimeLeft === 0) {
      setIsResting(false);
    }
    return () => clearInterval(restTimer);
  }, [isResting, restTimeLeft]);

  if (!workout) {
    return (
      <View style={styles.notFoundContainer}>
        <Dumbbell size={48} color={Colors.accentRose} />
        <Text style={styles.notFoundTitle}>Workout Not Found</Text>
        <Text style={styles.notFoundSub}>
          The workout routine you are looking for does not exist.
        </Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const exerciseList = (workout.exercises || []).map((exMeta) => {
    const full = EXERCISES.find((e) => e.id === exMeta.exerciseId) || {};
    return { ...full, ...exMeta };
  });

  const currentEx = exerciseList[currentExIndex];

  const handleStartWorkout = () => {
    setIsPlaying(true);
    setCurrentExIndex(0);
    setCompletedSets({});
    setIsResting(false);
    setElapsedSeconds(0);
    setIsFinished(false);
  };

  const handleToggleSet = (setIdx) => {
    const key = `${currentExIndex}_${setIdx}`;
    const nextState = !completedSets[key];
    setCompletedSets((prev) => ({ ...prev, [key]: nextState }));

    if (nextState) {
      setRestTimeLeft(currentEx?.rest || 60);
      setIsResting(true);
    }
  };

  const handleNextExercise = () => {
    setIsResting(false);
    if (currentExIndex < exerciseList.length - 1) {
      setCurrentExIndex(currentExIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrevExercise = () => {
    setIsResting(false);
    if (currentExIndex > 0) {
      setCurrentExIndex(currentExIndex - 1);
    }
  };

  const handleFinishAndSave = async () => {
    try {
      setSavingHistory(true);
      const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
      const calsBurned = Math.round(
        (minutes / (workout.duration || 45)) * (workout.calories || 300)
      );

      await addWorkoutHistory({
        name: workout.name,
        duration: minutes,
        calories: calsBurned,
      });

      setIsFinished(false);
      setIsPlaying(false);
      Alert.alert(
        'Workout Completed! 🔥',
        `Great job! Logged ${minutes} mins and ${calsBurned} calories burned to your profile.`,
        [
          {
            text: 'View Progress',
            onPress: () => router.push('/(tabs)/progress'),
          },
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)'),
          },
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to record workout history.');
    } finally {
      setSavingHistory(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.navBackIcon}
          onPress={() => {
            if (isPlaying) {
              Alert.alert(
                'Exit Workout?',
                'Are you sure you want to stop this workout session?',
                [
                  { text: 'Resume', style: 'cancel' },
                  { text: 'Exit', style: 'destructive', onPress: () => setIsPlaying(false) },
                ]
              );
            } else {
              router.back();
            }
          }}
        >
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {isPlaying ? 'Active Workout Session' : workout.name}
        </Text>
        {isPlaying ? (
          <View style={styles.timerBadge}>
            <Clock size={12} color={Colors.primaryNeon} />
            <Text style={styles.timerBadgeText}>{formatTime(elapsedSeconds)}</Text>
          </View>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {/* ACTIVE WORKOUT PLAYER VIEW */}
      {isPlaying ? (
        <ScrollView style={styles.playerScroll} contentContainerStyle={styles.playerContent}>
          {/* Progress tracker */}
          <View style={styles.exerciseStepHeader}>
            <Text style={styles.exerciseStepText}>
              EXERCISE {currentExIndex + 1} OF {exerciseList.length}
            </Text>
            <View style={styles.trackBar}>
              <View
                style={[
                  styles.trackFill,
                  { width: `${((currentExIndex + 1) / exerciseList.length) * 100}%` },
                ]}
              />
            </View>
          </View>

          {/* Current Exercise Card */}
          <View style={styles.activeExCard}>
            {currentEx.gifUrl ? (
              <Image source={{ uri: currentEx.gifUrl }} style={styles.exImage} />
            ) : (
              <View style={styles.noExImage}>
                <Dumbbell size={48} color={Colors.primaryNeon} />
              </View>
            )}

            <View style={styles.activeExInfo}>
              <Text style={styles.activeExTitle}>{currentEx.name}</Text>
              <Text style={styles.activeExTarget}>
                Target: {currentEx.targetMuscle || workout.category}
              </Text>
            </View>

            {/* Rest Timer Banner */}
            {isResting && (
              <View style={styles.restBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <RotateCcw size={16} color={Colors.accentAmber} />
                  <Text style={styles.restBannerText}>Rest Interval</Text>
                </View>
                <Text style={styles.restCountdown}>{restTimeLeft}s</Text>
                <Pressable
                  style={styles.skipRestBtn}
                  onPress={() => setIsResting(false)}
                >
                  <Text style={styles.skipRestText}>Skip</Text>
                </Pressable>
              </View>
            )}

            {/* Sets Checklist */}
            <Text style={styles.setsHeader}>Exercise Sets</Text>
            <View style={styles.setsList}>
              {Array.from({ length: currentEx.sets || 3 }).map((_, sIdx) => {
                const isChecked = !!completedSets[`${currentExIndex}_${sIdx}`];
                return (
                  <Pressable
                    key={sIdx}
                    style={[styles.setRow, isChecked && styles.setRowChecked]}
                    onPress={() => handleToggleSet(sIdx)}
                  >
                    <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                      {isChecked && <CheckCircle2 size={16} color="#000" />}
                    </View>
                    <Text style={[styles.setText, isChecked && styles.setTextChecked]}>
                      Set {sIdx + 1}
                    </Text>
                    <Text style={styles.setReps}>
                      {currentEx.reps || '10-12 reps'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Nav Controls */}
            <View style={styles.playerControls}>
              <Pressable
                style={[styles.prevBtn, currentExIndex === 0 && { opacity: 0.4 }]}
                onPress={handlePrevExercise}
                disabled={currentExIndex === 0}
              >
                <ChevronLeft size={18} color={Colors.textPrimary} />
                <Text style={styles.prevBtnText}>Previous</Text>
              </Pressable>

              <Pressable style={styles.nextBtn} onPress={handleNextExercise}>
                <Text style={styles.nextBtnText}>
                  {currentExIndex === exerciseList.length - 1
                    ? 'Finish Workout'
                    : 'Next Exercise'}
                </Text>
                <ChevronRight size={18} color="#000" />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* WORKOUT OVERVIEW VIEW */
        <ScrollView style={styles.overviewScroll} contentContainerStyle={styles.overviewContent}>
          <Image source={{ uri: workout.imageUrl }} style={styles.heroBanner} />

          <View style={styles.heroOverlay}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{workout.category}</Text>
            </View>
            <Text style={styles.workoutNameBig}>{workout.name}</Text>
            <Text style={styles.workoutDesc}>{workout.description}</Text>

            {/* Quick Stats */}
            <View style={styles.statsStrip}>
              <View style={styles.statCol}>
                <Clock size={16} color={Colors.primaryNeon} />
                <Text style={styles.statVal}>{workout.duration} mins</Text>
                <Text style={styles.statLbl}>Duration</Text>
              </View>
              <View style={styles.statCol}>
                <Flame size={16} color={Colors.accentAmber} />
                <Text style={styles.statVal}>{workout.calories} kcal</Text>
                <Text style={styles.statLbl}>Est. Burn</Text>
              </View>
              <View style={styles.statCol}>
                <Dumbbell size={16} color={Colors.secondaryCyan} />
                <Text style={styles.statVal}>{exerciseList.length}</Text>
                <Text style={styles.statLbl}>Exercises</Text>
              </View>
            </View>

            {/* Start Button */}
            <Pressable style={styles.startWorkoutCta} onPress={handleStartWorkout}>
              <Play size={20} color="#000" fill="#000" />
              <Text style={styles.startWorkoutCtaText}>Start Routine Now</Text>
            </Pressable>
          </View>

          {/* Exercise Breakdown List */}
          <Text style={styles.routineHeading}>Exercise Lineup</Text>
          <View style={{ gap: 10, marginBottom: 30 }}>
            {exerciseList.map((ex, i) => (
              <View key={i} style={styles.exListCard}>
                <View style={styles.exIndexCircle}>
                  <Text style={styles.exIndexText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exListName}>{ex.name}</Text>
                  <Text style={styles.exListMeta}>
                    {ex.sets} Sets • {ex.reps} • {ex.rest || 60}s Rest
                  </Text>
                </View>
                <View style={styles.muscleTag}>
                  <Text style={styles.muscleTagText}>{ex.targetMuscle || 'Target'}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* FINISHED MODAL */}
      <Modal visible={isFinished} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.finishedCard}>
            <View style={styles.finishedIconCircle}>
              <Sparkles size={36} color="#000" />
            </View>
            <Text style={styles.finishedTitle}>Workout Crushed!</Text>
            <Text style={styles.finishedSub}>
              You persevered through all {exerciseList.length} exercises.
            </Text>

            <View style={styles.finishedStatsStrip}>
              <View style={styles.finishedStat}>
                <Text style={styles.finishedStatVal}>
                  {Math.round(elapsedSeconds / 60)} mins
                </Text>
                <Text style={styles.finishedStatLbl}>Total Time</Text>
              </View>
              <View style={styles.finishedStat}>
                <Text style={styles.finishedStatVal}>
                  {workout.calories} kcal
                </Text>
                <Text style={styles.finishedStatLbl}>Est. Burned</Text>
              </View>
            </View>

            <Pressable
              style={styles.saveHistoryBtn}
              onPress={handleFinishAndSave}
              disabled={savingHistory}
            >
              <Text style={styles.saveHistoryBtnText}>
                {savingHistory ? 'Saving to Profile...' : 'Save to Workout Log'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDarkBase,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGlass,
    backgroundColor: 'rgba(13, 18, 34, 0.95)',
  },
  navBackIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    maxWidth: '60%',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerBadgeText: {
    color: Colors.primaryNeon,
    fontSize: 12,
    fontWeight: '700',
  },
  playerScroll: {
    flex: 1,
  },
  playerContent: {
    padding: 16,
    paddingBottom: 60,
  },
  exerciseStepHeader: {
    marginBottom: 16,
  },
  exerciseStepText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  trackBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: Colors.primaryNeon,
    borderRadius: 3,
  },
  activeExCard: {
    backgroundColor: Colors.bgDarkCard,
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    padding: 16,
  },
  exImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 14,
  },
  noExImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  activeExInfo: {
    marginBottom: 14,
  },
  activeExTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  activeExTarget: {
    fontSize: 12,
    color: Colors.secondaryCyan,
    fontWeight: '600',
    marginTop: 2,
  },
  restBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: Colors.accentAmber,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  restBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accentAmber,
  },
  restCountdown: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.accentAmber,
  },
  skipRestBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.accentAmber,
    borderRadius: 6,
  },
  skipRestText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
  setsHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  setsList: {
    gap: 8,
    marginBottom: 20,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 12,
  },
  setRowChecked: {
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
    borderColor: Colors.primaryNeon,
    borderWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primaryNeon,
    borderColor: Colors.primaryNeon,
  },
  setText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  setTextChecked: {
    color: Colors.primaryNeon,
  },
  setReps: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  playerControls: {
    flexDirection: 'row',
    gap: 12,
  },
  prevBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  prevBtnText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  nextBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.primaryNeon,
  },
  nextBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
  },
  overviewScroll: {
    flex: 1,
  },
  overviewContent: {
    paddingBottom: 60,
  },
  heroBanner: {
    width: '100%',
    height: 240,
  },
  heroOverlay: {
    padding: 16,
    backgroundColor: Colors.bgDarkBase,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCyan,
  },
  workoutNameBig: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  workoutDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.bgDarkCard,
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLbl: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  startWorkoutCta: {
    backgroundColor: Colors.primaryNeon,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  startWorkoutCtaText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
  routineHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  exListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgDarkCard,
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    gap: 12,
  },
  exIndexCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  exListName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  exListMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  muscleTag: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  muscleTagText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  finishedCard: {
    width: '100%',
    backgroundColor: Colors.bgDarkCard,
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  finishedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryNeon,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  finishedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  finishedSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
  },
  finishedStatsStrip: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  finishedStat: {
    alignItems: 'center',
  },
  finishedStatVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryNeon,
  },
  finishedStatLbl: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  saveHistoryBtn: {
    width: '100%',
    backgroundColor: Colors.primaryNeon,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveHistoryBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: Colors.bgDarkBase,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  notFoundSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  backBtn: {
    backgroundColor: Colors.primaryNeon,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  backBtnText: {
    color: '#000',
    fontWeight: '700',
  },
});
