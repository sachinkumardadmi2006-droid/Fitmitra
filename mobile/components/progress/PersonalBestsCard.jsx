import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy, Dumbbell, Calendar, Zap } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from '../ui/AppCard';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (_) {
    return dateStr;
  }
}

export default function PersonalBestsCard({ personalBests = [], style }) {
  const { theme } = useAppTheme();
  const { colors } = theme;

  const validBests = Array.isArray(personalBests)
    ? personalBests.filter((pr) => pr && typeof pr.bestWeightKg === 'number' && pr.bestWeightKg > 0)
    : [];

  return (
    <AppCard variant="elevated" style={[styles.root, style]}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={[styles.trophyWrap, { backgroundColor: colors.secondaryContainer }]}>
            <Trophy size={18} color={colors.onSecondaryContainer} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.onSurface }]}>Personal Bests (PRs)</Text>
            <Text style={[styles.subTitle, { color: colors.onSurfaceVariant }]}>
              All-time heaviest completed lifts
            </Text>
          </View>
        </View>

        {validBests.length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
            <Zap size={12} color={colors.secondary} />
            <Text style={[styles.countBadgeText, { color: colors.onSurface }]}>
              {validBests.length} {validBests.length === 1 ? 'record' : 'records'}
            </Text>
          </View>
        )}
      </View>

      {validBests.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Dumbbell size={28} color={colors.outlineVariant} />
          <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            Complete your workout sets with logged weights and reps to automatically unlock your Personal Records.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {validBests.map((pr, idx) => (
            <View
              key={pr.exerciseId || `pr-${idx}`}
              style={[
                styles.itemRow,
                idx < validBests.length - 1 && { borderBottomColor: colors.outlineVariant, borderBottomWidth: 1 },
              ]}
            >
              <View style={styles.itemLeft}>
                <Text style={[styles.exerciseName, { color: colors.onSurface }]} numberOfLines={1}>
                  {pr.exerciseName || 'Exercise Lift'}
                </Text>
                <View style={styles.metaRow}>
                  <Calendar size={12} color={colors.onSurfaceVariant} />
                  <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
                    {formatDate(pr.achievedDateKey)}
                  </Text>
                  {pr.repsAtBest > 0 && (
                    <Text style={[styles.repsText, { color: colors.onSurfaceVariant }]}>
                      • {pr.repsAtBest} {pr.repsAtBest === 1 ? 'rep' : 'reps'}
                    </Text>
                  )}
                </View>
              </View>

              <View style={[styles.weightPill, { backgroundColor: colors.primaryContainer, borderColor: colors.primary }]}>
                <Text style={[styles.weightVal, { color: colors.onPrimaryContainer }]}>
                  {pr.bestWeightKg} <Text style={styles.kgUnit}>kg</Text>
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  trophyWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subTitle: {
    fontSize: 12,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyWrap: {
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  list: {
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemLeft: {
    flex: 1,
    marginRight: 12,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
  },
  repsText: {
    fontSize: 11,
  },
  weightPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  kgUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
});

