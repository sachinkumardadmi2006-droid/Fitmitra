import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Flame,
  Camera,
  Video,
  CheckCircle2,
  Clock,
  Hourglass,
  AlertCircle,
  Zap,
} from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  CHALLENGE_TYPES,
  USER_CHALLENGE_STATUS,
  SUBMISSION_STATUS,
} from '../../services/challengeService';

/**
 * Material design pill badge for challenge types and statuses
 */
export function ChallengeTypeBadge({ type, style }) {
  const { theme } = useAppTheme();
  const { colors } = theme;

  if (type === CHALLENGE_TYPES.DAY_STREAK) {
    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: colors.errorContainer, borderColor: colors.error },
          style,
        ]}
      >
        <Flame size={12} color={colors.onErrorContainer} strokeWidth={2.2} />
        <Text style={[styles.badgeText, { color: colors.onErrorContainer }]}>
          Day Streak
        </Text>
      </View>
    );
  }

  if (type === CHALLENGE_TYPES.PROOF_BASED) {
    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: colors.secondaryContainer, borderColor: colors.secondary },
          style,
        ]}
      >
        <Camera size={12} color={colors.onSecondaryContainer} strokeWidth={2} />
        <Text style={[styles.badgeText, { color: colors.onSecondaryContainer }]}>
          Proof Based
        </Text>
      </View>
    );
  }

  return null;
}

/**
 * Status badge for user challenge state (ACCEPTED, COMPLETED, EXPIRED, PENDING, REJECTED)
 */
export function ChallengeStatusBadge({ status, style }) {
  const { theme } = useAppTheme();
  const { colors } = theme;

  switch (status) {
    case USER_CHALLENGE_STATUS.COMPLETED:
    case SUBMISSION_STATUS.APPROVED:
      return (
        <View
          style={[
            styles.badge,
            { backgroundColor: '#DCFCE7', borderColor: '#16A34A' },
            style,
          ]}
        >
          <CheckCircle2 size={12} color="#15803D" strokeWidth={2.2} />
          <Text style={[styles.badgeText, { color: '#15803D' }]}>
            Completed
          </Text>
        </View>
      );

    case USER_CHALLENGE_STATUS.ACCEPTED:
      return (
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
            style,
          ]}
        >
          <Zap size={12} color={colors.primary} fill={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            Active
          </Text>
        </View>
      );

    case SUBMISSION_STATUS.PENDING:
      return (
        <View
          style={[
            styles.badge,
            { backgroundColor: '#FEF3C7', borderColor: '#D97706' },
            style,
          ]}
        >
          <Hourglass size={12} color="#B45309" strokeWidth={2} />
          <Text style={[styles.badgeText, { color: '#B45309' }]}>
            Under Review
          </Text>
        </View>
      );

    case SUBMISSION_STATUS.REJECTED:
      return (
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.errorContainer, borderColor: colors.error },
            style,
          ]}
        >
          <AlertCircle size={12} color={colors.error} strokeWidth={2} />
          <Text style={[styles.badgeText, { color: colors.error }]}>
            Rejected
          </Text>
        </View>
      );

    case USER_CHALLENGE_STATUS.EXPIRED:
      return (
        <View
          style={[
            styles.badge,
            { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
            style,
          ]}
        >
          <Clock size={12} color={colors.onSurfaceVariant} strokeWidth={2} />
          <Text style={[styles.badgeText, { color: colors.onSurfaceVariant }]}>
            Ended
          </Text>
        </View>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});

