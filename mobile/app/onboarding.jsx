// Onboarding Wizard — 3 steps (Goal → Experience → Details) (mirrors frontend Onboarding.jsx)
import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Target, Dumbbell, UserCheck, Flame } from 'lucide-react-native';
import { saveUser, getUser, addWeightLog } from '../utils/db';
import { Colors, FontSize, BorderRadius } from '../constants/theme';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('Muscle Gain');
  const [experience, setExperience] = useState('Intermediate');
  const [age, setAge] = useState('24');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('72');
  const [gender, setGender] = useState('Male');
  const [activity, setActivity] = useState('Moderately Active');
  const totalSteps = 3;

  const nextStep = () => { if (step < totalSteps) setStep(step + 1); else handleComplete(); };
  const prevStep = () => { if (step > 1) setStep(step - 1); };

  const handleComplete = async () => {
    const w = parseFloat(weight) || 70;
    const h = parseInt(height) || 170;
    const a = parseInt(age) || 24;
    let baseCal = gender === 'Male' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
    let multiplier = activity === 'Moderately Active' ? 1.4 : activity === 'Very Active' ? 1.6 : 1.2;
    let targetCal = Math.round(baseCal * multiplier);
    if (goal === 'Fat Loss') targetCal -= 450;
    else if (goal === 'Muscle Gain') targetCal += 350;
    else if (goal === 'Strength') targetCal += 200;
    const targetProtein = Math.round(w * 2.0);
    const targetFats = Math.round((targetCal * 0.25) / 9);
    const targetCarbs = Math.round((targetCal - (targetProtein * 4) - (targetFats * 9)) / 4);

    const currentUser = await getUser();
    const updatedUser = {
      ...currentUser,
      fitnessGoal: goal, experienceLevel: experience,
      age: a, height: h, weight: w, currentWeight: w, startingWeight: w,
      goalWeight: goal === 'Fat Loss' ? Math.round(w * 0.9) : goal === 'Muscle Gain' ? Math.round(w * 1.08) : w,
      gender, activityLevel: activity, targetCal, targetProtein, targetCarbs, targetFats,
    };
    await saveUser(updatedUser);
    await addWeightLog(weight);
    router.replace('/(tabs)');
  };

  const goals = [
    { key: 'Muscle Gain', icon: Flame, desc: 'Build size, mass, and recover effectively' },
    { key: 'Fat Loss', icon: Target, desc: 'Shred fat, lean out, and build endurance' },
    { key: 'Strength', icon: Dumbbell, desc: 'Focus on heavy compounding and lifting power' },
    { key: 'General Fitness', icon: UserCheck, desc: 'Build healthy active habits and stamina' },
  ];

  const experiences = [
    { key: 'Beginner', num: '1', desc: '0 - 6 months lifting' },
    { key: 'Intermediate', num: '2', desc: '6 months - 2 years' },
    { key: 'Advanced', num: '3', desc: '2+ years, high intensity' },
  ];

  const genders = ['Male', 'Female', 'Other'];
  const activities = ['Sedentary', 'Moderately Active', 'Very Active'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.window}>
        <Text style={styles.stepCount}>STEP {step} OF {totalSteps}</Text>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} /></View>

        {step === 1 && (
          <View>
            <Text style={styles.title}>Select Your Primary Goal</Text>
            <Text style={styles.desc}>We customize your daily target metrics based on this.</Text>
            {goals.map(g => (
              <Pressable key={g.key} style={[styles.optionCard, goal === g.key && styles.optionSelected]} onPress={() => setGoal(g.key)}>
                <View style={[styles.iconWrap, goal === g.key && styles.iconSelected]}>
                  <g.icon size={22} color={goal === g.key ? '#000' : Colors.primaryNeon} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{g.key}</Text>
                  <Text style={styles.optionDesc}>{g.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.title}>Select Your Experience Level</Text>
            <Text style={styles.desc}>We adjust exercise volumes and instructions accordingly.</Text>
            {experiences.map(e => (
              <Pressable key={e.key} style={[styles.optionCard, experience === e.key && styles.optionSelected]} onPress={() => setExperience(e.key)}>
                <View style={[styles.numBadge, experience === e.key && styles.numBadgeSelected]}>
                  <Text style={[styles.numText, experience === e.key && { color: '#000' }]}>{e.num}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{e.key}</Text>
                  <Text style={styles.optionDesc}>{e.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.title}>Enter Your Details</Text>
            <Text style={styles.desc}>Help us estimate your metabolic rates accurately.</Text>
            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.label}>Age</Text>
                <TextInput style={styles.input} keyboardType="number-pad" value={age} onChangeText={setAge} />
              </View>
              <View style={styles.formHalf}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput style={styles.input} keyboardType="number-pad" value={height} onChangeText={setHeight} />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput style={styles.input} keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
              </View>
              <View style={styles.formHalf}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.chipRow}>
                  {genders.map(g => (
                    <Pressable key={g} style={[styles.chip, gender === g && styles.chipActive]} onPress={() => setGender(g)}>
                      <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
            <Text style={[styles.label, { marginTop: 16 }]}>Activity Level</Text>
            <View style={styles.chipRow}>
              {activities.map(a => (
                <Pressable key={a} style={[styles.chip, activity === a && styles.chipActive]} onPress={() => setActivity(a)}>
                  <Text style={[styles.chipText, activity === a && styles.chipTextActive]}>{a}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          {step > 1 ? (
            <Pressable style={styles.btnSecondary} onPress={prevStep}><Text style={styles.btnSecondaryText}>Back</Text></Pressable>
          ) : <View />}
          <Pressable style={styles.btnPrimary} onPress={nextStep}>
            <Text style={styles.btnPrimaryText}>{step === totalSteps ? 'Finish Profile' : 'Continue'}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDarkBase },
  content: { padding: 20, justifyContent: 'center', minHeight: '100%' },
  window: { backgroundColor: Colors.bgGlass, borderRadius: BorderRadius.lg, padding: 24, borderWidth: 1, borderColor: Colors.borderGlass },
  stepCount: { fontSize: 11, color: Colors.textMuted, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: Colors.borderGlass, marginBottom: 24 },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: Colors.primaryNeon },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  desc: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: 24 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16,
    backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: Colors.borderGlass,
    borderRadius: BorderRadius.md, marginBottom: 12,
  },
  optionSelected: { borderColor: 'rgba(204,255,0,0.4)', backgroundColor: Colors.primaryNeonDim },
  iconWrap: {
    width: 44, height: 44, borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center',
  },
  iconSelected: { backgroundColor: Colors.primaryNeon },
  numBadge: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.borderGlassBright,
    alignItems: 'center', justifyContent: 'center',
  },
  numBadgeSelected: { backgroundColor: Colors.primaryNeon },
  numText: { fontWeight: '700', color: Colors.textPrimary },
  optionTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textPrimary },
  optionDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  formRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  formHalf: { flex: 1 },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: Colors.borderGlass,
    borderRadius: BorderRadius.sm, paddingHorizontal: 14, height: 44, color: Colors.textPrimary, fontSize: FontSize.md,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.borderGlass, backgroundColor: 'transparent',
  },
  chipActive: { backgroundColor: Colors.primaryNeon, borderColor: Colors.primaryNeon },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#000' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderColor: Colors.borderGlass,
  },
  btnSecondary: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.borderGlassBright },
  btnSecondaryText: { color: Colors.textSecondary, fontWeight: '600' },
  btnPrimary: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryNeon },
  btnPrimaryText: { color: '#000', fontWeight: '700', fontSize: FontSize.md },
});
