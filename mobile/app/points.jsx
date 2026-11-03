import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Zap,
  Trophy,
  Flame,
  Utensils,
  Dumbbell,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Clock,
  Lock,
  Bell,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Sparkle,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../constants/queryKeys';
import { profileService } from '../services/profileService';
import { workoutService } from '../services/workoutService';
import { nutritionService } from '../services/nutritionService';
import { challengeService } from '../services/challengeService';
import AppHeader from '../components/ui/AppHeader';
import AppCard from '../components/ui/AppCard';

// Athletic Tier Calculations
const getTierInfo = (points = 0) => {
  if (points >= 2000) {
    return { name: 'Mitra Legend', level: 4, min: 2000, next: 5000, color: '#F59E0B' };
  }
  if (points >= 750) {
    return { name: 'Pro Athlete', level: 3, min: 750, next: 2000, color: '#8B5CF6' };
  }
  if (points >= 250) {
    return { name: 'Active Mitra', level: 2, min: 250, next: 750, color: '#3B82F6' };
  }
  return { name: 'Rookie Athlete', level: 1, min: 0, next: 250, color: '#10B981' };
};

// Format Date key (YYYY-MM-DD) in Asia/Kolkata
const getTodayDateKey = () => {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    return `${y}-${m}-${d}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

export default function PointsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors } = theme;
  const { profile, refreshProfile } = useAuth();

  const [notified, setNotified] = useState(false);
  const todayKey = getTodayDateKey();

  // 1. Points History Query
  const pointsHistoryQuery = useQuery({
    queryKey: queryKeys.pointsHistory,
    queryFn: async () => {
      try {
        const res = await profileService.getPointsHistory({ limit: 15 });
        return Array.isArray(res) ? res : res?.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 30 * 1000,
  });

  // 2. Today's Workout Status Query
  const workoutHistoryQuery = useQuery({
    queryKey: queryKeys.workoutHistory(5),
    queryFn: async () => {
      try {
        const res = await workoutService.getWorkoutHistory({ limit: 5 });
        return res?.items || res || [];
      } catch {
        return [];
      }
    },
    staleTime: 60 * 1000,
  });

  // 3. Today's Nutrition Log Query
  const nutritionQuery = useQuery({
    queryKey: queryKeys.nutritionLogs(todayKey),
    queryFn: async () => {
      try {
        const res = await nutritionService.getNutritionLogs(todayKey);
        return res || null;
      } catch {
        return null;
      }
    },
    staleTime: 30 * 1000,
  });

  // 4. Active Challenges Query
  const activeChallengesQuery = useQuery({
    queryKey: queryKeys.challengesActive,
    queryFn: async () => {
      try {
        const res = await challengeService.getActiveChallenges();
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    staleTime: 60 * 1000,
  });

  const points = profile?.points ?? 0;
  const streak = profile?.streak ?? 0;
  const tier = getTierInfo(points);
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((points - tier.min) / (tier.next - tier.min)) * 100))
  );

  // Check today's workout completion
  const recentWorkouts = workoutHistoryQuery.data || [];
  const hasCompletedWorkoutToday = recentWorkouts.some((w) => {
    const sessionDate = (w.dateKey || w.completedAt || w.createdAt || '').slice(0, 10);
    return sessionDate === todayKey && (w.status === 'COMPLETED' || w.durationSeconds >= 120);
  });

  // Check today's nutrition targets
  const nutritionLog = nutritionQuery.data;
  const targets = nutritionLog?.targets || { calories: 2000, protein: 120, carbs: 220, fat: 60 };
  const totals = nutritionLog?.totals || nutritionLog?.dailyTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const targetReached = Boolean(
    nutritionLog?.targetReached ||
      (targets.calories > 0 &&
        totals.calories >= targets.calories * 0.95 &&
        (targets.protein <= 0 || totals.protein >= targets.protein * 0.9))
  );

  const historyItems = pointsHistoryQuery.data || [];
  const refreshing =
    pointsHistoryQuery.isRefetching ||
    workoutHistoryQuery.isRefetching ||
    nutritionQuery.isRefetching;

  const onRefresh = useCallback(async () => {
    await Promise.all([
      refreshProfile(),
      pointsHistoryQuery.refetch(),
      workoutHistoryQuery.refetch(),
      nutritionQuery.refetch(),
      activeChallengesQuery.refetch(),
    ]);
  }, [refreshProfile, pointsHistoryQuery, workoutHistoryQuery, nutritionQuery, activeChallengesQuery]);

  const handleNotifyToggle = () => {
    setNotified((prev) => !prev);
    Alert.alert(
      !notified ? 'Rewards Alert Set!' : 'Notifications Muted',
      !notified
        ? 'You will receive an instant notification when the Rewards Store and redemption open.'
        : 'You have unsubscribed from reward launch notifications.'
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Mitra Points"
        subtitle="Earn, level up & unlock perks"
        showBack
        rightAction={
          <Pressable
            onPress={() => router.push('/leaderboard')}
            style={[styles.headerIconBtn, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
            hitSlop={8}
            accessibilityLabel="Leaderboard"
          >
            <Trophy size={18} color={colors.primary} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HERO BALANCE CARD */}
        <AppCard variant="elevated" style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>CURRENT BALANCE</Text>
              <View style={styles.pointsDisplayRow}>
                <Zap size={30} color={colors.primary} fill={colors.primary} />
                <Text style={[styles.pointsHeroNumber, { color: colors.textPrimary }]}>{points}</Text>
                <Text style={[styles.pointsHeroPts, { color: colors.primary }]}>pts</Text>
              </View>
            </View>

            <View style={[styles.tierBadge, { backgroundColor: `${tier.color}18`, borderColor: tier.color }]}>
              <Sparkles size={14} color={tier.color} style={{ marginRight: 4 }} />
              <Text style={[styles.tierText, { color: tier.color }]}>{tier.name}</Text>
            </View>
          </View>

          {/* Tier Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
                {tier.next - points > 0 ? `${tier.next - points} pts to next rank` : 'Top Rank Achieved!'}
              </Text>
              <Text style={[styles.progressPercent, { color: colors.textSecondary }]}>{progressPercent}%</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceVariant || '#27272A' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
          </View>

          {/* Quick Stats Footer */}
          <View style={[styles.heroStatsRow, { borderTopColor: colors.borderLight }]}>
            <View style={styles.heroStatItem}>
              <Flame size={16} color="#F97316" />
              <Text style={[styles.heroStatText, { color: colors.textPrimary }]}>{streak} Day Streak</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
            <Pressable
              style={styles.heroStatItem}
              onPress={() => router.push('/leaderboard')}
              hitSlop={6}
            >
              <Trophy size={16} color={colors.primary} />
              <Text style={[styles.heroStatText, { color: colors.primary }]}>Community Rank</Text>
              <ChevronRight size={14} color={colors.primary} />
            </Pressable>
          </View>
        </AppCard>

        {/* 2. HOW TO EARN POINTS (REAL ACTIVE BACKEND RULES) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Ways to Earn Points</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Complete your daily fitness and nutrition goals
          </Text>
        </View>

        {/* Quest 1: Daily Workout */}
        <AppCard
          variant="outlined"
          style={[
            styles.questCard,
            {
              backgroundColor: colors.surface,
              borderColor: hasCompletedWorkoutToday ? '#10B981' : colors.borderLight,
            },
          ]}
        >
          <View style={styles.questHeader}>
            <View style={[styles.questIconBox, { backgroundColor: '#F9731618' }]}>
              <Dumbbell size={22} color="#F97316" />
            </View>
            <View style={styles.questTitleBox}>
              <View style={styles.questTitleRow}>
                <Text style={[styles.questTitle, { color: colors.textPrimary }]}>Daily Workout Session</Text>
                <View style={[styles.pointBadge, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[styles.pointBadgeText, { color: colors.onPrimaryContainer }]}>+5 pts</Text>
                </View>
              </View>
              <Text style={[styles.questDesc, { color: colors.textSecondary }]}>
                Complete at least one routine or 2 minutes of logged training today.
              </Text>
            </View>
          </View>

          <View style={[styles.questActionRow, { borderTopColor: colors.borderLight }]}>
            {hasCompletedWorkoutToday ? (
              <View style={styles.completedTag}>
                <CheckCircle2 size={16} color="#10B981" />
                <Text style={styles.completedTagText}>Earned +5 pts today</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => router.push('/(tabs)/workouts')}
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>Start Workout</Text>
                <ArrowRight size={14} color={colors.onPrimary} style={{ marginLeft: 4 }} />
              </Pressable>
            )}
          </View>
        </AppCard>

        {/* Quest 2: Daily Nutrition Targets */}
        <AppCard
          variant="outlined"
          style={[
            styles.questCard,
            {
              backgroundColor: colors.surface,
              borderColor: targetReached ? '#10B981' : colors.borderLight,
            },
          ]}
        >
          <View style={styles.questHeader}>
            <View style={[styles.questIconBox, { backgroundColor: '#10B98118' }]}>
              <Utensils size={22} color="#10B981" />
            </View>
            <View style={styles.questTitleBox}>
              <View style={styles.questTitleRow}>
                <Text style={[styles.questTitle, { color: colors.textPrimary }]}>Daily Nutrient Targets</Text>
                <View style={[styles.pointBadge, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[styles.pointBadgeText, { color: colors.onPrimaryContainer }]}>+5 pts</Text>
                </View>
              </View>
              <Text style={[styles.questDesc, { color: colors.textSecondary }]}>
                Hit your daily targets for calories, protein, carbs, and fats.
              </Text>

              {/* Mini Macro Breakdown */}
              <View style={[styles.macroPillRow, { backgroundColor: colors.surfaceVariant || '#27272A' }]}>
                <Text style={[styles.macroPillText, { color: colors.textSecondary }]}>
                  Cal: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{Math.round(totals.calories)}</Text>/{targets.calories}
                </Text>
                <Text style={[styles.macroPillText, { color: colors.textSecondary }]}>
                  P: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{Math.round(totals.protein)}g</Text>/{targets.protein}g
                </Text>
                <Text style={[styles.macroPillText, { color: colors.textSecondary }]}>
                  C: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{Math.round(totals.carbs)}g</Text>/{targets.carbs}g
                </Text>
                <Text style={[styles.macroPillText, { color: colors.textSecondary }]}>
                  F: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{Math.round(totals.fat)}g</Text>/{targets.fat}g
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.questActionRow, { borderTopColor: colors.borderLight }]}>
            {targetReached ? (
              <View style={styles.completedTag}>
                <CheckCircle2 size={16} color="#10B981" />
                <Text style={styles.completedTagText}>Targets Reached (+5 pts earned)</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => router.push('/(tabs)/nutrition')}
                style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant || '#3F3F46' }]}
              >
                <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Log Meals</Text>
                <ArrowRight size={14} color={colors.textPrimary} style={{ marginLeft: 4 }} />
              </Pressable>
            )}
          </View>
        </AppCard>

        {/* Quest 3: Challenges */}
        <AppCard variant="outlined" style={[styles.questCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={styles.questHeader}>
            <View style={[styles.questIconBox, { backgroundColor: '#8B5CF618' }]}>
              <Trophy size={22} color="#8B5CF6" />
            </View>
            <View style={styles.questTitleBox}>
              <View style={styles.questTitleRow}>
                <Text style={[styles.questTitle, { color: colors.textPrimary }]}>Community Challenges</Text>
                <View style={[styles.pointBadge, { backgroundColor: '#8B5CF622' }]}>
                  <Text style={[styles.pointBadgeText, { color: '#A78BFA' }]}>+50 to +300 pts</Text>
                </View>
              </View>
              <Text style={[styles.questDesc, { color: colors.textSecondary }]}>
                Participate in Day Streak challenges or upload verified exercise proof submissions.
              </Text>
            </View>
          </View>

          <View style={[styles.questActionRow, { borderTopColor: colors.borderLight }]}>
            <Pressable
              onPress={() => router.push('/challenges')}
              style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]}
            >
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Explore Challenges</Text>
              <ArrowRight size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </Pressable>
          </View>
        </AppCard>

        {/* 3. COMING SOON: REDEEM REWARDS */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <View style={styles.comingSoonHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Redeem Rewards</Text>
            <View style={styles.comingSoonBadge}>
              <Lock size={12} color="#F59E0B" />
              <Text style={styles.comingSoonBadgeText}>COMING SOON</Text>
            </View>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Redemption will open soon for store discounts, AI tools & subscriptions
          </Text>
        </View>

        <AppCard
          variant="elevated"
          style={[styles.rewardsTeaserCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
        >
          {/* Teaser 1 */}
          <View style={styles.teaserItem}>
            <View style={[styles.teaserIconWrap, { backgroundColor: colors.primaryContainer }]}>
              <ShoppingBag size={18} color={colors.primary} />
            </View>
            <View style={styles.teaserContent}>
              <Text style={[styles.teaserTitle, { color: colors.textPrimary }]}>10% - 25% Off Store Gear</Text>
              <Text style={[styles.teaserSub, { color: colors.textSecondary }]}>
                Redeem points for flat discounts on supplements, gym wear & accessories.
              </Text>
            </View>
          </View>

          <View style={[styles.teaserDivider, { backgroundColor: colors.borderLight }]} />

          {/* Teaser 2 */}
          <View style={styles.teaserItem}>
            <View style={[styles.teaserIconWrap, { backgroundColor: '#8B5CF622' }]}>
              <Sparkle size={18} color="#8B5CF6" />
            </View>
            <View style={styles.teaserContent}>
              <Text style={[styles.teaserTitle, { color: colors.textPrimary }]}>AI Coach Pro Passes</Text>
              <Text style={[styles.teaserSub, { color: colors.textSecondary }]}>
                Unlock premium personalized AI meal plans and hyper-specific workout splits.
              </Text>
            </View>
          </View>

          <View style={[styles.teaserDivider, { backgroundColor: colors.borderLight }]} />

          {/* Teaser 3 */}
          <View style={styles.teaserItem}>
            <View style={[styles.teaserIconWrap, { backgroundColor: '#10B98122' }]}>
              <ShieldCheck size={18} color="#10B981" />
            </View>
            <View style={styles.teaserContent}>
              <Text style={[styles.teaserTitle, { color: colors.textPrimary }]}>Free Pro Membership Days</Text>
              <Text style={[styles.teaserSub, { color: colors.textSecondary }]}>
                Trade points for 7-day or 30-day FitMitra Pro upgrades without credit card.
              </Text>
            </View>
          </View>

          {/* Notify Me Toggle */}
          <Pressable
            onPress={handleNotifyToggle}
            style={[
              styles.notifyBtn,
              {
                borderColor: notified ? '#10B981' : colors.primary,
                backgroundColor: notified ? '#10B98115' : colors.primaryGlow,
              },
            ]}
          >
            <Bell size={16} color={notified ? '#10B981' : colors.primary} />
            <Text style={[styles.notifyBtnText, { color: notified ? '#10B981' : colors.primary }]}>
              {notified ? 'Reward Notifications Enabled ✓' : 'Notify Me When Rewards Go Live'}
            </Text>
          </Pressable>
        </AppCard>

        {/* 4. POINTS ACTIVITY HISTORY */}
        <View style={[styles.sectionHeader, { marginTop: 28 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Points History</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Audit log of your earned & spent points
          </Text>
        </View>

        {historyItems.length > 0 ? (
          <View style={[styles.historyContainer, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            {historyItems.map((item, idx) => {
              const isEarned = item.type === 'EARNED';
              const isLast = idx === historyItems.length - 1;

              let reasonLabel = 'Points Credited';
              if (item.reason === 'WORKOUT_COMPLETED') reasonLabel = 'Daily Workout Completed';
              else if (item.reason === 'NUTRITION_TARGET_REACHED') reasonLabel = 'Daily Nutrient Targets Met';
              else if (item.reason === 'CHALLENGE_CLEARED') reasonLabel = 'Challenge Cleared';
              else if (item.reason === 'PRODUCT_PURCHASE') reasonLabel = 'Store Product Purchase';
              else if (item.reason === 'ADMIN_ADJUSTMENT') reasonLabel = 'Account Adjustment';

              const dateStr = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Recent';

              return (
                <View
                  key={item._id || item.id || idx}
                  style={[
                    styles.historyItemRow,
                    !isLast && { borderBottomColor: colors.borderLight, borderBottomWidth: 1 },
                  ]}
                >
                  <View style={styles.historyLeft}>
                    <View
                      style={[
                        styles.historyIconCircle,
                        { backgroundColor: isEarned ? '#10B98118' : '#EF444418' },
                      ]}
                    >
                      <Zap size={14} color={isEarned ? '#10B981' : '#EF4444'} />
                    </View>
                    <View>
                      <Text style={[styles.historyReason, { color: colors.textPrimary }]}>{reasonLabel}</Text>
                      <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                        {dateStr} {item.dateKey ? `• ${item.dateKey}` : ''}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.historyAmount,
                      { color: isEarned ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {isEarned ? `+${item.points}` : `-${item.points}`} pts
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <AppCard variant="outlined" style={[styles.emptyHistoryCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Clock size={32} color={colors.textSecondary} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyHistoryTitle, { color: colors.textPrimary }]}>No Points Activity Yet</Text>
            <Text style={[styles.emptyHistorySub, { color: colors.textSecondary }]}>
              Complete today&apos;s workout or reach your daily nutrition targets to earn your first +5 points!
            </Text>
          </AppCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  heroCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  pointsDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  pointsHeroNumber: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  pointsHeroPts: {
    fontSize: 16,
    fontWeight: '800',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressSection: {
    marginTop: 18,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroStatText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 18,
  },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  questCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  questIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questTitleBox: {
    flex: 1,
  },
  questTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  questTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  pointBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pointBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  questDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  macroPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  macroPillText: {
    fontSize: 11,
  },
  questActionRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  comingSoonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#F59E0B18',
    borderWidth: 1,
    borderColor: '#F59E0B44',
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  rewardsTeaserCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  teaserItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  teaserIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teaserContent: {
    flex: 1,
  },
  teaserTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  teaserSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  teaserDivider: {
    height: 1,
    marginVertical: 12,
  },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  notifyBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  historyContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyReason: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 11,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptyHistoryCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyHistorySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
});
