import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Truck, X } from 'lucide-react-native';
import { storeService } from '../services/storeService';
import { queryKeys } from '../constants/queryKeys';
import { useAuth } from '../context/AuthContext';
import { useAppConfig } from '../hooks/useAppConfig';
import { OrderCard } from '../components/store/OrderCard';
import { TrackingTimeline } from '../components/store/TrackingTimeline';
import { openCheckout, mapCashOrderToCheckout } from '../services/paymentCheckout';
import { useAppTheme } from '../theme/ThemeContext';
import AppHeader from '../components/ui/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

export default function OrdersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const { shippingEnabled } = useAppConfig();

  // Complete payment in-progress indicator
  const [completingPayment, setCompletingPayment] = useState(false);

  // Live tracking modal
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [activeTracking, setActiveTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const ordersQuery = useQuery({
    queryKey: queryKeys.storeOrders,
    queryFn: async () => {
      const orderData = await storeService.getMyOrders();
      return Array.isArray(orderData?.items)
        ? orderData.items
        : Array.isArray(orderData?.data)
        ? orderData.data
        : Array.isArray(orderData)
        ? orderData
        : [];
    },
    staleTime: 60 * 1000,
  });

  const orders = ordersQuery.data || [];
  const loading = ordersQuery.isLoading && !ordersQuery.data;
  const refreshing = ordersQuery.isRefetching;

  const onRefresh = useCallback(async () => {
    await ordersQuery.refetch();
  }, [ordersQuery]);

  // Poll order confirmation on GET /store/orders/:id up to 3 times, 3s apart
  const pollOrderPaid = async (orderId) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const orderData = await storeService.getOrder(orderId);
        const order = orderData?.data || orderData;
        if (order?.status === 'PAID') {
          return true;
        }
      } catch (_) {}
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
    return false;
  };

  // Resume payment for PENDING_PAYMENT cash order
  const handleCompletePayment = async (order) => {
    if (!order.idempotencyKey) {
      Alert.alert(
        'Cannot Resume Payment',
        'This order is missing idempotency credentials. Please place a new order from the store.'
      );
      return;
    }

    const orderAgeMs = order.createdAt ? Date.now() - new Date(order.createdAt).getTime() : 0;
    if (orderAgeMs >= 60 * 60 * 1000) {
      Alert.alert('This order expired', 'Please place a new order.');
      await ordersQuery.refetch();
      return;
    }

    try {
      setCompletingPayment(true);

      const formattedItems = (order.items || []).map((i) => ({
        productId: i.productId?._id || i.productId,
        quantity: i.quantity,
      }));

      // Replay POST /store/orders/cash with the order's items, address and idempotencyKey
      const res = await storeService.createCashOrder(
        {
          items: formattedItems,
          deliveryAddress: order.deliveryAddress,
        },
        order.idempotencyKey
      );

      const orderDoc = res?.order || res?.data?.order;
      const paymentInfo = res?.payment || res?.data?.payment;

      if (!orderDoc?._id) {
        throw new Error('Unable to retrieve payment session from server.');
      }

      // Replayed order status check
      if (orderDoc.status === 'PAID') {
        Alert.alert('Order Already Paid', 'This order has already been confirmed as paid.');
        await ordersQuery.refetch();
        return;
      }

      if (orderDoc.status !== 'PENDING_PAYMENT') {
        Alert.alert('This order expired', 'Please place a new order.');
        await ordersQuery.refetch();
        return;
      }

      if (!paymentInfo?.providerOrderId) {
        throw new Error('Server order replay did not return valid payment credentials.');
      }

      // Map response using shared mapping and open Razorpay Checkout
      const checkoutOptions = mapCashOrderToCheckout(orderDoc, paymentInfo, user, order.deliveryAddress);
      const checkoutResult = await openCheckout(checkoutOptions);

      if (checkoutResult.status === 'success' || checkoutResult.status === 'pending') {
        const confirmed = await pollOrderPaid(orderDoc._id);
        await queryClient.invalidateQueries({ queryKey: queryKeys.storeOrders });

        if (confirmed) {
          Alert.alert('Payment Confirmed!', 'Your payment was verified and your order is confirmed!');
        } else {
          Alert.alert(
            'Payment Processing',
            'Payment received, confirming... Your order status will update shortly.'
          );
        }
      } else if (checkoutResult.status === 'failed') {
        Alert.alert(
          'Payment Failed',
          checkoutResult.message || 'Payment could not be completed.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => handleCompletePayment(order) },
          ]
        );
      }
    } catch (err) {
      Alert.alert(
        'Payment Error',
        err.message || 'Failed to initiate payment resumption.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => handleCompletePayment(order) },
        ]
      );
    } finally {
      setCompletingPayment(false);
    }
  };

  // Live Shiprocket Tracking
  const handleTrackOrder = async (order) => {
    const awb = order.shippingDetails?.awbCode;

    if (!shippingEnabled || !awb) {
      setActiveTracking({
        order,
        awb: awb || '',
        courier: order.shippingDetails?.courierName || 'Shiprocket Delivery',
        status: 'NOT_AVAILABLE',
        estimatedDelivery: '',
        activities: [],
      });
      setTrackingModalVisible(true);
      return;
    }

    try {
      setTrackingLoading(true);
      setTrackingModalVisible(true);
      const res = await storeService.trackShipment(awb);
      setActiveTracking({
        order,
        awb,
        courier: res?.tracking?.courier_name || res?.tracking?.carrier_name || order.shippingDetails?.courierName || 'Shiprocket Delivery',
        status: res?.tracking?.current_status || order.status,
        estimatedDelivery: res?.tracking?.etd || '',
        activities: res?.tracking?.scans || res?.checkpoints || [],
      });
    } catch (err) {
      setActiveTracking({
        order,
        awb,
        courier: order.shippingDetails?.courierName || 'Shiprocket Delivery',
        status: 'NOT_AVAILABLE',
        estimatedDelivery: '',
        activities: [],
      });
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="My Orders & Shipments" onBack={() => router.back()} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={custom.primaryStrong}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {ordersQuery.isError ? (
          <EmptyState
            icon="alert-circle"
            title="Failed to Load Orders"
            description="We couldn't retrieve your order history. Please check your connection."
            actionLabel="Retry"
            onAction={() => ordersQuery.refetch()}
          />
        ) : loading && orders.length === 0 ? (
          <View style={styles.skeletonWrap}>
            <Skeleton height={130} radius={custom.radius.lg} style={styles.mbLg} />
            <Skeleton height={130} radius={custom.radius.lg} style={styles.mbLg} />
            <Skeleton height={130} radius={custom.radius.lg} />
          </View>
        ) : orders.length > 0 ? (
          orders.map((ord) => (
            <OrderCard
              key={ord._id || ord.id}
              order={ord}
              showTracking={shippingEnabled}
              onTrack={handleTrackOrder}
              onCompletePayment={handleCompletePayment}
            />
          ))
        ) : (
          <EmptyState
            icon="package"
            title="No Orders Found"
            description="Orders you place using Cash or Reward Points will appear here with live tracking updates."
            actionLabel="Visit Store"
            onAction={() => router.push('/(tabs)/store')}
          />
        )}
      </ScrollView>

      {/* Live Tracking Modal */}
      <Modal
        visible={trackingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTrackingModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Live Tracking</Text>
              <Pressable onPress={() => setTrackingModalVisible(false)} hitSlop={8}>
                <X size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            {trackingLoading ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Skeleton height={120} radius={custom.radius.md} />
              </View>
            ) : activeTracking ? (
              <TrackingTimeline
                status={activeTracking.status}
                awb={activeTracking.awb}
                courier={activeTracking.courier}
                estimatedDelivery={activeTracking.estimatedDelivery}
                activities={activeTracking.activities}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  skeletonWrap: {
    paddingVertical: 12,
  },
  mbLg: {
    marginBottom: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
});
