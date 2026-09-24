// Dashboard Screen — Home tab (mirrors frontend Dashboard.jsx)
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Flame, Dumbbell, Award, Scale, Plus, Send } from 'lucide-react-native';
import { getUser, getTodayNutritionLogs, addNutritionLog, getWorkoutHistory, addWeightLog } from '../../utils/db';
import { WORKOUTS } from '../../data/mockData';
import { t } from '../../utils/i18n';
import { onDbUpdate } from '../../utils/events';
import { Colors, FontSize, BorderRadius } from '../../constants/theme';
import Svg, { Circle } from 'react-native-svg';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [todayWorkoutCompleted, setTodayWorkoutCompleted] = useState(false);
  const [completedDetails, setCompletedDetails] = useState(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [logWeightVal, setLogWeightVal] = useState('');
  const [quickName, setQuickName] = useState('');
  const [quickCal, setQuickCal] = useState('');
  const [quickProt, setQuickProt] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hey! I am your FitMitra AI Coach. Need a quick tip?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const loadData = useCallback(async () => {
    const u = await getUser();
    setUser(u);
    if (!u) return;
    const todayLogs = await getTodayNutritionLogs();
    setCaloriesConsumed(todayLogs.reduce((a, c) => a + c.calories, 0));
    const history = await getWorkoutHistory();
    const todayStr = new Date().toISOString().split('T')[0];
    const done = history.find(h => h.date === todayStr);
    if (done) { setTodayWorkoutCompleted(true); setCompletedDetails(done); }
    else { setTodayWorkoutCompleted(false); }
    const rec = WORKOUTS.find(w => {
      if (u.fitnessGoal === 'Muscle Gain') return w.id === 'chest-triceps';
      if (u.fitnessGoal === 'Fat Loss') return w.id === 'core-cardio';
      if (u.fitnessGoal === 'Strength') return w.id === 'leg-destroyer';
      return w.id === 'shoulder-blast';
    }) || WORKOUTS[0];
    setTodayWorkout(rec);
  }, []);

  useEffect(() => { loadData(); const unsub = onDbUpdate(loadData); return unsub; }, [loadData]);

  const handleQuickMeal = async () => {
    if (!quickName || !quickCal) return;
    await addNutritionLog({ mealType: 'Snacks', name: quickName, calories: parseInt(quickCal), protein: parseInt(quickProt) || 0, carbs: 0, fats: 0 });
    setQuickName(''); setQuickCal(''); setQuickProt('');
  };

  const handleWeightLog = async () => {
    if (!logWeightVal) return;
    await addWeightLog(logWeightVal);
    setShowWeightModal(false); setLogWeightVal('');
  };

  const lang = user?.language || 'en';
  const getGreeting = () => {
    const h = new Date().getHours();
    if (lang === 'kn') return h < 12 ? 'ಶುಭೋದಯ' : h < 17 ? 'ಶುಭ ಮಧ್ಯಾಹ್ನ' : 'ಶುಭ ಸಂಜೆ';
    return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  };

  const handleSendMessage = (textToSend) => {
    const text = textToSend || chatInput;
    if (!text) return;
    setChatMessages(prev => [...prev, { sender: 'user', text }]);
    setChatInput('');
    setTimeout(() => {
      const q = text.toLowerCase();
      let resp = "Keep focusing on your workouts and hitting calorie targets!";
      if (q.includes('protein') || q.includes('eat')) resp = "Post-workout, focus on 20-30g protein with simple carbs.";
      else if (q.includes('sore') || q.includes('rest')) resp = "If sore, reduce overload slightly. Keep movements controlled.";
      else if (q.includes('water') || q.includes('hydration')) resp = "Aim for 3-4 liters daily. 200ml every 15-20 min during lifts.";
      setChatMessages(prev => [...prev, { sender: 'bot', text: resp }]);
    }, 800);
  };

  if (!user) return <View style={styles.loadingBox}><Text style={styles.loadingText}>Loading...</Text></View>;

  const calPct = Math.min(100, Math.round((caloriesConsumed / (user.targetCal || 2000)) * 100));
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (circumference * calPct) / 100;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.greeting}>{getGreeting()}, {user.name} 👋</Text>
        <Pressable style={styles.weightBtn} onPress={() => setShowWeightModal(true)}>
          <Scale size={14} color={Colors.textSecondary} />
          <Text style={styles.weightBtnText}>{t('logWeight', lang)}</Text>
        </Pressable>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Flame size={20} color={Colors.primaryNeon} />
          <Text style={styles.statVal}>{user.streak} {t('days', lang)}</Text>
          <Text style={styles.statLabel}>{t('streak', lang)}</Text>
        </View>
        <View style={styles.statBox}>
          <Scale size={20} color={Colors.secondaryCyan} />
          <Text style={styles.statVal}>{user.currentWeight} KG</Text>
          <Text style={styles.statLabel}>{t('currentWeight', lang)}</Text>
        </View>
        <View style={styles.statBox}>
          <Dumbbell size={20} color={Colors.accentPurple} />
          <Text style={styles.statVal}>{user.completedWorkoutsCount}</Text>
          <Text style={styles.statLabel}>{t('completedWorkouts', lang)}</Text>
        </View>
      </View>

      {/* Today's Workout */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{lang === 'kn' ? 'ಇಂದಿನ ವ್ಯಾಯಾಮ' : "Today's Workout"}</Text>
        {todayWorkoutCompleted ? (
          <View style={styles.completedRow}>
            <Award size={40} color={Colors.primaryNeon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.completedTitle}>✓ Workout Completed!</Text>
              <Text style={styles.completedSub}>{completedDetails?.name}</Text>
              <Text style={styles.completedMeta}>🔥 {completedDetails?.calories} Kcal  ⏱ {completedDetails?.duration} Min</Text>
            </View>
          </View>
        ) : todayWorkout && (
          <View>
            <Text style={styles.workoutName}>{todayWorkout.name}</Text>
            <Text style={styles.workoutMeta}>{todayWorkout.difficulty} • {todayWorkout.duration} Min • {todayWorkout.exercises.length} Exercises</Text>
            <Pressable style={styles.startBtn} onPress={() => router.push(`/workout/${todayWorkout.id}`)}>
              <Text style={styles.startBtnText}>{t('startWorkout', lang)}</Text>
              <Dumbbell size={18} color="#000" />
            </Pressable>
          </View>
        )}
      </View>

      {/* Nutrition Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{lang === 'kn' ? 'ಇಂದಿನ ಆಹಾರ' : "Nutrition Summary"}</Text>
        <View style={styles.nutritionRow}>
          <View style={styles.circleContainer}>
            <Svg width={100} height={100}>
              <Circle cx={50} cy={50} r={40} stroke={Colors.borderGlass} strokeWidth={6} fill="none" />
              <Circle cx={50} cy={50} r={40} stroke={Colors.secondaryCyan} strokeWidth={6} fill="none"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                strokeLinecap="round" rotation="-90" origin="50,50"
              />
            </Svg>
            <View style={styles.circleText}>
              <Text style={styles.circleVal}>{caloriesConsumed}</Text>
              <Text style={styles.circleLabel}>of {user.targetCal}</Text>
            </View>
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <View style={styles.macroRow}><Text style={[styles.macroVal, { color: Colors.primaryNeon }]}>{user.targetProtein}g</Text><Text style={styles.macroLabel}>Protein</Text></View>
            <View style={styles.macroRow}><Text style={[styles.macroVal, { color: Colors.secondaryCyan }]}>{user.targetCarbs}g</Text><Text style={styles.macroLabel}>Carbs</Text></View>
            <View style={styles.macroRow}><Text style={[styles.macroVal, { color: Colors.accentOrange }]}>{user.targetFats}g</Text><Text style={styles.macroLabel}>Fats</Text></View>
          </View>
        </View>
        {/* Quick meal log */}
        <View style={styles.quickMealSection}>
          <Text style={styles.quickMealTitle}>{t('quickLogMeal', lang)}</Text>
          <View style={styles.quickMealRow}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Meal name" placeholderTextColor={Colors.textMuted} value={quickName} onChangeText={setQuickName} />
            <TextInput style={[styles.input, { width: 70 }]} placeholder="Kcal" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" value={quickCal} onChangeText={setQuickCal} />
            <Pressable style={styles.addBtn} onPress={handleQuickMeal}><Plus size={20} color="#000" /></Pressable>
          </View>
        </View>
      </View>

      {/* AI Coach */}
      <View style={styles.card}>
        <View style={styles.aiHeader}>
          <View style={styles.botAvatar}><Text style={styles.botAvatarText}>AI</Text></View>
          <View><Text style={styles.aiTitle}>{t('aiCoach', lang)}</Text><Text style={styles.onlineText}>● Online</Text></View>
        </View>
        <ScrollView style={styles.chatArea} nestedScrollEnabled>
          {chatMessages.map((m, i) => (
            <View key={i} style={[styles.bubble, m.sender === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
              <Text style={styles.bubbleText}>{m.text}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.promptRow}>
          {['Post-Workout Meal?', 'Hydration Tip?'].map(p => (
            <Pressable key={p} style={styles.promptBtn} onPress={() => handleSendMessage(p)}><Text style={styles.promptBtnText}>{p}</Text></Pressable>
          ))}
        </View>
        <View style={styles.chatInputRow}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder={t('askCoach', lang)} placeholderTextColor={Colors.textMuted}
            value={chatInput} onChangeText={setChatInput} onSubmitEditing={() => handleSendMessage()} />
          <Pressable style={styles.sendBtn} onPress={() => handleSendMessage()}><Send size={16} color="#000" /></Pressable>
        </View>
      </View>

      {/* Weight Modal */}
      <Modal visible={showWeightModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('logWeight', lang)}</Text>
            <TextInput style={styles.input} placeholder="E.g. 72.4" placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad" value={logWeightVal} onChangeText={setLogWeightVal} autoFocus />
            <View style={styles.modalActions}>
              <Pressable style={styles.btnSecondary} onPress={() => setShowWeightModal(false)}><Text style={styles.btnSecText}>{t('cancel', lang)}</Text></Pressable>
              <Pressable style={styles.btnPrimary} onPress={handleWeightLog}><Text style={styles.btnPrimText}>{t('save', lang)}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDarkBase },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgDarkBase },
  loadingText: { color: Colors.textSecondary },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  greeting: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  weightBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.borderGlassBright },
  weightBtnText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, marginBottom: 20 },
  statBox: { alignItems: 'center', gap: 4, padding: 12, flex: 1, backgroundColor: Colors.bgGlass, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.borderGlass, marginHorizontal: 4 },
  statVal: { fontWeight: '700', fontSize: FontSize.lg, color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase' },
  card: { backgroundColor: Colors.bgGlass, borderWidth: 1, borderColor: Colors.borderGlass, borderRadius: BorderRadius.lg, padding: 20, marginHorizontal: 16, marginBottom: 16 },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  completedTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primaryNeon },
  completedSub: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 2 },
  completedMeta: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '600', marginTop: 8 },
  workoutName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  workoutMeta: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 16 },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primaryNeon, paddingVertical: 14, borderRadius: BorderRadius.md },
  startBtnText: { fontWeight: '700', fontSize: FontSize.md, color: '#000' },
  nutritionRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20 },
  circleContainer: { position: 'relative', width: 100, height: 100 },
  circleText: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  circleVal: { fontWeight: '800', fontSize: FontSize.xl, color: Colors.textPrimary },
  circleLabel: { fontSize: 10, color: Colors.textSecondary },
  macroRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.borderGlass, borderRadius: BorderRadius.sm },
  macroVal: { fontWeight: '700', fontSize: FontSize.md },
  macroLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'uppercase' },
  quickMealSection: { borderTopWidth: 1, borderColor: Colors.borderGlass, paddingTop: 16 },
  quickMealTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 10 },
  quickMealRow: { flexDirection: 'row', gap: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: Colors.borderGlass, borderRadius: BorderRadius.sm, paddingHorizontal: 12, height: 42, color: Colors.textPrimary, fontSize: FontSize.sm },
  addBtn: { width: 42, height: 42, borderRadius: BorderRadius.sm, backgroundColor: Colors.secondaryCyan, alignItems: 'center', justifyContent: 'center' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderColor: Colors.borderGlass },
  botAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryNeon, alignItems: 'center', justifyContent: 'center' },
  botAvatarText: { fontWeight: '800', fontSize: 12, color: '#000' },
  aiTitle: { fontWeight: '600', fontSize: FontSize.md, color: Colors.textPrimary },
  onlineText: { fontSize: 10, color: '#10b981' },
  chatArea: { maxHeight: 200, marginBottom: 12 },
  bubble: { padding: 12, borderRadius: BorderRadius.md, marginBottom: 8, maxWidth: '85%' },
  bubbleBot: { backgroundColor: 'rgba(255,255,255,0.04)', alignSelf: 'flex-start' },
  bubbleUser: { backgroundColor: Colors.primaryNeonDim, alignSelf: 'flex-end' },
  bubbleText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  promptRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  promptBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.borderGlass },
  promptBtnText: { fontSize: 11, color: Colors.textSecondary },
  chatInputRow: { flexDirection: 'row', gap: 8 },
  sendBtn: { width: 42, height: 42, borderRadius: BorderRadius.sm, backgroundColor: Colors.primaryNeon, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: Colors.bgDarkCard, borderRadius: BorderRadius.lg, padding: 24, borderWidth: 1, borderColor: Colors.borderGlass },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  btnSecondary: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.borderGlassBright },
  btnSecText: { color: Colors.textSecondary, fontWeight: '600' },
  btnPrimary: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryNeon },
  btnPrimText: { color: '#000', fontWeight: '700' },
});
