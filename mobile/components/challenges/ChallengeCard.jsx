import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import {
  Trophy,
  Zap,
  Calendar,
  ChevronRight,
  Flame,
  CheckCircle2,
} from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  ChallengeTypeBadge,
  ChallengeStatusBadge,
} from './ChallengeTypeBadge';
import {
  CHALLENGE_TYPES,
  USER_CHALLENGE_STATUS,
} from '../../services/challengeService';

export function ChallengeCard({
  challenge,
  onPress,
  onJoinPress,
  isJoining = false,
  style,
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;

  if (!challenge) return null;

  const userChallenge = challenge.userChallenge || null;
  const isJoined = Boolean(challenge.isJoined || userChallenge);
  const isCompleted = userChallenge?.status === USER_CHALLENGE_STATUS.COMPLETED;
  const isDayStreak = challenge.type === CHALLENGE_TYPES.DAY_STREAK;

  const currentProgress = userChallenge?.progress?.current || 0;
  const targetProgress = challenge.targetValue || userChallenge?.progress?.target || 1;
  const progressRatio = Math.min(1, Math.max(0, currentProgress / targetProgress));
  const progressPercent = Math.round(progressRatio * 100);

  const pointsReward = challenge.reward?.points ?? 0;

  // Format date range (e.g., Ends: 2026-11-20)
  const endDateFormatted = challenge.endDateKey || 'Active';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.outlineVariant,
        },
        pressed && { opacity: 0.94 },
        style,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Challenge: ${challenge.title}`}
    >
      {/* Top Banner / Image Area */}
      {challenge.thumbnailUrl ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: challenge.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          {/* Overlay Points Badge */}
          {pointsReward > 0 && (
            <View
              style={[
                styles.pointsBadgeOverlay,
                { backgroundColor: 'rgba(0,0,0,0.75)' },
              ]}
            >
              <Zap size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.pointsOverlayText}>+{pointsReward} pts</Text>
            </View>
          )}
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
          {isDayStreak ? (
            <Flame size={28} color={colors.onErrorContainer} />
          ) : (
            <Trophy size={28} color={colors.primary} />
          )}

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

      {/* Card Content Area */}
      <View style={styles.contentWrap}>
        {/* Badges Row */}
        <View style={styles.badgesRow}>
          <ChallengeTypeBadge type={challenge.type} />
          {userChallenge ? (
            <ChallengeStatusBadge status={userChallenge.status} />
          ) : null}
        </View>

        {/* Challenge Title */}
        <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
          {challenge.title}
        </Text>

        {/* Description Snippet */}
        {challenge.description ? (
          <Text
            style={[styles.description, { color: colors.onSurfaceVariant }]}
            numberOfLines={2}
          >
            {challenge.description}
          </Text>
        ) : null}

        {/* Progress Bar (Visible if Joined) */}
        {isJoined && (
          <View style={styles.progressSection}>
            <View style={styles.progressMetaRow}>
              <Text
                style={[styles.progressLabel, { color: colors.onSurfaceVariant }]}
              >
                {isDayStreak ? 'Streak Progress' : 'Challenge Progress'}
              </Text>
              <Text style={[styles.progressValue, { color: colors.primary }]}>
                {isDayStreak
                  ? `${currentProgress} / ${targetProgress} Days (${progressPercent}%)`
                  : isCompleted
                  ? 'Completed'
                  : `${progressPercent}%`}
              </Text>
            </View>

            {/* Custom Material Progress Bar Track */}
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
                    backgroundColor: isCompleted ? '#16A34A' : colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Divider */}
        <View
          style={[
            styles.cardDivider,
            { backgroundColor: colors.outlineVariant },
          ]}
        />

        {/* Footer Meta & Action */}
        <View style={styles.footerRow}>
          <View style={styles.dateCol}>
            <Calendar size={13} color={colors.onSurfaceVariant} />
            <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
              Ends: {endDateFormatted}
            </Text>
          </View>

          {/* Action Button */}
          {!isJoined ? (
            <Pressable
              style={[
                styles.actionBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={(e) => {
                e.stopPropagation?.();
                onJoinPress ? onJoinPress(challenge) : onPress?.();
              }}
              disabled={isJoining}
              hitSlop={6}
            >
              <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>
                {isJoining ? 'Joining...' : 'Join Challenge'}
              </Text>
            </Pressable>
          ) : isCompleted ? (
            <View style={styles.completedRow}>
              <CheckCircle2 size={16} color="#15803D" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          ) : (
            <View style={styles.viewRow}>
              <Text style={[styles.viewText, { color: colors.primary }]}>
                View Details
              </Text>
              <ChevronRight size={16} color={colors.primary} />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  pointsBadgeOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsOverlayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  placeholderHeader: {
    width: '100%',
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pointsBadgeTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 11,
    fontWeight: '800',
  },
  contentWrap: {
    padding: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  progressSection: {
    marginTop: 6,
    marginBottom: 10,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});

