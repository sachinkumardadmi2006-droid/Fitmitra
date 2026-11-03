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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Trophy,
  Zap,
  Flame,
  Camera,
  Layers,
  CheckCircle2,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../constants/queryKeys';
import {
  challengeService,
  CHALLENGE_TYPES,
} from '../services/challengeService';
import AppHeader from '../components/ui/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import {
  ChallengeCard,
  ActiveChallengeCard,
  AcceptedChallengeHero,
  SubmitProofModal,
} from '../components/challenges';

const TYPE_FILTERS = [
  { key: 'ALL', label: 'All Challenges' },
  { key: CHALLENGE_TYPES.DAY_STREAK, label: '🔥 Day Streak' },
  { key: CHALLENGE_TYPES.PROOF_BASED, label: '📸 Proof Based' },
];

export default function ChallengesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const { points, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('EXPLORE'); // 'EXPLORE' | 'MY_CHALLENGES'
  const [selectedType, setSelectedType] = useState('ALL');
  const [activeChallengeIndex, setActiveChallengeIndex] = useState(0);

  // Proof submission modal state
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [selectedProofChallenge, setSelectedProofChallenge] = useState(null);

  // 1. All Published Challenges Query
  const challengesQuery = useQuery({
    queryKey: queryKeys.challenges(selectedType),
    queryFn: async () => {
      const res = await challengeService.getChallenges({
        type: selectedType !== 'ALL' ? selectedType : undefined,
        limit: 30,
      });
      return res?.items || [];
    },
    staleTime: 60 * 1000,
  });

  // 2. User's Active Challenges Query
  const activeQuery = useQuery({
    queryKey: queryKeys.challengesActive,
    queryFn: async () => {
      const res = await challengeService.getActiveChallenges();
      return Array.isArray(res) ? res : [];
    },
    staleTime: 60 * 1000,
  });

  const challenges = challengesQuery.data || [];
  const activeChallenges = activeQuery.data || [];

  const loading =
    activeTab === 'EXPLORE'
      ? challengesQuery.isLoading && !challengesQuery.data
      : activeQuery.isLoading && !activeQuery.data;

  const refreshing =
    activeTab === 'EXPLORE' ? challengesQuery.isRefetching : activeQuery.isRefetching;

  const onRefresh = useCallback(async () => {
    refreshProfile?.();
    await Promise.all([challengesQuery.refetch(), activeQuery.refetch()]);
  }, [challengesQuery, activeQuery, refreshProfile]);

  // 3. Join Challenge Mutation
  const joinMutation = useMutation({
    mutationFn: (challengeId) => challengeService.acceptChallenge(challengeId),
    onSuccess: (data, challengeId) => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      refreshProfile?.();

      if (data?.status === 'COMPLETED') {
        Alert.alert(
          'Challenge Completed! 🎉',
          'Congratulations! Your existing streak already clears this challenge. Your reward points have been added to your profile!'
        );
      } else {
        Alert.alert(
          'Challenge Joined! 🚀',
          'You have successfully joined this challenge. Track your daily progress right here.'
        );
      }
    },
    onError: (err) => {
      Alert.alert(
        'Could Not Join',
        err?.message || 'Unable to join challenge. Please try again.'
      );
    },
  });

  const handleJoinChallenge = (challenge) => {
    joinMutation.mutate(challenge._id);
  };

  const handleCardPress = (challenge) => {
    const id = challenge._id || challenge.id;
    if (id) {
      router.push(`/challenge/${id}`);
    }
  };

  const handleActiveCardPress = (userChallenge) => {
    const challengeId =
      typeof userChallenge.challengeId === 'object'
        ? userChallenge.challengeId?._id
        : userChallenge.challengeId;
    if (challengeId) {
      router.push(`/challenge/${challengeId}`);
    }
  };

  const handleOpenProofModal = (challenge) => {
    setSelectedProofChallenge(challenge);
    setProofModalVisible(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* App Header */}
      <AppHeader
        title="Fitness Challenges"
        subtitle="Earn points & build streaks"
        showBack
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/more'))}
        rightElement={
          <Pressable
            onPress={() => router.push('/points')}
            style={[
              styles.pointsPill,
              { backgroundColor: colors.secondaryContainer },
            ]}
            accessibilityLabel="View Mitra Points"
          >
            <Zap size={12} color={colors.secondary} fill={colors.secondary} />
            <Text
              style={[
                styles.pointsPillText,
                { color: colors.onSecondaryContainer },
              ]}
            >
              {points || 0} pts
            </Text>
          </Pressable>
        }
      />

      {/* Main Tab Toggle: Explore vs My Challenges */}
      <View style={styles.tabToggleRow}>
        <Pressable
          style={[
            styles.tabBtn,
            activeTab === 'EXPLORE'
              ? { backgroundColor: colors.primaryContainer }
              : { backgroundColor: colors.surfaceVariant },
          ]}
          onPress={() => setActiveTab('EXPLORE')}
        >
          <Trophy
            size={16}
            color={
              activeTab === 'EXPLORE'
                ? colors.onPrimaryContainer
                : colors.onSurfaceVariant
            }
          />
          <Text
            style={[
              styles.tabBtnText,
              {
                color:
                  activeTab === 'EXPLORE'
                    ? colors.onPrimaryContainer
                    : colors.onSurfaceVariant,
                fontWeight: activeTab === 'EXPLORE' ? '800' : '600',
              },
            ]}
          >
            All Challenges
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tabBtn,
            activeTab === 'MY_CHALLENGES'
              ? { backgroundColor: colors.primaryContainer }
              : { backgroundColor: colors.surfaceVariant },
          ]}
          onPress={() => setActiveTab('MY_CHALLENGES')}
        >
          <Flame
            size={16}
            color={
              activeTab === 'MY_CHALLENGES'
                ? colors.onPrimaryContainer
                : colors.onSurfaceVariant
            }
          />
          <Text
            style={[
              styles.tabBtnText,
              {
                color:
                  activeTab === 'MY_CHALLENGES'
                    ? colors.onPrimaryContainer
                    : colors.onSurfaceVariant,
                fontWeight: activeTab === 'MY_CHALLENGES' ? '800' : '600',
              },
            ]}
          >
            My Challenges ({activeChallenges.length})
          </Text>
        </Pressable>
      </View>

      {/* Sub-Filters for Explore Tab */}
      {activeTab === 'EXPLORE' && (
        <View style={styles.filterScrollWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScrollView}
            contentContainerStyle={styles.filterScroll}
          >
            {TYPE_FILTERS.map((f) => {
              const isSelected = selectedType === f.key;
              return (
                <Pressable
                  key={f.key}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.surfaceVariant,
                      borderColor: isSelected ? colors.primary : colors.outlineVariant,
                    },
                  ]}
                  onPress={() => setSelectedType(f.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: isSelected ? colors.onPrimary : colors.onSurfaceVariant,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main List Content */}
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
            tintColor={colors.primary}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {activeTab === 'EXPLORE' ? (
          /* Explore Tab */
          loading && challenges.length === 0 ? (
            <View style={styles.skeletonWrap}>
              <Skeleton height={200} radius={custom.radius.lg} style={styles.mbLg} />
              <Skeleton height={200} radius={custom.radius.lg} style={styles.mbLg} />
            </View>
          ) : (
            <>
              {/* ACCEPTED / IN-PROGRESS CHALLENGE HERO CARD AT TOP */}
              {activeChallenges.length > 0 && (
                <View style={styles.acceptedSection}>
                  <View style={styles.acceptedSectionHeader}>
                    <View style={styles.acceptedHeaderLeft}>
                      <View style={styles.livePulseDot} />
                      <Text style={[styles.acceptedHeaderTitle, { color: colors.onSurface }]}>
                        Your Active Challenge{activeChallenges.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                    {activeChallenges.length > 1 && (
                      <View style={styles.switcherPills}>
                        {activeChallenges.map((_, idx) => (
                          <Pressable
                            key={`active-dot-${idx}`}
                            style={[
                              styles.switcherDot,
                              activeChallengeIndex === idx
                                ? { backgroundColor: colors.primary, width: 18 }
                                : { backgroundColor: colors.outlineVariant },
                            ]}
                            onPress={() => setActiveChallengeIndex(idx)}
                            hitSlop={6}
                          />
                        ))}
                      </View>
                    )}
                  </View>

                  <AcceptedChallengeHero
                    userChallenge={
                      activeChallenges[activeChallengeIndex] || activeChallenges[0]
                    }
                    onPress={(challengeId) => router.push(`/challenge/${challengeId}`)}
                    onSubmitProofPress={(challenge) => handleOpenProofModal(challenge)}
                    onContinueWorkoutPress={() => router.push('/(tabs)/workouts')}
                  />

                  {challenges.length > 0 && (
                    <View style={styles.exploreHeaderRow}>
                      <Text
                        style={[styles.exploreHeaderTitle, { color: colors.onSurface }]}
                      >
                        Explore All Challenges
                      </Text>
                      <Text
                        style={[
                          styles.exploreHeaderCount,
                          { color: colors.onSurfaceVariant },
                        ]}
                      >
                        {challenges.length} available
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Published Challenges List */}
              {challenges.length > 0 ? (
                challenges.map((c) => (
                  <ChallengeCard
                    key={String(c._id || c.id)}
                    challenge={c}
                    onPress={() => handleCardPress(c)}
                    onJoinPress={() => handleJoinChallenge(c)}
                    isJoining={joinMutation.isPending && joinMutation.variables === c._id}
                  />
                ))
              ) : (
                <EmptyState
                  icon="trophy-outline"
                  title="No Challenges Available"
                  description="New streak and form verification challenges will appear here shortly."
                />
              )}
            </>
          )
        ) : (
          /* My Challenges Tab */
          loading && activeChallenges.length === 0 ? (
            <View style={styles.skeletonWrap}>
              <Skeleton height={180} radius={custom.radius.lg} style={styles.mbLg} />
              <Skeleton height={180} radius={custom.radius.lg} style={styles.mbLg} />
            </View>
          ) : activeChallenges.length > 0 ? (
            activeChallenges.map((uc) => (
              <AcceptedChallengeHero
                key={String(uc._id || uc.id)}
                userChallenge={uc}
                onPress={(challengeId) => router.push(`/challenge/${challengeId}`)}
                onSubmitProofPress={(challenge) => handleOpenProofModal(challenge)}
                onContinueWorkoutPress={() => router.push('/(tabs)/workouts')}
              />
            ))
          ) : (
            <EmptyState
              icon="flag-outline"
              title="No Active Challenges"
              description="You haven't joined any challenges yet. Explore challenges and start earning reward points!"
              actionLabel="Explore Challenges"
              onAction={() => setActiveTab('EXPLORE')}
            />
          )
        )}
      </ScrollView>

      {/* Proof Submission Modal */}
      <SubmitProofModal
        visible={proofModalVisible}
        challenge={selectedProofChallenge}
        onClose={() => {
          setProofModalVisible(false);
          setSelectedProofChallenge(null);
        }}
        onProofSubmitted={() => {
          setProofModalVisible(false);
          setSelectedProofChallenge(null);
          queryClient.invalidateQueries({ queryKey: ['challenges'] });
          queryClient.invalidateQueries({ queryKey: queryKeys.challengesActive });
          queryClient.invalidateQueries({ queryKey: queryKeys.profile });
          refreshProfile?.();
          Alert.alert(
            'Proof Submitted! 🎉',
            'Your proof has been submitted for coach review. Reward points will be credited upon approval.'
          );
        }}
      />
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
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  pointsPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tabToggleRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabBtnText: {
    fontSize: 13,
  },
  filterScrollWrapper: {
    height: 44,
    marginBottom: 4,
  },
  filterScrollView: {
    flexGrow: 0,
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'center',
  },
  filterChipText: {
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  skeletonWrap: {
    paddingVertical: 8,
  },
  mbLg: {
    marginBottom: 16,
  },

  /* ACCEPTED CHALLENGES TOP SECTION */
  acceptedSection: {
    marginBottom: 10,
  },
  acceptedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  acceptedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  acceptedHeaderTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  switcherPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  switcherDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  exploreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  exploreHeaderTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  exploreHeaderCount: {
    fontSize: 12,
    fontWeight: '600',
  },
});
