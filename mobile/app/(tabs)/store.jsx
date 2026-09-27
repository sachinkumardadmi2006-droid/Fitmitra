import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import {
  ShoppingBag,
  Zap,
  Search,
  Package,
  Truck,
  X,
  Filter,
  ArrowRight,
} from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { storeService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { onDbUpdate } from '../../utils/events';
import { ProductCard } from '../../components/store/ProductCard';
import { OrderCard } from '../../components/store/OrderCard';
import { OrderModal } from '../../components/store/OrderModal';
import { TrackingTimeline } from '../../components/store/TrackingTimeline';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { TopBar } from '../../components/common/TopBar';
import { useTheme } from '../../context/ThemeContext';

const CATEGORIES = [
  { key: 'ALL', label: 'All' },
  { key: 'PROTEIN', label: 'Protein' },
  { key: 'CREATINE', label: 'Creatine' },
  { key: 'OATS', label: 'Oats' },
  { key: 'VITAMINS', label: 'Vitamins' },
  { key: 'SNACKS', label: 'Snacks' },
];

export default function StoreTab() {
  const { points, refreshProfile } = useAuth();
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState('PRODUCTS'); // 'PRODUCTS' | 'ORDERS'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Checkout modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [checkoutMode, setCheckoutMode] = useState('CASH'); // 'CASH' | 'POINTS'
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Live tracking modal
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [activeTracking, setActiveTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const loadStoreData = useCallback(async () => {
    try {
      if (activeTab === 'PRODUCTS') {
        const params = {};
        if (selectedCategory !== 'ALL') {
          params.category = selectedCategory;
        }
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        const data = await storeService.getProducts(params);
        setProducts(data || []);
      } else {
        const orderData = await storeService.getMyOrders();
        setOrders(orderData || []);
      }
    } catch (err) {
      console.warn('Store data fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, selectedCategory, searchQuery]);

  useEffect(() => {
    setLoading(true);
    loadStoreData();
  }, [loadStoreData]);

  useEffect(() => {
    const unsub = onDbUpdate(() => {
      refreshProfile();
      loadStoreData();
    });
    return unsub;
  }, [refreshProfile, loadStoreData]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshProfile();
    loadStoreData();
  };

  const handleBuyCash = (product) => {
    setSelectedProduct(product);
    setCheckoutMode('CASH');
    setShowOrderModal(true);
  };

  const handleRedeemPoints = (product) => {
    if (points < (product.pointsPrice || 0)) {
      Alert.alert(
        'Insufficient Points',
        `You need ${product.pointsPrice} points to redeem this item. You currently have ${points} points. Complete workouts to earn +5 points each session!`
      );
      return;
    }
    setSelectedProduct(product);
    setCheckoutMode('POINTS');
    setShowOrderModal(true);
  };

  const handleTrackOrder = async (order) => {
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
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      {/* Top Header */}
      <TopBar
        title="FitMitra Store"
        subtitle="Supplements & Gear"
        icon={ShoppingBag}
        showBack
        rightAction={
          <View style={[styles.pointsPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Zap size={14} color="#FFB800" fill="#FFB800" />
            <Text style={[styles.pointsPillText, { color: colors.textPrimary }]}>{points} pts</Text>
          </View>
        }
      />

      {/* Main Tabs (Products vs Orders) */}
      <View style={[styles.tabToggleRow, { paddingHorizontal: 16 }]}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'PRODUCTS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('PRODUCTS')}
        >
          <ShoppingBag
            size={16}
            color={activeTab === 'PRODUCTS' ? Colors.bgDarkBase : Colors.textSecondary}
          />
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'PRODUCTS' && styles.tabBtnTextActive,
            ]}
          >
            Products
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'ORDERS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ORDERS')}
        >
          <Truck
            size={16}
            color={activeTab === 'ORDERS' ? Colors.bgDarkBase : Colors.textSecondary}
          />
          <Text
            style={[
              styles.tabBtnText,
              activeTab === 'ORDERS' && styles.tabBtnTextActive,
            ]}
          >
            My Orders
          </Text>
        </Pressable>
      </View>

      {activeTab === 'PRODUCTS' ? (
        <>
          {/* Search & Categories */}
          <View style={styles.searchBar}>
            <Search size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search protein, creatine, oats..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={loadStoreData}
            />
          </View>

          {/* Category Horizontal Filter */}
          <View style={styles.categoriesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
            >
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.key}
                  style={[
                    styles.catChip,
                    selectedCategory === cat.key && styles.catChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.key)}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      selectedCategory === cat.key && styles.catChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Products List */}
          {loading ? (
            <LoadingSpinner message="Loading supplements..." />
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryNeon} />
              }
            >
              {products.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title="No Products Found"
                  description="We couldn't find any supplements matching your filter. Try another category or search term."
                  actionLabel="Reset Filters"
                  onAction={() => {
                    setSelectedCategory('ALL');
                    setSearchQuery('');
                  }}
                />
              ) : (
                products.map((product) => (
                  <ProductCard
                    key={product._id || product.id}
                    product={product}
                    userPoints={points}
                    onBuyCash={handleBuyCash}
                    onRedeemPoints={handleRedeemPoints}
                  />
                ))
              )}
            </ScrollView>
          )}
        </>
      ) : (
        /* My Orders Tab */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryNeon} />
          }
        >
          {loading ? (
            <LoadingSpinner message="Loading your orders..." />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No Orders Placed Yet"
              description="You have not purchased any supplements or redeemed points yet. Check out the products catalog!"
              actionLabel="Browse Products"
              onAction={() => setActiveTab('PRODUCTS')}
            />
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order._id || order.id}
                order={order}
                onTrack={handleTrackOrder}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Order Modal (Cash / Points) */}
      <OrderModal
        visible={showOrderModal}
        product={selectedProduct}
        mode={checkoutMode}
        userPoints={points}
        onClose={() => setShowOrderModal(false)}
        onSuccess={() => {
          refreshProfile();
          setActiveTab('ORDERS');
          loadStoreData();
        }}
      />

      {/* Shiprocket Live Tracking Modal */}
      <Modal visible={trackingModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.trackingSheet}>
            <View style={styles.trackingSheetHeader}>
              <View style={styles.trackingTitleRow}>
                <Truck size={20} color={Colors.primaryNeon} />
                <Text style={styles.trackingTitle}>Live Shipment Tracking</Text>
              </View>
              <Pressable
                style={styles.closeBtn}
                onPress={() => setTrackingModalVisible(false)}
              >
                <X size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {trackingLoading ? (
              <LoadingSpinner message="Fetching Shiprocket updates..." />
            ) : activeTracking ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <TrackingTimeline
                  status={activeTracking.status}
                  awb={activeTracking.awb}
                  courier={activeTracking.courier}
                  estimatedDelivery={activeTracking.estimatedDelivery}
                  activities={activeTracking.activities}
                />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDarkBase,
    paddingTop: 54,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFB800',
  },
  tabToggleRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: Colors.primaryNeon,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
    color: Colors.bgDarkBase,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgCardGlass,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    borderRadius: 14,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  categoriesContainer: {
    marginBottom: 14,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catChipActive: {
    backgroundColor: 'rgba(0, 245, 155, 0.15)',
    borderColor: Colors.primaryNeon,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  catChipTextActive: {
    color: Colors.primaryNeon,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 19, 0.85)',
    justifyContent: 'flex-end',
  },
  trackingSheet: {
    backgroundColor: '#0D1222',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.borderGlass,
    padding: 24,
    maxHeight: '85%',
  },
  trackingSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
});
