import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, Medal, Crown, Zap, Flame, ChevronRight, Award } from 'lucide-react-native';
import { leaderboardService } from '../services/leaderboardService';
import { queryKeys } from '../constants/queryKeys';
import { useAppTheme } from '../theme/ThemeContext';
import AppHeader from '../components/ui/AppHeader';
import AppCard from '../components/ui/AppCard';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

const PODIUM_CONFIG = {
  1: {
    color: '#F59E0B', // Gold
    bgTint: '#FEF3C7',
    darkBgTint: 'rgba(245, 158, 11, 0.16)',
    avatarSize: 56,
    avatarRadius: 28,
    borderWidth: 2.5,
    pillarHeight: 228,
    pedestalHeight: 84,
    label: '1st',
    Icon: Crown,
    iconSize: 20,
  },
  2: {
    color: '#94A3B8', // Silver
    bgTint: '#F1F5F9',
    darkBgTint: 'rgba(148, 163, 184, 0.16)',
    avatarSize: 48,
    avatarRadius: 24,
    borderWidth: 2,
    pillarHeight: 198,
    pedestalHeight: 66,
    label: '2nd',
    Icon: Medal,
    iconSize: 18,
  },
  3: {
    color: '#D97706', // Bronze
    bgTint: '#FFEDD5',
    darkBgTint: 'rgba(217, 119, 6, 0.16)',
    avatarSize: 44,
    avatarRadius: 22,
    borderWidth: 2,
    pillarHeight: 178,
    pedestalHeight: 50,
    label: '3rd',
    Icon: Medal,
    iconSize: 18,
  },
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  const leaderboardQuery = useQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: async () => {
      const res = await leaderboardService.getLeaderboard();
      const data = res?.data || res;
      return {
        items: data?.leaderboard || [],
        currentUser: data?.currentUser || data?.me || null,
      };
    },
    staleTime: 60 * 1000,
  });

  const leaderboard = leaderboardQuery.data?.items || [];
  const currentUser = leaderboardQuery.data?.currentUser || null;

  const loading = leaderboardQuery.isLoading && !leaderboardQuery.data;
  const refreshing = leaderboardQuery.isRefetching;

  const onRefresh = useCallback(async () => {
    await leaderboardQuery.refetch();
  }, [leaderboardQuery]);

  // Split into Top 3 for vertical podium and remaining for horizontal rows below
  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  // Arrange podium in Olympic visual order:
  // 3 athletes: [Rank 2 (Silver), Rank 1 (Gold, taller center), Rank 3 (Bronze)]
  // 2 athletes: [Rank 2 (Silver), Rank 1 (Gold)]
  // 1 athlete:  [Rank 1 (Gold)]
  const podiumAthletes = useMemo(() => {
    if (top3.length === 3) {
      return [
        { item: top3[1], podiumRank: 2 },
        { item: top3[0], podiumRank: 1 },
        { item: top3[2], podiumRank: 3 },
      ];
    }
    if (top3.length === 2) {
      return [
        { item: top3[1], podiumRank: 2 },
        { item: top3[0], podiumRank: 1 },
      ];
    }
    if (top3.length === 1) {
      return [
        { item: top3[0], podiumRank: 1 },
      ];
    }
    return [];
  }, [top3]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Leaderboard" subtitle="Community Rankings & Streaks" showBack />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(40, insets.bottom + 24) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={custom.primaryStrong}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {/* User's Current Standing Card */}
        {currentUser && (
          <AppCard variant="elevated" style={styles.myRankCard}>
            <View style={styles.myRankRow}>
              <View
                style={[
                  styles.myRankCircle,
                  { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
                ]}
              >
                <Text style={[styles.myRankNum, { color: colors.onPrimaryContainer }]}>
                  #{currentUser.rank || '-'}
                </Text>
              </View>

              <View style={styles.myRankInfo}>
                <Text style={[styles.myRankLabel, { color: colors.onSurfaceVariant }]}>
                  Your Standing
                </Text>
                <View style={styles.statsRow}>
                  <View style={styles.statPill}>
                    <Zap size={14} color={colors.secondary} fill={colors.secondary} />
                    <Text style={[styles.statVal, { color: colors.onSurface }]}>
                      {currentUser.points ?? currentUser.lifetimePoints ?? 0} pts
                    </Text>
                  </View>
                  <View style={styles.statPill}>
                    <Flame size={14} color="#EF4444" fill="#EF4444" />
                    <Text style={[styles.statVal, { color: colors.onSurface }]}>
                      {currentUser.currentStreak || 0} days streak
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </AppCard>
        )}

        {/* Challenges Shortcut Banner */}
        <Pressable
          style={[
            styles.challengeBanner,
            {
              backgroundColor: colors.secondaryContainer,
              borderColor: colors.secondary,
            },
          ]}
          onPress={() => router.push('/challenges')}
          hitSlop={4}
        >
          <View style={styles.challengeBannerLeft}>
            <Trophy size={20} color={colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.challengeBannerTitle, { color: colors.onSecondaryContainer }]}>
                Join Fitness Challenges
              </Text>
              <Text style={[styles.challengeBannerSub, { color: colors.onSecondaryContainer }]}>
                Earn bonus points, extend streaks & climb the rankings
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.onSecondaryContainer} />
        </Pressable>

        {/* Loading Skeletons */}
        {loading && leaderboard.length === 0 ? (
          <View style={styles.skeletonWrap}>
            <View style={styles.podiumSkeletonRow}>
              <Skeleton height={180} radius={18} style={{ flex: 1 }} />
              <Skeleton height={220} radius={18} style={{ flex: 1 }} />
              <Skeleton height={160} radius={18} style={{ flex: 1 }} />
            </View>
            <Skeleton height={68} radius={custom.radius.md} style={styles.mbSm} />
            <Skeleton height={68} radius={custom.radius.md} style={styles.mbSm} />
            <Skeleton height={68} radius={custom.radius.md} style={styles.mbSm} />
          </View>
        ) : leaderboard.length > 0 ? (
          <>
            {/* TOP 3 PODIUM (Vertical Pedestals) */}
            {podiumAthletes.length > 0 && (
              <View style={styles.podiumContainer}>
                <View style={styles.podiumRow}>
                  {podiumAthletes.map(({ item, podiumRank }) => {
                    const cfg = PODIUM_CONFIG[podiumRank];
                    const IconComp = cfg.Icon;
                    const points = item.points ?? item.lifetimePoints ?? 0;
                    const isMe = !!item.isMe;

                    return (
                      <View
                        key={`podium-${item.userId || item.displayName || podiumRank}-${podiumRank}`}
                        style={[
                          styles.podiumCol,
                          {
                            minHeight: cfg.pillarHeight,
                            backgroundColor: colors.surface,
                            borderColor: isMe
                              ? colors.primary
                              : theme.dark
                              ? '#27272A'
                              : '#E4E4E7',
                            borderWidth: isMe ? 2 : 1,
                          },
                        ]}
                      >
                        {/* Top Icon */}
                        <View style={styles.podiumHeaderIcon}>
                          <IconComp
                            size={cfg.iconSize}
                            color={cfg.color}
                            fill={podiumRank === 1 ? cfg.color : 'transparent'}
                          />
                        </View>

                        {/* Avatar with Circular Rank Badge */}
                        <View style={styles.podiumAvatarWrap}>
                          <View
                            style={[
                              styles.podiumAvatarBorder,
                              {
                                width: cfg.avatarSize + 4,
                                height: cfg.avatarSize + 4,
                                borderRadius: (cfg.avatarSize + 4) / 2,
                                borderColor: cfg.color,
                                borderWidth: cfg.borderWidth,
                              },
                            ]}
                          >
                            {item.avatarUrl ? (
                              <Image
                                source={{ uri: item.avatarUrl }}
                                style={{
                                  width: cfg.avatarSize,
                                  height: cfg.avatarSize,
                                  borderRadius: cfg.avatarRadius,
                                }}
                                resizeMode="cover"
                              />
                            ) : (
                              <View
                                style={[
                                  styles.podiumAvatarFallback,
                                  {
                                    width: cfg.avatarSize,
                                    height: cfg.avatarSize,
                                    borderRadius: cfg.avatarRadius,
                                    backgroundColor: cfg.color + '22',
                                  },
                                ]}
                              >
                                <Text style={[styles.podiumAvatarText, { color: cfg.color }]}>
                                  {item.displayName?.[0]?.toUpperCase() || 'A'}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Rank Badge Circle */}
                          <View
                            style={[
                              styles.podiumBadgeCircle,
                              { backgroundColor: cfg.color },
                            ]}
                          >
                            <Text style={styles.podiumBadgeNum}>{podiumRank}</Text>
                          </View>
                        </View>

                        {/* Name, You badge, streak */}
                        <View style={styles.podiumMeta}>
                          <Text
                            style={[
                              styles.podiumName,
                              { color: colors.onSurface },
                              isMe && { color: colors.primary, fontWeight: '800' },
                            ]}
                            numberOfLines={1}
                          >
                            {item.displayName || 'Athlete'}
                          </Text>
                          {isMe && (
                            <View
                              style={[
                                styles.youBadge,
                                { backgroundColor: colors.primaryContainer, marginTop: 2 },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.youText,
                                  { color: colors.onPrimaryContainer },
                                ]}
                              >
                                YOU
                              </Text>
                            </View>
                          )}
                          <View style={styles.podiumStreakRow}>
                            <Flame size={11} color="#EF4444" fill="#EF4444" />
                            <Text
                              style={[
                                styles.podiumStreakText,
                                { color: colors.onSurfaceVariant },
                              ]}
                            >
                              {item.currentStreak || 0}d streak
                            </Text>
                          </View>
                        </View>

                        {/* Bottom Pedestal Base Block */}
                        <View
                          style={[
                            styles.pedestalBase,
                            {
                              height: cfg.pedestalHeight,
                              backgroundColor: theme.dark ? cfg.darkBgTint : cfg.bgTint,
                              borderTopColor: cfg.color + '44',
                            },
                          ]}
                        >
                          <Text style={[styles.pedestalRankTag, { color: cfg.color }]}>
                            {cfg.label}
                          </Text>
                          <View style={styles.pedestalPointsWrap}>
                            <Zap size={11} color={colors.secondary} fill={colors.secondary} />
                            <Text
                              style={[
                                styles.pedestalPointsText,
                                { color: colors.onSurface },
                              ]}
                            >
                              {points} pts
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* REMAINING DOWNSIDE (Horizontal List Cards) */}
            {remaining.length > 0 ? (
              <View style={styles.remainingSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                    Rankings
                  </Text>
                  <View
                    style={[
                      styles.countBadge,
                      { backgroundColor: colors.surfaceVariant },
                    ]}
                  >
                    <Text
                      style={[
                        styles.countText,
                        { color: colors.onSurfaceVariant },
                      ]}
                    >
                      {leaderboard.length} athletes
                    </Text>
                  </View>
                </View>

                {remaining.map((item, index) => {
                  const points = item.points ?? item.lifetimePoints ?? 0;
                  const isMe = !!item.isMe;

                  return (
                    <AppCard
                      key={`remaining-${item.userId || item.displayName || index}-${item.rank || index + 4}`}
                      variant={isMe ? 'elevated' : 'outlined'}
                      style={[
                        styles.horizontalRowCard,
                        isMe ? { borderColor: colors.primary, borderWidth: 1.5 } : null,
                      ]}
                    >
                      <View style={styles.horizontalRowContent}>
                        {/* Rank Position */}
                        <View
                          style={[
                            styles.rowRankCircle,
                            { backgroundColor: colors.surfaceVariant },
                            isMe && { backgroundColor: colors.primaryContainer },
                          ]}
                        >
                          <Text
                            style={[
                              styles.rowRankText,
                              {
                                color: isMe
                                  ? colors.onPrimaryContainer
                                  : colors.onSurfaceVariant,
                              },
                            ]}
                          >
                            #{item.rank}
                          </Text>
                        </View>

                        {/* Avatar */}
                        <View
                          style={[
                            styles.rowAvatarCircle,
                            { backgroundColor: colors.secondaryContainer },
                          ]}
                        >
                          {item.avatarUrl ? (
                            <Image
                              source={{ uri: item.avatarUrl }}
                              style={styles.rowAvatarImg}
                            />
                          ) : (
                            <Text
                              style={[
                                styles.rowAvatarInitial,
                                { color: colors.onSecondaryContainer },
                              ]}
                            >
                              {item.displayName?.[0]?.toUpperCase() || 'A'}
                            </Text>
                          )}
                        </View>

                        {/* Athlete Meta */}
                        <View style={styles.rowInfoCol}>
                          <View style={styles.rowNameLine}>
                            <Text
                              style={[
                                styles.rowDisplayName,
                                { color: colors.onSurface },
                                isMe ? { fontWeight: '700', color: colors.primary } : null,
                              ]}
                              numberOfLines={1}
                            >
                              {item.displayName || 'FitMitra Athlete'}
                            </Text>
                            {isMe && (
                              <View
                                style={[
                                  styles.youBadge,
                                  { backgroundColor: colors.primaryContainer },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.youText,
                                    { color: colors.onPrimaryContainer },
                                  ]}
                                >
                                  YOU
                                </Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.rowStreakLine}>
                            <Flame size={12} color="#EF4444" fill="#EF4444" />
                            <Text
                              style={[
                                styles.rowStreakText,
                                { color: colors.onSurfaceVariant },
                              ]}
                            >
                              {item.currentStreak || 0} day streak
                            </Text>
                          </View>
                        </View>

                        {/* Points Pill */}
                        <View
                          style={[
                            styles.rowPointsPill,
                            { backgroundColor: colors.secondaryContainer },
                          ]}
                        >
                          <Zap size={13} color={colors.secondary} fill={colors.secondary} />
                          <Text
                            style={[
                              styles.rowPointsText,
                              { color: colors.onSecondaryContainer },
                            ]}
                          >
                            {points}
                          </Text>
                        </View>
                      </View>
                    </AppCard>
                  );
                })}
              </View>
            ) : (
              /* When 3 or fewer members, show clean motivation banner */
              <AppCard variant="outlined" style={styles.motivationCard}>
                <View style={styles.motivationRow}>
                  <View
                    style={[
                      styles.motivationIconWrap,
                      { backgroundColor: colors.primaryContainer },
                    ]}
                  >
                    <Award size={20} color={colors.primary} />
                  </View>
                  <View style={styles.motivationInfo}>
                    <Text style={[styles.motivationTitle, { color: colors.onSurface }]}>
                      Rise Up The Leaderboard
                    </Text>
                    <Text
                      style={[
                        styles.motivationDesc,
                        { color: colors.onSurfaceVariant },
                      ]}
                    >
                      Complete daily workouts, log nutrition, and join community challenges to earn points and claim your spot on the podium!
                    </Text>
                  </View>
                </View>
              </AppCard>
            )}
          </>
        ) : (
          <EmptyState
            icon="trophy"
            title="Leaderboard Resetting"
            description="Leaderboard rankings will appear once athlete workouts are logged."
          />
        )}
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
    padding: 16,
    paddingBottom: 40,
  },
  myRankCard: {
    padding: 16,
    marginBottom: 14,
  },
  myRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  myRankCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myRankNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  myRankInfo: {
    flex: 1,
  },
  myRankLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  challengeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  challengeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  challengeBannerTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  challengeBannerSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  skeletonWrap: {
    gap: 10,
  },
  podiumSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  mbSm: {
    marginBottom: 10,
  },

  /* PODIUM STYLES (Vertical Pedestal Columns) */
  podiumContainer: {
    marginBottom: 22,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 6,
  },
  podiumCol: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  podiumHeaderIcon: {
    marginBottom: 6,
    marginTop: 10,
  },
  podiumAvatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  podiumAvatarBorder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumAvatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  podiumBadgeCircle: {
    position: 'absolute',
    bottom: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  podiumBadgeNum: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  podiumMeta: {
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8,
    width: '100%',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  podiumStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  podiumStreakText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  pedestalBase: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  pedestalRankTag: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  pedestalPointsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pedestalPointsText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* REMAINING ATHLETES STYLES (Horizontal Row Cards) */
  remainingSection: {
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  horizontalRowCard: {
    padding: 12,
    marginBottom: 8,
  },
  horizontalRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowRankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowRankText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  rowAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowAvatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  rowAvatarInitial: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowInfoCol: {
    flex: 1,
  },
  rowNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  rowDisplayName: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowStreakLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowStreakText: {
    fontSize: 11,
  },
  rowPointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  rowPointsText: {
    fontSize: 13,
    fontWeight: '700',
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  youText: {
    fontSize: 9,
    fontWeight: '800',
  },

  /* MOTIVATION CARD */
  motivationCard: {
    padding: 14,
    marginTop: 4,
  },
  motivationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  motivationIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motivationInfo: {
    flex: 1,
  },
  motivationTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  motivationDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
