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
  Platform,
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
  Clock,
  Moon,
  Dumbbell,
  UtensilsCrossed,
  Trophy,
  Flame,
  Zap,
  Package,
  Crown,
  Tag,
  Globe,
  RefreshCw,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { queryKeys } from '../constants/queryKeys';
import { useAppTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import { notificationService } from '../services/notificationService';
import AppHeader from '../components/ui/AppHeader';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import ThemeSelector from '../components/ui/ThemeSelector';
import { EmailVerificationBanner } from '../components/auth';

const NOTIF_CATEGORIES = [
  { key: 'workout', label: 'Workouts', desc: 'Daily workout training reminders', Icon: Dumbbell },
  { key: 'nutrition', label: 'Nutrition', desc: 'Breakfast, lunch & dinner logging alerts', Icon: UtensilsCrossed },
  { key: 'challenges', label: 'Challenges', desc: 'New challenges & 24h expiration reminders', Icon: Trophy },
  { key: 'streak', label: 'Daily Streak', desc: 'At-risk evening alerts & milestones', Icon: Flame },
  { key: 'points', label: 'FitCoins & Points', desc: 'Points awarded & rewards updates', Icon: Zap },
  { key: 'orders', label: 'Orders & Deliveries', desc: 'Purchases, tracking & order confirmations', Icon: Package },
  { key: 'subscription', label: 'Subscriptions', desc: 'Membership status & plan renewals', Icon: Crown },
  { key: 'promotions', label: 'Offers & Updates', desc: 'Store discounts & community announcements', Icon: Tag },
  { key: 'system', label: 'System & Security', desc: 'Security updates & account alerts', Icon: ShieldCheck },
];

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const { colors } = theme;
  const { logout, user } = useAuth();

  // Local device preference indicators
  const [cameraPermission, setCameraPermission] = useState(true);
  const [motionSensors, setMotionSensors] = useState(true);

  // Granular notification preferences query & mutation
  const {
    data: notifPrefsData,
    isLoading: loadingNotifPrefs,
  } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const res = await notificationService.getNotificationPreferences();
      return res || {};
    },
  });

  const updateNotifPrefsMutation = useMutation({
    mutationFn: (patch) => notificationService.updateNotificationPreferences(patch),
    onSuccess: (updated) => {
      queryClient.setQueryData(['notificationPreferences'], (old) => ({
        ...(old || {}),
        ...(updated || {}),
      }));
    },
    onError: (err) => {
      console.warn('[Settings] Failed to update preferences:', err?.message || err);
      Alert.alert('Update Failed', 'Could not save notification preferences. Please try again.');
    },
  });

  const [pickerConfig, setPickerConfig] = useState({
    visible: false,
    field: null,
    date: new Date(),
  });

  const openTimePicker = (field, currentTimeStr) => {
    if (Platform.OS === 'web') {
      const val = typeof window !== 'undefined' ? window.prompt('Enter time (HH:mm in 24h format):', currentTimeStr || '08:00') : null;
      if (val && /^([01]\d|2[0-3]):([0-5]\d)$/.test(val.trim())) {
        const timeStr = val.trim();
        if (field === 'quietStart') {
          updateNotifPrefsMutation.mutate({
            quietHours: { ...(notifPrefsData?.quietHours || {}), start: timeStr },
          });
        } else if (field === 'quietEnd') {
          updateNotifPrefsMutation.mutate({
            quietHours: { ...(notifPrefsData?.quietHours || {}), end: timeStr },
          });
        } else {
          updateNotifPrefsMutation.mutate({
            notificationSchedule: { ...(notifPrefsData?.notificationSchedule || {}), [field]: timeStr },
          });
        }
      }
      return;
    }
    const d = new Date();
    if (currentTimeStr) {
      const [h, m] = currentTimeStr.split(':').map(Number);
      d.setHours(h || 0, m || 0, 0, 0);
    }
    setPickerConfig({
      visible: true,
      field,
      date: d,
    });
  };

  const onTimeChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setPickerConfig((prev) => ({ ...prev, visible: false }));
    }
    if (event.type === 'dismissed' || !selectedDate) return;

    const h = String(selectedDate.getHours()).padStart(2, '0');
    const m = String(selectedDate.getMinutes()).padStart(2, '0');
    const timeStr = `${h}:${m}`;

    if (pickerConfig.field === 'quietStart') {
      updateNotifPrefsMutation.mutate({
        quietHours: {
          ...(notifPrefsData?.quietHours || {}),
          start: timeStr,
        },
      });
    } else if (pickerConfig.field === 'quietEnd') {
      updateNotifPrefsMutation.mutate({
        quietHours: {
          ...(notifPrefsData?.quietHours || {}),
          end: timeStr,
        },
      });
    } else if (pickerConfig.field) {
      updateNotifPrefsMutation.mutate({
        notificationSchedule: {
          ...(notifPrefsData?.notificationSchedule || {}),
          [pickerConfig.field]: timeStr,
        },
      });
    }
  };

  const handleToggleChannel = (categoryKey, channelKey, value) => {
    const currentMatrix = notifPrefsData?.notificationPreferences || {};
    const catPrefs = currentMatrix[categoryKey] || { inApp: true, push: true };
    const updatedMatrix = {
      ...currentMatrix,
      [categoryKey]: {
        ...catPrefs,
        [channelKey]: value,
      },
    };
    updateNotifPrefsMutation.mutate({
      notificationPreferences: updatedMatrix,
    });
  };

  const handleToggleQuietHours = (value) => {
    const current = notifPrefsData?.quietHours || { start: '22:00', end: '06:00' };
    updateNotifPrefsMutation.mutate({
      quietHours: {
        ...current,
        enabled: value,
      },
    });
  };

  const handleSyncTimezone = async () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      updateNotifPrefsMutation.mutate({ timezone: tz });
      Alert.alert('Timezone Synced', `Notification timezone set to: ${tz}`);
    }
  };

  // Informational modals
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', body: '' });

  const showInfoModal = (title, body) => {
    setModalContent({ title, body });
    setModalVisible(true);
  };

  const handleLogout = () => {
    const doLogout = async () => {
      try {
        await logout();
        router.replace('/login');
      } catch (err) {
        console.warn('[Settings] Logout error:', err?.message || err);
        router.replace('/login');
      }
    };

    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm('Are you sure you want to sign out of your FitMitra account?')
          : true;
      if (confirmed) {
        doLogout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out of your FitMitra account?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: doLogout,
        },
      ]);
    }
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

        {/* Section 3: Notification Preferences & Timezone */}
        <Text style={[styles.sectionHeading, { color: colors.onSurfaceVariant }]}>
          NOTIFICATION TIMING & QUIET HOURS
        </Text>

        <AppCard variant="elevated" padded={false} style={styles.card}>
          {loadingNotifPrefs ? (
            <View style={styles.loadingPadding}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
                Loading notification preferences...
              </Text>
            </View>
          ) : (
            <>
              {/* Timezone Row */}
              <View style={styles.settingRow}>
                <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
                  <Globe size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: colors.onSurface }]}>
                    Timezone
                  </Text>
                  <Text style={[styles.settingSub, { color: colors.onSurfaceVariant }]}>
                    {notifPrefsData?.timezone || 'UTC'}
                  </Text>
                </View>
                <Pressable
                  style={[styles.syncPill, { backgroundColor: colors.primaryContainer }]}
                  onPress={handleSyncTimezone}
                >
                  <RefreshCw size={13} color={colors.primary} />
                  <Text style={[styles.syncPillText, { color: colors.primary }]}>Sync</Text>
                </Pressable>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

              {/* Quiet Hours Switch */}
              <View style={styles.settingRow}>
                <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
                  <Moon size={20} color={colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: colors.onSurface }]}>
                    Quiet Hours
                  </Text>
                  <Text style={[styles.settingSub, { color: colors.onSurfaceVariant }]}>
                    Mute push alerts during rest hours
                  </Text>
                </View>
                <Switch
                  value={notifPrefsData?.quietHours?.enabled ?? false}
                  onValueChange={handleToggleQuietHours}
                  trackColor={{ false: colors.outlineVariant, true: colors.primary }}
                  thumbColor="#FFFFFF"
                  activeThumbColor="#FFFFFF"
                  ios_backgroundColor={colors.outlineVariant}
                />
              </View>

              {/* Quiet Hours Time Slots */}
              {notifPrefsData?.quietHours?.enabled ? (
                <>
                  <View style={styles.quietHoursTimesRow}>
                    <View style={styles.quietTimeBlock}>
                      <Text style={[styles.quietTimeLabel, { color: colors.onSurfaceVariant }]}>Starts at</Text>
                      <Pressable
                        style={[styles.timePill, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceVariant }]}
                        onPress={() => openTimePicker('quietStart', notifPrefsData?.quietHours?.start || '22:00')}
                      >
                        <Clock size={14} color={colors.primary} />
                        <Text style={[styles.timePillText, { color: colors.onSurface }]}>
                          {notifPrefsData?.quietHours?.start || '22:00'}
                        </Text>
                      </Pressable>
                    </View>

                    <Text style={{ color: colors.onSurfaceVariant, fontWeight: '700' }}>to</Text>

                    <View style={styles.quietTimeBlock}>
                      <Text style={[styles.quietTimeLabel, { color: colors.onSurfaceVariant }]}>Ends at</Text>
                      <Pressable
                        style={[styles.timePill, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceVariant }]}
                        onPress={() => openTimePicker('quietEnd', notifPrefsData?.quietHours?.end || '06:00')}
                      >
                        <Clock size={14} color={colors.primary} />
                        <Text style={[styles.timePillText, { color: colors.onSurface }]}>
                          {notifPrefsData?.quietHours?.end || '06:00'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  <Text style={[styles.helperNotice, { color: colors.onSurfaceVariant }]}>
                    Orders, security and subscription push alerts always bypass quiet hours.
                  </Text>
                </>
              ) : null}
            </>
          )}
        </AppCard>

        {/* Section 3b: Daily Reminders Schedule */}
        <Text style={[styles.sectionHeading, { color: colors.onSurfaceVariant }]}>
          DAILY REMINDER SCHEDULE
        </Text>

        <AppCard variant="elevated" padded={false} style={styles.card}>
          {/* Workout Time */}
          <View style={styles.settingRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <Dumbbell size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.onSurface }]}>
                Workout Reminder
              </Text>
              <Text style={[styles.settingSub, { color: colors.onSurfaceVariant }]}>
                Preferred daily training time
              </Text>
            </View>
            <Pressable
              style={[styles.timePill, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceVariant }]}
              onPress={() => openTimePicker('workoutTime', notifPrefsData?.notificationSchedule?.workoutTime || '08:00')}
            >
              <Clock size={14} color={colors.primary} />
              <Text style={[styles.timePillText, { color: colors.onSurface }]}>
                {notifPrefsData?.notificationSchedule?.workoutTime || '08:00'}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

          {/* Breakfast Time */}
          <View style={styles.settingRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <UtensilsCrossed size={20} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.onSurface }]}>
                Breakfast Reminder
              </Text>
              <Text style={[styles.settingSub, { color: colors.onSurfaceVariant }]}>
                Morning meal logging nudge
              </Text>
            </View>
            <Pressable
              style={[styles.timePill, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceVariant }]}
              onPress={() => openTimePicker('breakfastTime', notifPrefsData?.notificationSchedule?.breakfastTime || '08:30')}
            >
              <Clock size={14} color={colors.secondary} />
              <Text style={[styles.timePillText, { color: colors.onSurface }]}>
                {notifPrefsData?.notificationSchedule?.breakfastTime || '08:30'}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

          {/* Lunch Time */}
          <View style={styles.settingRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <UtensilsCrossed size={20} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.onSurface }]}>
                Lunch Reminder
              </Text>
              <Text style={[styles.settingSub, { color: colors.onSurfaceVariant }]}>
                Afternoon meal logging nudge
              </Text>
            </View>
            <Pressable
              style={[styles.timePill, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceVariant }]}
              onPress={() => openTimePicker('lunchTime', notifPrefsData?.notificationSchedule?.lunchTime || '13:00')}
            >
              <Clock size={14} color={colors.secondary} />
              <Text style={[styles.timePillText, { color: colors.onSurface }]}>
                {notifPrefsData?.notificationSchedule?.lunchTime || '13:00'}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

          {/* Dinner Time */}
          <View style={styles.settingRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <UtensilsCrossed size={20} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: colors.onSurface }]}>
                Dinner Reminder
              </Text>
              <Text style={[styles.settingSub, { color: colors.onSurfaceVariant }]}>
                Evening meal logging nudge
              </Text>
            </View>
            <Pressable
              style={[styles.timePill, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceVariant }]}
              onPress={() => openTimePicker('dinnerTime', notifPrefsData?.notificationSchedule?.dinnerTime || '20:00')}
            >
              <Clock size={14} color={colors.secondary} />
              <Text style={[styles.timePillText, { color: colors.onSurface }]}>
                {notifPrefsData?.notificationSchedule?.dinnerTime || '20:00'}
              </Text>
            </Pressable>
          </View>
        </AppCard>

        {/* Section 3c: Notification Channels Matrix */}
        <Text style={[styles.sectionHeading, { color: colors.onSurfaceVariant }]}>
          NOTIFICATION CHANNELS BY CATEGORY
        </Text>

        <AppCard variant="elevated" padded={false} style={styles.card}>
          {NOTIF_CATEGORIES.map((cat, index) => {
            const matrix = notifPrefsData?.notificationPreferences || {};
            const catPref = matrix[cat.key] || {
              inApp: true,
              push: cat.key === 'promotions' ? false : true,
            };
            return (
              <React.Fragment key={cat.key}>
                {index > 0 ? (
                  <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
                ) : null}
                <View style={styles.matrixRow}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
                    <cat.Icon size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.settingTitle, { color: colors.onSurface }]}>
                      {cat.label}
                    </Text>
                    <Text style={[styles.settingSub, { color: colors.onSurfaceVariant }]}>
                      {cat.desc}
                    </Text>
                  </View>
                  <View style={styles.channelSwitchesWrap}>
                    <View style={styles.channelCol}>
                      <Text style={[styles.channelLabel, { color: colors.onSurfaceVariant }]}>
                        In-App
                      </Text>
                      <Switch
                        value={catPref.inApp ?? true}
                        onValueChange={(val) => handleToggleChannel(cat.key, 'inApp', val)}
                        trackColor={{ false: colors.outlineVariant, true: colors.primary }}
                        thumbColor="#FFFFFF"
                        activeThumbColor="#FFFFFF"
                      />
                    </View>
                    <View style={styles.channelCol}>
                      <Text style={[styles.channelLabel, { color: colors.onSurfaceVariant }]}>
                        Push
                      </Text>
                      <Switch
                        value={catPref.push ?? (cat.key === 'promotions' ? false : true)}
                        onValueChange={(val) => handleToggleChannel(cat.key, 'push', val)}
                        trackColor={{ false: colors.outlineVariant, true: colors.primary }}
                        thumbColor="#FFFFFF"
                        activeThumbColor="#FFFFFF"
                      />
                    </View>
                  </View>
                </View>
              </React.Fragment>
            );
          })}
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
              thumbColor="#FFFFFF"
              activeThumbColor="#FFFFFF"
              ios_backgroundColor={colors.outlineVariant}
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
              thumbColor="#FFFFFF"
              activeThumbColor="#FFFFFF"
              ios_backgroundColor={colors.outlineVariant}
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

      {/* DateTimePicker for time picking on iOS/Android */}
      {pickerConfig.visible && Platform.OS !== 'web' && (
        <DateTimePicker
          value={pickerConfig.date}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}

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
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  timePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  syncPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quietHoursTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  quietTimeBlock: {
    alignItems: 'center',
    gap: 4,
  },
  quietTimeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  channelSwitchesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  channelCol: {
    alignItems: 'center',
    gap: 4,
  },
  channelLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  helperNotice: {
    fontSize: 11,
    paddingHorizontal: 16,
    paddingBottom: 12,
    lineHeight: 16,
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
