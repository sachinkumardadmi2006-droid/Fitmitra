import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
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
  Camera,
  ArrowRight,
  Dumbbell,
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

/**
 * AcceptedChallengeHero — Standout hero card displayed at the top of the Challenges feed
 * showing the user's accepted challenge, remaining day streak countdown, banner image,
 * and direct "Add Your Proof to Complete" or "Continue Routine" actions.
 */
export function AcceptedChallengeHero({
  userChallenge,
  onPress,
  onSubmitProofPress,
  onContinueWorkoutPress,
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

  const challengeId = challenge._id || challenge.id;
  const isDayStreak = challenge.type === CHALLENGE_TYPES.DAY_STREAK;
  const isProofBased = challenge.type === CHALLENGE_TYPES.PROOF_BASED;
  const isCompleted = userChallenge.status === USER_CHALLENGE_STATUS.COMPLETED;

  // Dynamic aspect ratio calculation so image renders with full natural width & height
  const [imageRatio, setImageRatio] = useState(16 / 9);

  useEffect(() => {
    if (challenge?.thumbnailUrl) {
      Image.getSize(
        challenge.thumbnailUrl,
        (width, height) => {
          if (width && height && height > 0) {
            setImageRatio(width / height);
          }
        },
        () => {
          setImageRatio(16 / 9);
        }
      );
    }
  }, [challenge?.thumbnailUrl]);

  // Progress metrics
  const currentDays = userChallenge.progress?.current || 0;
  const targetDays = challenge.targetValue || userChallenge.progress?.target || 1;
  const remainingDays = Math.max(0, targetDays - currentDays);
  const progressRatio = Math.min(1, Math.max(0, currentDays / targetDays));
  const progressPercent = Math.round(progressRatio * 100);

  const pointsReward = challenge.reward?.points ?? 0;
  const endDateFormatted = challenge.endDateKey || 'Active';

  // Submissions state for proof-based
  const submissions = Array.isArray(userChallenge.submissions) ? userChallenge.submissions : [];
  const latestSubmission = submissions.length > 0 ? submissions[submissions.length - 1] : null;
  const isPendingReview = latestSubmission?.status === SUBMISSION_STATUS.PENDING;
  const isApproved = latestSubmission?.status === SUBMISSION_STATUS.APPROVED || isCompleted;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isCompleted
            ? '#16A34A'
            : isDayStreak
            ? 'rgba(234, 88, 12, 0.4)'
            : 'rgba(99, 102, 241, 0.4)',
        },
        pressed && { opacity: 0.96 },
        style,
      ]}
      onPress={() => onPress?.(challengeId)}
      accessibilityRole="button"
      accessibilityLabel={`Accepted Challenge: ${challenge.title || 'Challenge'}`}
    >
      {/* Top Banner / Image with Overlays */}
      {challenge.thumbnailUrl ? (
        <View style={[styles.imageContainer, { aspectRatio: imageRatio }]}>
          <Image
            source={{ uri: challenge.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
            onLoad={(e) => {
              const { width, height } = e?.nativeEvent?.source || {};
              if (width && height && height > 0) {
                setImageRatio(width / height);
              }
            }}
          />

          {/* Top Overlays: Badges Left & Points Right */}
          <View style={styles.imageOverlayTop}>
            <View style={styles.badgeGroup}>
              <ChallengeTypeBadge type={challenge.type} />
              <View style={[styles.activePill, { backgroundColor: 'rgba(16, 185, 129, 0.9)' }]}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>Active</Text>
              </View>
            </View>

            {pointsReward > 0 && (
              <View style={styles.pointsBadgeOverlay}>
                <Zap size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.pointsOverlayText}>+{pointsReward} pts</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.placeholderHeader,
            {
              backgroundColor: isDayStreak
                ? colors.errorContainer
                : colors.primaryContainer,
            },
          ]}
        >
          <View style={styles.badgeGroup}>
            <ChallengeTypeBadge type={challenge.type} />
            <View style={[styles.activePill, { backgroundColor: '#10B981' }]}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          </View>

          {pointsReward > 0 && (
            <View
              style={[
                styles.pointsBadgeTopRight,
                { backgroundColor: colors.surface },
              ]}
            >
              <Zap size={12} color={colors.secondary} fill={colors.secondary} />
              <Text style={[styles.pointsText, { color: colors.onSurface }]}>
                +{pointsReward} pts
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Card Content Body */}
      <View style={styles.body}>
        {/* Title */}
        <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
          {challenge.title || 'Untitled Challenge'}
        </Text>

        {/* Short Description */}
        {challenge.description ? (
          <Text
            style={[styles.description, { color: colors.onSurfaceVariant }]}
            numberOfLines={2}
          >
            {challenge.description}
          </Text>
        ) : null}

        {/* 1. DAY STREAK SECTION */}
        {isDayStreak && (
          <View style={styles.sectionWrap}>
            {/* Highlight Box showing Remaining Day Streak to Complete */}
            <View
              style={[
                styles.highlightBox,
                {
                  backgroundColor: theme.dark
                    ? 'rgba(234, 88, 12, 0.14)'
                    : '#FFF7ED',
                  borderColor: 'rgba(234, 88, 12, 0.3)',
                },
              ]}
            >
              <View style={styles.highlightIconWrap}>
                <Flame size={20} color="#EA580C" fill="#EA580C" />
              </View>
              <View style={styles.highlightContent}>
                <Text
                  style={[
                    styles.highlightTitle,
                    { color: theme.dark ? '#FDBA74' : '#C2410C' },
                  ]}
                >
                  {isCompleted || remainingDays === 0
                    ? '🎉 Goal Reached! Challenge Completed'
                    : remainingDays === 1
                    ? '⚡ 1 Day Streak Remaining to Complete!'
                    : `🔥 ${remainingDays} Days Streak Remaining to Complete!`}
                </Text>
                <Text
                  style={[
                    styles.highlightSub,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  {isCompleted || remainingDays === 0
                    ? `You cleared your streak goal and secured +${pointsReward} points!`
                    : `Maintain your workout streak for ${remainingDays} more day${
                        remainingDays > 1 ? 's' : ''
                      } to unlock your +${pointsReward} pts reward.`}
                </Text>
              </View>
            </View>

            {/* Streak Progress Bar */}
            <View style={styles.progressRow}>
              <Text style={[styles.progressLabel, { color: colors.onSurfaceVariant }]}>
                Streak Progress
              </Text>
              <Text style={[styles.progressVal, { color: '#EA580C' }]}>
                {currentDays} / {targetDays} Days ({progressPercent}%)
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

        {/* 2. PROOF BASED SECTION */}
        {isProofBased && (
          <View style={styles.sectionWrap}>
            {isPendingReview ? (
              <View
                style={[
                  styles.highlightBox,
                  {
                    backgroundColor: theme.dark
                      ? 'rgba(217, 119, 6, 0.14)'
                      : '#FEF3C7',
                    borderColor: 'rgba(217, 119, 6, 0.3)',
                  },
                ]}
              >
                <Hourglass size={20} color="#D97706" />
                <View style={styles.highlightContent}>
                  <Text style={[styles.highlightTitle, { color: '#B45309' }]}>
                    Proof Submitted • Under Coach Review
                  </Text>
                  <Text style={[styles.highlightSub, { color: colors.onSurfaceVariant }]}>
                    Your submission is being verified. Your +{pointsReward} reward points will be added upon approval.
                  </Text>
                </View>
              </View>
            ) : isApproved ? (
              <View
                style={[
                  styles.highlightBox,
                  {
                    backgroundColor: theme.dark
                      ? 'rgba(22, 163, 74, 0.14)'
                      : '#F0FDF4',
                    borderColor: 'rgba(22, 163, 74, 0.3)',
                  },
                ]}
              >
                <CheckCircle2 size={20} color="#16A34A" />
                <View style={styles.highlightContent}>
                  <Text style={[styles.highlightTitle, { color: '#15803D' }]}>
                    Proof Verified & Challenge Completed!
                  </Text>
                  <Text style={[styles.highlightSub, { color: colors.onSurfaceVariant }]}>
                    +{pointsReward} reward points have been credited to your balance.
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <View
                  style={[
                    styles.highlightBox,
                    {
                      backgroundColor: theme.dark
                        ? 'rgba(99, 102, 241, 0.14)'
                        : '#EEF2FF',
                      borderColor: 'rgba(99, 102, 241, 0.3)',
                    },
                  ]}
                >
                  <Camera size={20} color={colors.primary} />
                  <View style={styles.highlightContent}>
                    <Text style={[styles.highlightTitle, { color: colors.primary }]}>
                      Proof Required to Complete
                    </Text>
                    <Text style={[styles.highlightSub, { color: colors.onSurfaceVariant }]}>
                      Upload photo or video proof of your exercise form to complete this challenge and claim +{pointsReward} pts.
                    </Text>
                  </View>
                </View>

                {/* STANDOUT ACTION BUTTON: Add Your Proof to Complete */}
                <Pressable
                  style={[
                    styles.submitProofBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    if (onSubmitProofPress) {
                      onSubmitProofPress(challenge);
                    } else {
                      onPress?.(challengeId);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Add your proof to complete challenge"
                >
                  <UploadCloud size={18} color={colors.onPrimary} />
                  <Text style={[styles.submitProofBtnText, { color: colors.onPrimary }]}>
                    Add Your Proof to Complete
                  </Text>
                  <ArrowRight size={16} color={colors.onPrimary} />
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

        {/* Footer Info & Actions */}
        <View style={styles.footerRow}>
          <View style={styles.dateWrap}>
            <Calendar size={13} color={colors.onSurfaceVariant} />
            <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
              Ends: {endDateFormatted}
            </Text>
          </View>

          <View style={styles.footerActions}>
            {isDayStreak && (
              <Pressable
                style={[styles.continueBtn, { backgroundColor: colors.primaryContainer }]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onContinueWorkoutPress ? onContinueWorkoutPress() : onPress?.(challengeId);
                }}
                hitSlop={6}
              >
                <Dumbbell size={13} color={colors.onPrimaryContainer} />
                <Text style={[styles.continueBtnText, { color: colors.onPrimaryContainer }]}>
                  Log Workout
                </Text>
              </Pressable>
            )}

            <Pressable
              style={styles.detailsLink}
              onPress={() => onPress?.(challengeId)}
              hitSlop={6}
            >
              <Text style={[styles.detailsLinkText, { color: colors.primary }]}>
                View Details
              </Text>
              <ChevronRight size={15} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
      },
    }),
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  imageOverlayTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  activeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pointsBadgeOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  pointsOverlayText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },
  placeholderHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsBadgeTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '800',
  },
  body: {
    padding: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  description: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 12,
  },
  sectionWrap: {
    marginTop: 2,
    marginBottom: 6,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  highlightIconWrap: {
    marginTop: 1,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  highlightSub: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressVal: {
    fontSize: 12.5,
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
  submitProofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitProofBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginVertical: 12,
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
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  continueBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});

