import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Moon,
  Sun,
  Bell,
  Camera,
  Activity,
  ShieldCheck,
  HelpCircle,
  LogOut,
  ChevronRight,
  Info,
  X,
} from 'lucide-react-native';
import { TopBar } from '../components/common/TopBar';
import { MaterialCard } from '../components/common/MaterialCard';
import { useTheme } from '../context/ThemeContext';
import { clearAuthData } from '../services/api';
import { emitDbUpdate } from '../utils/events';
import { FontSize, BorderRadius } from '../constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme, theme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [cameraPermission, setCameraPermission] = useState(true);
  const [motionSensors, setMotionSensors] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', body: '' });

  const showInfoModal = (title, body) => {
    setModalContent({ title, body });
    setModalVisible(true);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of FitMitra?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearAuthData();
          emitDbUpdate();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      {/* Context-Aware TopBar */}
      <TopBar title="Settings" subtitle="Preferences & App Control" showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Appearance */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          APPEARANCE & THEME
        </Text>

        <MaterialCard style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.settingRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
              {isDark ? (
                <Moon size={20} color={colors.primary} />
              ) : (
                <Sun size={20} color={colors.primary} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                Dark Mode
              </Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                {isDark ? 'Athletic fluorescent dark palette' : 'Material 3 crisp light palette'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#CBD5E0', true: colors.primary }}
              thumbColor={isDark ? '#000' : '#FFF'}
            />
          </View>
        </MaterialCard>

        {/* Section 2: Device Permissions */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          DEVICE PERMISSIONS
        </Text>

        <MaterialCard style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Notifications */}
          <View style={styles.settingRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.secondaryCyan + '20' }]}>
              <Bell size={20} color={colors.secondaryCyan} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                Push Notifications
              </Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                Order tracking, streak alerts & workout reminders
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#CBD5E0', true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Camera */}
          <View style={styles.settingRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.accentAmber + '20' }]}>
              <Camera size={20} color={colors.accentAmber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                Camera Access
              </Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                Progress photo comparison & profile avatar
              </Text>
            </View>
            <Switch
              value={cameraPermission}
              onValueChange={setCameraPermission}
              trackColor={{ false: '#CBD5E0', true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Activity / Step Sensors */}
          <View style={styles.settingRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.accentRose + '20' }]}>
              <Activity size={20} color={colors.accentRose} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                Step & Motion Sensors
              </Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                Automatic rest timer & rep detection
              </Text>
            </View>
            <Switch
              value={motionSensors}
              onValueChange={setMotionSensors}
              trackColor={{ false: '#CBD5E0', true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>
        </MaterialCard>

        {/* Section 3: Legal & Support */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          SUPPORT & LEGAL
        </Text>

        <MaterialCard style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Privacy Policy */}
          <Pressable
            style={styles.actionRow}
            onPress={() =>
              showInfoModal(
                'Privacy Policy',
                'FitMitra respects your privacy. All biometric and workout logs are securely encrypted and associated with your verified account. We do not sell your health data to third parties. For full details, visit fitmitra.com/privacy.'
              )
            }
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
              <ShieldCheck size={20} color={colors.primary} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
              Privacy Policy & Data Security
            </Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Help & Support */}
          <Pressable
            style={styles.actionRow}
            onPress={() =>
              showInfoModal(
                'Help & Support',
                'Need assistance with workouts, subscriptions, or orders? Contact our fitness coaches at support@fitmitra.com or ask your AI Coach on the home screen!'
              )
            }
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.secondaryCyan + '20' }]}>
              <HelpCircle size={20} color={colors.secondaryCyan} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
              Help & Customer Support
            </Text>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* App Version */}
          <View style={styles.actionRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated }]}>
              <Info size={20} color={colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                FitMitra App Version
              </Text>
              <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                v2.1.0 • React Native / Expo
              </Text>
            </View>
          </View>
        </MaterialCard>

        {/* Section 4: Sign Out */}
        <Pressable
          style={[styles.logoutBtn, { borderColor: colors.error + '55', backgroundColor: colors.error + '10' }]}
          onPress={handleLogout}
        >
          <LogOut size={18} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>
            Sign Out of Account
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Info Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <MaterialCard style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {modalContent.title}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={[styles.modalBody, { color: colors.textSecondary }]}>
              {modalContent.body}
            </Text>
            <Pressable
              style={[styles.modalCloseBtn, { backgroundColor: colors.primary }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Got it</Text>
            </Pressable>
          </MaterialCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    padding: 6,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  actionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    flex: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    padding: 22,
    borderRadius: BorderRadius.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  modalBody: {
    fontSize: FontSize.sm,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalCloseBtn: {
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#000',
    fontWeight: '800',
    fontSize: FontSize.md,
  },
});
