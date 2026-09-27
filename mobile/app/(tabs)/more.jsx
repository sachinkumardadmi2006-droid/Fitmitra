import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Trophy,
  Sparkles,
  ShoppingBag,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Zap,
  Flame,
  Shield,
  Layers,
} from 'lucide-react-native';
import { TopBar } from '../../components/common/TopBar';
import { MaterialCard } from '../../components/common/MaterialCard';
import { useTheme } from '../../context/ThemeContext';
import { dashboardService } from '../../services/dashboardService';
import { clearAuthData } from '../../services/api';
import { emitDbUpdate } from '../../utils/events';
import { FontSize, BorderRadius } from '../../constants/theme';

export default function MoreHub() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [user, setUser] = useState({ displayName: 'Athlete', email: '' });
  const [profile, setProfile] = useState({ points: 0, goal: 'Muscle Gain' });

  useEffect(() => {
    (async () => {
      try {
        const userStr = await AsyncStorage.getItem('fitmitra_user');
        if (userStr) {
          setUser(JSON.parse(userStr));
        }
        const data = await dashboardService.getDashboard();
        if (data?.profile) {
          setProfile(data.profile);
        }
      } catch (_) {}
    })();
  }, []);

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
      {/* TopBar */}
      <TopBar title="More" subtitle="Feature Hub & Settings" icon={Layers} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Summary Card */}
        <MaterialCard
          elevated
          style={[styles.profileCard, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/profile')}
        >
          <View style={styles.profileRow}>
            <View style={[styles.avatarWrap, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
              <User size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                {user.displayName || 'FitMitra Athlete'}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {user.email || 'athlete@fitmitra.com'}
              </Text>
              <View style={styles.profileMetaRow}>
                <View style={[styles.goalPill, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={[styles.goalText, { color: colors.primary }]}>
                    {profile.goal || 'General Fitness'}
                  </Text>
                </View>
                <View style={[styles.pointsPill, { backgroundColor: colors.primary + '18' }]}>
                  <Zap size={12} color={colors.primary} />
                  <Text style={[styles.pointsPillText, { color: colors.primary }]}>
                    {profile.points || 0} pts
                  </Text>
                </View>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </View>
        </MaterialCard>

        {/* Section 1: Community & Competition */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          COMMUNITY & REWARDS
        </Text>

        <MaterialCard style={[styles.hubCard, { backgroundColor: colors.surface }]}>
          {/* Leaderboard Item */}
          <Pressable
            style={styles.hubItem}
            onPress={() => router.push('/leaderboard')}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#FFB80020' }]}>
              <Trophy size={20} color="#FFB800" />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                Community Leaderboard
              </Text>
              <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                Compete on streaks • {profile.points || 0} points
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Store Item */}
          <Pressable
            style={styles.hubItem}
            onPress={() => router.push('/store')}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
              <ShoppingBag size={20} color={colors.primary} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                FitMitra Store
              </Text>
              <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                Supplements, Whey & Gear • Shiprocket Tracking
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
        </MaterialCard>

        {/* Section 2: Coaching & Intelligence */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          INTELLIGENCE & COACHING
        </Text>

        <MaterialCard style={[styles.hubCard, { backgroundColor: colors.surface }]}>
          {/* AI Coach Item */}
          <Pressable
            style={styles.hubItem}
            onPress={() => router.push('/ai-coach')}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.secondaryCyan + '20' }]}>
              <Sparkles size={20} color={colors.secondaryCyan} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                AI Fitness Coach
              </Text>
              <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                Personalized advice • DeepSeek + LangGraph
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
        </MaterialCard>

        {/* Section 3: Preferences & System */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
          PREFERENCES & APP
        </Text>

        <MaterialCard style={[styles.hubCard, { backgroundColor: colors.surface }]}>
          {/* Settings Item */}
          <Pressable
            style={styles.hubItem}
            onPress={() => router.push('/settings')}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.accentPurple + '20' }]}>
              <Settings size={20} color={colors.accentPurple} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                Settings & Preferences
              </Text>
              <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                Dark/Light Theme • Permissions • Support
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
        </MaterialCard>

        {/* Logout Button */}
        <Pressable
          style={[styles.logoutBtn, { borderColor: colors.error + '44', backgroundColor: colors.error + '10' }]}
          onPress={handleLogout}
        >
          <LogOut size={18} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>
            Sign Out of FitMitra
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  profileCard: {
    marginBottom: 20,
    padding: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  profileEmail: {
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  goalPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  goalText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  pointsPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  hubCard: {
    padding: 4,
    marginBottom: 20,
  },
  hubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  itemSubtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: 10,
  },
  logoutText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
});
