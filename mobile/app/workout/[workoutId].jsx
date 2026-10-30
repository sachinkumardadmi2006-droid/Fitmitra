/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Image,
  AppState,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import {
  Clock,
  Flame,
  Dumbbell,
  Play,
  Pause,
  RotateCcw,
  X,
  Zap,
  Info,
  Check,
  Volume2,
  VolumeX,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Camera,
  Image as ImageIcon,
} from 'lucide-react-native';
import { useTranslation } from '../../utils/i18n';
import { resolveMediaUrl } from '../../utils/media';
import { ProgressBar } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeContext';
import { workoutService, normalizeTodayWorkout } from '../../services/workoutService';
import { queryKeys } from '../../constants/queryKeys';
import { emitDbUpdate } from '../../utils/events';
import { PointsCelebrationModal } from '../../components/modals/PointsCelebrationModal';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import AppHeader from '../../components/ui/AppHeader';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Skeleton } from '../../components/ui/Skeleton';

async function uploadProofPhotoToS3(uploadUrl, imageUri, mimeType = 'image/jpeg') {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45-second S3 timeout

  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
      },
      body: blob,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status ${uploadResponse.status}`);
    }
    return true;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function resolveExerciseVideo(ex) {
  if (!ex) return null;
  return ex.videoUrl || resolveMediaUrl(ex.videoKey || ex.video);
}

function resolveExerciseThumbnail(ex) {
  if (!ex) return null;
  return ex.thumbnailUrl || resolveMediaUrl(ex.thumbnailKey || ex.imageKey || ex.image);
}

function DualExerciseVideoArea({
  currentEx,
  nextEx,
  isResting,
  isPaused,
  theme,
  t,
}) {
  const { colors, radius } = theme;
  const currentVideo = useMemo(() => resolveExerciseVideo(currentEx), [currentEx]);
  const nextVideo = useMemo(() => resolveExerciseVideo(nextEx), [nextEx]);
  const thumbnail = useMemo(() => resolveExerciseThumbnail(currentEx), [currentEx]);

  const [activeSlot, setActiveSlot] = useState(0); // 0 -> playerA, 1 -> playerB
  const [isMuted, setIsMuted] = useState(true);
  const [isPlayingVideo, setIsPlayingVideo] = useState(true);
  const [statusA, setStatusA] = useState('idle');
  const [statusB, setStatusB] = useState('idle');
  const [showPoster, setShowPoster] = useState(true);

  const playerA = useVideoPlayer(currentVideo, (p) => {
    p.loop = true;
    p.muted = true;
  });

  const playerB = useVideoPlayer(nextVideo, (p) => {
    p.loop = true;
    p.muted = true;
  });

  const prevExIdRef = useRef(currentEx?.exerciseId || currentEx?._id);

  // Sync / Swap video on exercise change
  useEffect(() => {
    const curId = currentEx?.exerciseId || currentEx?._id;
    if (curId && curId !== prevExIdRef.current) {
      prevExIdRef.current = curId;
      setActiveSlot((prev) => {
        const nextSlot = prev === 0 ? 1 : 0;
        const nowActive = nextSlot === 0 ? playerA : playerB;
        const nowBg = nextSlot === 0 ? playerB : playerA;

        if (currentVideo) {
          nowActive.replace(currentVideo);
          nowActive.muted = isMuted;
          if (!isResting && !isPaused) {
            nowActive.play();
          }
        }
        if (nextVideo) {
          nowBg.replace(nextVideo);
          nowBg.muted = true;
          nowBg.pause();
        }
        return nextSlot;
      });
      setShowPoster(true);
    } else {
      const activeP = activeSlot === 0 ? playerA : playerB;
      const bgP = activeSlot === 0 ? playerB : playerA;
      if (currentVideo) {
        activeP.replace(currentVideo);
        activeP.muted = isMuted;
        if (!isResting && !isPaused) {
          activeP.play();
        }
      }
      if (nextVideo) {
        bgP.replace(nextVideo);
        bgP.muted = true;
        bgP.pause();
      }
    }
  }, [currentEx, nextEx, currentVideo, nextVideo, isResting, isPaused, isMuted, playerA, playerB, activeSlot]);

  // Listen to status changes on player A
  useEffect(() => {
    const sub = playerA.addListener('statusChange', (payload) => {
      setStatusA(payload.status);
      if (activeSlot === 0 && payload.status === 'readyToPlay') {
        setShowPoster(false);
      }
    });
    const playSub = playerA.addListener('playingChange', (payload) => {
      if (activeSlot === 0) setIsPlayingVideo(payload.isPlaying);
    });
    return () => {
      sub.remove();
      playSub.remove();
    };
  }, [playerA, activeSlot]);

  // Listen to status changes on player B
  useEffect(() => {
    const sub = playerB.addListener('statusChange', (payload) => {
      setStatusB(payload.status);
      if (activeSlot === 1 && payload.status === 'readyToPlay') {
        setShowPoster(false);
      }
    });
    const playSub = playerB.addListener('playingChange', (payload) => {
      if (activeSlot === 1) setIsPlayingVideo(payload.isPlaying);
    });
    return () => {
      sub.remove();
      playSub.remove();
    };
  }, [playerB, activeSlot]);

  // Handle rest timer or workout paused state
  useEffect(() => {
    const activeP = activeSlot === 0 ? playerA : playerB;
    if (isResting || isPaused) {
      activeP.pause();
    } else if (currentVideo && (activeSlot === 0 ? statusA : statusB) === 'readyToPlay') {
      activeP.play();
    }
  }, [isResting, isPaused, activeSlot, currentVideo, statusA, statusB, playerA, playerB]);

  // Pause on screen blur or background
  useFocusEffect(
    useCallback(() => {
      return () => {
        playerA.pause();
        playerB.pause();
      };
    }, [playerA, playerB])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        playerA.pause();
        playerB.pause();
      }
    });
    return () => sub.remove();
  }, [playerA, playerB]);

  const activeP = activeSlot === 0 ? playerA : playerB;
  const currentStatus = activeSlot === 0 ? statusA : statusB;

  const togglePlayPause = () => {
    if (activeP.playing) {
      activeP.pause();
      setIsPlayingVideo(false);
    } else {
      activeP.play();
      setIsPlayingVideo(true);
    }
  };

  const toggleMute = () => {
    const nextM = !isMuted;
    setIsMuted(nextM);
    activeP.muted = nextM;
  };

  const handleRetry = () => {
    setShowPoster(true);
    if (currentVideo) {
      activeP.replace(currentVideo);
      activeP.play();
    }
  };

  if (!currentVideo) {
    return (
      <View style={[styles.videoContainer, { backgroundColor: colors.surfaceVariant, borderRadius: radius.lg }]}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={[styles.videoPoster, { borderRadius: radius.lg }]} resizeMode="cover" />
        ) : (
          <View style={styles.noVideoPlaceholder}>
            <Dumbbell size={36} color={colors.onSurfaceVariant} />
            <Text style={[styles.noVideoText, { color: colors.onSurfaceVariant }]}>
              {t('workout.videoComingSoon')}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.videoContainer, { backgroundColor: '#000', borderRadius: radius.lg }]}>
      {/* Player A Slot */}
      <View style={[styles.videoSlot, { display: activeSlot === 0 ? 'flex' : 'none' }]}>
        <VideoView
          player={playerA}
          style={styles.fullVideo}
          contentFit="cover"
          nativeControls={false}
        />
      </View>

      {/* Player B Slot */}
      <View style={[styles.videoSlot, { display: activeSlot === 1 ? 'flex' : 'none' }]}>
        <VideoView
          player={playerB}
          style={styles.fullVideo}
          contentFit="cover"
          nativeControls={false}
        />
      </View>

      {/* Poster until ready */}
      {showPoster && thumbnail ? (
        <Image source={{ uri: thumbnail }} style={[styles.videoPoster, { borderRadius: radius.lg }]} resizeMode="cover" />
      ) : null}

      {/* Buffering Indicator */}
      {currentStatus === 'loading' && (
        <View style={[styles.videoOverlayCenter, { backgroundColor: colors.backdrop }]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {/* Video Unavailable Error Overlay */}
      {currentStatus === 'error' && (
        <View style={[styles.videoOverlayCenter, { backgroundColor: colors.backdrop }]}>
          <Text style={[styles.errorOverlayText, { color: colors.onSurface }]}>
            {t('workout.videoUnavailable')}
          </Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={handleRetry}
          >
            <RefreshCw size={14} color={colors.onPrimary} />
            <Text style={[styles.retryBtnText, { color: colors.onPrimary }]}>
              {t('workout.retry')}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Transparent Tap Overlay for play/pause */}
      <Pressable style={styles.tapOverlay} onPress={togglePlayPause} />

      {/* Mute / Unmute Button */}
      <Pressable
        style={[styles.muteBtn, { backgroundColor: colors.surface }]}
        onPress={toggleMute}
        hitSlop={8}
      >
        {isMuted ? (
          <VolumeX size={16} color={colors.onSurface} />
        ) : (
          <Volume2 size={16} color={colors.onSurface} />
        )}
      </Pressable>

      {/* Paused icon indicator */}
      {!isPlayingVideo && currentStatus === 'readyToPlay' && !isResting && (
        <View style={[styles.centerPlayBadge, { backgroundColor: colors.primary }]}>
          <Play size={18} color={colors.onPrimary} style={{ marginLeft: 2 }} />
        </View>
      )}
    </View>
  );
}

/**
 * ExercisePreviewPanel
 * Full-screen panel that shows exercise detail (video, instructions, muscles, equipment)
 * with "Complete Exercise" and "Next Exercise" buttons.
 */
function ExercisePreviewPanel({
  exercise,
  exerciseIndex,
  totalExercises,
  theme,
  t,
  onClose,
  onCompleteExercise,
  onNextExercise,
}) {
  const { colors, custom } = theme;
  const videoUrl = resolveExerciseVideo(exercise);
  const thumbnail = resolveExerciseThumbnail(exercise);
  const isLast = exerciseIndex === totalExercises - 1;

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useFocusEffect(
    useCallback(() => {
      if (videoUrl) player.play();
      return () => player.pause();
    }, [player, videoUrl])
  );

  return (
    <View style={[previewStyles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[previewStyles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <Pressable
          style={[previewStyles.closeBtn, { backgroundColor: colors.surfaceVariant }]}
          onPress={onClose}
          hitSlop={8}
        >
          <X size={18} color={colors.onSurface} />
        </Pressable>

        <View style={previewStyles.headerCenter}>
          <Text style={[previewStyles.headerTitle, { color: colors.onSurface }]}>
            {exercise.name}
          </Text>
          <Text style={[previewStyles.headerSub, { color: colors.onSurfaceVariant }]}>
            Exercise {exerciseIndex + 1} of {totalExercises}
          </Text>
        </View>

        <View style={previewStyles.headerRight} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={previewStyles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Video / Thumbnail Area */}
        <View style={[previewStyles.videoBox, { backgroundColor: '#000', borderRadius: custom.radius?.lg || 12 }]}>
          {videoUrl ? (
            <VideoView
              player={player}
              style={previewStyles.videoFull}
              contentFit="cover"
              nativeControls={false}
            />
          ) : thumbnail ? (
            <Image source={{ uri: thumbnail }} style={previewStyles.videoFull} resizeMode="cover" />
          ) : (
            <View style={previewStyles.noVideoBox}>
              <Dumbbell size={40} color={colors.onSurfaceVariant} />
              <Text style={[previewStyles.noVideoText, { color: colors.onSurfaceVariant }]}>
                🎬 Video Coming Soon
              </Text>
            </View>
          )}
        </View>

        {/* Sets / Reps / Rest Chips */}
        <View style={previewStyles.chipRow}>
          <View style={[previewStyles.chip, { backgroundColor: colors.primaryContainer }]}>
            <Dumbbell size={13} color={colors.onPrimaryContainer} />
            <Text style={[previewStyles.chipText, { color: colors.onPrimaryContainer }]}>
              {exercise.sets || 3} sets
            </Text>
          </View>
          <View style={[previewStyles.chip, { backgroundColor: colors.secondaryContainer }]}>
            <Zap size={13} color={colors.onSecondaryContainer} />
            <Text style={[previewStyles.chipText, { color: colors.onSecondaryContainer }]}>
              {exercise.reps || '10-12'} reps
            </Text>
          </View>
          <View style={[previewStyles.chip, { backgroundColor: colors.surfaceVariant }]}>
            <Clock size={13} color={colors.onSurfaceVariant} />
            <Text style={[previewStyles.chipText, { color: colors.onSurfaceVariant }]}>
              {exercise.restSec || 60}s rest
            </Text>
          </View>
        </View>

        {/* Muscle Groups */}
        {exercise.muscleGroups?.length > 0 && (
          <View style={previewStyles.section}>
            <Text style={[previewStyles.sectionTitle, { color: colors.onSurface }]}>Muscle Groups</Text>
            <View style={previewStyles.tagWrap}>
              {exercise.muscleGroups.map((mg, i) => (
                <View key={i} style={[previewStyles.muscleTag, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[previewStyles.muscleTagText, { color: colors.onSurfaceVariant }]}>{mg}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Equipment */}
        {exercise.equipment?.length > 0 && (
          <View style={previewStyles.section}>
            <Text style={[previewStyles.sectionTitle, { color: colors.onSurface }]}>Equipment</Text>
            <Text style={[previewStyles.bodyText, { color: colors.onSurfaceVariant }]}>
              {exercise.equipment.join(' · ')}
            </Text>
          </View>
        )}

        {/* Instructions */}
        {exercise.instructions?.length > 0 && (
          <View style={previewStyles.section}>
            <Text style={[previewStyles.sectionTitle, { color: colors.onSurface }]}>How To Perform</Text>
            {exercise.instructions.map((step, i) => (
              <View key={i} style={previewStyles.instructionRow}>
                <View style={[previewStyles.stepDot, { backgroundColor: colors.primary }]}>
                  <Text style={[previewStyles.stepDotText, { color: colors.onPrimary }]}>{i + 1}</Text>
                </View>
                <Text style={[previewStyles.instructionText, { color: colors.onSurfaceVariant }]}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Safety Notes */}
        {exercise.safetyNotes?.length > 0 && (
          <View style={previewStyles.section}>
            <Text style={[previewStyles.sectionTitle, { color: colors.onSurface }]}>Safety Notes</Text>
            {exercise.safetyNotes.map((note, i) => (
              <Text key={i} style={[previewStyles.bodyText, { color: colors.onSurfaceVariant }]}>⚠️ {note}</Text>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={[previewStyles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant }]}>
        <Pressable
          style={[previewStyles.completeBtn, { backgroundColor: colors.primaryContainer }]}
          onPress={onCompleteExercise}
        >
          <Check size={16} color={colors.onPrimaryContainer} />
          <Text style={[previewStyles.completeBtnText, { color: colors.onPrimaryContainer }]}>
            Complete Exercise
          </Text>
        </Pressable>

        {!isLast && (
          <Pressable
            style={[previewStyles.nextBtn, { backgroundColor: colors.primary }]}
            onPress={onNextExercise}
          >
            <Text style={[previewStyles.nextBtnText, { color: colors.onPrimary }]}>Next</Text>
            <ChevronRight size={16} color={colors.onPrimary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  root: { flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { fontSize: 15, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  headerRight: { width: 34 },
  scrollContent: { padding: 16 },
  videoBox: { width: '100%', aspectRatio: 16 / 9, overflow: 'hidden', marginBottom: 16 },
  videoFull: { width: '100%', height: '100%' },
  noVideoBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  noVideoText: { fontSize: 14, fontWeight: '600' },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  muscleTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  muscleTagText: { fontSize: 12, fontWeight: '600' },
  bodyText: { fontSize: 13, lineHeight: 20 },
  instructionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  stepDot: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  stepDotText: { fontSize: 11, fontWeight: '800' },
  instructionText: { flex: 1, fontSize: 13, lineHeight: 20 },
  bottomBar: {
    flexDirection: 'row', gap: 10, padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  completeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  completeBtnText: { fontSize: 14, fontWeight: '700' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12,
  },
  nextBtnText: { fontSize: 14, fontWeight: '700' },
});

export default function WorkoutDetailAndPlayerScreen() {
  const { workoutId, kind: rawKind } = useLocalSearchParams();
  const kind = rawKind || (workoutId === 'today' ? 'today' : 'session');
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const { t } = useTranslation();

  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [noProgram, setNoProgram] = useState(false);
  const [isInProgressSession, setIsInProgressSession] = useState(false);
  const [isCompletedSession, setIsCompletedSession] = useState(false);
  const [caloriesBurned, setCaloriesBurned] = useState(null);

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

  const queryClient = useQueryClient();
  const [proofPhotoUri, setProofPhotoUri] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showProofConfirm, setShowProofConfirm] = useState(false);

  // Exercise Detail Preview (pre-start tap-to-view)
  const [previewExIndex, setPreviewExIndex] = useState(null);

  // Dialogs
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  // Points celebration
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [newPointsBalance, setNewPointsBalance] = useState(null);

  const handlePickProofPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setProofPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('[WorkoutPlayer] Photo pick failed:', err?.message || err);
    }
  };

  const handleTakeProofPhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setProofPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('[WorkoutPlayer] Camera photo capture failed:', err?.message || err);
    }
  };

  // Load workout routine
  useEffect(() => {
    let isMounted = true;

    const fetchWorkout = async () => {
      setLoading(true);
      try {
        if (kind === 'today' || workoutId === 'today') {
          const todayRes = await workoutService.getTodayWorkout();
          if (todayRes && isMounted) {
            const norm = normalizeTodayWorkout(todayRes);
            if (!norm || norm.hasProgram === false) {
              setNoProgram(true);
              setLoading(false);
              return;
            }

            if (norm?.workout?.exercises?.length > 0) {
              setWorkout({
                id: norm.workout.id || 'today',
                title: norm.workout.title,
                programName: norm.workout.programName || 'Scheduled Routine',
                level: norm.workout.level || 'Beginner',
                estimatedMin: norm.workout.estimatedMin || 40,
                exercises: norm.workout.exercises,
                muscleGroups: norm.workout.muscleGroups || [],
                isRest: norm.isRest || false,
              });

              if (norm.session?.id) {
                setSessionId(norm.session.id);
              }

              if (norm.session?.status === 'in_progress') {
                setIsInProgressSession(true);
                if (norm.session.completedSetsMap) {
                  setCompletedSets(norm.session.completedSetsMap);
                }
                if (norm.session.durationSeconds) {
                  setElapsedSeconds(norm.session.durationSeconds);
                }
              }

              if (norm.session?.status === 'completed' || norm.hasCompletedToday) {
                setIsCompletedSession(true);
                if (norm.session?.durationSeconds) {
                  setElapsedSeconds(norm.session.durationSeconds);
                }
                if (norm.session?.caloriesEstimate) {
                  setCaloriesBurned(norm.session.caloriesEstimate);
                }
                if (norm.session?.completedSetsMap) {
                  setCompletedSets(norm.session.completedSetsMap);
                }
              }
            } else {
              setWorkout({
                id: 'today',
                title: norm?.workout?.title || (norm?.isRest ? 'Rest Day' : "Today's Workout"),
                programName: norm?.workout?.programName || 'Daily Routine',
                level: 'Beginner',
                estimatedMin: 0,
                exercises: [],
                isRest: norm?.isRest || false,
              });
            }
          }
          return;
        }

        if (kind === 'program') {
          const progRes = await workoutService.getProgram(workoutId);
          const prog = progRes?.data || progRes;
          if (prog && isMounted) {
            // Find today's day of week (1=Mon, 2=Tue, ..., 7=Sun)
            const todayDow = ((new Date().getDay() + 6) % 7) + 1;
            const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

            const isMatchingDay = (day) => {
              if (!day) return false;
              if (Number(day.dayOfWeek) === todayDow) return true;
              if (Number(day.dayNumber) === todayDow) return true;
              if (typeof day.dayOfWeek === 'string' && day.dayOfWeek.toLowerCase() === todayDayName) return true;
              if (typeof day.title === 'string' && day.title.toLowerCase().includes(todayDayName)) return true;
              return false;
            };

            let chosenRoutine = null;
            let chosenPlanName = prog.name;

            const plans = Array.isArray(prog.workoutPlans) ? prog.workoutPlans : (Array.isArray(prog.plans) ? prog.plans : []);
            if (plans.length > 0) {
              const plan = plans[0];
              const schedule = plan.schedule || [];
              chosenRoutine =
                schedule.find(isMatchingDay) ||
                schedule.find((s) => !s.isRest) ||
                schedule[0] ||
                {};
              chosenPlanName = plan.name || prog.name;
            } else {
              const weeks = prog.weeks || [];
              const allDays = weeks.flatMap((w) => w.days || []);
              chosenRoutine =
                allDays.find(isMatchingDay) ||
                allDays.find((d) => !d.isRest) ||
                prog.routines?.[0] ||
                {};
            }

            const rawExercises = chosenRoutine?.exercises || [];
            const exercises = rawExercises.map((ex, idx) => {
              const exDoc = (typeof ex.exerciseId === 'object' && ex.exerciseId !== null)
                ? ex.exerciseId
                : (typeof ex.exercise === 'object' && ex.exercise !== null)
                ? ex.exercise
                : {};

              const exId = String(
                exDoc._id ||
                exDoc.id ||
                (typeof ex.exerciseId === 'string' && ex.exerciseId) ||
                ex._id ||
                ex.id ||
                `ex_${idx}`
              );

              return {
                exerciseId: exId,
                name: exDoc.name || ex.name || 'Exercise',
                slug: exDoc.slug || ex.slug || '',
                sets: Number(ex.targetSets || ex.sets || 3),
                reps: String(ex.targetReps || ex.reps || '10-12'),
                restSec: Number(ex.restSeconds || ex.restSec || 60),
                instructions: Array.isArray(exDoc.instructions)
                  ? exDoc.instructions
                  : Array.isArray(ex.instructions)
                  ? ex.instructions
                  : [],
                muscleGroups: Array.isArray(exDoc.muscleGroups)
                  ? exDoc.muscleGroups
                  : Array.isArray(ex.muscleGroups)
                  ? ex.muscleGroups
                  : [],
                equipment: Array.isArray(exDoc.equipment)
                  ? exDoc.equipment
                  : Array.isArray(ex.equipment)
                  ? ex.equipment
                  : [],
                videoUrl: exDoc.videoUrl || ex.videoUrl || null,
                thumbnailUrl: exDoc.thumbnailUrl || ex.thumbnailUrl || null,
                difficulty: exDoc.difficulty || ex.difficulty || null,
                safetyNotes: Array.isArray(exDoc.safetyNotes)
                  ? exDoc.safetyNotes
                  : Array.isArray(ex.safetyNotes)
                  ? ex.safetyNotes
                  : [],
                notes: ex.notes || exDoc.notes || '',
              };
            });

            setWorkout({
              id: prog._id || prog.id || workoutId,
              title: chosenRoutine?.title || prog.name || 'Program Workout',
              programName: chosenPlanName,
              level: prog.level || 'Beginner',
              estimatedMin: Math.max(25, exercises.length * 8),
              description: prog.description,
              exercises,
              isRest: Boolean(chosenRoutine?.isRest || chosenRoutine?.restDay),
            });
          }
          return;
        }

        if (kind === 'session') {
          const sessionRes = await workoutService.getWorkoutById(workoutId);
          const sessionData = sessionRes?.data || sessionRes;
          if (sessionData && isMounted) {
            setSessionId(sessionData._id || sessionData.id || workoutId);
            setIsCompletedSession(true);
            setElapsedSeconds(sessionData.durationSeconds || 1800);
            setCaloriesBurned(sessionData.caloriesEstimate || null);

            const rawLogs = sessionData.exercises || sessionData.exerciseLogs || [];
            const mappedSets = {};

            const exercises = rawLogs.map((log, idx) => {
              const setsCount = Array.isArray(log.sets) ? log.sets.length : (log.targetSets || 3);
              for (let s = 0; s < setsCount; s++) {
                mappedSets[`${idx}_${s}`] = true;
              }

              return {
                exerciseId: String(log.exerciseId?._id || log.exerciseId || `ex_${idx}`),
                name: log.exerciseId?.name || log.name || 'Exercise',
                sets: setsCount,
                reps: log.sets?.[0]?.reps ? String(log.sets[0].reps) : (log.targetReps || '10-12'),
                restSec: log.restSeconds || 60,
                instructions: Array.isArray(log.exerciseId?.instructions) ? log.exerciseId.instructions : [],
                muscleGroups: Array.isArray(log.exerciseId?.muscleGroups) ? log.exerciseId.muscleGroups : (log.muscleGroups || []),
                videoUrl: log.exerciseId?.videoUrl || null,
                thumbnailUrl: log.exerciseId?.thumbnailUrl || null,
              };
            });

            setCompletedSets(mappedSets);
            setWorkout({
              id: sessionData._id || sessionData.id || workoutId,
              title: sessionData.title || 'Completed Session',
              programName: sessionData.title || 'Workout Session',
              level: 'Standard',
              estimatedMin: Math.round((sessionData.durationSeconds || 1800) / 60),
              exercises,
              isRest: sessionData.dayType === 'REST',
            });
          }
          return;
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
  }, [workoutId, kind]);

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
        setRestTimeLeft((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
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
    try {
      if (!sessionId) {
        const sessResult = await workoutService.ensureActiveSession({
          programDayId: workout?.id !== 'today' ? workout?.id : undefined,
          title: workout?.title || "Today's Workout",
        });
        if (sessResult?.sessionId) {
          setSessionId(sessResult.sessionId);
          setIsInProgressSession(true);
          emitDbUpdate();
        }
      }

      if (exerciseList.length > 0 && exerciseList[0]?.exerciseId) {
        router.push(
          `/workout/exercise/${exerciseList[0].exerciseId}?index=0&total=${exerciseList.length}`
        );
        return;
      }

      setIsPlaying(true);
      setIsPaused(false);
      setIsResting(false);
    } catch (err) {
      console.warn('[WorkoutSession] Session start error:', err?.message || err);
      // Fallback
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  // Helper to sync cumulative sets for an exercise to avoid set overwrite bugs
  const syncCumulativeSets = async (targetExIndex, targetEx, nextSetsMap) => {
    if (!sessionId || !targetEx?.exerciseId) return;
    try {
      const totalSets = Number(targetEx.sets || 3);
      const repsVal = parseInt(targetEx.reps, 10) || 10;
      const cumulativeSets = Array.from({ length: totalSets }).map((_, s) => ({
        setNumber: s + 1,
        reps: repsVal,
        completed: Boolean(nextSetsMap[`${targetExIndex}_${s}`]),
      }));

      await workoutService.logExercise(sessionId, {
        exerciseId: String(targetEx.exerciseId),
        sets: cumulativeSets,
      });
    } catch (err) {
      console.warn('[WorkoutSession] Failed to sync cumulative sets:', err?.message || err);
    }
  };

  // Toggle set completion and trigger rest
  const handleToggleSet = async (setIdx) => {
    const key = `${currentExIndex}_${setIdx}`;
    const nextCompleted = !completedSets[key];

    const nextCompletedSets = {
      ...completedSets,
      [key]: nextCompleted,
    };
    setCompletedSets(nextCompletedSets);

    if (nextCompleted) {
      // Trigger rest timer
      const restPeriod = currentEx?.restSec || 60;
      setInitialRestDuration(restPeriod);
      setRestTimeLeft(restPeriod);
      setIsResting(true);
    }

    // Always log cumulative sets for this exercise to prevent set overwrite bugs
    await syncCumulativeSets(currentExIndex, currentEx, nextCompletedSets);
  };

  const handleSkipRest = () => {
    setIsResting(false);
  };

  const handleAddRestTime = () => {
    setRestTimeLeft((prev) => prev + 30);
  };

  const handleNextExercise = async () => {
    setIsResting(false);
    await syncCumulativeSets(currentExIndex, currentEx, completedSets);
    if (currentExIndex < exerciseList.length - 1) {
      setCurrentExIndex(currentExIndex + 1);
    } else {
      checkBeforeFinish();
    }
  };

  const handlePrevExercise = async () => {
    setIsResting(false);
    await syncCumulativeSets(currentExIndex, currentEx, completedSets);
    if (currentExIndex > 0) {
      setCurrentExIndex(currentExIndex - 1);
    }
  };

  const checkBeforeFinish = async () => {
    await syncCumulativeSets(currentExIndex, currentEx, completedSets);
    setShowProofConfirm(true);
  };

  const executeFinishWorkout = async () => {
    setShowProofConfirm(false);
    setShowFinishConfirm(false);
    setSavingSession(true);

    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    let pointsEarned = 5;
    let newBalance = null;

    if (sessionId) {
      try {
        let photoKey = null;
        if (proofPhotoUri) {
          try {
            setUploadingProof(true);
            const uploadMeta = await workoutService.getProofUploadUrl(sessionId, {
              fileName: 'proof.jpg',
              mimeType: 'image/jpeg',
            });
            const { uploadUrl, photoKey: pKey } = uploadMeta?.data || uploadMeta || {};
            if (uploadUrl && pKey) {
              await uploadProofPhotoToS3(uploadUrl, proofPhotoUri, 'image/jpeg');
              photoKey = pKey;
            }
          } catch (uploadErr) {
            console.warn('[WorkoutSession] Proof photo upload failed or timed out (45s), completing without photo:', uploadErr?.message || uploadErr);
          } finally {
            setUploadingProof(false);
          }
        }

        const res = await workoutService.completeWorkout(sessionId, {
          durationSeconds: elapsedSeconds,
          caloriesEstimate: Math.max(50, Math.round(minutes * 7.5)),
          photoKey: photoKey || undefined,
        });

        const resData = res?.data || res;
        if (resData?.points) {
          pointsEarned = resData.points.pointsAdded ?? resData.points.pointsEarned ?? 5;
          newBalance = resData.points.newBalance ?? null;
        }

        setIsCompletedSession(true);
        setIsInProgressSession(false);

        // Invalidate queries for home dashboard, today workout, and profile
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
          queryClient.invalidateQueries({ queryKey: queryKeys.todayWorkout }),
          queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
        ]);

        emitDbUpdate();
      } catch (err) {
        console.warn('[WorkoutSession] Completion error:', err?.message || err);
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
    setIsInProgressSession(true);
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

  // 2. No Program Assigned View
  if (noProgram) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title="Workout Plan" onBack={() => router.back()} />
        <View style={styles.centerWrap}>
          <EmptyState
            icon="dumbbell"
            title="No Active Workout Plan"
            description="You don't have an active fitness program assigned yet. Choose a structured program to unlock daily routines."
            actionLabel="Explore Programs"
            onAction={() => router.replace('/(tabs)/workouts')}
          />
        </View>
      </View>
    );
  }

  // 3. No exercises configured for this workout day
  if (!workout || (exerciseList.length === 0 && !workout.isRest)) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title="Workout" onBack={() => router.back()} />
        <View style={styles.centerWrap}>
          <EmptyState
            icon="dumbbell"
            title="No Exercises Configured"
            description="No exercises are configured for this routine yet. Explore available workout plans to choose a complete routine."
            actionLabel="Explore Workout Plans"
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
            {/* 16:9 Video Area with Alternating Players */}
            <DualExerciseVideoArea
              currentEx={currentEx}
              nextEx={exerciseList[currentExIndex + 1] || null}
              isResting={isResting}
              isPaused={isPaused}
              theme={theme}
              t={t}
            />

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
          onConfirm={() => {
            setShowFinishConfirm(false);
            setShowProofConfirm(true);
          }}
          onCancel={() => setShowFinishConfirm(false)}
        />

        {/* Workout Finish & Proof Photo Modal */}
        <Modal
          visible={showProofConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => !savingSession && !uploadingProof && setShowProofConfirm(false)}
        >
          <View style={finishModalStyles.backdrop}>
            <View
              style={[
                finishModalStyles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <Text style={[finishModalStyles.title, { color: colors.onSurface }]}>
                Finish Workout
              </Text>
              <Text style={[finishModalStyles.subtitle, { color: colors.onSurfaceVariant }]}>
                Attach an optional workout proof photo to verify your session and claim reward points.
              </Text>

              {proofPhotoUri ? (
                <View style={finishModalStyles.previewContainer}>
                  <Image source={{ uri: proofPhotoUri }} style={finishModalStyles.previewImage} resizeMode="cover" />
                  <Pressable
                    style={[finishModalStyles.removePhotoBtn, { backgroundColor: colors.errorContainer }]}
                    onPress={() => setProofPhotoUri(null)}
                    hitSlop={8}
                  >
                    <X size={16} color={colors.onErrorContainer} />
                  </Pressable>
                </View>
              ) : (
                <View style={finishModalStyles.photoActionRow}>
                  <Pressable
                    style={[finishModalStyles.photoBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}
                    onPress={handleTakeProofPhoto}
                  >
                    <Camera size={20} color={colors.primary} />
                    <Text style={[finishModalStyles.photoBtnText, { color: colors.onSurface }]}>Camera</Text>
                  </Pressable>

                  <Pressable
                    style={[finishModalStyles.photoBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}
                    onPress={handlePickProofPhoto}
                  >
                    <ImageIcon size={20} color={colors.primary} />
                    <Text style={[finishModalStyles.photoBtnText, { color: colors.onSurface }]}>Gallery</Text>
                  </Pressable>
                </View>
              )}

              <View style={finishModalStyles.actionCol}>
                <AppButton
                  tone="primary"
                  label={uploadingProof ? 'Uploading Proof...' : savingSession ? 'Recording Workout...' : 'Finish & Claim Reward'}
                  icon="check"
                  loading={savingSession || uploadingProof}
                  onPress={executeFinishWorkout}
                />
                <AppButton
                  mode="text"
                  label="Keep Working Out"
                  disabled={savingSession || uploadingProof}
                  onPress={() => setShowProofConfirm(false)}
                  style={{ marginTop: 8 }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Points Celebration Modal */}
        <PointsCelebrationModal
          visible={showPointsModal}
          pointsEarned={earnedPoints}
          pointsAdded={earnedPoints}
          totalPoints={newPointsBalance}
          newBalance={newPointsBalance}
          onClose={handlePointsModalClose}
        />
      </View>
    );
  }

  // 5. WORKOUT DETAILS (Pre-Workout Preview & Completed Review View)
  const isRest = Boolean(workout.isRest);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader
        title={isCompletedSession ? 'Completed Routine' : isRest ? 'Rest & Recovery' : "Today's Routine"}
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.detailScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <AppCard
          variant="elevated"
          style={[
            styles.heroDetailCard,
            isCompletedSession ? { borderColor: colors.primary, borderWidth: 1 } : null,
          ]}
        >
          <View style={styles.heroTopRow}>
            {isCompletedSession ? (
              <View style={[styles.levelTag, { backgroundColor: colors.primaryContainer }]}>
                <Check size={13} color={colors.onPrimaryContainer} style={{ marginRight: 4 }} />
                <Text style={[styles.levelTagText, { color: colors.onPrimaryContainer }]}>
                  COMPLETED TODAY
                </Text>
              </View>
            ) : isRest ? (
              <View style={[styles.levelTag, { backgroundColor: colors.surfaceVariant }]}>
                <Sparkles size={13} color={colors.onSurfaceVariant} style={{ marginRight: 4 }} />
                <Text style={[styles.levelTagText, { color: colors.onSurfaceVariant }]}>
                  REST & RECOVERY
                </Text>
              </View>
            ) : isInProgressSession ? (
              <View style={[styles.levelTag, { backgroundColor: colors.errorContainer }]}>
                <RotateCcw size={13} color={colors.onErrorContainer} style={{ marginRight: 4 }} />
                <Text style={[styles.levelTagText, { color: colors.onErrorContainer }]}>
                  SESSION IN PROGRESS
                </Text>
              </View>
            ) : (
              <View style={[styles.levelTag, { backgroundColor: colors.primaryContainer }]}>
                <Text style={[styles.levelTagText, { color: colors.onPrimaryContainer }]}>
                  {(workout.level || 'Standard').toUpperCase()}
                </Text>
              </View>
            )}

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
            {isCompletedSession
              ? "Awesome work! You logged and finished today's training routine."
              : isRest
              ? 'Active recovery allows muscle fibers to rebuild stronger. Drink water, maintain your protein intake, and rest.'
              : workout.description ||
                (workout.programName
                  ? `Structured routine from the ${workout.programName} program.`
                  : 'Complete all exercises in order to maximize muscular stimulation and cardiovascular fitness.')}
          </Text>

          {/* Metrics summary row */}
          {!isRest && (
            <View style={[styles.metricsRow, { borderColor: colors.outlineVariant }]}>
              <View style={styles.metricItem}>
                <Clock size={16} color={colors.primary} />
                <Text style={[styles.metricVal, { color: colors.onSurface }]}>
                  {isCompletedSession && elapsedSeconds > 0
                    ? `${Math.max(1, Math.round(elapsedSeconds / 60))}m logged`
                    : `~${workout.estimatedMin} mins`}
                </Text>
                <Text style={[styles.metricLbl, { color: colors.onSurfaceVariant }]}>
                  {isCompletedSession ? 'Duration' : 'Est. Duration'}
                </Text>
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
                  {caloriesBurned ? `${caloriesBurned} kcal` : `~${Math.round(workout.estimatedMin * 7.5)} kcal`}
                </Text>
                <Text style={[styles.metricLbl, { color: colors.onSurfaceVariant }]}>
                  {isCompletedSession ? 'Burned' : 'Burn Est.'}
                </Text>
              </View>
            </View>
          )}
        </AppCard>

        {/* Exercises Section */}
        {!isRest && exerciseList.length > 0 && (
          <>
            <SectionHeader
              title={`Today's Exercises (${exerciseList.length})`}
              style={{ marginTop: 20, marginBottom: 8 }}
            />

            {exerciseList.map((ex, index) => {
              const setsCount = Number(ex.sets || 3);
              const repsStr = ex.reps || '10-12';
              const restVal = ex.restSec || 60;
              const hasVideo = Boolean(ex.videoUrl);

              const exerciseRawId = typeof ex.exerciseId === 'object' ? (ex.exerciseId?._id || '') : (ex.exerciseId || ex._id || '');
              const exerciseKey = `workout-ex-${exerciseRawId || 'item'}-${index}`;
              const targetExerciseId = typeof ex.exerciseId === 'object' ? (ex.exerciseId?._id || ex.exerciseId) : (ex.exerciseId || ex._id);

              return (
                <AppCard
                  key={exerciseKey}
                  variant="outlined"
                  style={styles.exerciseCard}
                  onPress={() =>
                    router.push(
                      `/workout/exercise/${targetExerciseId}?index=${index}&total=${exerciseList.length}`
                    )
                  }
                >
                  <View style={styles.exerciseCardRow}>
                    {/* Step Index Number */}
                    <View
                      style={[
                        styles.stepBadge,
                        isCompletedSession
                          ? { backgroundColor: colors.primaryContainer }
                          : { backgroundColor: colors.surfaceVariant },
                      ]}
                    >
                      {isCompletedSession ? (
                        <Check size={14} color={colors.onPrimaryContainer} />
                      ) : (
                        <Text style={[styles.stepBadgeText, { color: colors.onSurface }]}>
                          {index + 1}
                        </Text>
                      )}
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

                      {ex.muscleGroups?.length > 0 && (
                        <Text style={[styles.exerciseCardSub, { color: colors.primary, marginTop: 2 }]}>
                          {ex.muscleGroups.slice(0, 2).join(' • ')}
                        </Text>
                      )}
                    </View>

                    <View style={styles.exCardChevron}>
                      {hasVideo ? (
                        <Play size={14} color={colors.primary} />
                      ) : (
                        <Info size={14} color={colors.onSurfaceVariant} />
                      )}
                    </View>
                  </View>
                </AppCard>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Floating Sticky Bottom Action Button */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.outlineVariant,
          },
        ]}
      >
        {isCompletedSession ? (
          <AppButton
            mode="outlined"
            label="Back to Workouts"
            icon="arrow-left"
            onPress={() => router.replace('/(tabs)/workouts')}
          />
        ) : isRest ? (
          <AppButton
            mode="outlined"
            label="Browse All Programs"
            icon="compass"
            onPress={() => router.replace('/(tabs)/workouts')}
          />
        ) : isInProgressSession ? (
          <AppButton
            tone="primary"
            label="Resume Workout"
            icon="play"
            onPress={handleStartWorkout}
          />
        ) : (
          <AppButton
            tone="primary"
            label="Start Workout"
            icon="play"
            onPress={handleStartWorkout}
          />
        )}
      </View>

      {/* Points Celebration Modal */}
      <PointsCelebrationModal
        visible={showPointsModal}
        pointsEarned={earnedPoints}
        pointsAdded={earnedPoints}
        totalPoints={newPointsBalance}
        newBalance={newPointsBalance}
        onClose={handlePointsModalClose}
      />

      {/* Exercise Detail Preview Overlay */}
      {previewExIndex !== null && exerciseList[previewExIndex] && (
        <ExercisePreviewPanel
          exercise={exerciseList[previewExIndex]}
          exerciseIndex={previewExIndex}
          totalExercises={exerciseList.length}
          theme={theme}
          t={t}
          onClose={() => setPreviewExIndex(null)}
          onCompleteExercise={() => {
            // Start workout if not started, mark first set done, close preview
            if (!isPlaying) {
              handleStartWorkout();
            }
            handleToggleSet(0);
            setPreviewExIndex(null);
          }}
          onNextExercise={() => {
            const next = previewExIndex + 1;
            if (next < exerciseList.length) {
              setPreviewExIndex(next);
            } else {
              setPreviewExIndex(null);
            }
          }}
        />
      )}
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
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 14,
  },
  videoSlot: {
    ...StyleSheet.absoluteFillObject,
  },
  fullVideo: {
    width: '100%',
    height: '100%',
  },
  videoPoster: {
    ...StyleSheet.absoluteFillObject,
  },
  noVideoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  noVideoText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  videoOverlayCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 5,
  },
  errorOverlayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  muteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 3,
  },
  centerPlayBadge: {
    position: 'absolute',
    alignSelf: 'center',
    top: '38%',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
    elevation: 4,
  },
});

const finishModalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  previewContainer: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 18,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 18,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  photoBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionCol: {
    width: '100%',
  },
});

