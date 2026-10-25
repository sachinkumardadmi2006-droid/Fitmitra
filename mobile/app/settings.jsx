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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell,
  Camera,
  Activity,
  ShieldCheck,
  HelpCircle,
  LogOut,
  ChevronRight,
  Info,
  X,
  User,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { useAppTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import AppHeader from '../components/ui/AppHeader';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import ThemeSelector from '../components/ui/ThemeSelector';
import { EmailVerificationBanner } from '../components/auth';

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const { colors } = theme;
  const { logout, user } = useAuth();

  const {
    data: settingsData,
    isLoading: loadingSettings,
  } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: async () => {
      const res = await profileService.getSettings();
      return res || {};
    },
  });

  const notificationSettings = {
    workoutReminders: settingsData?.workoutReminders ?? true,
    pointsAlerts: settingsData?.pointsAlerts ?? true,
    offersAndNews: settingsData?.offersAndNews ?? true,
  };

  const updateSettingsMutation = useMutation({
    mutationFn: (patch) => profileService.updateSettings(patch),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.settings, (old) => ({ ...(old || {}), ...(updated || {}) }));
    },
    onError: (err) => {
      console.warn('[Settings] Failed to update notification setting:', err?.message || err);
      Alert.alert('Update Failed', 'Could not save notification preferences to server. Please try again.');
    },
  });

  // Local device preference indicators
  const [cameraPermission, setCameraPermission] = useState(true);
  const [motionSensors, setMotionSensors] = useState(true);

  // Informational modals
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', body: '' });

  const handleToggleSetting = async (key, value) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const showInfoModal = (title, body) => {
    setModalContent({ title, body });
    setModalVisible(true);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your FitMitra account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/login');
          } catch (err) {
            console.warn('[Settings] Logout error:', err?.message || err);
            router.replace('/login');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Settings & Preferences"
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <EmailVerificationBanner style={{ marginHorizontal: 0, marginBottom: 16 }} />

        {/* Section 1: Account & Profile Link */}
        <Text style={[styles.sectionHeading, { color: colors.onSurfaceVariant }]}>
          ACCOUNT
        </Text>

        <AppCard variant="elevated" padded={false} style={styles.card}>
          <Pressable
            style={styles.actionRow}
            onPress={() => router.push('/profile')}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryContainer }]}>
              <User size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.onSurface }]}>
                {user?.displayName || 'Personal Profile'}
              </Text>
              <Text style={[styles.settingSub, { color: colors.onSurfaceVariant }]}>
                Biometrics, fitness targets & experience level
              </Text>
            </View>
            <ChevronRight size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        </AppCard>

        {/* Section 2: Appearance & Theme */}
        <Text style={[styles.sectionHeading, { color: colors.onSurfaceVariant }]}>
          APPEARANCE & THEME
        </Text>

        <AppCard variant="elevated" style={styles.card}>
          <ThemeSelector />
        </AppCard>

        {/* Section 3: Real Notification Preferences */}
        <Text style={[styles.sectionHeading, { color: colors.onSurfaceVariant }]}>
          NOTIFICATION PREFERENCES
        </Text>

        <AppCard variant="elevated" padded={false} style={styles.card}>
          {loadingSettings ? (
            <View style={styles.loadingPadding}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
                Loading notification preferences...
              </Text>
            </View>
          ) : (
            <>
              {/* Workout Reminders */}
              <View style={styles.settingRow}>
                <View style={[styles.iconWrap, { backgroundColor: colors.secondaryContainer }]}>
                  <Bell size={20} color={colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: colors.onSurface }]}>
                    Workout Reminders
                  </Text>
                  <Text style={[styles.settingSub, { color: colors.onSurfaceVariant }]}>
                    Daily schedule alerts & training nudges
                  </Text>
                </View>
                <Switch
                  value={notificationSettings.workoutReminders}
                  onValueChange={(val) => handleToggleSetting('workoutReminders', val)}
                  trackColor={{ false: colors.outlineVariant, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

              {/* Points & Streak Alerts */}
              <View style={styles.settingRow}>
                <View style={[styles.iconWrap, { backgroundColor: theme.colors.secondaryContainer }]}>
                  <Activity size={20} color={theme.custom.accentText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: colors.onSurface }]}>
                    Points & Streak Alerts
                  </Text>
                  <Text style={[styles.settingSub, { color: colors.onSurfaceVariant }]}>
                    Leaderboard milestones & daily streak notifications
                  </Text>
                </View>
                <Switch
                  value={notificationSettings.pointsAlerts}
                  onValueChange={(val) => handleToggleSetting('pointsAlerts', val)}
                  trackColor={{ false: colors.outlineVariant, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

              {/* Offers & News */}
              <View style={styles.settingRow}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primaryContainer }]}>
                  <ShieldCheck size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: colors.onSurface }]}>
                    Supplements & App Updates
                  </Text>
                  <Text style={[styles.settingSub, { color: colors.onSurfaceVariant }]}>
                    Store discounts, Pro feature drops & community news
                  </Text>
                </View>
                <Switch
                  value={notificationSettings.offersAndNews}
                  onValueChange={(val) => handleToggleSetting('offersAndNews', val)}
                  trackColor={{ false: colors.outlineVariant, true: colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
            </>
          )}
        </AppCard>

        {/* Section 4: Device & Sensor Permissions */}
        <Text style={[styles.sectionHeading, { color: colors.onSurfaceVariant }]}>
          DEVICE PERMISSIONS
        </Text>

        <AppCard variant="elevated" padded={false} style={styles.card}>
          <View style={styles.settingRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <Camera size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.onSurface }]}>
                Camera Access
              </Text>
              <Text style={[styles.settingSub, { color: colors.onSurfaceVariant }]}>
                Body composition photos & profile avatar
              </Text>
            </View>
            <Switch
              value={cameraPermission}
              onValueChange={setCameraPermission}
              trackColor={{ false: colors.outlineVariant, true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

          <View style={styles.settingRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <Activity size={20} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.onSurface }]}>
                Motion & Step Counter
              </Text>
              <Text style={[styles.settingSub, { color: colors.onSurfaceVariant }]}>
                Rest timer triggers & rep tempo monitoring
              </Text>
            </View>
            <Switch
              value={motionSensors}
              onValueChange={setMotionSensors}
              trackColor={{ false: colors.outlineVariant, true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>
        </AppCard>

        {/* Section 5: Support & Legal */}
        <Text style={[styles.sectionHeading, { color: colors.onSurfaceVariant }]}>
          SUPPORT & LEGAL
        </Text>

        <AppCard variant="elevated" padded={false} style={styles.card}>
          {/* Privacy Policy */}
          <Pressable
            style={styles.actionRow}
            onPress={() =>
              showInfoModal(
                'Privacy Policy & Health Data',
                'FitMitra encrypts all biometric, workout, and nutritional records. We do not sell or share personal health metrics with advertisers. All data is processed strictly to generate customized training plans and AI Coach guidance.'
              )
            }
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <ShieldCheck size={20} color={colors.primary} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.onSurface }]}>
              Privacy Policy & Security
            </Text>
            <ChevronRight size={18} color={colors.onSurfaceVariant} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

          {/* Help & Support */}
          <Pressable
            style={styles.actionRow}
            onPress={() =>
              showInfoModal(
                'Help & Customer Support',
                'Need assistance with your subscription, workout sessions, or supplement deliveries? Contact our team at support@fitmitra.com or ask your AI Coach on the home screen for live assistance.'
              )
            }
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <HelpCircle size={20} color={colors.secondary} />
            </View>
            <Text style={[styles.actionTitle, { color: colors.onSurface }]}>
              Help & Customer Support
            </Text>
            <ChevronRight size={18} color={colors.onSurfaceVariant} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

          {/* App Version Info */}
          <View style={styles.actionRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <Info size={20} color={colors.onSurfaceVariant} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: colors.onSurface }]}>
                FitMitra App Version
              </Text>
              <Text style={[styles.settingSub, { color: colors.onSurfaceVariant }]}>
                v2.1.0 • Production Build (Expo SDK 52)
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Section 6: Sign Out */}
        <Pressable
          style={[
            styles.logoutBtn,
            {
              borderColor: colors.error,
              backgroundColor: colors.errorContainer,
            },
          ]}
          onPress={handleLogout}
        >
          <LogOut size={18} color={colors.onErrorContainer} />
          <Text style={[styles.logoutText, { color: colors.onErrorContainer }]}>
            Sign Out of Account
          </Text>
        </Pressable>

        {__DEV__ ? (
          <View style={{ marginTop: 16 }}>
            <AppButton
              label="UI Component Gallery"
              mode="outlined"
              onPress={() => router.push('/ui-gallery')}
            />
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Info Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <AppCard variant="elevated" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                {modalContent.title}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <X size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
            <Text style={[styles.modalBody, { color: colors.onSurfaceVariant }]}>
              {modalContent.body}
            </Text>
            <AppButton
              label="Got it"
              mode="contained"
              onPress={() => setModalVisible(false)}
            />
          </AppCard>
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
    paddingTop: 14,
    paddingBottom: 24,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    marginBottom: 20,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 12,
    marginTop: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  loadingPadding: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  modalBody: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 18,
  },
});
