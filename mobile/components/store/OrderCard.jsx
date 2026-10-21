import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Package, Truck, Zap, ChevronRight, CreditCard } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from '../ui/AppCard';

export function OrderCard({ order, onTrack, onCompletePayment, showTracking = true }) {
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  const isPoints = order.paymentMethod === 'POINTS';
  const awb = order.shippingDetails?.awbCode;

  const orderAgeMs = order.createdAt ? Date.now() - new Date(order.createdAt).getTime() : 0;
  const isYoungerThan60Min = orderAgeMs < 60 * 60 * 1000;
  const isPendingPayment = order.status === 'PENDING_PAYMENT';
  const canCompletePayment = isPendingPayment && isYoungerThan60Min;

  const getStatusBadge = () => {
    switch (order.status) {
      case 'PENDING_PAYMENT':
        if (!isYoungerThan60Min) {
          return {
            bg: colors.surfaceVariant,
            fg: colors.onSurfaceVariant,
            border: colors.outlineVariant,
            label: 'Payment Expired',
          };
        }
        return {
          bg: colors.secondaryContainer,
          fg: colors.onSecondaryContainer,
          border: colors.secondary,
          label: 'Payment Pending',
        };
      case 'PLACED':
      case 'PAID':
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'DISPATCHED':
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
      case 'DELIVERED':
        return {
          bg: colors.primaryContainer,
          fg: colors.onPrimaryContainer,
          border: colors.primary,
          label: order.status.replace(/_/g, ' '),
        };
      case 'CANCELLED':
      case 'RTO':
        return {
          bg: colors.surfaceVariant,
          fg: colors.onSurfaceVariant,
          border: colors.outlineVariant,
          label: order.status.replace(/_/g, ' '),
        };
      case 'REFUND_REQUIRED':
        return {
          bg: colors.errorContainer,
          fg: colors.onErrorContainer,
          border: colors.error,
          label: 'Refund Required',
        };
      default:
        return {
          bg: colors.surfaceVariant,
          fg: colors.onSurfaceVariant,
          border: colors.outlineVariant,
          label: order.status || 'Unknown',
        };
    }
  };

  const badge = getStatusBadge();

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <AppCard variant="elevated" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Package size={16} color={colors.primary} />
          <Text style={[styles.orderId, { color: colors.onSurface }]}>
            #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: badge.bg, borderColor: badge.border },
          ]}
        >
          <Text style={[styles.statusText, { color: badge.fg }]}>
            {badge.label}
          </Text>
        </View>
      </View>

      <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>{formattedDate}</Text>

      {/* Items list */}
      <View
        style={[
          styles.itemsList,
          {
            borderTopColor: colors.outlineVariant,
            borderBottomColor: colors.outlineVariant,
          },
        ]}
      >
        {order.items?.map((item, idx) => (
          <Text key={idx} style={[styles.itemText, { color: colors.onSurface }]} numberOfLines={1}>
            {item.quantity}x {item.productName || item.product?.name || 'Product'}
          </Text>
        ))}
      </View>

      {/* Total & Action Footer */}
      <View style={styles.footer}>
        <View style={styles.totalWrap}>
          <Text style={[styles.totalLabel, { color: colors.onSurfaceVariant }]}>Total: </Text>
          {isPoints ? (
            <View style={styles.pointsWrap}>
              <Zap size={14} color={colors.secondary} fill={colors.secondary} />
              <Text style={[styles.pointsText, { color: colors.secondary }]}>
                {order.pointsUsed || order.totalPoints || 0} pts
              </Text>
            </View>
          ) : (
            <Text style={[styles.cashText, { color: colors.onSurface }]}>
              ₹{Math.round((order.totalAmountInPaise || 0) / 100)}
            </Text>
          )}
        </View>

        <View style={styles.actionsWrap}>
          {canCompletePayment ? (
            <Pressable
              style={[
                styles.payBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => onCompletePayment?.(order)}
            >
              <CreditCard size={14} color={colors.onPrimary} />
              <Text style={[styles.payBtnText, { color: colors.onPrimary }]}>
                Complete Payment
              </Text>
            </Pressable>
          ) : null}

          {showTracking && awb ? (
            <Pressable
              style={[
                styles.trackBtn,
                {
                  backgroundColor: colors.primaryContainer,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => onTrack?.(order)}
            >
              <Truck size={14} color={colors.onPrimaryContainer} />
              <Text style={[styles.trackBtnText, { color: colors.onPrimaryContainer }]}>
                Track
              </Text>
              <ChevronRight size={14} color={colors.onPrimaryContainer} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    marginBottom: 10,
  },
  itemsList: {
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  itemText: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
  },
  cashText: {
    fontSize: 16,
    fontWeight: '800',
  },
  pointsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  payBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
