import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Trophy, Medal, Flame, Zap, User } from 'lucide-react-native';
import { leaderboardService } from '../services/leaderboardService';
import { TopBar } from '../components/common/TopBar';
import { MaterialCard } from '../components/common/MaterialCard';
import { useTheme } from '../context/ThemeContext';
import { FontSize, BorderRadius } from '../constants/theme';

export default function LeaderboardScreen() {
  const { colors, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState({ rank: 1, points: 0 });

  const fetchLeaderboard = async () => {
    try {
      const data = await leaderboardService.getLeaderboard();
      if (data?.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
      if (data?.currentUser) {
        setCurrentUser(data.currentUser);
      }
    } catch (err) {
      console.warn('Leaderboard fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      {/* Context-Aware TopBar */}
      <TopBar title="Leaderboard" subtitle="Top Community Athletes" showBack icon={Trophy} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Your Rank Highlight Card */}
        <MaterialCard elevated style={[styles.myRankCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}>
          <View style={styles.myRankRow}>
            <View style={[styles.myRankBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.myRankNumber}>#{currentUser.rank}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.myRankTitle, { color: colors.textPrimary }]}>
                Your Current Ranking
              </Text>
              <Text style={[styles.myRankSub, { color: colors.textSecondary }]}>
                Keep completing workouts to climb the leaderboard!
              </Text>
            </View>
            <View style={styles.pointsBadge}>
              <Zap size={15} color={colors.primary} />
              <Text style={[styles.pointsText, { color: colors.primary }]}>
                {currentUser.points} pts
              </Text>
            </View>
          </View>
        </MaterialCard>

        {loading && !leaderboard.length ? (
          <View style={styles.centerSpinner}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading community rankings...
            </Text>
          </View>
        ) : (
          <>
            {/* Top 3 Podium */}
            {topThree.length >= 1 ? (
              <View style={styles.podiumSection}>
                {/* 2nd Place */}
                {topThree[1] ? (
                  <View style={[styles.podiumCol, { marginTop: 24 }]}>
                    <View style={[styles.podiumAvatar, { borderColor: '#A0AEC0' }]}>
                      <Text style={[styles.podiumAvatarText, { color: colors.textPrimary }]}>
                        {topThree[1].displayName?.charAt(0) || '2'}
                      </Text>
                    </View>
                    <Text style={[styles.podiumName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {topThree[1].displayName}
                    </Text>
                    <View style={[styles.podiumPill, { backgroundColor: '#A0AEC025' }]}>
                      <Medal size={12} color="#A0AEC0" />
                      <Text style={[styles.podiumRank, { color: '#A0AEC0' }]}>2nd</Text>
                    </View>
                    <Text style={[styles.podiumPoints, { color: colors.textSecondary }]}>
                      {topThree[1].points} pts
                    </Text>
                  </View>
                ) : null}

                {/* 1st Place (Gold) */}
                {topThree[0] ? (
                  <View style={styles.podiumCol}>
                    <View style={[styles.podiumAvatarFirst, { borderColor: '#FFB800' }]}>
                      <Text style={[styles.podiumAvatarTextFirst, { color: '#FFB800' }]}>
                        {topThree[0].displayName?.charAt(0) || '1'}
                      </Text>
                    </View>
                    <Text style={[styles.podiumNameFirst, { color: colors.textPrimary }]} numberOfLines={1}>
                      {topThree[0].displayName}
                    </Text>
                    <View style={[styles.podiumPill, { backgroundColor: '#FFB80025' }]}>
                      <Trophy size={13} color="#FFB800" />
                      <Text style={[styles.podiumRankFirst, { color: '#FFB800' }]}>1st</Text>
                    </View>
                    <Text style={[styles.podiumPointsFirst, { color: colors.primary }]}>
                      {topThree[0].points} pts
                    </Text>
                  </View>
                ) : null}

                {/* 3rd Place (Bronze) */}
                {topThree[2] ? (
                  <View style={[styles.podiumCol, { marginTop: 32 }]}>
                    <View style={[styles.podiumAvatar, { borderColor: '#CD7F32' }]}>
                      <Text style={[styles.podiumAvatarText, { color: colors.textPrimary }]}>
                        {topThree[2].displayName?.charAt(0) || '3'}
                      </Text>
                    </View>
                    <Text style={[styles.podiumName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {topThree[2].displayName}
                    </Text>
                    <View style={[styles.podiumPill, { backgroundColor: '#CD7F3225' }]}>
                      <Medal size={12} color="#CD7F32" />
                      <Text style={[styles.podiumRank, { color: '#CD7F32' }]}>3rd</Text>
                    </View>
                    <Text style={[styles.podiumPoints, { color: colors.textSecondary }]}>
                      {topThree[2].points} pts
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Remaining Athletes List */}
            <Text style={[styles.listHeader, { color: colors.textMuted }]}>
              ALL ATHLETES
            </Text>

            <MaterialCard style={[styles.listCard, { backgroundColor: colors.surface }]}>
              {leaderboard.map((item, index) => (
                <View
                  key={item.userId || index}
                  style={[
                    styles.rankRow,
                    index > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight },
                  ]}
                >
                  <Text style={[styles.rankNumber, { color: colors.textMuted }]}>
                    #{item.rank || index + 1}
                  </Text>
                  <View style={[styles.userAvatar, { backgroundColor: colors.surfaceElevated }]}>
                    <User size={16} color={colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>
                      {item.displayName || 'Athlete'}
                    </Text>
                    <Text style={[styles.userGoal, { color: colors.textMuted }]}>
                      {item.goal || 'General Fitness'}
                    </Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <Zap size={13} color={colors.primary} />
                    <Text style={[styles.pointsText, { color: colors.textPrimary }]}>
                      {item.points || 0}
                    </Text>
                  </View>
                </View>
              ))}
            </MaterialCard>
          </>
        )}

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
  centerSpinner: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: FontSize.sm,
  },
  myRankCard: {
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  myRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  myRankBadge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myRankNumber: {
    fontSize: FontSize.lg,
    fontWeight: '900',
    color: '#000',
  },
  myRankTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  myRankSub: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  podiumSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 24,
    gap: 16,
  },
  podiumCol: {
    alignItems: 'center',
    width: 90,
  },
  podiumAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  podiumAvatarFirst: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  podiumAvatarText: {
    fontSize: 20,
    fontWeight: '800',
  },
  podiumAvatarTextFirst: {
    fontSize: 26,
    fontWeight: '900',
  },
  podiumName: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumNameFirst: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
  },
  podiumRank: {
    fontSize: 10,
    fontWeight: '800',
  },
  podiumRankFirst: {
    fontSize: 11,
    fontWeight: '900',
  },
  podiumPoints: {
    fontSize: 11,
    fontWeight: '700',
  },
  podiumPointsFirst: {
    fontSize: FontSize.xs,
    fontWeight: '900',
  },
  listHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  listCard: {
    padding: 0,
    marginBottom: 20,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rankNumber: {
    width: 28,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  userGoal: {
    fontSize: 10,
    marginTop: 1,
  },
});
