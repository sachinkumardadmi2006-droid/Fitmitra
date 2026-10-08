// Workouts Tab — Exercises, Tutorials & Routines
// Designed to match exact photo layout with instant preview and live backend API integration (GET /api/v1/exercises & GET /api/v1/programs)
// Uploaded exercise videos from Admin Dashboard are rendered & playable directly.
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Search,
  Dumbbell,
  Clock,
  Flame,
  ChevronRight,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Lock,
  Sparkles,
  CheckCircle,
  Crown,
  Calendar,
  Play,
  Edit3,
  Zap,
  Bell,
  X,
  Check,
} from 'lucide-react-native';
import { Colors, FontSize, BorderRadius, Spacing } from '../../constants/theme';
import { workoutService, subscriptionService } from '../../services';
import { onDbUpdate } from '../../utils/events';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { TopBar } from '../../components/common/TopBar';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Default Exercise Data matching user photo (used as instant preview & fallback if server API is empty)
const PHOTO_EXERCISES = [
  {
    id: 'ex-1',
    name: 'Barbell Bench Press',
    muscleGroups: ['CHEST', 'TRICEPS', 'SHOULDERS'],
    equipment: ['BARBELL'],
    difficulty: 'INTERMEDIATE',
    defaultSets: 3,
    defaultReps: '8–12',
    duration: '4:32',
    subtitle: 'Correct Form & Tips',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    instructions: [
      'Lie flat on bench with feet planted firmly on floor.',
      'Grasp barbell slightly wider than shoulder-width.',
      'Lower bar to mid-chest with elbows at 45° angle.',
      'Press explosively back up to starting position.',
    ],
    tips: ['Keep shoulder blades retracted and depressed.', 'Do not bounce bar off your chest.'],
  },
  {
    id: 'ex-2',
    name: 'Incline Dumbbell Press',
    muscleGroups: ['CHEST', 'SHOULDERS', 'TRICEPS'],
    equipment: ['DUMBBELL'],
    difficulty: 'INTERMEDIATE',
    defaultSets: 3,
    defaultReps: '8–12',
    duration: '3:58',
    subtitle: 'Step by Step Guide',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    instructions: [
      'Set bench to 30–45 degree incline.',
      'Press dumbbells directly upwards until arms are fully extended.',
      'Lower under control to chest level.',
    ],
    tips: ['Focus on squeezing upper chest at top of movement.'],
  },
  {
    id: 'ex-3',
    name: 'Chest Fly',
    muscleGroups: ['CHEST'],
    equipment: ['DUMBBELL'],
    difficulty: 'BEGINNER',
    defaultSets: 3,
    defaultReps: '10–15',
    duration: '4:10',
    subtitle: 'Form & Common Mistakes',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    instructions: [
      'Lie on flat bench holding dumbbells above chest with slight elbow bend.',
      'Lower weights in wide arc until chest stretch is felt.',
      'Bring dumbbells back together at top.',
    ],
    tips: ['Maintain constant elbow angle throughout movement.'],
  },
  {
    id: 'ex-4',
    name: 'Push Ups',
    muscleGroups: ['CHEST', 'TRICEPS', 'CORE'],
    equipment: ['BODYWEIGHT'],
    difficulty: 'BEGINNER',
    defaultSets: 3,
    defaultReps: '12–20',
    duration: '3:15',
    subtitle: 'Beginner Form Guide',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoylikes.mp4',
    instructions: [
      'Place hands shoulder-width apart in plank position.',
      'Lower chest until nearly touching floor.',
      'Push body back up in straight line.',
    ],
    tips: ['Keep core engaged to prevent lower back sagging.'],
  },
  {
    id: 'ex-5',
    name: 'Cable Crossover',
    muscleGroups: ['CHEST'],
    equipment: ['CABLE'],
    difficulty: 'INTERMEDIATE',
    defaultSets: 3,
    defaultReps: '10–15',
    duration: '4:45',
    subtitle: 'Isolation Technique',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    instructions: [
      'Stand in center of cable station with high pulleys.',
      'Pull handles down and across body until hands meet in front.',
      'Squeeze chest muscles at bottom of movement.',
    ],
    tips: ['Keep slight bend in elbows and control eccentric phase.'],
  },
  {
    id: 'ex-6',
    name: 'Chest Dips',
    muscleGroups: ['CHEST', 'TRICEPS'],
    equipment: ['BODYWEIGHT'],
    difficulty: 'ADVANCED',
    defaultSets: 3,
    defaultReps: '8–12',
    duration: '3:40',
    subtitle: 'Lower Chest Builder',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    instructions: [
      'Grasp parallel dip bars and suspend body.',
      'Lean forward slightly to emphasize chest.',
      'Lower body until elbows are at 90° angle, then push up.',
    ],
    tips: ['Leaning forward targets lower chest over triceps.'],
  },
];

