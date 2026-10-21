import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, Circle, Clock } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { spacing, radius } from '../../theme/tokens';

const STEPS = [
  { key: 'PLACED', label: 'Order Placed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
];

export function TrackingTimeline({
  status = 'PLACED',
  awb = '',
  courier = '',
  estimatedDelivery = '',
  activities = [],
}) {
  const { theme } = useAppTheme();
  const currentStepIndex = STEPS.findIndex(
    (s) => s.key === status || (status === 'CONFIRMED' && s.key === 'PLACED')
  );
  const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      {/* Header Info */}
      <View
        style={[
          styles.trackingHeader,
          { borderBottomColor: theme.colors.outlineVariant },
        ]}
      >
        <View>
          <Text style={[styles.courierText, { color: theme.colors.onSurface }]}>
            {courier || 'Shiprocket Delivery'}
          </Text>
          {awb ? (
            <Text
              style={[
                styles.awbText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              AWB: {awb}
            </Text>
          ) : null}
        </View>
        {estimatedDelivery ? (
          <View
            style={[
              styles.etaBadge,
              {
                backgroundColor: theme.colors.tertiaryContainer,
                borderColor: theme.colors.tertiary,
              },
            ]}
          >
            <Clock size={12} color={theme.colors.onTertiaryContainer} />
            <Text
              style={[
                styles.etaText,
                { color: theme.colors.onTertiaryContainer },
              ]}
            >
              ETA: {estimatedDelivery}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Stepper */}
      {status === 'NOT_AVAILABLE' ? (
        <View style={{ padding: spacing.lg, alignItems: 'center' }}>
          <Text style={[styles.stepLabel, { color: theme.colors.onSurfaceVariant, textAlign: 'center' }]}>
            Live tracking is not available yet.
          </Text>
        </View>
      ) : (
        <View style={styles.stepsContainer}>
        {STEPS.map((step, idx) => {
          const isCompleted = idx <= activeIndex;
          const isCurrent = idx === activeIndex;
          const isLast = idx === STEPS.length - 1;

          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={styles.indicatorCol}>
                <View
                  style={[
                    styles.node,
                    { backgroundColor: theme.colors.surfaceVariant },
                    isCompleted && { backgroundColor: theme.colors.primary },
                    isCurrent && {
                      backgroundColor: theme.colors.primaryContainer,
                      borderColor: theme.colors.primary,
                      borderWidth: 2,
                    },
                  ]}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={16} color={theme.colors.onPrimary} />
                  ) : (
                    <Circle size={10} color={theme.colors.onSurfaceVariant} />
                  )}
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.line,
                      { backgroundColor: theme.colors.outlineVariant },
                      idx < activeIndex && {
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                )}
              </View>

              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepLabel,
                    { color: theme.colors.onSurfaceVariant },
                    isCompleted && {
                      color: theme.colors.onSurface,
                      fontWeight: '600',
                    },
                    isCurrent && {
                      color: theme.custom.primaryStrong,
                      fontWeight: '800',
                    },
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      )}

      {/* Checkpoints Activities */}
      {activities && activities.length > 0 && (
        <View
          style={[
            styles.activitiesSection,
            { borderTopColor: theme.colors.outlineVariant },
          ]}
        >
          <Text
            style={[
              styles.activitiesTitle,
              { color: theme.colors.onSurface },
            ]}
          >
            Activity History
          </Text>
          {activities.map((act, i) => (
            <View key={i} style={styles.activityItem}>
              <Text
                style={[
                  styles.activityText,
                  { color: theme.colors.onSurface },
                ]}
              >
                {act.activity || act.status}
              </Text>
              {act.location ? (
                <Text
                  style={[
                    styles.activitySub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {act.location}
                </Text>
              ) : null}
              {act.timestamp ? (
                <Text
                  style={[
                    styles.activityDate,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {new Date(act.timestamp).toLocaleString()}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  courierText: {
    fontSize: 16,
    fontWeight: '700',
  },
  awbText: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  etaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepsContainer: {
    paddingLeft: spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 48,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 24,
  },
  node: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    marginVertical: spacing.xs,
  },
  stepContent: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingTop: 2,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  activitiesSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  activitiesTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  activityItem: {
    marginBottom: spacing.sm,
  },
  activityText: {
    fontSize: 12,
  },
  activitySub: {
    fontSize: 11,
  },
  activityDate: {
    fontSize: 10,
    marginTop: 2,
  },
});

