import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import {
  ShoppingBag,
  Zap,
  Search,
  Truck,
  X,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Chip, Snackbar } from 'react-native-paper';
import { storeService } from '../../services/storeService';
import { queryKeys } from '../../constants/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { useAppConfig } from '../../hooks/useAppConfig';
import { ProductCard } from '../../components/store/ProductCard';
import { ProductDetailModal } from '../../components/store/ProductDetailModal';
import { OrderCard } from '../../components/store/OrderCard';
import { TrackingTimeline } from '../../components/store/TrackingTimeline';
import { TopBar } from '../../components/common/TopBar';
import { useAppTheme } from '../../theme/ThemeContext';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';

const CATEGORIES = [
  { key: 'ALL', label: 'All' },
  { key: 'PROTEIN', label: 'Protein' },
  { key: 'CREATINE', label: 'Creatine' },
  { key: 'OATS', label: 'Oats' },
  { key: 'VITAMINS', label: 'Vitamins' },
  { key: 'SNACKS', label: 'Snacks' },
];

export default function StoreTab() {
  const router = useRouter();
  const { points, refreshProfile } = useAuth();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const { storeEnabled, shippingEnabled } = useAppConfig();

  const [activeTab, setActiveTab] = useState('PRODUCTS'); // 'PRODUCTS' | 'ORDERS'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Product detail sheet & Cart toast
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [cartSnackbarVisible, setCartSnackbarVisible] = useState(false);

  // Live tracking modal
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [activeTracking, setActiveTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const isOrderingAvailable = Boolean(storeEnabled && shippingEnabled);

  // 1. Products Query (cached per category and search) — always enabled for browsing on PRODUCTS tab
  const productsQuery = useQuery({
    queryKey: queryKeys.storeProducts(selectedCategory, searchQuery),
    queryFn: async () => {
      const params = {};
      if (selectedCategory !== 'ALL') {
        params.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const data = await storeService.getProducts(params);
      return Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
    },
    enabled: activeTab === 'PRODUCTS',
    staleTime: 60 * 1000,
  });

  // 2. Orders Query (cached)
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
    enabled: activeTab === 'ORDERS',
    staleTime: 60 * 1000,
  });

  const products = productsQuery.data || [];
  const orders = ordersQuery.data || [];

  const loading =
    activeTab === 'PRODUCTS'
      ? productsQuery.isLoading && !productsQuery.data
      : ordersQuery.isLoading && !ordersQuery.data;

  const refreshing =
    activeTab === 'PRODUCTS'
      ? productsQuery.isRefetching
      : ordersQuery.isRefetching;

  const onRefresh = useCallback(async () => {
    refreshProfile?.();
    if (activeTab === 'PRODUCTS') {
      await productsQuery.refetch();
    } else {
      await ordersQuery.refetch();
    }
  }, [activeTab, productsQuery, ordersQuery, refreshProfile]);

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
      <TopBar
        title="FitMitra Store"
        subtitle="Supplements & Gear"
        icon={ShoppingBag}
        showBack
        showCart
        rightAction={
          <View
            style={[
              styles.pointsPill,
              { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
            ]}
          >
            <Zap size={14} color={colors.secondary} fill={colors.secondary} />
            <Text style={[styles.pointsPillText, { color: colors.onSurface }]}>
              {points || 0} pts
            </Text>
          </View>
        }
      />

      {/* Main Tabs (Products vs Orders) */}
      <View style={styles.tabToggleRow}>
        <Pressable
          style={[
            styles.tabBtn,
            activeTab === 'PRODUCTS'
              ? { backgroundColor: colors.primaryContainer }
              : { backgroundColor: colors.surfaceVariant },
          ]}
          onPress={() => setActiveTab('PRODUCTS')}
        >
          <ShoppingBag
            size={16}
            color={activeTab === 'PRODUCTS' ? colors.onPrimaryContainer : colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.tabBtnText,
              {
                color: activeTab === 'PRODUCTS' ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                fontWeight: activeTab === 'PRODUCTS' ? '800' : '600',
              },
            ]}
          >
            Supplements
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tabBtn,
            activeTab === 'ORDERS'
              ? { backgroundColor: colors.primaryContainer }
              : { backgroundColor: colors.surfaceVariant },
          ]}
          onPress={() => setActiveTab('ORDERS')}
        >
          <Truck
            size={16}
            color={activeTab === 'ORDERS' ? colors.onPrimaryContainer : colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.tabBtnText,
              {
                color: activeTab === 'ORDERS' ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                fontWeight: activeTab === 'ORDERS' ? '800' : '600',
              },
            ]}
          >
            My Orders
          </Text>
        </Pressable>
      </View>

      {activeTab === 'PRODUCTS' ? (
        <>
          {/* Ordering Availability Banner */}
          {!isOrderingAvailable && (
            <View
              style={[
                styles.orderingBanner,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <Text style={[styles.orderingBannerText, { color: colors.onSurfaceVariant }]}>
                Ordering opens soon. We are setting up delivery.
              </Text>
            </View>
          )}

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
              ]}
            >
              <Search size={16} color={colors.onSurfaceVariant} />
              <TextInput
                style={[styles.searchInput, { color: colors.onSurface }]}
                placeholder="Search whey, creatine, oats..."
                placeholderTextColor={colors.onSurfaceVariant}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => productsQuery.refetch()}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <X size={16} color={colors.onSurfaceVariant} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Categories Horizontal Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <Chip
                  key={cat.key}
                  selected={isSelected}
                  onPress={() => setSelectedCategory(cat.key)}
                  style={[
                    styles.catChip,
                    isSelected
                      ? { backgroundColor: colors.primaryContainer }
                      : { backgroundColor: colors.surfaceVariant },
                  ]}
                  textStyle={{
                    color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                    fontSize: 12,
                    fontWeight: isSelected ? '700' : '500',
                  }}
                >
                  {cat.label}
                </Chip>
              );
            })}
          </ScrollView>

          {/* Products List */}
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
            {loading && products.length === 0 ? (
              <View style={styles.skeletonWrap}>
                <Skeleton height={220} radius={custom.radius.lg} style={styles.mbLg} />
                <Skeleton height={220} radius={custom.radius.lg} style={styles.mbLg} />
              </View>
            ) : products.length > 0 ? (
              products.map((prod, index) => (
                <ProductCard
                  key={String(prod._id?._id || prod._id || prod.id || index)}
                  product={prod}
                  onPress={(selected) => {
                    setSelectedProduct(selected);
                    setProductModalVisible(true);
                  }}
                />
              ))
            ) : (
              <EmptyState
                icon="shopping-outline"
                title="No Products Found"
                description={
                  searchQuery
                    ? `No products matched "${searchQuery}".`
                    : 'The supplements catalog is being updated. Check back shortly.'
                }
              />
            )}
          </ScrollView>
        </>
      ) : (
        /* Orders Tab */
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
              <Skeleton height={110} radius={custom.radius.lg} style={styles.mbLg} />
              <Skeleton height={110} radius={custom.radius.lg} style={styles.mbLg} />
            </View>
          ) : orders.length > 0 ? (
            orders.map((ord, index) => (
              <OrderCard
                key={typeof ord._id === 'object' ? String(ord._id?._id || index) : String(ord._id || ord.id || index)}
                order={ord}
                showTracking={shippingEnabled}
                onTrack={handleTrackOrder}
              />
            ))
          ) : (
            <EmptyState
              icon="package"
              title="No Orders Yet"
              description="Orders placed via Cash or redeemed with Reward Points will appear here with tracking details."
              actionLabel="Browse Products"
              onAction={() => setActiveTab('PRODUCTS')}
            />
          )}
        </ScrollView>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        key={String(selectedProduct?._id || selectedProduct?.slug || 'none')}
        visible={productModalVisible}
        product={selectedProduct}
        onClose={() => setProductModalVisible(false)}
        onAddedToCart={() => setCartSnackbarVisible(true)}
      />

      {/* Added to Cart Feedback Toast */}
      <Snackbar
        visible={cartSnackbarVisible}
        onDismiss={() => setCartSnackbarVisible(false)}
        duration={3500}
        action={{
          label: 'View cart',
          textColor: colors.primary,
          onPress: () => router.push('/cart'),
        }}
        style={{
          backgroundColor: colors.inverseSurface,
          borderRadius: custom.radius.md,
          marginBottom: 72,
        }}
      >
        <Text style={{ color: colors.inverseOnSurface }}>Added to cart</Text>
      </Snackbar>

      {/* Live Shiprocket Tracking Modal */}
      <Modal visible={trackingModalVisible} transparent animationType="slide" onRequestClose={() => setTrackingModalVisible(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.backdrop }]}>
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
  centerWrap: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  skeletonWrap: {
    paddingVertical: 12,
  },
  mbLg: {
    marginBottom: 16,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  pointsPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tabToggleRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabBtnText: {
    fontSize: 13,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  catChip: {
    borderRadius: 16,
  },
  orderingBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  orderingBannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
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
