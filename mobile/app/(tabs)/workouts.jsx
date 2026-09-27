// Workouts Tab — workout catalogue + exercise library
// Powered by live backend APIs: GET /api/v1/programs and GET /api/v1/exercises
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  RefreshControl,
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
} from 'lucide-react-native';
import { Colors, FontSize, BorderRadius } from '../../constants/theme';
import { workoutService, subscriptionService } from '../../services';
import { onDbUpdate } from '../../utils/events';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { TopBar } from '../../components/common/TopBar';
import { useTheme } from '../../context/ThemeContext';

export default function Workouts() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [activeDiff, setActiveDiff] = useState('All');

  // Server data
  const [programs, setPrograms] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Modal states
  const [selectedEx, setSelectedEx] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeItemName, setUpgradeItemName] = useState('');

  const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Abs', 'Full Body'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const loadData = useCallback(async () => {
    try {
      // 1. Fetch real exercises
      const exRes = await workoutService.getExercises({ limit: 100 });
      const exItems = Array.isArray(exRes) ? exRes : exRes?.exercises || exRes?.items || [];
      setExercises(exItems);

      // 2. Fetch real structured programs
      const progRes = await workoutService.getPrograms({ limit: 50 });
      const progItems = Array.isArray(progRes) ? progRes : progRes?.programs || progRes?.items || [];
      setPrograms(progItems);

      // 3. Check subscription
      try {
        const sub = await subscriptionService.getMySubscription();
        setIsPremium(!!sub?.isActive);
      } catch (_) {
        setIsPremium(false);
      }
    } catch (err) {
      console.warn('Exercises and programs fetch failed:', err.message);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoadingData(true);
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

  // Filter programs / workouts
  const filteredPrograms = programs.filter((p) => {
    const goal = (p.goal || '').toLowerCase();
    const level = (p.level || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const q = query.toLowerCase();

    const matchesCat = activeCat === 'All' || goal.includes(activeCat.toLowerCase());
    const matchesDiff = activeDiff === 'All' || level.includes(activeDiff.toLowerCase());
    const matchesSearch = !q || name.includes(q) || desc.includes(q);

    return matchesCat && matchesDiff && matchesSearch;
  });

  // Filter exercises
  const filteredEx = exercises.filter((ex) => {
    const muscle = (ex.muscleGroups || []).join(' ').toLowerCase();
    const diff = (ex.difficulty || '').toLowerCase();
    const name = (ex.name || '').toLowerCase();
    const equip = (ex.equipment || []).join(' ').toLowerCase();
    const q = query.toLowerCase();

    const matchesCat = activeCat === 'All' || muscle.includes(activeCat.toLowerCase());
    const matchesDiff = activeDiff === 'All' || diff.includes(activeDiff.toLowerCase());
    const matchesSearch = !q || name.includes(q) || muscle.includes(q) || equip.includes(q);

    return matchesCat && matchesDiff && matchesSearch;
  });

  const handleProgramPress = (prog) => {
    if (isLocked(prog.level)) {
      setUpgradeItemName(prog.name);
      setShowUpgradeModal(true);
    } else {
      router.push(`/workout/${prog._id || prog.id}`);
    }
  };

  const handleExercisePress = (ex) => {
    if (isLocked(ex.difficulty)) {
      setUpgradeItemName(ex.name);
      setShowUpgradeModal(true);
    } else {
      setSelectedEx(ex);
    }
  };

  const handleUpgradeNow = () => {
    setShowUpgradeModal(false);
    router.push('/premium');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <TopBar title="Workouts" subtitle="Exercises & Routines" icon={Dumbbell} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bgBase }]}
        contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Search & Filters */}
      <View style={styles.searchCard}>
        <View style={styles.searchRow}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search workouts or exercises..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
          {categories.map((c) => (
            <Pressable
              key={c}
              style={[styles.pill, activeCat === c && styles.pillActive]}
              onPress={() => setActiveCat(c)}
            >
              <Text style={[styles.pillText, activeCat === c && styles.pillTextActive]}>
                {c}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
          {difficulties.map((d) => {
            const locked = isLocked(d);
            return (
              <Pressable
                key={d}
                style={[styles.pillDiff, activeDiff === d && styles.pillDiffActive]}
                onPress={() => setActiveDiff(d)}
              >
                <Text
                  style={[
                    styles.pillDiffText,
                    activeDiff === d && styles.pillDiffTextActive,
                  ]}
                >
                  {d} {locked && '🔒'}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Loading Spinner */}
      {loadingData ? (
        <LoadingSpinner message="Loading routines & exercises from server..." />
      ) : (
        <>
          {/* Programs / Routines Section */}
          <Text style={styles.sectionTitle}>
            Training Routines ({filteredPrograms.length})
          </Text>
          {filteredPrograms.map((prog) => {
            const locked = isLocked(prog.level);
            return (
              <Pressable
                key={prog._id || prog.id}
                style={[styles.workoutCard, locked && styles.workoutCardLocked]}
                onPress={() => handleProgramPress(prog)}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.badge, locked && styles.badgeLocked]}>
                    <Text style={[styles.badgeText, locked && styles.badgeTextLocked]}>
                      {prog.level} {locked && '🔒'}
                    </Text>
                  </View>
                  <Text style={styles.catTag}>{prog.goal || 'General'}</Text>
                </View>
                <Text style={styles.cardName}>{prog.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {prog.description || 'Structured multi-week workout program'}
                </Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Clock size={14} color={Colors.textMuted} />
                    <Text style={styles.metaText}>
                      {prog.durationWeeks ? `${prog.durationWeeks} Weeks` : '4 Weeks'}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Flame size={14} color={Colors.textMuted} />
                    <Text style={styles.metaText}>High Burn</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Dumbbell size={14} color={Colors.textMuted} />
                    <Text style={styles.metaText}>
                      {prog.equipment?.length ? `${prog.equipment.length} Tools` : 'Bodyweight'}
                    </Text>
                  </View>
                </View>

                {locked && (
                  <View style={styles.lockedFooter}>
                    <Lock size={14} color="#f97316" />
                    <Text style={styles.lockedFooterText}>Unlock with FitMitra Pro 🔒</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
          {filteredPrograms.length === 0 && (
            <Text style={styles.noResults}>No routines match your criteria.</Text>
          )}

          {/* Exercise Library Section */}
          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
            Exercise Library ({filteredEx.length})
          </Text>
          {filteredEx.map((ex) => {
            const locked = isLocked(ex.difficulty);
            const muscles = (ex.muscleGroups || []).join(', ');
            const equipment = (ex.equipment || []).join(', ');

            return (
              <Pressable
                key={ex._id || ex.id}
                style={[styles.exRow, locked && styles.exRowLocked]}
                onPress={() => handleExercisePress(ex)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exMeta}>
                    {muscles || 'Target Muscle'} • {equipment || 'Bodyweight'}
                  </Text>
                </View>
                <View style={styles.exRight}>
                  <View style={[styles.badgeCyan, locked && styles.badgeLocked]}>
                    <Text
                      style={[
                        styles.badgeCyanText,
                        locked && styles.badgeTextLocked,
                      ]}
                    >
                      {ex.difficulty || 'Beginner'} {locked && '🔒'}
                    </Text>
                  </View>
                  {locked ? (
                    <Lock size={18} color="#f97316" />
                  ) : (
                    <BookOpen size={16} color={Colors.textMuted} />
                  )}
                </View>
              </Pressable>
            );
          })}
          {filteredEx.length === 0 && (
            <Text style={styles.noResults}>No exercises match your criteria.</Text>
          )}
        </>
      )}

      {/* Exercise Detail Modal */}
      <Modal visible={!!selectedEx} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {selectedEx && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalName}>{selectedEx.name}</Text>
                    <Text style={styles.modalSub}>
                      {(selectedEx.muscleGroups || []).join(', ')} •{' '}
                      {(selectedEx.equipment || []).join(', ')}
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelectedEx(null)}>
                    <Text style={styles.closeBtn}>×</Text>
                  </Pressable>
                </View>
                <View style={styles.exStats}>
                  <View style={styles.exStat}>
                    <Text style={styles.exStatLabel}>Sets</Text>
                    <Text style={styles.exStatVal}>
                      {selectedEx.defaultSets || 3}
                    </Text>
                  </View>
                  <View style={styles.exStat}>
                    <Text style={styles.exStatLabel}>Reps</Text>
                    <Text style={styles.exStatVal}>
                      {selectedEx.defaultReps || 10}
                    </Text>
                  </View>
                  <View style={styles.exStat}>
                    <Text style={styles.exStatLabel}>Rest</Text>
                    <Text style={styles.exStatVal}>
                      {selectedEx.defaultRest || 60}s
                    </Text>
                  </View>
                  <View style={styles.exStat}>
                    <Text style={styles.exStatLabel}>Level</Text>
                    <Text style={styles.exStatVal}>
                      {selectedEx.difficulty || 'Beginner'}
                    </Text>
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
                {selectedEx.tips?.length > 0 && (
                  <View style={[styles.notesBox, { borderLeftColor: '#eab308' }]}>
                    <View style={styles.notesTitleRow}>
                      <Lightbulb size={14} color="#eab308" />
                      <Text style={styles.notesTitleText}>Pro Tips</Text>
                    </View>
                    {selectedEx.tips.map((tip, i) => (
                      <Text key={i} style={styles.notesItem}>
                        • {tip}
                      </Text>
                    ))}
                  </View>
                )}
                {selectedEx.mistakes?.length > 0 && (
                  <View
                    style={[
                      styles.notesBox,
                      { borderLeftColor: Colors.accentRose },
                    ]}
                  >
                    <View style={styles.notesTitleRow}>
                      <AlertTriangle size={14} color={Colors.accentRose} />
                      <Text style={styles.notesTitleText}>Avoid</Text>
                    </View>
                    {selectedEx.mistakes.map((m, i) => (
                      <Text key={i} style={styles.notesItem}>
                        • {m}
                      </Text>
                    ))}
                  </View>
                )}
                <Pressable
                  style={styles.closeModalBtn}
                  onPress={() => setSelectedEx(null)}
                >
                  <Text style={styles.closeModalBtnText}>Close Guide</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* UPGRADE YOUR PLAN MODAL */}
      <Modal visible={showUpgradeModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.upgradeModalContent}>
            <View style={styles.crownCircle}>
              <Crown size={32} color="#f97316" />
            </View>
            <Text style={styles.upgradeTitle}>Upgrade Your Plan</Text>
            <Text style={styles.upgradeSub}>
              Unlock Intermediate & Advanced Workouts
            </Text>

            <View style={styles.highlightBox}>
              <Text style={styles.highlightText}>
                <Text style={{ fontWeight: '700' }}>
                  "{upgradeItemName || 'This content'}"
                </Text>{' '}
                requires FitMitra Pro access.
              </Text>
            </View>

            <Text style={styles.upgradeDesc}>
              Intermediate & Advanced routines are designed for maximum muscle
              growth and fat burn. Upgrade your account to unlock full access
              across all devices!
            </Text>

            <View style={styles.perksBox}>
              <View style={styles.perkItem}>
                <CheckCircle size={16} color={Colors.primaryNeon} />
                <Text style={styles.perkText}>
                  Access to all Intermediate & Advanced Workouts
                </Text>
              </View>
              <View style={styles.perkItem}>
                <CheckCircle size={16} color={Colors.primaryNeon} />
                <Text style={styles.perkText}>
                  HD Technique & Form Instructions
                </Text>
              </View>
              <View style={styles.perkItem}>
                <CheckCircle size={16} color={Colors.primaryNeon} />
                <Text style={styles.perkText}>
                  Customized Macro Goals & Diet Recipes
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.upgradeBtnPrimary}
              onPress={handleUpgradeNow}
            >
              <Sparkles size={18} color="#000" />
              <Text style={styles.upgradeBtnPrimaryText}>
                UPGRADE TO FITMITRA PRO
              </Text>
            </Pressable>

            <Pressable
              style={styles.upgradeBtnCancel}
              onPress={() => setShowUpgradeModal(false)}
            >
              <Text style={styles.upgradeBtnCancelText}>Maybe Later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDarkBase },
  pageHeader: { padding: 20, paddingTop: 50 },
  pageTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  pageSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  searchCard: {
    backgroundColor: Colors.bgGlass,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm },
  pillRow: { marginBottom: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginRight: 8,
  },
  pillActive: { backgroundColor: Colors.primaryNeon, borderColor: Colors.primaryNeon },
  pillText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  pillTextActive: { color: '#000', fontWeight: '600' },
  pillDiff: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginRight: 8,
  },
  pillDiffActive: { backgroundColor: Colors.secondaryCyan, borderColor: Colors.secondaryCyan },
  pillDiffText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  pillDiffTextActive: { color: '#000' },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  workoutCard: {
    backgroundColor: Colors.bgGlass,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  workoutCardLocked: { borderColor: 'rgba(249, 115, 22, 0.3)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryNeonDim,
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.2)',
  },
  badgeLocked: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.primaryNeon },
  badgeTextLocked: { color: '#f97316' },
  catTag: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  cardName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  cardDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textMuted },
  lockedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: Colors.borderGlass,
  },
  lockedFooterText: { fontSize: 12, fontWeight: '700', color: '#f97316' },
  noResults: { textAlign: 'center', padding: 32, color: Colors.textMuted },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgGlass,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    borderRadius: BorderRadius.md,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  exRowLocked: { borderColor: 'rgba(249, 115, 22, 0.2)' },
  exName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  exMeta: { fontSize: 12, color: Colors.textSecondary },
  exRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badgeCyan: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondaryCyanDim,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.2)',
  },
  badgeCyanText: { fontSize: 10, fontWeight: '700', color: Colors.secondaryCyan },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: {
    backgroundColor: Colors.bgDarkCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: Colors.borderGlass,
  },
  modalName: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  modalSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  closeBtn: { fontSize: 28, color: Colors.textMuted },
  exStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 20,
  },
  exStat: { alignItems: 'center', gap: 4 },
  exStatLabel: { fontSize: 11, color: Colors.textMuted },
  exStatVal: { fontWeight: '700', fontSize: FontSize.lg, color: Colors.primaryNeon },
  instrBox: { marginBottom: 20 },
  instrTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  instrItem: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22, marginBottom: 6 },
  notesBox: {
    borderLeftWidth: 3,
    padding: 14,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.01)',
    marginBottom: 16,
  },
  notesTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  notesTitleText: { fontWeight: '600', fontSize: FontSize.md, color: Colors.textPrimary },
  notesItem: { fontSize: 12, color: Colors.textSecondary, lineHeight: 20, marginBottom: 4 },
  closeModalBtn: {
    backgroundColor: Colors.borderGlassBright,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: 8,
  },
  closeModalBtnText: { fontWeight: '600', color: Colors.textSecondary },

  /* UPGRADE MODAL */
  upgradeModalContent: {
    backgroundColor: Colors.bgDarkCard,
    borderRadius: BorderRadius.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.borderGlassBright,
    alignItems: 'center',
  },
  crownCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(249,115,22,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  upgradeTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  upgradeSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  highlightBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    borderRadius: BorderRadius.sm,
    padding: 10,
    width: '100%',
    marginBottom: 12,
  },
  highlightText: { fontSize: 12, color: Colors.textPrimary, textAlign: 'center' },
  upgradeDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  perksBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: BorderRadius.md,
    padding: 12,
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  perkItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perkText: { fontSize: 12, color: Colors.textPrimary, flex: 1 },
  upgradeBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryNeon,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    width: '100%',
    marginBottom: 10,
  },
  upgradeBtnPrimaryText: { fontWeight: '800', fontSize: FontSize.md, color: '#000' },
  upgradeBtnCancel: { paddingVertical: 10, alignItems: 'center', width: '100%' },
  upgradeBtnCancelText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
});
