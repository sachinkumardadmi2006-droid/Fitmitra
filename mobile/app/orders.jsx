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
import { useQuery } from '@tanstack/react-query';
import { Package, Truck, X } from 'lucide-react-native';
import { storeService } from '../services/storeService';
import { queryKeys } from '../constants/queryKeys';
import { useAppConfig } from '../hooks/useAppConfig';
import { OrderCard } from '../components/store/OrderCard';
import { TrackingTimeline } from '../components/store/TrackingTimeline';
import { useAppTheme } from '../theme/ThemeContext';
import AppHeader from '../components/ui/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

export default function OrdersScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const { shippingEnabled } = useAppConfig();

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

  const handleTrackOrder = async (order) => {
    if (!shippingEnabled) {
      Alert.alert('Tracking Unavailable', 'Shipment tracking is currently disabled.');
      return;
    }
    const awb = order.shippingDetails?.awbCode;
    if (!awb) {
      Alert.alert('Tracking Pending', 'AWB has not been assigned by Shiprocket yet. Check back soon!');
      return;
    }

    try {
      setTrackingLoading(true);
      setTrackingModalVisible(true);
      const res = await storeService.trackShipment(awb);
      setActiveTracking({
        order,
        awb,
        courier: res?.tracking?.courier_name || res?.tracking?.carrier_name || 'Shiprocket Delivery',
        status: res?.tracking?.current_status || order.status,
        estimatedDelivery: res?.tracking?.etd || '',
        activities: res?.tracking?.scans || [],
      });
    } catch (err) {
      Alert.alert('Tracking Error', 'Unable to fetch real-time Shiprocket updates right now.');
      setTrackingModalVisible(false);
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
        {loading && orders.length === 0 ? (
          <View style={styles.skeletonWrap}>
            <Skeleton height={120} radius={custom.radius.lg} style={styles.mbLg} />
            <Skeleton height={120} radius={custom.radius.lg} style={styles.mbLg} />
            <Skeleton height={120} radius={custom.radius.lg} />
          </View>
        ) : orders.length > 0 ? (
          orders.map((ord) => (
            <OrderCard
              key={ord._id || ord.id}
              order={ord}
              showTracking={shippingEnabled}
              onTrack={handleTrackOrder}
            />
          ))
        ) : (
          <EmptyState
            icon="package"
            title="No Orders Found"
            description="Orders you place using Cash or Reward Points will appear here with live tracking updates."
            actionLabel="Visit Store"
            onAction={() => router.push('/store')}
          />
        )}
      </ScrollView>

      {/* Live Shiprocket Tracking Modal */}
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
