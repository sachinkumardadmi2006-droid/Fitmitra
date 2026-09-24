// Workouts Tab — workout catalogue + exercise library (mirrors frontend Workouts.jsx)
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Dumbbell, Clock, Flame, ChevronRight, Play, BookOpen, AlertTriangle, Lightbulb, Lock, Sparkles, CheckCircle, Crown } from 'lucide-react-native';
import { WORKOUTS, EXERCISES } from '../../data/mockData';
import { Colors, FontSize, BorderRadius } from '../../constants/theme';
import { getUser, saveUser } from '../../utils/db';
import { onDbUpdate } from '../../utils/events';

export default function Workouts() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [activeDiff, setActiveDiff] = useState('All');
  
  // User state for premium check
  const [user, setUser] = useState(null);

  // Modal states
  const [selectedEx, setSelectedEx] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeItemName, setUpgradeItemName] = useState('');

  const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Abs'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const loadUser = useCallback(async () => {
    const u = await getUser();
    setUser(u);
  }, []);

  useEffect(() => {
    loadUser();
    const unsub = onDbUpdate(loadUser);
    return unsub;
  }, [loadUser]);

  // Check if item difficulty tier is locked for current user
  const isLocked = (diff) => {
    if (user?.isPremium) return false;
    return diff === 'Intermediate' || diff === 'Advanced';
  };

  const filtered = WORKOUTS.filter(w => {
    const mc = activeCat === 'All' || w.category === activeCat;
    const md = activeDiff === 'All' || w.difficulty === activeDiff;
    const ms = w.name.toLowerCase().includes(query.toLowerCase()) || w.tagline.toLowerCase().includes(query.toLowerCase());
    return mc && md && ms;
  });

  const filteredEx = EXERCISES.filter(ex => {
    const mc = activeCat === 'All' || ex.category === activeCat;
    const md = activeDiff === 'All' || ex.difficulty === activeDiff;
    const ms = ex.name.toLowerCase().includes(query.toLowerCase()) || ex.targetMuscle.toLowerCase().includes(query.toLowerCase());
    return mc && md && ms;
  });

  const handleWorkoutPress = (w) => {
    if (isLocked(w.difficulty)) {
      setUpgradeItemName(w.name);
      setShowUpgradeModal(true);
    } else {
      router.push(`/workout/${w.id}`);
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

  const handleUpgradeNow = async () => {
    try {
      const updatedUser = { ...user, isPremium: true };
      await saveUser(updatedUser);
      setUser(updatedUser);
      setShowUpgradeModal(false);
      Alert.alert('🎉 Premium Unlocked!', 'Congratulations! You are now a FitMitra Pro member. All Intermediate and Advanced workouts & exercises are unlocked!');
    } catch (e) {
      Alert.alert('Upgrade Failed', 'Could not upgrade account. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Workouts & Library</Text>
        <Text style={styles.pageSubtitle}>Choose a routine or inspect individual exercises</Text>
      </View>

      {/* Search & Filters */}
      <View style={styles.searchCard}>
        <View style={styles.searchRow}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Search workouts or exercises..." placeholderTextColor={Colors.textMuted} value={query} onChangeText={setQuery} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
          {categories.map(c => (
            <Pressable key={c} style={[styles.pill, activeCat === c && styles.pillActive]} onPress={() => setActiveCat(c)}>
              <Text style={[styles.pillText, activeCat === c && styles.pillTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
          {difficulties.map(d => {
            const locked = isLocked(d);
            return (
              <Pressable key={d} style={[styles.pillDiff, activeDiff === d && styles.pillDiffActive]} onPress={() => setActiveDiff(d)}>
                <Text style={[styles.pillDiffText, activeDiff === d && styles.pillDiffTextActive]}>
                  {d} {locked && '🔒'}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Workout Cards */}
      <Text style={styles.sectionTitle}>Training Routines ({filtered.length})</Text>
      {filtered.map(w => {
        const locked = isLocked(w.difficulty);
        return (
          <Pressable 
            key={w.id} 
            style={[styles.workoutCard, locked && styles.workoutCardLocked]} 
            onPress={() => handleWorkoutPress(w)}
          >
            <View style={styles.cardTop}>
              <View style={[styles.badge, locked && styles.badgeLocked]}>
                <Text style={[styles.badgeText, locked && styles.badgeTextLocked]}>
                  {w.difficulty} {locked && '🔒'}
                </Text>
              </View>
              <Text style={styles.catTag}>{w.category}</Text>
            </View>
            <Text style={styles.cardName}>{w.name}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{w.tagline}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}><Clock size={14} color={Colors.textMuted} /><Text style={styles.metaText}>{w.duration} Min</Text></View>
              <View style={styles.metaItem}><Flame size={14} color={Colors.textMuted} /><Text style={styles.metaText}>{w.calories} Kcal</Text></View>
              <View style={styles.metaItem}><Dumbbell size={14} color={Colors.textMuted} /><Text style={styles.metaText}>{w.exercises.length}</Text></View>
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
      {filtered.length === 0 && <Text style={styles.noResults}>No workouts match your criteria.</Text>}

      {/* Exercise Library */}
      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Exercise Library ({filteredEx.length})</Text>
      {filteredEx.map(ex => {
        const locked = isLocked(ex.difficulty);
        return (
          <Pressable key={ex.id} style={[styles.exRow, locked && styles.exRowLocked]} onPress={() => handleExercisePress(ex)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.exName}>{ex.name}</Text>
              <Text style={styles.exMeta}>{ex.targetMuscle} • {ex.equipment}</Text>
            </View>
            <View style={styles.exRight}>
              <View style={[styles.badgeCyan, locked && styles.badgeLocked]}>
                <Text style={[styles.badgeCyanText, locked && styles.badgeTextLocked]}>
                  {ex.difficulty} {locked && '🔒'}
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
      {filteredEx.length === 0 && <Text style={styles.noResults}>No exercises match your criteria.</Text>}

      {/* Exercise Detail Modal */}
      <Modal visible={!!selectedEx} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 40 }}>
            {selectedEx && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}><Text style={styles.modalName}>{selectedEx.name}</Text><Text style={styles.modalSub}>{selectedEx.targetMuscle} • {selectedEx.equipment}</Text></View>
                  <Pressable onPress={() => setSelectedEx(null)}><Text style={styles.closeBtn}>×</Text></Pressable>
                </View>
                <View style={styles.exStats}>
                  <View style={styles.exStat}><Text style={styles.exStatLabel}>Sets</Text><Text style={styles.exStatVal}>{selectedEx.defaultSets}</Text></View>
                  <View style={styles.exStat}><Text style={styles.exStatLabel}>Reps</Text><Text style={styles.exStatVal}>{selectedEx.defaultReps}</Text></View>
                  <View style={styles.exStat}><Text style={styles.exStatLabel}>Rest</Text><Text style={styles.exStatVal}>{selectedEx.defaultRest}s</Text></View>
                  <View style={styles.exStat}><Text style={styles.exStatLabel}>Level</Text><Text style={styles.exStatVal}>{selectedEx.difficulty}</Text></View>
                </View>
                <View style={styles.instrBox}><Text style={styles.instrTitle}>Instructions</Text>
                  {selectedEx.instructions.map((inst, i) => <Text key={i} style={styles.instrItem}>{i + 1}. {inst}</Text>)}
                </View>
                {selectedEx.tips?.length > 0 && (
                  <View style={[styles.notesBox, { borderLeftColor: '#eab308' }]}>
                    <View style={styles.notesTitleRow}><Lightbulb size={14} color="#eab308" /><Text style={styles.notesTitleText}>Pro Tips</Text></View>
                    {selectedEx.tips.map((tip, i) => <Text key={i} style={styles.notesItem}>• {tip}</Text>)}
                  </View>
                )}
                {selectedEx.mistakes?.length > 0 && (
                  <View style={[styles.notesBox, { borderLeftColor: Colors.accentRose }]}>
                    <View style={styles.notesTitleRow}><AlertTriangle size={14} color={Colors.accentRose} /><Text style={styles.notesTitleText}>Avoid</Text></View>
                    {selectedEx.mistakes.map((m, i) => <Text key={i} style={styles.notesItem}>• {m}</Text>)}
                  </View>
                )}
                <Pressable style={styles.closeModalBtn} onPress={() => setSelectedEx(null)}>
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
            <Text style={styles.upgradeSub}>Unlock Intermediate & Advanced Workouts</Text>

            <View style={styles.highlightBox}>
              <Text style={styles.highlightText}>
                <Text style={{ fontWeight: '700' }}>"{upgradeItemName || 'This content'}"</Text> requires FitMitra Pro access.
              </Text>
            </View>

            <Text style={styles.upgradeDesc}>
              Intermediate & Advanced routines are designed for maximum muscle growth and fat burn. Upgrade your account to unlock full access across all devices!
            </Text>

            <View style={styles.perksBox}>
              <View style={styles.perkItem}>
                <CheckCircle size={16} color={Colors.primaryNeon} />
                <Text style={styles.perkText}>Access to all 40+ Intermediate & Advanced Workouts</Text>
              </View>
              <View style={styles.perkItem}>
                <CheckCircle size={16} color={Colors.primaryNeon} />
                <Text style={styles.perkText}>HD Technique & Video Form Guides</Text>
              </View>
              <View style={styles.perkItem}>
                <CheckCircle size={16} color={Colors.primaryNeon} />
                <Text style={styles.perkText}>Customized Macro Goals & Diet Recipes</Text>
              </View>
            </View>

            <Pressable style={styles.upgradeBtnPrimary} onPress={handleUpgradeNow}>
              <Sparkles size={18} color="#000" />
              <Text style={styles.upgradeBtnPrimaryText}>UPGRADE TO FITMITRA PRO</Text>
            </Pressable>

            <Pressable style={styles.upgradeBtnCancel} onPress={() => setShowUpgradeModal(false)}>
              <Text style={styles.upgradeBtnCancelText}>Maybe Later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDarkBase },
  pageHeader: { padding: 20, paddingTop: 50 },
  pageTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  pageSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  searchCard: { backgroundColor: Colors.bgGlass, borderWidth: 1, borderColor: Colors.borderGlass, borderRadius: BorderRadius.lg, padding: 16, marginHorizontal: 16, marginBottom: 24 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: Colors.borderGlass, borderRadius: BorderRadius.sm, paddingHorizontal: 12, height: 42, marginBottom: 12 },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm },
  pillRow: { marginBottom: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.borderGlass, marginRight: 8 },
  pillActive: { backgroundColor: Colors.primaryNeon, borderColor: Colors.primaryNeon },
  pillText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  pillTextActive: { color: '#000', fontWeight: '600' },
  pillDiff: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.borderGlass, marginRight: 8 },
  pillDiffActive: { backgroundColor: Colors.secondaryCyan, borderColor: Colors.secondaryCyan },
  pillDiffText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  pillDiffTextActive: { color: '#000' },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, paddingHorizontal: 16, marginBottom: 12 },
  workoutCard: { backgroundColor: Colors.bgGlass, borderWidth: 1, borderColor: Colors.borderGlass, borderRadius: BorderRadius.lg, padding: 16, marginHorizontal: 16, marginBottom: 12 },
  workoutCardLocked: { borderColor: 'rgba(249, 115, 22, 0.3)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.primaryNeonDim, borderWidth: 1, borderColor: 'rgba(204,255,0,0.2)' },
  badgeLocked: { backgroundColor: 'rgba(249, 115, 22, 0.15)', borderColor: 'rgba(249, 115, 22, 0.3)' },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.primaryNeon },
  badgeTextLocked: { color: '#f97316' },
  catTag: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  cardName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  cardDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textMuted },
  lockedFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderColor: Colors.borderGlass },
  lockedFooterText: { fontSize: 12, fontWeight: '700', color: '#f97316' },
  noResults: { textAlign: 'center', padding: 32, color: Colors.textMuted },
  exRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgGlass, borderWidth: 1, borderColor: Colors.borderGlass, borderRadius: BorderRadius.md, padding: 14, marginHorizontal: 16, marginBottom: 8 },
  exRowLocked: { borderColor: 'rgba(249, 115, 22, 0.2)' },
  exName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  exMeta: { fontSize: 12, color: Colors.textSecondary },
  exRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badgeCyan: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: Colors.secondaryCyanDim, borderWidth: 1, borderColor: 'rgba(0,240,255,0.2)' },
  badgeCyanText: { fontSize: 10, fontWeight: '700', color: Colors.secondaryCyan },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.bgDarkCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderColor: Colors.borderGlass },
  modalName: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  modalSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  closeBtn: { fontSize: 28, color: Colors.textMuted },
  exStats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: Colors.borderGlass, borderRadius: BorderRadius.md, padding: 12, marginBottom: 20 },
  exStat: { alignItems: 'center', gap: 4 },
  exStatLabel: { fontSize: 11, color: Colors.textMuted },
  exStatVal: { fontWeight: '700', fontSize: FontSize.lg, color: Colors.primaryNeon },
  instrBox: { marginBottom: 20 },
  instrTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  instrItem: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22, marginBottom: 6 },
  notesBox: { borderLeftWidth: 3, padding: 14, borderRadius: BorderRadius.sm, backgroundColor: 'rgba(255,255,255,0.01)', marginBottom: 16 },
  notesTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  notesTitleText: { fontWeight: '600', fontSize: FontSize.md, color: Colors.textPrimary },
  notesItem: { fontSize: 12, color: Colors.textSecondary, lineHeight: 20, marginBottom: 4 },
  closeModalBtn: { backgroundColor: Colors.borderGlassBright, paddingVertical: 14, borderRadius: BorderRadius.md, alignItems: 'center', marginTop: 8 },
  closeModalBtnText: { fontWeight: '600', color: Colors.textSecondary },

  /* UPGRADE MODAL */
  upgradeModalContent: { backgroundColor: Colors.bgDarkCard, borderRadius: BorderRadius.lg, padding: 24, borderWidth: 1, borderColor: Colors.borderGlassBright, alignItems: 'center' },
  crownCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(249,115,22,0.15)', borderWidth: 1, borderColor: 'rgba(249,115,22,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  upgradeTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  upgradeSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  highlightBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: Colors.borderGlass, borderRadius: BorderRadius.sm, padding: 10, width: '100%', marginBottom: 12 },
  highlightText: { fontSize: 12, color: Colors.textPrimary, textAlign: 'center' },
  upgradeDesc: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  perksBox: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: BorderRadius.md, padding: 12, width: '100%', gap: 10, marginBottom: 20 },
  perkItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perkText: { fontSize: 12, color: Colors.textPrimary, flex: 1 },
  upgradeBtnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primaryNeon, paddingVertical: 14, borderRadius: BorderRadius.md, width: '100%', marginBottom: 10 },
  upgradeBtnPrimaryText: { fontWeight: '800', fontSize: FontSize.md, color: '#000' },
  upgradeBtnCancel: { paddingVertical: 10, alignItems: 'center', width: '100%' },
  upgradeBtnCancelText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
});