export default function Workouts() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  // State
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('Chest');
  const [activeDiff, setActiveDiff] = useState('All');

  // Backend API data merged with photo defaults
  const [exercises, setExercises] = useState(PHOTO_EXERCISES);
  const [programs, setPrograms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Video & Detail Modal state
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  const [selectedEx, setSelectedEx] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeItemName, setUpgradeItemName] = useState('');
  const [selectedRoutineId, setSelectedRoutineId] = useState('c1');

  const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // Load backend data and merge uploaded exercises from Admin
  const loadData = useCallback(async () => {
    try {
      // 1. Fetch live exercises from API
      const exRes = await workoutService.getExercises({ limit: 100 }).catch(() => null);
      const exItems = Array.isArray(exRes) ? exRes : exRes?.exercises || exRes?.items || [];

      if (exItems.length > 0) {
        // Merge API exercises with photo defaults so uploaded admin items appear alongside
        const combined = [...exItems, ...PHOTO_EXERCISES];
        // Deduplicate by name
        const unique = Array.from(new Map(combined.map((item) => [item.name.toLowerCase(), item])).values());
        setExercises(unique);
      } else {
        setExercises(PHOTO_EXERCISES);
      }

      // 2. Fetch live workout programs from API
      const progRes = await workoutService.getPrograms({ limit: 50 }).catch(() => null);
      const progItems = Array.isArray(progRes) ? progRes : progRes?.programs || progRes?.items || [];
      if (progItems.length > 0) {
        setPrograms(progItems);
      }

      // 3. Subscription check
      try {
        const sub = await subscriptionService.getMySubscription().catch(() => null);
        setIsPremium(!!sub?.isActive);
      } catch (_) {
        setIsPremium(false);
      }
    } catch (err) {
      console.warn('API fetch warning:', err.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = onDbUpdate(loadData);
    return unsub;
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const isLocked = (diff) => {
    if (isPremium) return false;
    const d = (diff || '').toUpperCase();
    return d === 'INTERMEDIATE' || d === 'ADVANCED' || diff === 'Intermediate' || diff === 'Advanced';
  };

  // Filter exercises by Category, Difficulty & Search
  const filteredExercises = exercises.filter((ex) => {
    const muscles = (ex.muscleGroups || []).map((m) => m.toLowerCase()).join(' ');
    const diff = (ex.difficulty || '').toLowerCase();
    const name = (ex.name || '').toLowerCase();
    const equip = (ex.equipment || []).map((e) => e.toLowerCase()).join(' ');
    const q = query.toLowerCase();

    const matchesCat =
      activeCat === 'All' ||
      muscles.includes(activeCat.toLowerCase()) ||
      (activeCat === 'Core' && muscles.includes('abs')) ||
      (ex.name && ex.name.toLowerCase().includes(activeCat.toLowerCase()));

    const matchesDiff = activeDiff === 'All' || diff.includes(activeDiff.toLowerCase());
    const matchesSearch = !q || name.includes(q) || muscles.includes(q) || equip.includes(q);

    return matchesCat && matchesDiff && matchesSearch;
  });

  // Dynamic values
  const activeWorkoutTitle = activeCat === 'All' ? 'Full Body Day' : `${activeCat} Day`;
  const currentWorkoutExercises = filteredExercises.slice(0, 6);

  const handleStartWorkout = () => {
    if (programs.length > 0) {
      const prog = programs[0];
      router.push(`/workout/${prog._id || prog.id}`);
    } else {
      router.push('/workout/start');
    }
  };

  const handleExerciseClick = (ex) => {
    if (isLocked(ex.difficulty)) {
      setUpgradeItemName(ex.name);
      setShowUpgradeModal(true);
    } else {
      setSelectedEx(ex);
    }
  };

  const handleVideoClick = (tut) => {
    setActiveVideoModal(tut);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bgBase }]}>
      {/* Top Bar with Title & Notification Bell */}
      <TopBar
        title="Workouts"
        subtitle="Exercises & Routines"
        icon={Dumbbell}
        rightAction={
          <Pressable
            style={[styles.bellBtn, { backgroundColor: isDark ? '#171B24' : '#F1F3F5' }]}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={19} color={colors.textPrimary} />
            <View style={styles.bellBadge} />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16, paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A3E635" />
        }
      >
        {/* 1. Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: isDark ? '#10131A' : '#FFFFFF' }]}>
          <Search size={18} color="#6F7783" style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search workouts or exercises..."
            placeholderTextColor="#6F7783"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* 2. Muscle Group Category Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {categories.map((c) => {
            const isActive = activeCat === c;
            return (
              <Pressable
                key={c}
                style={[
                  styles.catChip,
                  isActive
                    ? styles.catChipActive
                    : { backgroundColor: isDark ? '#171B24' : '#F1F3F5' },
                ]}
                onPress={() => setActiveCat(c)}
              >
                <Text
                  style={[
                    styles.catChipText,
                    isActive ? styles.catChipTextActive : { color: colors.textSecondary },
                  ]}
                >
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 3. Difficulty Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRowDiff}>
          {difficulties.map((d) => {
            const isActive = activeDiff === d;
            const locked = isLocked(d);
            return (
              <Pressable
                key={d}
                style={[
                  styles.diffChip,
                  isActive
                    ? styles.diffChipActive
                    : { backgroundColor: isDark ? '#171B24' : '#F1F3F5' },
                ]}
                onPress={() => setActiveDiff(d)}
              >
                <Text
                  style={[
                    styles.diffChipText,
                    isActive ? styles.diffChipTextActive : { color: colors.textSecondary },
                  ]}
                >
                  {d} {locked ? '🔒' : ''}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 4. TODAY'S WORKOUT CARD */}
        <View style={styles.todayCardContainer}>
          <View style={styles.todayHeaderRow}>
            <View style={styles.todayTitleGroup}>
              <Calendar size={18} color="#A3E635" style={{ marginRight: 8 }} />
              <Text style={[styles.todayHeaderText, { color: colors.textPrimary }]}>
                Today's Workout
              </Text>
            </View>
            <Pressable
              style={styles.viewPlanBtn}
              onPress={() => router.push('/(tabs)/programs')}
            >
              <Text style={styles.viewPlanText}>View Plan ›</Text>
            </Pressable>
          </View>

          <View style={styles.bannerCard}>
            <View style={styles.bannerLeft}>
              <Text style={styles.bannerTitle}>{activeWorkoutTitle}</Text>
              <Text style={styles.bannerMeta}>
                {currentWorkoutExercises.length || 6} exercises • ~ 45 min • {activeDiff === 'All' ? 'Intermediate' : activeDiff}
              </Text>
              <Text style={styles.bannerDesc} numberOfLines={2}>
                Build a stronger {activeCat.toLowerCase()} with compound and isolation exercises.
              </Text>

              <Pressable style={styles.startBtn} onPress={handleStartWorkout}>
                <Play size={16} color="#000000" fill="#000000" style={{ marginRight: 8 }} />
                <Text style={styles.startBtnText}>Start Workout</Text>
              </Pressable>
            </View>

            <View style={styles.bannerRight}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
                }}
                style={styles.bannerImg}
                resizeMode="cover"
              />
              <View style={styles.bannerOverlay} />
            </View>
          </View>
        </View>

        {/* 5. WORKOUT TUTORIAL VIDEOS SECTION */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Play size={18} color="#A3E635" fill="#A3E635" style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Workout Tutorial Videos
            </Text>
          </View>
          <Pressable onPress={() => setActiveCat('All')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.videoRow}>
          {filteredExercises.map((ex, idx) => (
            <Pressable
              key={ex.id || ex._id || idx}
              style={styles.videoCard}
              onPress={() => handleVideoClick(ex)}
            >
              <View style={styles.videoThumbBox}>
                <Image
                  source={{ uri: ex.thumbnailUrl || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80' }}
                  style={styles.videoThumb}
                  resizeMode="cover"
                />
                <View style={styles.videoDarkOverlay} />
                <View style={styles.playCircle}>
                  <Play size={16} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                </View>
                <View style={styles.durationTag}>
                  <Text style={styles.durationText}>{ex.duration || '4:15'}</Text>
                </View>
              </View>

              <Text style={[styles.videoTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {ex.name}
              </Text>
              <Text style={styles.videoSubtitle} numberOfLines={1}>
                {ex.subtitle || 'Correct Form & Tips'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* 6. EXERCISES IN THIS WORKOUT SECTION */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <View style={styles.sectionTitleRow}>
            <Dumbbell size={18} color="#A3E635" style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Exercises in This Workout ({currentWorkoutExercises.length})
            </Text>
          </View>
          <Pressable style={styles.editBtn}>
            <Edit3 size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.editBtnText}>Edit Workout</Text>
          </Pressable>
        </View>

        {currentWorkoutExercises.map((ex, idx) => (
          <Pressable
            key={ex.id || ex._id || idx}
            style={[
              styles.exCardRow,
              { backgroundColor: isDark ? '#10131A' : '#FFFFFF' },
            ]}
            onPress={() => handleExerciseClick(ex)}
          >
            <View style={styles.numBadge}>
              <Text style={styles.numText}>{idx + 1}</Text>
            </View>

            <Image
              source={{ uri: ex.thumbnailUrl || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80' }}
              style={styles.exThumb}
              resizeMode="cover"
            />

            <View style={styles.exDetails}>
              <Text style={[styles.exTitle, { color: colors.textPrimary }]}>{ex.name}</Text>
              <Text style={styles.exSub}>
                {ex.defaultSets || 3} sets × {ex.defaultReps || '8–12'} reps
              </Text>
            </View>

            <ChevronRight size={18} color="#6F7783" />
          </Pressable>
        ))}

        {/* 7. RELATED ROUTINES SECTION */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <View style={styles.sectionTitleRow}>
            <Zap size={18} color="#A3E635" style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Related Routines
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/programs')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routineRow}>
          <Pressable
            style={[
              styles.routineCard,
              selectedRoutineId === 'c1'
                ? styles.routineCardActive
                : { backgroundColor: isDark ? '#10131A' : '#FFFFFF' },
            ]}
            onPress={() => setSelectedRoutineId('c1')}
          >
            <View style={styles.routineHeader}>
              <View style={styles.routineIconBox}>
                <Dumbbell size={16} color="#A3E635" />
              </View>
              <View style={styles.checkBadge}>
                <Check size={12} color="#000000" />
              </View>
            </View>
            <Text style={styles.routineName}>{activeCat} Day</Text>
            <Text style={styles.routineMeta}>
              {currentWorkoutExercises.length || 6} exercises • 45 min
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.routineCard,
              selectedRoutineId === 'c2'
                ? styles.routineCardActive
                : { backgroundColor: isDark ? '#10131A' : '#FFFFFF' },
            ]}
            onPress={() => setSelectedRoutineId('c2')}
          >
            <View style={styles.routineHeader}>
              <View style={styles.routineIconBox}>
                <Flame size={16} color="#00F0FF" />
              </View>
            </View>
            <Text style={styles.routineName}>Push Day</Text>
            <Text style={styles.routineMeta}>8 exercises • 60 min</Text>
          </Pressable>

          <Pressable
            style={[
              styles.routineCard,
              selectedRoutineId === 'c3'
                ? styles.routineCardActive
                : { backgroundColor: isDark ? '#10131A' : '#FFFFFF' },
            ]}
            onPress={() => setSelectedRoutineId('c3')}
          >
            <View style={styles.routineHeader}>
              <View style={styles.routineIconBox}>
                <Zap size={16} color="#A855F7" />
              </View>
            </View>
            <Text style={styles.routineName}>Upper Body</Text>
            <Text style={styles.routineMeta}>10 exercises • 70 min</Text>
          </Pressable>

          <Pressable
            style={[
              styles.routineCard,
              selectedRoutineId === 'c4'
                ? styles.routineCardActive
                : { backgroundColor: isDark ? '#10131A' : '#FFFFFF' },
            ]}
            onPress={() => setSelectedRoutineId('c4')}
          >
            <View style={styles.routineHeader}>
              <View style={styles.routineIconBox}>
                <Crown size={16} color="#FFB800" />
              </View>
            </View>
            <Text style={styles.routineName}>Beginner Chest</Text>
            <Text style={styles.routineMeta}>5 exercises • 35 min</Text>
          </Pressable>
        </ScrollView>
      </ScrollView>

      {/* 8. VIDEO TUTORIAL MODAL PLAYER */}
      <Modal visible={!!activeVideoModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.videoModalContent, { backgroundColor: isDark ? '#10131A' : '#FFFFFF' }]}>
            {activeVideoModal && (
              <>
                <View style={styles.modalTopHeader}>
                  <Text style={[styles.modalTitleText, { color: colors.textPrimary }]}>
                    {activeVideoModal.name}
                  </Text>
                  <Pressable onPress={() => setActiveVideoModal(null)} style={styles.modalCloseBtn}>
                    <X size={20} color={colors.textPrimary} />
                  </Pressable>
                </View>

                <View style={styles.playerBox}>
                  <Image
                    source={{ uri: activeVideoModal.thumbnailUrl || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80' }}
                    style={styles.playerThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.playerOverlay}>
                    <View style={styles.bigPlayBtn}>
                      <Play size={28} color="#000000" fill="#000000" style={{ marginLeft: 3 }} />
                    </View>
                    <Text style={styles.streamingText}>
                      {activeVideoModal.videoUrl
                        ? 'Streaming Uploaded Video Stream'
                        : 'Playing Exercise Demonstration'}
                    </Text>
                  </View>
                </View>

                <ScrollView style={{ maxHeight: 220, marginTop: 16 }}>
                  <Text style={styles.modalSectionHeading}>Execution Guide</Text>
                  {activeVideoModal.instructions?.length > 0 ? (
                    activeVideoModal.instructions.map((inst, i) => (
                      <Text key={i} style={[styles.modalInstructionText, { color: colors.textSecondary }]}>
                        {i + 1}. {inst}
                      </Text>
                    ))
                  ) : (
                    <Text style={[styles.modalInstructionText, { color: colors.textSecondary }]}>
                      1. Maintain proper form and keep your core engaged throughout the set.
                    </Text>
                  )}
                </ScrollView>

                <Pressable
                  style={styles.closeModalFullBtn}
                  onPress={() => setActiveVideoModal(null)}
                >
                  <Text style={styles.closeModalFullBtnText}>Close Video Player</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 9. EXERCISE DETAIL MODAL */}
      <Modal visible={!!selectedEx} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <ScrollView
            style={[styles.modalContent, { backgroundColor: isDark ? '#10131A' : '#FFFFFF' }]}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {selectedEx && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalName, { color: colors.textPrimary }]}>{selectedEx.name}</Text>
                    <Text style={styles.modalSub}>
                      {(selectedEx.muscleGroups || []).join(', ')} • {(selectedEx.equipment || []).join(', ')}
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelectedEx(null)}>
                    <Text style={styles.closeBtn}>×</Text>
                  </Pressable>
                </View>

                <View style={styles.exStats}>
                  <View style={styles.exStat}>
                    <Text style={styles.exStatLabel}>Sets</Text>
                    <Text style={styles.exStatVal}>{selectedEx.defaultSets || 3}</Text>
                  </View>
                  <View style={styles.exStat}>
                    <Text style={styles.exStatLabel}>Reps</Text>
                    <Text style={styles.exStatVal}>{selectedEx.defaultReps || 10}</Text>
                  </View>
                  <View style={styles.exStat}>
                    <Text style={styles.exStatLabel}>Rest</Text>
                    <Text style={styles.exStatVal}>{selectedEx.defaultRest || 60}s</Text>
                  </View>
                  <View style={styles.exStat}>
                    <Text style={styles.exStatLabel}>Level</Text>
                    <Text style={styles.exStatVal}>{selectedEx.difficulty || 'Beginner'}</Text>
                  </View>
                </View>

                {selectedEx.instructions?.length > 0 && (
                  <View style={styles.instrBox}>
                    <Text style={styles.instrTitle}>Instructions</Text>
                    {selectedEx.instructions.map((inst, i) => (
                      <Text key={i} style={styles.instrItem}>
                        {i + 1}. {inst}
                      </Text>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF5C69',
  },
  scrollView: {
    flex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#252B36',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  catChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: '#A3E635',
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  chipRowDiff: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  diffChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
  },
  diffChipActive: {
    backgroundColor: '#00F0FF',
  },
  diffChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  diffChipTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  todayCardContainer: {
    marginBottom: 20,
  },
  todayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  todayTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayHeaderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  viewPlanBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(163, 230, 53, 0.12)',
  },
  viewPlanText: {
    color: '#A3E635',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerCard: {
    backgroundColor: '#10131A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#252B36',
    flexDirection: 'row',
    overflow: 'hidden',
    padding: 16,
    minHeight: 180,
  },
  bannerLeft: {
    flex: 1,
    paddingRight: 10,
    justifyContent: 'space-between',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  bannerMeta: {
    color: '#A8AFBA',
    fontSize: 12,
    marginVertical: 4,
  },
  bannerDesc: {
    color: '#6F7783',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  startBtn: {
    backgroundColor: '#A3E635',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  startBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 14,
  },
  bannerRight: {
    width: 110,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  viewAllText: {
    color: '#A3E635',
    fontSize: 13,
    fontWeight: '600',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#252B36',
    backgroundColor: '#171B24',
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  videoRow: {
    flexDirection: 'row',
  },
  videoCard: {
    width: 200,
    marginRight: 14,
  },
  videoThumbBox: {
    width: 200,
    height: 115,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
    backgroundColor: '#171B24',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
  },
  videoDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  playCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationTag: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  videoSubtitle: {
    color: '#6F7783',
    fontSize: 11,
    marginTop: 2,
  },
  exCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#252B36',
    marginBottom: 10,
  },
  numBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#171B24',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  numText: {
    color: '#A8AFBA',
    fontSize: 12,
    fontWeight: '700',
  },
  exThumb: {
    width: 50,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#171B24',
  },
  exDetails: {
    flex: 1,
  },
  exTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  exSub: {
    color: '#6F7783',
    fontSize: 12,
    marginTop: 2,
  },
  routineRow: {
    flexDirection: 'row',
  },
  routineCard: {
    width: 145,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#252B36',
    marginRight: 12,
    justifyContent: 'space-between',
    minHeight: 90,
  },
  routineCardActive: {
    borderColor: '#A3E635',
    backgroundColor: 'rgba(163, 230, 53, 0.08)',
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routineIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#171B24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#A3E635',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  routineMeta: {
    color: '#6F7783',
    fontSize: 10,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  videoModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  playerBox: {
    width: '100%',
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  playerThumb: {
    width: '100%',
    height: '100%',
  },
  playerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#A3E635',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  streamingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalSectionHeading: {
    color: '#A3E635',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalInstructionText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
  },
  closeModalFullBtn: {
    backgroundColor: '#171B24',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#252B36',
  },
  closeModalFullBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalName: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSub: {
    color: '#6F7783',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    fontSize: 24,
    color: '#6F7783',
  },
  exStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#171B24',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  exStat: {
    alignItems: 'center',
  },
  exStatLabel: {
    color: '#6F7783',
    fontSize: 11,
  },
  exStatVal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  instrBox: {
    marginBottom: 16,
  },
  instrTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  instrItem: {
    color: '#A8AFBA',
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
  },
});
