// Profile & Settings Screen — mirrors frontend Profile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  LogOut,
  Sparkles,
  CheckCircle2,
  Trash2,
  Globe,
  Award,
  ChevronRight,
  Shield,
  CreditCard,
  X,
  Check,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/theme';
import { getUser, saveUser, initDb } from '../../utils/db';
import { onDbUpdate } from '../../utils/events';
import { t } from '../../utils/i18n';

const GOALS = ['Muscle Gain', 'Fat Loss', 'Strength', 'General Fitness'];
const EXPERIENCES = ['Beginner', 'Intermediate', 'Advanced'];
const ACTIVITIES = [
  'Sedentary',
  'Lightly Active',
  'Moderately Active',
  'Very Active',
];

export default function ProfileTab() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('Muscle Gain');
  const [experience, setExperience] = useState('Intermediate');
  const [activity, setActivity] = useState('Moderately Active');
  const [language, setLanguage] = useState('en');

  // Upgrade Modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState('monthly');
  const [upgradeMethod, setUpgradeMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const u = await getUser();
      setUser(u);
      if (u) {
        setName(u.name || '');
        setAge(u.age ? String(u.age) : '');
        setHeight(u.height ? String(u.height) : '');
        setWeight(u.weight || u.currentWeight ? String(u.weight || u.currentWeight) : '');
        setGoal(u.fitnessGoal || 'Muscle Gain');
        setExperience(u.experienceLevel || 'Intermediate');
        setActivity(u.activityLevel || 'Moderately Active');
        setLanguage(u.language || 'en');
      }
    } catch (e) {
      console.warn('Error loading profile:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = onDbUpdate(loadData);
    return unsub;
  }, [loadData]);

  const handleSaveProfile = async () => {
    if (!name.trim() || !height.trim() || !weight.trim()) {
      Alert.alert('Validation Error', 'Please fill in Name, Height, and Weight.');
      return;
    }

    try {
      setSaving(true);
      const updated = {
        ...user,
        name: name.trim(),
        age: parseInt(age, 10) || user.age,
        height: parseInt(height, 10) || user.height,
        weight: parseFloat(weight) || user.weight,
        currentWeight: parseFloat(weight) || user.currentWeight,
        fitnessGoal: goal,
        experienceLevel: experience,
        activityLevel: activity,
        language: language,
      };

      await saveUser(updated);
      setUser(updated);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of FitMitra?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('fitmitra_user');
          await AsyncStorage.removeItem('fitmitra_workout_history');
          await AsyncStorage.removeItem('fitmitra_nutrition_logs');
          await AsyncStorage.removeItem('fitmitra_weight_history');
          router.replace('/login');
        },
      },
    ]);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Data',
      'Are you sure you want to reset all workout history, weight tracking, and meals to initial defaults? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await initDb(true);
            await loadData();
            Alert.alert('Reset Complete', 'All metrics reset to factory defaults.');
          },
        },
      ]
    );
  };

  const handleUpgradeSuccess = async () => {
    setProcessing(true);
    setTimeout(async () => {
      setProcessing(false);
      const updated = { ...user, isPremium: true };
      await saveUser(updated);
      setUser(updated);
      setShowUpgradeModal(false);
      Alert.alert('FitMitra PRO Activated', 'You now have full access to all PRO features!');
    }, 1200);
  };

  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryNeon} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const h = Number(height) || 175;
  const w = Number(weight) || 72;
  const bmi = (w / ((h / 100) * (h / 100))).toFixed(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* User Header Profile Card */}
      <View style={styles.heroCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.heroName}>{user.name || 'Athlete'}</Text>
            {user.isPremium ? (
              <View style={styles.proTag}>
                <Sparkles size={10} color="#000" />
                <Text style={styles.proTagText}>PRO</Text>
              </View>
            ) : (
              <View style={styles.freeTag}>
                <Text style={styles.freeTagText}>FREE</Text>
              </View>
            )}
          </View>
          <Text style={styles.heroEmail}>{user.email || user.phone || 'fitmitra@app'}</Text>
        </View>
      </View>

      {/* Health Stats Summary Bar */}
      <View style={styles.statStrip}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{height || 0} cm</Text>
          <Text style={styles.statLbl}>Height</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{weight || 0} kg</Text>
          <Text style={styles.statLbl}>Weight</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{bmi}</Text>
          <Text style={styles.statLbl}>BMI</Text>
        </View>
      </View>

      {/* PRO Membership Banner */}
      {!user.isPremium ? (
        <Pressable
          style={styles.upgradeBanner}
          onPress={() => router.push('/premium')}
        >
          <View style={styles.upgradeIcon}>
            <Sparkles size={22} color="#000" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.upgradeTitle}>Upgrade to FitMitra PRO</Text>
            <Text style={styles.upgradeSub}>
              Unlock custom diets, audio coach, video routines & analytics
            </Text>
          </View>
          <ChevronRight size={18} color={Colors.accentAmber} />
        </Pressable>
      ) : (
        <View style={styles.activeProCard}>
          <Award size={20} color={Colors.primaryNeon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.activeProTitle}>FitMitra PRO Active</Text>
            <Text style={styles.activeProSub}>
              Unlimited access to all workouts, recipes & training plans
            </Text>
          </View>
        </View>
      )}

      {/* Edit Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>

        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your full name"
          placeholderTextColor={Colors.textSecondary}
        />

        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="Age"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              placeholder="cm"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="kg"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>

        {/* Primary Fitness Goal */}
        <Text style={styles.inputLabel}>Primary Goal</Text>
        <View style={styles.chipsWrap}>
          {GOALS.map((g) => (
            <Pressable
              key={g}
              style={[styles.chip, goal === g && styles.chipActive]}
              onPress={() => setGoal(g)}
            >
              <Text style={[styles.chipText, goal === g && styles.chipTextActive]}>
                {g}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Experience Level */}
        <Text style={styles.inputLabel}>Experience Level</Text>
        <View style={styles.chipsWrap}>
          {EXPERIENCES.map((exp) => (
            <Pressable
              key={exp}
              style={[styles.chip, experience === exp && styles.chipActive]}
              onPress={() => setExperience(exp)}
            >
              <Text style={[styles.chipText, experience === exp && styles.chipTextActive]}>
                {exp}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Activity Level */}
        <Text style={styles.inputLabel}>Daily Activity Level</Text>
        <View style={styles.chipsWrap}>
          {ACTIVITIES.map((act) => (
            <Pressable
              key={act}
              style={[styles.chip, activity === act && styles.chipActive]}
              onPress={() => setActivity(act)}
            >
              <Text style={[styles.chipText, activity === act && styles.chipTextActive]}>
                {act}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Language Selection */}
        <Text style={styles.inputLabel}>Preferred Language</Text>
        <View style={styles.langRow}>
          <Pressable
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>
              English (EN)
            </Text>
          </Pressable>
          <Pressable
            style={[styles.langBtn, language === 'kn' && styles.langBtnActive]}
            onPress={() => setLanguage('kn')}
          >
            <Text style={[styles.langBtnText, language === 'kn' && styles.langBtnTextActive]}>
              ಕನ್ನಡ (Kannada)
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.saveBtn}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.saveBtnText}>Save Profile Changes</Text>
          )}
        </Pressable>
      </View>

      {/* Danger Zone & Account Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Settings</Text>

        <Pressable style={styles.actionRow} onPress={handleResetData}>
          <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(255, 68, 68, 0.1)' }]}>
            <Trash2 size={18} color={Colors.accentRose} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionRowTitle}>Reset App Data</Text>
            <Text style={styles.actionRowSub}>
              Clear logged workouts, weights and food journal
            </Text>
          </View>
        </Pressable>

        <Pressable style={[styles.actionRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }]} onPress={handleLogout}>
          <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
            <LogOut size={18} color={Colors.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionRowTitle, { color: Colors.accentRose }]}>Log Out</Text>
            <Text style={styles.actionRowSub}>Sign out of your session on this device</Text>
          </View>
        </Pressable>
      </View>

      {/* PRO Upgrade Modal */}
      <Modal
        visible={showUpgradeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={20} color={Colors.accentAmber} />
                <Text style={styles.modalTitle}>FitMitra PRO</Text>
              </View>
              <Pressable onPress={() => setShowUpgradeModal(false)}>
                <X size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSub}>
                Join thousands of athletes transforming their fitness with PRO features.
              </Text>

              {/* Plans */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <Pressable
                  style={[
                    styles.planOption,
                    upgradePlan === 'monthly' && styles.planOptionActive,
                  ]}
                  onPress={() => setUpgradePlan('monthly')}
                >
                  <Text style={styles.planOptionName}>Monthly Pass</Text>
                  <Text style={styles.planOptionPrice}>₹299/mo</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.planOption,
                    upgradePlan === 'annual' && styles.planOptionActive,
                  ]}
                  onPress={() => setUpgradePlan('annual')}
                >
                  <Text style={styles.planOptionName}>Annual Pass</Text>
                  <Text style={styles.planOptionPrice}>₹1,999/yr</Text>
                </Pressable>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Enter UPI ID (e.g. yourname@okaxis)"
                placeholderTextColor={Colors.textSecondary}
                value={upiId}
                onChangeText={setUpiId}
              />

              <Pressable
                style={styles.confirmPayBtn}
                onPress={handleUpgradeSuccess}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.confirmPayBtnText}>Confirm & Unlock PRO</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDarkBase,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 48,
    paddingBottom: 90,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bgDarkBase,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 10,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.bgDarkCard,
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.secondaryCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  heroEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  proTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.accentAmber,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
  },
  freeTag: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  statStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.bgDarkCard,
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryNeon,
  },
  statLbl: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '70%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: Colors.accentAmber,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  upgradeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.accentAmber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.accentAmber,
  },
  upgradeSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activeProCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
    borderColor: Colors.primaryNeon,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  activeProTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryNeon,
  },
  activeProSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.bgDarkCard,
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    borderColor: Colors.primaryNeon,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
  },
  chipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.primaryNeon,
    fontWeight: '700',
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    alignItems: 'center',
  },
  langBtnActive: {
    borderColor: Colors.secondaryCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  langBtnText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  langBtnTextActive: {
    color: Colors.secondaryCyan,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: Colors.primaryNeon,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actionRowSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bgDarkCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.accentAmber,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  planOption: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  planOptionActive: {
    borderColor: Colors.accentAmber,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  planOptionName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  planOptionPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
    marginBottom: 16,
  },
  confirmPayBtn: {
    backgroundColor: Colors.primaryNeon,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmPayBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
});
