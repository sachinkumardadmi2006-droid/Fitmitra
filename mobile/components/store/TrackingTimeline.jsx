import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, Circle, Truck, Package, Clock } from 'lucide-react-native';
import { Colors } from '../../constants/theme';

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
  const currentStepIndex = STEPS.findIndex(
    (s) => s.key === status || (status === 'CONFIRMED' && s.key === 'PLACED')
  );
  const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.trackingHeader}>
        <View>
          <Text style={styles.courierText}>
            {courier || 'Shiprocket Delivery'}
          </Text>
          {awb ? <Text style={styles.awbText}>AWB: {awb}</Text> : null}
        </View>
        {estimatedDelivery ? (
          <View style={styles.etaBadge}>
            <Clock size={12} color="#00D8F6" />
            <Text style={styles.etaText}>ETA: {estimatedDelivery}</Text>
          </View>
        ) : null}
      </View>

      {/* Stepper */}
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
                    isCompleted && styles.nodeCompleted,
                    isCurrent && styles.nodeCurrent,
                  ]}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={16} color={Colors.bgDarkBase} />
                  ) : (
                    <Circle size={10} color={Colors.textSecondary} />
                  )}
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.line,
                      idx < activeIndex && styles.lineCompleted,
                    ]}
                  />
                )}
              </View>

              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepLabel,
                    isCompleted && styles.stepLabelCompleted,
                    isCurrent && styles.stepLabelCurrent,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Checkpoints Activities */}
      {activities && activities.length > 0 && (
        <View style={styles.activitiesSection}>
          <Text style={styles.activitiesTitle}>Activity History</Text>
          {activities.map((act, i) => (
            <View key={i} style={styles.activityItem}>
              <Text style={styles.activityText}>{act.activity || act.status}</Text>
              {act.location ? (
                <Text style={styles.activitySub}>{act.location}</Text>
              ) : null}
              {act.timestamp ? (
                <Text style={styles.activityDate}>
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
    backgroundColor: Colors.bgCardGlass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: 20,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  courierText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  awbText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 216, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 246, 0.25)',
  },
  etaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D8F6',
  },
  stepsContainer: {
    paddingLeft: 4,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeCompleted: {
    backgroundColor: Colors.primaryNeon,
  },
  nodeCurrent: {
    backgroundColor: '#00D8F6',
    borderWidth: 2,
    borderColor: Colors.bgDarkBase,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: Colors.primaryNeon,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 12,
    paddingTop: 2,
  },
  stepLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  stepLabelCompleted: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: '#00D8F6',
    fontWeight: '800',
  },
  activitiesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  activitiesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  activityItem: {
    marginBottom: 8,
  },
  activityText: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  activitySub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  activityDate: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
