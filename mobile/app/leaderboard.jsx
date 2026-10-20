import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Zap, Flame, User } from 'lucide-react-native';
import { leaderboardService } from '../services/leaderboardService';
import { queryKeys } from '../constants/queryKeys';
import { useAppTheme } from '../theme/ThemeContext';
import AppHeader from '../components/ui/AppHeader';
import AppCard from '../components/ui/AppCard';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

export default function LeaderboardScreen() {
  const router = useRouter();
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

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return '#F59E0B'; // Gold
    if (rank === 2) return '#94A3B8'; // Silver
    if (rank === 3) return '#B45309'; // Bronze
    return colors.surfaceVariant;
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Leaderboard" subtitle="Community Rankings & Streaks" showBack />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
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
                      {currentUser.lifetimePoints || currentUser.points || 0} pts
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

        {/* Loading Skeletons */}
        {loading && leaderboard.length === 0 ? (
          <View style={styles.skeletonWrap}>
            <Skeleton height={70} radius={custom.radius.md} style={styles.mbSm} />
            <Skeleton height={70} radius={custom.radius.md} style={styles.mbSm} />
            <Skeleton height={70} radius={custom.radius.md} style={styles.mbSm} />
            <Skeleton height={70} radius={custom.radius.md} style={styles.mbSm} />
          </View>
        ) : leaderboard.length > 0 ? (
          leaderboard.map((item) => {
            const isTop3 = item.rank <= 3;
            const badgeColor = getRankBadgeColor(item.rank);

            return (
              <AppCard
                key={item.rank}
                variant={item.isMe ? 'elevated' : 'outlined'}
                style={[
                  styles.rankCard,
                  item.isMe ? { borderColor: colors.primary, borderWidth: 1.5 } : null,
                ]}
              >
                <View style={styles.rankRow}>
                  {/* Rank Position */}
                  <View
                    style={[
                      styles.rankBadge,
                      { backgroundColor: isTop3 ? badgeColor : colors.surfaceVariant },
                    ]}
                  >
                    {item.rank === 1 ? (
                      <Trophy size={16} color="#FFF" />
                    ) : item.rank <= 3 ? (
                      <Medal size={16} color="#FFF" />
                    ) : (
                      <Text
                        style={[
                          styles.rankText,
                          { color: colors.onSurfaceVariant },
                        ]}
                      >
                        {item.rank}
                      </Text>
                    )}
                  </View>

                  {/* User Meta */}
                  <View style={styles.userCol}>
                    <View style={styles.userNameRow}>
                      <Text
                        style={[
                          styles.userName,
                          { color: colors.onSurface },
                          item.isMe ? { fontWeight: '700', color: colors.primary } : null,
                        ]}
                        numberOfLines={1}
                      >
                        {item.displayName || 'FitMitra Athlete'}
                      </Text>
                      {item.isMe && (
                        <View style={[styles.youBadge, { backgroundColor: colors.primaryContainer }]}>
                          <Text style={[styles.youText, { color: colors.onPrimaryContainer }]}>
                            YOU
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.metaRow}>
                      <Flame size={12} color="#EF4444" />
                      <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                        {item.currentStreak || 0} day streak
                      </Text>
                    </View>
                  </View>

                  {/* Points Pill */}
                  <View
                    style={[
                      styles.pointsPill,
                      { backgroundColor: colors.secondaryContainer },
                    ]}
                  >
                    <Zap size={13} color={colors.secondary} fill={colors.secondary} />
                    <Text style={[styles.pointsVal, { color: colors.onSecondaryContainer }]}>
                      {item.lifetimePoints || 0}
                    </Text>
                  </View>
                </View>
              </AppCard>
            );
          })
        ) : (
          <EmptyState
            icon="award"
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
    marginBottom: 20,
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
  skeletonWrap: {
    gap: 10,
  },
  mbSm: {
    marginBottom: 10,
  },
  rankCard: {
    padding: 12,
    marginBottom: 8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
  },
  userCol: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  pointsVal: {
    fontSize: 13,
    fontWeight: '700',
  },
});
