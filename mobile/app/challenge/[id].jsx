import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Trophy,
  Zap,
  Calendar,
  Flame,
  CheckCircle2,
  Clock,
  UploadCloud,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from '../../constants/queryKeys';
import {
  challengeService,
  CHALLENGE_TYPES,
  USER_CHALLENGE_STATUS,
  SUBMISSION_STATUS,
} from '../../services/challengeService';
import AppHeader from '../../components/ui/AppHeader';
import AppButton from '../../components/ui/AppButton';
import { Skeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import {
  ChallengeTypeBadge,
  ChallengeStatusBadge,
} from '../../components/challenges/ChallengeTypeBadge';
import { SubmitProofModal } from '../../components/challenges/SubmitProofModal';

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const { points, refreshProfile } = useAuth();

  const [proofModalVisible, setProofModalVisible] = useState(false);

  // Challenge Detail Query
  const detailQuery = useQuery({
    queryKey: queryKeys.challengeDetail(id),
    queryFn: async () => {
      const res = await challengeService.getChallengeById(id);
      return res || null;
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });

  const challenge = detailQuery.data;
  const loading = detailQuery.isLoading && !challenge;
  const refreshing = detailQuery.isRefetching;

  const onRefresh = useCallback(async () => {
    refreshProfile?.();
    await detailQuery.refetch();
  }, [detailQuery, refreshProfile]);

  // Join Challenge Mutation
  const joinMutation = useMutation({
    mutationFn: () => challengeService.acceptChallenge(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.challengeDetail(id) });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      refreshProfile?.();

      if (data?.status === USER_CHALLENGE_STATUS.COMPLETED) {
        Alert.alert(
          'Challenge Completed! 🎉',
          'Congratulations! Your existing streak already clears this challenge! Reward points have been credited to your profile.'
        );
      } else {
        Alert.alert(
          'Challenge Joined! 🚀',
          'You are now participating in this challenge. Complete the criteria before the deadline to earn reward points!'
        );
      }
    },
    onError: (err) => {
      Alert.alert('Could Not Join', err?.message || 'Failed to join challenge.');
    },
  });

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title="Challenge Details" showBack />
        <View style={styles.loadingBody}>
          <Skeleton height={200} radius={custom.radius.lg} style={styles.mbLg} />
          <Skeleton height={80} radius={custom.radius.md} style={styles.mbLg} />
          <Skeleton height={140} radius={custom.radius.md} style={styles.mbLg} />
        </View>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title="Challenge Details" showBack />
        <EmptyState
          icon="alert-circle-outline"
          title="Challenge Not Found"
          description="This challenge might have ended or been removed."
          actionLabel="View All Challenges"
          onAction={() => router.replace('/challenges')}
        />
      </View>
    );
  }

  const userChallenge = challenge.userChallenge || null;
  const isJoined = Boolean(challenge.isJoined || userChallenge);
  const isCompleted = userChallenge?.status === USER_CHALLENGE_STATUS.COMPLETED;
  const isDayStreak = challenge.type === CHALLENGE_TYPES.DAY_STREAK;
  const isProofBased = challenge.type === CHALLENGE_TYPES.PROOF_BASED;

  const currentProgress = userChallenge?.progress?.current || 0;
  const targetProgress = challenge.targetValue || userChallenge?.progress?.target || 1;
  const progressRatio = Math.min(1, Math.max(0, currentProgress / targetProgress));
  const progressPercent = Math.round(progressRatio * 100);

  const pointsReward = challenge.reward?.points ?? 0;
  const submissions = Array.isArray(userChallenge?.submissions) ? userChallenge.submissions : [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Challenge Details"
        showBack
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/challenges'))}
        rightElement={
          <View
            style={[
              styles.pointsPill,
              { backgroundColor: colors.secondaryContainer },
            ]}
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
          </View>
        }
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
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
        {/* Hero Image or Placeholder Banner */}
        {challenge.thumbnailUrl ? (
          <View style={styles.heroImageWrap}>
            <Image
              source={{ uri: challenge.thumbnailUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {pointsReward > 0 && (
              <View style={[styles.heroPointsPill, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
                <Zap size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.heroPointsText}>+{pointsReward} Reward Points</Text>
              </View>
            )}
          </View>
        ) : (
          <View
            style={[
              styles.placeholderBanner,
              {
                backgroundColor: isDayStreak
                  ? colors.errorContainer
                  : colors.primaryContainer,
              },
            ]}
          >
            {isDayStreak ? (
              <Flame size={44} color={colors.onErrorContainer} />
            ) : (
              <Trophy size={44} color={colors.primary} />
            )}
            {pointsReward > 0 && (
              <View style={[styles.heroPointsPillStandalone, { backgroundColor: colors.surface }]}>
                <Zap size={13} color={colors.secondary} fill={colors.secondary} />
                <Text style={[styles.heroPointsTextStandalone, { color: colors.onSurface }]}>
                  +{pointsReward} Reward Points
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Title & Status Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
          ]}
        >
          <View style={styles.badgesRow}>
            <ChallengeTypeBadge type={challenge.type} />
            {userChallenge ? (
              <ChallengeStatusBadge status={userChallenge.status} />
            ) : null}
          </View>

          <Text style={[styles.challengeTitle, { color: colors.onSurface }]}>
            {challenge.title}
          </Text>

          {challenge.description ? (
            <Text
              style={[styles.challengeDescription, { color: colors.onSurfaceVariant }]}
            >
              {challenge.description}
            </Text>
          ) : null}

          {/* Timing & Dates */}
          <View style={[styles.dateRow, { backgroundColor: colors.surfaceVariant + '60' }]}>
            <Calendar size={15} color={colors.primary} />
            <Text style={[styles.dateRowText, { color: colors.onSurface }]}>
              Active Window: {challenge.startDateKey} &rarr; {challenge.endDateKey}
            </Text>
          </View>
        </View>

        {/* User Progress Card (If Joined) */}
        {isJoined && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: isCompleted ? '#16A34A' : colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Your Progress
              </Text>
              {isCompleted ? (
                <View style={styles.completedBadgeRow}>
                  <CheckCircle2 size={16} color="#15803D" />
                  <Text style={styles.completedBadgeText}>Completed</Text>
                </View>
              ) : null}
            </View>

            {isDayStreak && (
              <View style={styles.progressBlock}>
                <View style={styles.progressLabelsRow}>
                  <Text style={[styles.metricText, { color: colors.onSurface }]}>
                    Streak: {currentProgress} / {targetProgress} Days
                  </Text>
                  <Text style={[styles.percentLabel, { color: colors.primary }]}>
                    {progressPercent}%
                  </Text>
                </View>

                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: colors.surfaceVariant },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${progressPercent}%`,
                        backgroundColor: isCompleted ? '#16A34A' : '#EA580C',
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {isProofBased && (
              <View style={styles.submissionsBlock}>
                <Text style={[styles.subBlockTitle, { color: colors.onSurfaceVariant }]}>
                  Verification Submissions ({submissions.length})
                </Text>

                {submissions.length > 0 ? (
                  submissions.map((sub, idx) => (
                    <View
                      key={String(sub._id || idx)}
                      style={[
                        styles.submissionItem,
                        {
                          backgroundColor: colors.surfaceVariant + '50',
                          borderColor: colors.outlineVariant,
                        },
                      ]}
                    >
                      <View style={styles.subItemHeader}>
                        <Text style={[styles.subDate, { color: colors.onSurfaceVariant }]}>
                          Submission #{idx + 1} • {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Recent'}
                        </Text>
                        <ChallengeStatusBadge status={sub.status} />
                      </View>

                      {sub.rejectionReason && (
                        <View style={styles.rejectionBox}>
                          <AlertCircle size={14} color={colors.error} />
                          <Text style={[styles.rejectionText, { color: colors.error }]}>
                            {sub.rejectionReason}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={[styles.noSubmissionsText, { color: colors.onSurfaceVariant }]}>
                    No proof submitted yet. Tap the button below to upload your proof.
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Instructions & Rules Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
          ]}
        >
          <View style={styles.sectionHeader}>
            <FileText size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Rules & Instructions
            </Text>
          </View>

          <Text style={[styles.instructionsText, { color: colors.onSurfaceVariant }]}>
            {challenge.instructions ||
              'Complete the daily workouts or form criteria specified above to earn your verification and points.'}
          </Text>
        </View>

        {/* Reward Callout */}
        <View
          style={[
            styles.rewardCallout,
            {
              backgroundColor: colors.secondaryContainer,
              borderColor: colors.secondary,
            },
          ]}
        >
          <Zap size={22} color={colors.secondary} fill={colors.secondary} />
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.rewardCalloutTitle, { color: colors.onSecondaryContainer }]}
            >
              Earn +{pointsReward} Points
            </Text>
            <Text
              style={[styles.rewardCalloutSub, { color: colors.onSecondaryContainer }]}
            >
              Redeemable for Whey Protein, Oats, Creatine & Supplements in the FitMitra Store.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button Bar */}
      <View
        style={[
          styles.floatingBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.outlineVariant,
          },
        ]}
      >
        {!isJoined ? (
          <AppButton
            label={joinMutation.isPending ? 'Joining Challenge...' : 'Accept Challenge'}
            onPress={() => joinMutation.mutate()}
            loading={joinMutation.isPending}
            disabled={joinMutation.isPending}
          />
        ) : isCompleted ? (
          <View style={styles.completedBanner}>
            <CheckCircle2 size={20} color="#15803D" />
            <Text style={styles.completedBannerText}>
              Challenge Completed • +{pointsReward} pts Awarded!
            </Text>
          </View>
        ) : isProofBased ? (
          <AppButton
            label="Submit Verification Proof"
            icon="camera"
            onPress={() => setProofModalVisible(true)}
          />
        ) : (
          <AppButton
            label="View Workouts"
            icon="dumbbell"
            mode="outlined"
            onPress={() => router.push('/(tabs)/workouts')}
          />
        )}
      </View>

      {/* Proof Submission Modal */}
      <SubmitProofModal
        visible={proofModalVisible}
        challenge={challenge}
        onClose={() => setProofModalVisible(false)}
        onProofSubmitted={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.challengeDetail(id) });
          queryClient.invalidateQueries({ queryKey: ['challenges'] });
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
  loadingBody: {
    padding: 16,
  },
  mbLg: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroImageWrap: {
    width: '100%',
    height: 190,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPointsPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  heroPointsText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  placeholderBanner: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroPointsPillStandalone: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroPointsTextStandalone: {
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      },
    }),
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  challengeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  dateRowText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  completedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  progressBlock: {
    marginBottom: 4,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  percentLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  submissionsBlock: {
    marginTop: 6,
  },
  subBlockTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  submissionItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  subItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  rejectionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noSubmissionsText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  instructionsText: {
    fontSize: 13.5,
    lineHeight: 21,
  },
  rewardCallout: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rewardCalloutTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rewardCalloutSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
      },
    }),
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  completedBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
});

