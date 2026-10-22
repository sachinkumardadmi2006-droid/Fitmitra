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
  Crown,
  Layers,
  Package,
  Bell,
} from 'lucide-react-native';
import { TopBar } from '../../components/common/TopBar';
import { useAppTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useAppConfig } from '../../hooks/useAppConfig';
import { dashboardService } from '../../services/dashboardService';
import AppCard from '../../components/ui/AppCard';

export default function MoreHub() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors } = theme;
  const { user: authUser, profile: authProfile, logout } = useAuth();
  const { storeEnabled, shippingEnabled } = useAppConfig();

  const user = {
    displayName: authUser?.displayName || 'FitMitra Athlete',
    email: authUser?.email || 'athlete@fitmitra.com',
  };

  const profile = {
    points: authProfile?.points ?? 0,
    goal: authProfile?.goal ?? 'General Fitness',
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of FitMitra?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TopBar title="More" subtitle="Feature Hub & Preferences" icon={Layers} showCart />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Summary Card */}
        <AppCard
          variant="elevated"
          style={styles.profileCard}
          onPress={() => router.push('/profile')}
        >
          <View style={styles.profileRow}>
            <View
              style={[
                styles.avatarWrap,
                { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
              ]}
            >
              <User size={26} color={colors.onPrimaryContainer} />
            </View>

            <View style={styles.profileMetaCol}>
              <Text style={[styles.profileName, { color: colors.onSurface }]}>
                {user.displayName || 'FitMitra Athlete'}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.onSurfaceVariant }]}>
                {user.email || 'athlete@fitmitra.com'}
              </Text>

              <View style={styles.profileTagsRow}>
                <View style={[styles.goalPill, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.goalText, { color: colors.primary }]}>
                    {profile.goal || 'General Fitness'}
                  </Text>
                </View>
                <View style={[styles.pointsPill, { backgroundColor: colors.secondaryContainer }]}>
                  <Zap size={12} color={colors.secondary} fill={colors.secondary} />
                  <Text style={[styles.pointsText, { color: colors.onSecondaryContainer }]}>
                    {profile.points || 0} pts
                  </Text>
                </View>
              </View>
            </View>

            <ChevronRight size={20} color={colors.onSurfaceVariant} />
          </View>
        </AppCard>

        {/* Section 1: FitMitra Pro & Upgrades */}
        <Text style={[styles.sectionHeading, { color: colors.onSurfaceVariant }]}>
          MEMBERSHIP
        </Text>

        <AppCard variant="elevated" style={styles.hubCard}>
          <Pressable style={styles.hubItem} onPress={() => router.push('/premium')}>
            <View style={[styles.iconWrap, { backgroundColor: colors.secondaryContainer }]}>
              <Crown size={20} color={colors.secondary} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: colors.onSurface }]}>
                FitMitra PRO
              </Text>
              <Text style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>
                Free trials, workout programs & unrestricted AI Coach
              </Text>
            </View>
            <ChevronRight size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        </AppCard>

        {/* Section 2: Store & Orders */}
        <Text style={[styles.sectionHeading, { color: colors.onSurfaceVariant }]}>
          COMMERCE & REWARDS
        </Text>

        <AppCard variant="elevated" style={styles.hubCard}>
          <Pressable style={styles.hubItem} onPress={() => router.push('/store')}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryContainer }]}>
              <ShoppingBag size={20} color={colors.primary} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: colors.onSurface }]}>
                Supplements Store
              </Text>
              <Text style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>
                {storeEnabled ? 'Whey, Creatine, Oats • Redeem Points' : 'Store currently offline'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.onSurfaceVariant} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

          <Pressable style={styles.hubItem} onPress={() => router.push('/orders')}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <Package size={20} color={colors.primary} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: colors.onSurface }]}>
                My Orders & Shipping
              </Text>
              <Text style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>
                {shippingEnabled ? 'Order status & live tracking' : 'Order history & status'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        </AppCard>

        {/* Section 3: AI & Community */}
        <Text style={[styles.sectionHeading, { color: colors.onSurfaceVariant }]}>
          INTELLIGENCE & COMMUNITY
        </Text>

        <AppCard variant="elevated" style={styles.hubCard}>
          <Pressable style={styles.hubItem} onPress={() => router.push('/ai-coach')}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <Sparkles size={20} color={colors.secondary} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: colors.onSurface }]}>
                AI Fitness Coach
              </Text>
              <Text style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>
                Real-time training & nutrition guidance
              </Text>
            </View>
            <ChevronRight size={18} color={colors.onSurfaceVariant} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

          <Pressable style={styles.hubItem} onPress={() => router.push('/leaderboard')}>
            <View style={[styles.iconWrap, { backgroundColor: colors.secondaryContainer }]}>
              <Trophy size={20} color={colors.secondary} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: colors.onSurface }]}>
                Community Leaderboard
              </Text>
              <Text style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>
                Streaks & points rankings • {profile.points || 0} pts
              </Text>
            </View>
            <ChevronRight size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        </AppCard>

        {/* Section 4: Settings */}
        <Text style={[styles.sectionHeading, { color: colors.onSurfaceVariant }]}>
          PREFERENCES
        </Text>

        <AppCard variant="elevated" style={styles.hubCard}>
          <Pressable style={styles.hubItem} onPress={() => router.push('/notifications')}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryContainer }]}>
              <Bell size={20} color={colors.primary} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: colors.onSurface }]}>
                Notifications & Alerts
              </Text>
              <Text style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>
                Order updates, workout reminders & announcements
              </Text>
            </View>
            <ChevronRight size={18} color={colors.onSurfaceVariant} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

          <Pressable style={styles.hubItem} onPress={() => router.push('/settings')}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
              <Settings size={20} color={colors.onSurface} />
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: colors.onSurface }]}>
                Settings & Appearance
              </Text>
              <Text style={[styles.itemSubtitle, { color: colors.onSurfaceVariant }]}>
                Theme selection (Light/Dark/System) & Profile
              </Text>
            </View>
            <ChevronRight size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        </AppCard>

        {/* Sign Out Button */}
        <Pressable
          style={[
            styles.logoutBtn,
            { borderColor: colors.error, backgroundColor: colors.errorContainer },
          ]}
          onPress={handleLogout}
        >
          <LogOut size={18} color={colors.onErrorContainer} />
          <Text style={[styles.logoutText, { color: colors.onErrorContainer }]}>
            Sign Out of FitMitra
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  profileCard: {
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMetaCol: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  profileTagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  goalPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  goalText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pointsText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  hubCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  hubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 66,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
