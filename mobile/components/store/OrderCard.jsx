import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Package, Truck, Zap, ChevronRight } from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { Badge } from '../common/Badge';

export function OrderCard({ order, onTrack }) {
  const isPoints = order.paymentMethod === 'POINTS';
  const awb = order.shippingDetails?.awbCode;

  const getStatusVariant = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'neon';
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return 'cyan';
      case 'DISPATCHED':
      case 'PROCESSING':
        return 'amber';
      case 'CANCELLED':
        return 'rose';
      default:
        return 'gray';
    }
  };

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Package size={16} color={Colors.primaryNeon} />
          <Text style={styles.orderId}>
            #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
          </Text>
        </View>
        <Badge
          label={order.status}
          variant={getStatusVariant(order.status)}
          size="small"
        />
      </View>

      <Text style={styles.dateText}>{formattedDate}</Text>

      {/* Items list */}
      <View style={styles.itemsList}>
        {order.items?.map((item, idx) => (
          <Text key={idx} style={styles.itemText} numberOfLines={1}>
            {item.quantity}x {item.productName || 'Product'}
          </Text>
        ))}
      </View>

      {/* Total & Action Footer */}
      <View style={styles.footer}>
        <View style={styles.totalWrap}>
          <Text style={styles.totalLabel}>Total: </Text>
          {isPoints ? (
            <View style={styles.pointsWrap}>
              <Zap size={14} color="#FFB800" fill="#FFB800" />
              <Text style={styles.pointsText}>{order.totalPoints} pts</Text>
            </View>
          ) : (
            <Text style={styles.cashText}>
              ₹{Math.round((order.totalAmountInPaise || 0) / 100)}
            </Text>
          )}
        </View>

        {awb ? (
          <Pressable
            style={({ pressed }) => [styles.trackBtn, pressed && { opacity: 0.8 }]}
            onPress={() => onTrack?.(order)}
          >
            <Truck size={14} color={Colors.primaryNeon} />
            <Text style={styles.trackBtnText}>Track Order</Text>
            <ChevronRight size={14} color={Colors.primaryNeon} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCardGlass,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: 16,
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
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  itemsList: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  itemText: {
    fontSize: 13,
    color: Colors.textPrimary,
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
    color: Colors.textSecondary,
  },
  cashText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  pointsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFB800',
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 155, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 155, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryNeon,
  },
});
