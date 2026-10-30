import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Edit3,
  Sparkles,
  LogOut,
  Award,
  ChevronRight,
  Dumbbell,
  Utensils,
  Settings,
  ShoppingBag,
  Trophy,
  Bot,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useAppTheme } from '../../theme/ThemeContext';
import { spacing, radius } from '../../theme/tokens';
import { authService, profileService } from '../../services';
import { subscriptionService } from '../../services/subscriptionService';
import { queryKeys } from '../../constants/queryKeys';
import { useAuth } from '../../context/AuthContext';

export default function ProfileTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const { points, refreshProfile, logout } = useAuth();

  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Live subscription query
  const subQuery = useQuery({
    queryKey: queryKeys.subscriptionCurrent,
    queryFn: async () => {
      try {
        const res = await subscriptionService.getMySubscription();
        const data = res?.data || res;
        return data && (data.status === 'ACTIVE' || data.status === 'TRIALING') ? data : null;
      } catch (_) {
        return null;
      }
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const isPremiumUser = Boolean(user?.isPremium || subQuery.data);

  // Fetch real user & profile from backend
  const loadData = useCallback(async () => {
    try {
      const [u, p] = await Promise.all([
        authService.getLocalUser(),
        profileService.getProfile().catch(() => null),
      ]);
      setUser(u || {});
      setProfileData(p || {});
    } catch (e) {
      console.warn('[ProfileTab] Error loading profile:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        loadData();
      }
    });
    return () => {
      ignore = true;
    };
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadData(),
        subQuery.refetch(),
        refreshProfile?.(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadData, subQuery, refreshProfile]);

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        if (logout) {
          await logout();
        } else {
          await authService.logout();
        }
        router.replace('/login');
      } catch (err) {
        console.warn('[Profile] Logout error:', err?.message || err);
        router.replace('/login');
      }
    };

    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm('Are you sure you want to log out of FitMitra?')
          : true;
      if (confirmed) {
        await doLogout();
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out of FitMitra?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: doLogout,
        },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.custom.primaryStrong} />
        <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  // Format metric values
  const heightVal = profileData?.heightCm || user?.height || 0;
  const weightVal = profileData?.weight || profileData?.weightKg || user?.weight || user?.currentWeight || 0;
  const bmiVal =
    heightVal > 0 && weightVal > 0
      ? (weightVal / ((heightVal / 100) * (heightVal / 100))).toFixed(1)
      : null;

  // Populated fields or fallbacks
  const goalTitle =
    (typeof profileData?.selectedGoal === 'object' &&
      (profileData.selectedGoal?.title || profileData.selectedGoal?.name)) ||
    user?.programName ||
    user?.fitnessGoal ||
    'General Fitness';

  const planTitle =
    (typeof profileData?.selectedWorkoutPlan === 'object' &&
      (profileData.selectedWorkoutPlan?.name || profileData.selectedWorkoutPlan?.title)) ||
    user?.workoutPlanName ||
    null;

  const experienceLabel =
    profileData?.experienceLevel === 'BEGINNER'
      ? 'Beginner'
      : profileData?.experienceLevel === 'ADVANCED'
      ? 'Advanced'
      : 'Intermediate';

  const workoutDaysVal = profileData?.preferredWorkoutDays || user?.preferredWorkoutDays || 5;
  const workoutLocationVal = profileData?.preferredWorkoutLocation || 'GYM';
  const workoutTimeVal = profileData?.preferredWorkoutTime
    ? profileData.preferredWorkoutTime.replace('_', ' ')
    : 'MORNING';

  const dietTypeLabel =
    profileData?.dietType === 'NON_VEG' ? 'Non-Vegetarian' : 'Vegetarian';
  const dietBudgetVal = profileData?.dailyDietBudget || 250;

  const displayName = user?.displayName || user?.name || 'Athlete';
  const userInitial = (displayName || 'A')[0].toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outlineVariant,
            paddingTop: Math.max(insets.top, 14),
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          Profile
        </Text>

        <Pressable
          style={[
            styles.editPillBtn,
            {
              backgroundColor: theme.colors.primaryContainer,
              borderColor: theme.colors.primary,
            },
          ]}
          onPress={() => router.push('/edit-profile')}
          hitSlop={8}
        >
          <Edit3 size={15} color={theme.colors.onPrimaryContainer} />
          <Text style={[styles.editPillText, { color: theme.colors.onPrimaryContainer }]}>
            Edit Profile
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.custom.primaryStrong}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* User Identity Hero Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <View style={[styles.avatarCircle, { backgroundColor: theme.colors.tertiaryContainer }]}>
            <Text style={[styles.avatarLetter, { color: theme.colors.onTertiaryContainer }]}>
              {userInitial}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={[styles.heroName, { color: theme.colors.onSurface }]}>
                {displayName}
              </Text>

              {isPremiumUser ? (
                <View style={[styles.proBadge, { backgroundColor: theme.colors.secondary }]}>
                  <Sparkles size={11} color={theme.colors.onSecondary} />
                  <Text style={[styles.proBadgeText, { color: theme.colors.onSecondary }]}>
                    PRO
                  </Text>
                </View>
              ) : (
                <Pressable
                  style={[styles.freeBadge, { backgroundColor: theme.colors.surfaceVariant }]}
                  onPress={() => router.push('/premium')}
                >
                  <Text style={[styles.freeBadgeText, { color: theme.colors.onSurfaceVariant }]}>
                    FREE
                  </Text>
                </Pressable>
              )}
            </View>

            <Text style={[styles.heroEmail, { color: theme.colors.onSurfaceVariant }]}>
              {user?.email || user?.phone || 'fitmitra@app'}
            </Text>

            {profileData?.age ? (
              <Text style={[styles.heroAge, { color: theme.colors.onSurfaceVariant }]}>
                Age: {profileData.age} yrs
              </Text>
            ) : null}
          </View>
        </View>

        {/* Biometrics Summary Strip */}
        <View
          style={[
            styles.statStrip,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: theme.custom.primaryStrong }]}>
              {heightVal || '--'}
            </Text>
            <Text style={[styles.statUnit, { color: theme.colors.onSurfaceVariant }]}>cm</Text>
            <Text style={[styles.statLbl, { color: theme.colors.onSurfaceVariant }]}>Height</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.colors.outlineVariant }]} />

          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: theme.custom.primaryStrong }]}>
              {weightVal || '--'}
            </Text>
            <Text style={[styles.statUnit, { color: theme.colors.onSurfaceVariant }]}>kg</Text>
            <Text style={[styles.statLbl, { color: theme.colors.onSurfaceVariant }]}>Weight</Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.colors.outlineVariant }]} />

          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: theme.custom.primaryStrong }]}>
              {bmiVal || '--'}
            </Text>
            <Text style={[styles.statUnit, { color: theme.colors.onSurfaceVariant }]}>BMI</Text>
            <Text style={[styles.statLbl, { color: theme.colors.onSurfaceVariant }]}>
              {bmiVal
                ? parseFloat(bmiVal) < 18.5
                  ? 'Under'
                  : parseFloat(bmiVal) <= 24.9
                  ? 'Healthy'
                  : 'Over'
                : 'Index'}
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.colors.outlineVariant }]} />

          <Pressable
            style={styles.statBox}
            onPress={() => router.push('/(tabs)/store')}
            hitSlop={4}
          >
            <Text style={[styles.statVal, { color: theme.custom.accentText }]}>
              ⚡ {points || 0}
            </Text>
            <Text style={[styles.statUnit, { color: theme.custom.accentText }]}>pts</Text>
            <Text style={[styles.statLbl, { color: theme.custom.accentText }]}>Points</Text>
          </Pressable>
        </View>

        {/* PRO Membership Banner */}
        {!isPremiumUser ? (
          <Pressable
            style={[
              styles.upgradeBanner,
              {
                backgroundColor: theme.colors.secondaryContainer,
                borderColor: theme.colors.secondary,
              },
            ]}
            onPress={() => router.push('/premium')}
          >
            <View style={[styles.upgradeIcon, { backgroundColor: theme.colors.secondary }]}>
              <Sparkles size={20} color={theme.colors.onSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.upgradeTitle, { color: theme.colors.onSecondaryContainer }]}>
                Upgrade to FitMitra PRO
              </Text>
              <Text style={[styles.upgradeSub, { color: theme.colors.onSecondaryContainer }]}>
                Unlock custom diets, audio coach, video routines & analytics
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.onSecondaryContainer} />
          </Pressable>
        ) : (
          <View
            style={[
              styles.activeProCard,
              {
                backgroundColor: theme.colors.primaryContainer,
                borderColor: theme.colors.primary,
              },
            ]}
          >
            <Award size={22} color={theme.colors.onPrimaryContainer} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.activeProTitle, { color: theme.colors.onPrimaryContainer }]}>
                {subQuery.data?.planId?.name || 'FitMitra PRO Active'}
              </Text>
              <Text style={[styles.activeProSub, { color: theme.colors.onPrimaryContainer }]}>
                {subQuery.data?.currentPeriodEnd
                  ? `Valid until ${new Date(subQuery.data.currentPeriodEnd).toLocaleDateString()}`
                  : 'Unlimited access to all workouts, recipes & training plans'}
              </Text>
            </View>
          </View>
        )}

        {/* Section: Training & Workout Roadmap */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Dumbbell size={18} color={theme.custom.primaryStrong} />
              <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                Training Plan
              </Text>
            </View>

            <Pressable onPress={() => router.push('/edit-profile')} hitSlop={6}>
              <Text style={[styles.cardActionText, { color: theme.custom.primaryStrong }]}>
                Change
              </Text>
            </Pressable>
          </View>

          <View style={styles.cardGrid}>
            <View style={styles.gridItem}>
              <Text style={[styles.gridLabel, { color: theme.colors.onSurfaceVariant }]}>
                Goal Program
              </Text>
              <Text style={[styles.gridValue, { color: theme.colors.onSurface }]}>
                {goalTitle}
              </Text>
            </View>

            {planTitle && (
              <View style={styles.gridItem}>
                <Text style={[styles.gridLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Workout Plan
                </Text>
                <Text style={[styles.gridValue, { color: theme.colors.onSurface }]}>
                  {planTitle}
                </Text>
              </View>
            )}

            <View style={styles.gridItem}>
              <Text style={[styles.gridLabel, { color: theme.colors.onSurfaceVariant }]}>
                Experience
              </Text>
              <Text style={[styles.gridValue, { color: theme.colors.onSurface }]}>
                {experienceLabel}
              </Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={[styles.gridLabel, { color: theme.colors.onSurfaceVariant }]}>
                Schedule
              </Text>
              <Text style={[styles.gridValue, { color: theme.colors.onSurface }]}>
                {workoutDaysVal} days/week • {workoutLocationVal}
              </Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={[styles.gridLabel, { color: theme.colors.onSurfaceVariant }]}>
                Preferred Time
              </Text>
              <Text style={[styles.gridValue, { color: theme.colors.onSurface }]}>
                {workoutTimeVal}
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Nutrition & Lifestyle */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Utensils size={18} color={theme.custom.primaryStrong} />
              <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                Nutrition Preferences
              </Text>
            </View>

            <Pressable onPress={() => router.push('/edit-profile')} hitSlop={6}>
              <Text style={[styles.cardActionText, { color: theme.custom.primaryStrong }]}>
                Edit
              </Text>
            </Pressable>
          </View>

          <View style={styles.cardGrid}>
            <View style={styles.gridItem}>
              <Text style={[styles.gridLabel, { color: theme.colors.onSurfaceVariant }]}>
                Diet Preference
              </Text>
              <Text style={[styles.gridValue, { color: theme.colors.onSurface }]}>
                {dietTypeLabel}
              </Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={[styles.gridLabel, { color: theme.colors.onSurfaceVariant }]}>
                Target Daily Budget
              </Text>
              <Text style={[styles.gridValue, { color: theme.colors.onSurface }]}>
                ₹{dietBudgetVal} / day
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Hub Navigation Links */}
        <View
          style={[
            styles.menuCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Pressable
            style={styles.menuRow}
            onPress={() => router.push('/settings')}
          >
            <View style={styles.menuLeft}>
              <Settings size={18} color={theme.colors.onSurface} />
              <Text style={[styles.menuTitle, { color: theme.colors.onSurface }]}>
                App Settings & Notifications
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.onSurfaceVariant} />
          </Pressable>

          <View style={[styles.menuDivider, { backgroundColor: theme.colors.outlineVariant }]} />

          <Pressable
            style={styles.menuRow}
            onPress={() => router.push('/orders')}
          >
            <View style={styles.menuLeft}>
              <ShoppingBag size={18} color={theme.colors.onSurface} />
              <Text style={[styles.menuTitle, { color: theme.colors.onSurface }]}>
                My Store Orders
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.onSurfaceVariant} />
          </Pressable>

          <View style={[styles.menuDivider, { backgroundColor: theme.colors.outlineVariant }]} />

          <Pressable
            style={styles.menuRow}
            onPress={() => router.push('/leaderboard')}
          >
            <View style={styles.menuLeft}>
              <Trophy size={18} color={theme.colors.onSurface} />
              <Text style={[styles.menuTitle, { color: theme.colors.onSurface }]}>
                Leaderboard & Streaks
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.onSurfaceVariant} />
          </Pressable>

          <View style={[styles.menuDivider, { backgroundColor: theme.colors.outlineVariant }]} />

          <Pressable
            style={styles.menuRow}
            onPress={() => router.push('/ai-coach')}
          >
            <View style={styles.menuLeft}>
              <Bot size={18} color={theme.colors.onSurface} />
              <Text style={[styles.menuTitle, { color: theme.colors.onSurface }]}>
                AI Fitness Coach
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.onSurfaceVariant} />
          </Pressable>
        </View>

        {/* Log Out Action */}
        <Pressable
          style={[
            styles.logoutBtn,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
          onPress={handleLogout}
        >
          <LogOut size={18} color={theme.colors.error} />
          <Text style={[styles.logoutText, { color: theme.colors.error }]}>
            Log Out
          </Text>
        </Pressable>

        <Text style={[styles.versionText, { color: theme.colors.onSurfaceVariant }]}>
          FitMitra App v2.4.0 • Real Fitness & Nutrition
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  editPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  editPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  contentContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  heroCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: '800',
  },
  heroName: {
    fontSize: 18,
    fontWeight: '700',
  },
  heroEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  heroAge: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  freeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statStrip: {
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  statUnit: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: -2,
  },
  statLbl: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  upgradeBanner: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  upgradeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  upgradeSub: {
    fontSize: 11,
    marginTop: 2,
  },
  activeProCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activeProTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  activeProSub: {
    fontSize: 11,
    marginTop: 2,
  },
  infoCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '47%',
    gap: 2,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  menuCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 44,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 46,
    marginTop: spacing.xs,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: spacing.xs,
  },
});
