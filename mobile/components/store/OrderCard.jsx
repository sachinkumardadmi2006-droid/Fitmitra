import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Package, Truck, Zap, ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from '../ui/AppCard';

export function OrderCard({ order, onTrack, showTracking = true }) {
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  const isPoints = order.paymentMethod === 'POINTS';
  const awb = order.shippingDetails?.awbCode;

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
            { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
          ]}
        >
          <Text style={[styles.statusText, { color: colors.onSurface }]}>
            {order.status}
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
                {order.totalPoints || 0} pts
              </Text>
            </View>
          ) : (
            <Text style={[styles.cashText, { color: colors.onSurface }]}>
              ₹{Math.round((order.totalAmountInPaise || 0) / 100)}
            </Text>
          )}
        </View>

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
              Track Order
            </Text>
            <ChevronRight size={14} color={colors.onPrimaryContainer} />
          </Pressable>
        ) : null}
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
