import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import {
  Flame,
  Zap,
  Calendar,
  ChevronRight,
  UploadCloud,
  CheckCircle2,
  Hourglass,
} from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  ChallengeTypeBadge,
  ChallengeStatusBadge,
} from './ChallengeTypeBadge';
import {
  CHALLENGE_TYPES,
  USER_CHALLENGE_STATUS,
  SUBMISSION_STATUS,
} from '../../services/challengeService';

export function ActiveChallengeCard({
  userChallenge,
  onPress,
  onSubmitProofPress,
  style,
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;

  if (!userChallenge) return null;

  // Populated challenge reference
  const challenge =
    typeof userChallenge.challengeId === 'object' && userChallenge.challengeId !== null
      ? userChallenge.challengeId
      : {};

  const isDayStreak = challenge.type === CHALLENGE_TYPES.DAY_STREAK;
  const isProofBased = challenge.type === CHALLENGE_TYPES.PROOF_BASED;
  const isCompleted = userChallenge.status === USER_CHALLENGE_STATUS.COMPLETED;

  const currentProgress = userChallenge.progress?.current || 0;
  const targetProgress = challenge.targetValue || userChallenge.progress?.target || 1;
  const progressRatio = Math.min(1, Math.max(0, currentProgress / targetProgress));
  const progressPercent = Math.round(progressRatio * 100);

  const pointsReward = challenge.reward?.points ?? 0;

  // Submissions state
  const submissions = Array.isArray(userChallenge.submissions) ? userChallenge.submissions : [];
  const latestSubmission = submissions.length > 0 ? submissions[submissions.length - 1] : null;
  const isPendingReview = latestSubmission?.status === SUBMISSION_STATUS.PENDING;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isCompleted ? '#16A34A' : colors.outlineVariant,
        },
        pressed && { opacity: 0.94 },
        style,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Active Challenge: ${challenge.title || 'Challenge'}`}
    >
      {/* Header Row: Type Badge + Reward Pill */}
      <View style={styles.headerRow}>
        <View style={styles.badgeGroup}>
          <ChallengeTypeBadge type={challenge.type} />
          {userChallenge.status && (
            <ChallengeStatusBadge
              status={
                isPendingReview ? SUBMISSION_STATUS.PENDING : userChallenge.status
              }
            />
          )}
        </View>

        {pointsReward > 0 && (
          <View
            style={[
              styles.rewardPill,
              { backgroundColor: colors.secondaryContainer },
            ]}
          >
            <Zap size={11} color={colors.secondary} fill={colors.secondary} />
            <Text
              style={[styles.rewardText, { color: colors.onSecondaryContainer }]}
            >
              +{pointsReward} pts
            </Text>
          </View>
        )}
      </View>

      {/* Challenge Title */}
      <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
        {challenge.title || 'Untitled Challenge'}
      </Text>

      {/* Progress Metric & Status */}
      {isDayStreak && (
        <View style={styles.streakProgressBlock}>
          <View style={styles.streakHeaderRow}>
            <View style={styles.streakIconWrap}>
              <Flame size={16} color="#EA580C" />
              <Text style={[styles.streakText, { color: colors.onSurface }]}>
                {currentProgress} of {targetProgress} Days
              </Text>
            </View>
            <Text style={[styles.percentText, { color: colors.primary }]}>
              {progressPercent}%
            </Text>
          </View>

          {/* Progress Track */}
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
        <View
          style={[
            styles.proofStatusBox,
            { backgroundColor: colors.surfaceVariant + '80' },
          ]}
        >
          {isPendingReview ? (
            <View style={styles.proofStatusRow}>
              <Hourglass size={15} color="#D97706" />
              <Text style={[styles.proofStatusText, { color: '#D97706' }]}>
                Proof submitted • Pending coach review
              </Text>
            </View>
          ) : isCompleted ? (
            <View style={styles.proofStatusRow}>
              <CheckCircle2 size={15} color="#15803D" />
              <Text style={[styles.proofStatusText, { color: '#15803D' }]}>
                Proof verified & completed!
              </Text>
            </View>
          ) : (
            <View style={styles.proofStatusRow}>
              <UploadCloud size={15} color={colors.primary} />
              <Text style={[styles.proofStatusText, { color: colors.primary }]}>
                Photo or video proof required
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Divider */}
      <View
        style={[styles.divider, { backgroundColor: colors.outlineVariant }]}
      />

      {/* Footer Info & Action */}
      <View style={styles.footerRow}>
        <View style={styles.dateWrap}>
          <Calendar size={13} color={colors.onSurfaceVariant} />
          <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
            Ends: {challenge.endDateKey || 'Ongoing'}
          </Text>
        </View>

        {isProofBased && !isCompleted && !isPendingReview ? (
          <Pressable
            style={[
              styles.actionBtn,
              { backgroundColor: colors.primaryContainer },
            ]}
            onPress={(e) => {
              e.stopPropagation?.();
              onSubmitProofPress ? onSubmitProofPress(userChallenge) : onPress?.();
            }}
            hitSlop={6}
          >
            <UploadCloud size={14} color={colors.onPrimaryContainer} />
            <Text
              style={[
                styles.actionBtnText,
                { color: colors.onPrimaryContainer },
              ]}
            >
              Submit Proof
            </Text>
          </Pressable>
        ) : (
          <View style={styles.detailRow}>
            <Text style={[styles.detailText, { color: colors.primary }]}>
              {isCompleted ? 'View Result' : 'View Details'}
            </Text>
            <ChevronRight size={15} color={colors.primary} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  streakProgressBlock: {
    marginBottom: 10,
  },
  streakHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  streakIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3.5,
  },
  proofStatusBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  proofStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proofStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});

