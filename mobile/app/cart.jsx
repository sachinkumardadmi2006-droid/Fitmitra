// FitMitra — Multi-Item Shopping Cart & Checkout Screen
// Powered by live store catalog, AsyncStorage persistence, and unified Razorpay WebView checkout

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Crypto from 'expo-crypto';
import {
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Zap,
  ShoppingBag,
  AlertCircle,
  Truck,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { spacing, radius } from '../theme/tokens';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';
import { useAppConfig } from '../hooks/useAppConfig';
import { useTranslation } from '../utils/i18n';
import { storeService } from '../services/storeService';
import { openCheckout, mapCashOrderToCheckout } from '../services/paymentCheckout';
import { queryKeys } from '../constants/queryKeys';
import AppHeader from '../components/ui/AppHeader';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

const FIELD_KEYS = [
  'fullName',
  'phone',
  'fullAddress',
  'floor',
  'areaLandmark',
  'city',
  'state',
  'pincode',
];

export default function CartScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const { user, profile, points: userPoints, refreshProfile } = useAuth();
  const { storeEnabled, shippingEnabled } = useAppConfig();
  const { t } = useTranslation();

  const isOrderingAvailable = Boolean(storeEnabled && shippingEnabled);

  const {
    items: cartItems,
    totalQuantity,
    updateQuantity,
    removeItem,
    clearCart,
    loading: cartLoading,
    MAX_ITEMS,
    MAX_QTY_PER_ITEM,
  } = useCart();

  // Payment method: 'CASH' | 'POINTS'
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [pollStatus, setPollStatus] = useState('');

  // Delivery Address Form State
  const [address, setAddress] = useState({
    fullName: user?.name || profile?.name || '',
    phone: user?.phone || profile?.phone || '',
    fullAddress: '',
    floor: '',
    areaLandmark: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [addressErrors, setAddressErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Layout refs for scrolling to first invalid field
  const scrollViewRef = useRef(null);
  const addressCardYRef = useRef(0);
  const fieldYMapRef = useRef({});

  const handleFieldLayout = (fieldName, event) => {
    fieldYMapRef.current[fieldName] = event.nativeEvent.layout.y;
  };

  // Prefill full name and phone when user/profile loads (React state adjustment pattern)
  const currentPhone = user?.phone || profile?.phone || '';
  const currentName = user?.name || profile?.name || '';
  const [prevUserPhone, setPrevUserPhone] = useState(currentPhone);
  const [prevUserName, setPrevUserName] = useState(currentName);

  if (currentPhone && currentPhone !== prevUserPhone) {
    setPrevUserPhone(currentPhone);
    if (!address.phone) {
      setAddress((prev) => ({ ...prev, phone: currentPhone }));
    }
  }
  if (currentName && currentName !== prevUserName) {
    setPrevUserName(currentName);
    if (!address.fullName) {
      setAddress((prev) => ({ ...prev, fullName: currentName }));
    }
  }

  // Idempotency Key Ref: created once per checkout attempt, reused on retry of same cart
  const idempotencyKeyRef = useRef(Crypto.randomUUID());
  const pendingOrderIdRef = useRef(null);

  // Cart Fingerprint: item ids + quantities + payment method + all address fields
  const cartFingerprint = useMemo(() => {
    const itemsPart = cartItems
      .map((i) => {
        const id = typeof i.productId === 'object' ? i.productId?._id : i.productId;
        return `${id}:${i.quantity}`;
      })
      .sort()
      .join('|');
    const addressPart = [
      (address.fullName || '').trim(),
      (address.phone || '').trim(),
      (address.fullAddress || '').trim(),
      (address.floor || '').trim(),
      (address.areaLandmark || '').trim(),
      (address.city || '').trim(),
      (address.state || '').trim(),
      (address.pincode || '').trim(),
      'India',
    ].join('~');
    return `${paymentMethod}::${itemsPart}::${addressPart}`;
  }, [cartItems, paymentMethod, address]);

  // Rotate idempotency key whenever the cart fingerprint changes
  const prevFingerprintRef = useRef(cartFingerprint);
  useEffect(() => {
    if (prevFingerprintRef.current !== cartFingerprint) {
      prevFingerprintRef.current = cartFingerprint;
      idempotencyKeyRef.current = Crypto.randomUUID();
      pendingOrderIdRef.current = null;
    }
  }, [cartFingerprint]);

  // Fetch live product details from server for each item in the cart
  const productQueries = useQuery({
    queryKey: ['cart', 'products', cartFingerprint],
    queryFn: async () => {
      if (cartItems.length === 0) return {};
      const results = await Promise.all(
        cartItems.map(async (item) => {
          const id = typeof item.productId === 'object' ? item.productId?._id : item.productId;
          try {
            const prod = await storeService.getProduct(item.slug);
            return { [id]: prod };
          } catch (_e) {
            return { [id]: null };
          }
        })
      );
      return Object.assign({}, ...results);
    },
    enabled: cartItems.length > 0,
    staleTime: 60 * 1000,
  });

  const serverProducts = useMemo(() => productQueries.data || {}, [productQueries.data]);
  const isFetchingProducts = productQueries.isLoading;

  // Validation function matching server/src/modules/store/store.validators.ts exactly
  const validateField = (name, value) => {
    const val = (value || '').trim();
    switch (name) {
      case 'fullName':
        if (!val || val.length < 2) return 'Full name is required (min 2 characters)';
        return null;
      case 'phone':
        if (!/^[6-9]\d{9}$/.test(val)) return 'Valid 10-digit Indian phone number required';
        return null;
      case 'fullAddress':
        if (!val || val.length < 5) return 'Full address is required (min 5 characters)';
        return null;
      case 'city':
        if (!val || val.length < 2) return 'City is required (min 2 characters)';
        return null;
      case 'state':
        if (!val || val.length < 2) return 'State is required (min 2 characters)';
        return null;
      case 'pincode':
        if (!/^\d{6}$/.test(val)) return 'Valid 6-digit Indian PIN code required';
        return null;
      default:
        return null;
    }
  };

  const validateAllAddressFields = () => {
    const errors = {};
    const required = ['fullName', 'phone', 'fullAddress', 'city', 'state', 'pincode'];
    required.forEach((f) => {
      const err = validateField(f, address[f]);
      if (err) errors[f] = err;
    });
    setAddressErrors(errors);
    return errors;
  };

  const handleFieldChange = (name, val) => {
    setAddress((prev) => ({ ...prev, [name]: val }));
    if (hasSubmitted || touchedFields[name]) {
      const err = validateField(name, val);
      setAddressErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleFieldBlur = (name) => {
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, address[name]);
    setAddressErrors((prev) => ({ ...prev, [name]: err }));
  };

  const getFieldError = (name) => {
    if (hasSubmitted || touchedFields[name]) {
      return addressErrors[name] || null;
    }
    return null;
  };

  // Calculations: Cash total in paise, Points total, stock validity
  const {
    totalCashPaise,
    totalPointsRequired,
    allAllowPoints,
    hasOutOfStock,
    hasUnpublished,
  } = useMemo(() => {
    let totalCash = 0;
    let totalPoints = 0;
    let allowPoints = true;
    let outOfStock = false;
    let unpublished = false;

    cartItems.forEach((item) => {
      const pId = typeof item.productId === 'object' ? item.productId?._id : item.productId;
      const prod = serverProducts[pId];
      if (prod) {
        totalCash += (prod.priceInPaise || 0) * item.quantity;
        totalPoints += (prod.pointsPrice || 0) * item.quantity;
        if (!prod.allowPointsPurchase) {
          allowPoints = false;
        }
        if ((prod.stockQuantity || 0) < item.quantity) {
          outOfStock = true;
        }
      } else if (!isFetchingProducts && serverProducts[pId] === null) {
        unpublished = true;
      }
    });

    return {
      totalCashPaise: totalCash,
      totalPointsRequired: totalPoints,
      allAllowPoints: allowPoints,
      hasOutOfStock: outOfStock,
      hasUnpublished: unpublished,
    };
  }, [cartItems, serverProducts, isFetchingProducts]);

  const canAffordPoints = (userPoints || 0) >= totalPointsRequired;

  // Poll server order confirmation after payment
  const pollOrderConfirmation = async (orderId) => {
    setPollStatus('Confirming order with server...');
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

  // Invalidate relevant query keys on successful checkout
  const invalidateSuccessQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.storeOrders }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ]);
    refreshProfile?.();
  };

  // Checkout submission handler
  const handleCheckout = async () => {
    if (!isOrderingAvailable) {
      return;
    }

    if (hasOutOfStock || hasUnpublished) {
      Alert.alert(
        'Item Unavailable',
        'Some items in your cart are out of stock or no longer available. Please adjust your cart before proceeding.'
      );
      return;
    }

    setHasSubmitted(true);
    const errors = validateAllAddressFields();
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstInvalidField = FIELD_KEYS.find((f) => errors[f]);
      if (firstInvalidField && fieldYMapRef.current[firstInvalidField] !== undefined) {
        const targetY = Math.max(0, addressCardYRef.current + fieldYMapRef.current[firstInvalidField] - 20);
        scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
      } else if (addressCardYRef.current) {
        scrollViewRef.current?.scrollTo({ y: Math.max(0, addressCardYRef.current - 20), animated: true });
      }
      return;
    }

    setSubmitting(true);
    setPollStatus('');

    const formattedItems = cartItems.map((item) => ({
      productId: typeof item.productId === 'object' ? item.productId?._id : item.productId,
      quantity: item.quantity,
    }));

    const formattedAddress = {
      fullName: address.fullName.trim(),
      phone: address.phone.trim(),
      addressLine1: (address.fullAddress.trim() + (address.floor?.trim() ? `, Floor ${address.floor.trim()}` : '')).trim(),
      addressLine2: address.areaLandmark?.trim() || null,
      city: address.city.trim(),
      state: address.state.trim(),
      pincode: address.pincode.trim(),
      country: 'India',
    };

    // ─── 1. Points Order Flow ────────────────────────────────────────────────
    if (paymentMethod === 'POINTS') {
      if (!allAllowPoints || !canAffordPoints) {
        Alert.alert(
          'Insufficient Points',
          `You need ${totalPointsRequired} points to complete this redemption. You currently have ${userPoints || 0} points.`
        );
        setSubmitting(false);
        return;
      }

      try {
        await storeService.createPointsOrder(
          {
            items: formattedItems,
            deliveryAddress: formattedAddress,
          },
          idempotencyKeyRef.current
        );

        await clearCart();
        idempotencyKeyRef.current = Crypto.randomUUID();
        pendingOrderIdRef.current = null;
        await invalidateSuccessQueries();

        Alert.alert(
          'Order Placed!',
          'Your Reward Points order has been confirmed successfully.',
          [{ text: 'View Orders', onPress: () => router.replace('/orders') }]
        );
      } catch (err) {
        if (err.status === 503) {
          Alert.alert(
            'Store Closed',
            'The store is currently closed. Orders cannot be processed.'
          );
        } else {
          Alert.alert('Points Redemption Failed', err.message || 'Unable to place points order.');
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ─── 2. Cash (Razorpay) Order Flow ───────────────────────────────────────
    try {
      let res = await storeService.createCashOrder(
        {
          items: formattedItems,
          deliveryAddress: formattedAddress,
        },
        idempotencyKeyRef.current
      );

      // Unwrap response: res.order and res.payment
      let orderDoc = res?.order || res?.data?.order;
      let paymentInfo = res?.payment || res?.data?.payment;

      if (!orderDoc?._id) {
        throw new Error('Server order creation did not return valid order details.');
      }

      // Retry Check: Check order status on replayed idempotency key
      if (orderDoc.status === 'PAID') {
        await clearCart();
        idempotencyKeyRef.current = Crypto.randomUUID();
        pendingOrderIdRef.current = null;
        await invalidateSuccessQueries();
        Alert.alert(
          'Order Already Paid',
          'This order has already been paid and confirmed.',
          [{ text: 'View Orders', onPress: () => router.replace('/orders') }]
        );
        return;
      }

      // Any other non-PENDING status (cancelled, expired, released): rotate key & create fresh order
      if (orderDoc.status !== 'PENDING_PAYMENT') {
        idempotencyKeyRef.current = Crypto.randomUUID();
        res = await storeService.createCashOrder(
          {
            items: formattedItems,
            deliveryAddress: formattedAddress,
          },
          idempotencyKeyRef.current
        );
        orderDoc = res?.order || res?.data?.order;
        paymentInfo = res?.payment || res?.data?.payment;
      }

      if (!orderDoc?._id || !paymentInfo?.providerOrderId) {
        throw new Error('Server order creation did not return valid payment credentials.');
      }

      pendingOrderIdRef.current = orderDoc._id;

      // Open Razorpay Checkout WebView
      const checkoutOptions = mapCashOrderToCheckout(orderDoc, paymentInfo, user, formattedAddress);
      const checkoutResult = await openCheckout(checkoutOptions);

      // Handle Checkout Outcome
      if (checkoutResult.status === 'success') {
        const confirmed = await pollOrderConfirmation(orderDoc._id);
        await invalidateSuccessQueries();

        if (confirmed) {
          await clearCart();
          idempotencyKeyRef.current = Crypto.randomUUID();
          pendingOrderIdRef.current = null;
          Alert.alert(
            'Payment Confirmed!',
            'Your payment was verified and your order is placed!',
            [{ text: 'View Orders', onPress: () => router.replace('/orders') }]
          );
        } else {
          Alert.alert(
            'Payment Received',
            'Payment received, confirming... Your order status will update shortly.',
            [{ text: 'View Orders', onPress: () => router.replace('/orders') }]
          );
        }
      } else if (checkoutResult.status === 'pending') {
        await invalidateSuccessQueries();
        Alert.alert(
          'Processing Payment',
          'Payment received, confirming... We are syncing with the bank and your order will update shortly.',
          [{ text: 'View Orders', onPress: () => router.replace('/orders') }]
        );
      } else if (checkoutResult.status === 'cancelled') {
        Alert.alert('Checkout Cancelled', 'Payment was cancelled. You can retry checkout when ready.');
      } else {
        Alert.alert('Payment Failed', checkoutResult.message || 'Payment could not be completed. Please retry.');
      }
    } catch (err) {
      if (err.status === 503) {
        Alert.alert(
          'Store Closed',
          'The store is currently closed. Orders cannot be processed.'
        );
      } else {
        Alert.alert('Checkout Error', err.message || 'Failed to initiate order checkout.');
      }
    } finally {
      setSubmitting(false);
      setPollStatus('');
    }
  };

  const isPlaceOrderDisabled =
    !isOrderingAvailable ||
    submitting ||
    hasOutOfStock ||
    hasUnpublished ||
    (paymentMethod === 'POINTS' && (!allAllowPoints || !canAffordPoints));

  // Error & Retry Screen
  if (productQueries.isError && cartItems.length > 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader title="Cart" onBack={() => router.back()} />
        <ErrorState
          error={productQueries.error}
          onRetry={() => productQueries.refetch()}
        />
      </View>
    );
  }

  // Loading Screen
  if (cartLoading || (isFetchingProducts && cartItems.length > 0 && !productQueries.data)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader title="Cart" onBack={() => router.back()} />
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={2} />
        </View>
      </View>
    );
  }

  // Empty Cart State
  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader title="Cart" onBack={() => router.back()} />
        <EmptyState
          icon="shopping-outline"
          title="Your Cart is Empty"
          message="Browse the FitMitra store for premium supplements, shaker bottles, and accessories."
          actionLabel="Browse Store"
          onAction={() => router.replace('/(tabs)/store')}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <AppHeader
        title={`Shopping Cart (${totalQuantity})`}
        onBack={() => router.back()}
        actions={[
          {
            icon: 'trash-can-outline',
            onPress: clearCart,
            accessibilityLabel: 'Clear Cart',
          },
        ]}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 110 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Ordering Notice Card (only when unavailable) */}
        {!isOrderingAvailable && (
          <View
            style={[
              styles.orderingNoticeCard,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <AlertCircle size={18} color={colors.onSurfaceVariant} style={{ marginTop: 2 }} />
            <Text style={[styles.orderingNoticeText, { color: colors.onSurfaceVariant }]}>
              {t('store.cartNotice')}
            </Text>
          </View>
        )}

        {/* Limits notice */}
        <View style={styles.limitNoticeRow}>
          <Text style={[styles.limitNoticeText, { color: colors.onSurfaceVariant }]}>
            Cart limits: up to {MAX_ITEMS} products, max {MAX_QTY_PER_ITEM} units per item.
          </Text>
        </View>

        {/* 2. Items List */}
        <View style={styles.itemsSection}>
          {cartItems.map((item, index) => {
            const pId = typeof item.productId === 'object' ? String(item.productId?._id) : String(item.productId);
            const product = serverProducts[pId];
            const isOutOfStock = product && product.stockQuantity < item.quantity;
            const priceRupees = product ? Math.round(product.priceInPaise / 100) : 0;
            const pointsPrice = product?.pointsPrice || 0;
            const imageUrl =
              product?.imageKeys?.[0] ||
              'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=500&auto=format&fit=crop&q=60';

            return (
              <View
                key={`cart-item-${typeof item.productId === 'object' ? String(item.productId?._id || index) : String(item.productId || index)}-${index}`}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isOutOfStock ? colors.error : colors.outlineVariant,
                  },
                ]}
              >
                <Image source={{ uri: imageUrl }} style={styles.itemImage} resizeMode="cover" />

                <View style={styles.itemDetails}>
                  <Text style={[styles.itemName, { color: colors.onSurface }]} numberOfLines={2}>
                    {product ? product.name : `Product (${item.slug || 'loading...'})`}
                  </Text>

                  {/* Pricing info */}
                  {product ? (
                    <View style={styles.itemPricingRow}>
                      <Text style={[styles.itemPrice, { color: custom.primaryStrong }]}>
                        ₹{priceRupees * item.quantity}
                      </Text>
                      {product.allowPointsPurchase && (
                        <View style={styles.pointsPill}>
                          <Zap size={11} color={colors.secondary} fill={colors.secondary} />
                          <Text style={[styles.pointsPillText, { color: colors.secondary }]}>
                            {pointsPrice * item.quantity} pts
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : isFetchingProducts ? (
                    <Skeleton width="40%" height={14} style={{ marginTop: 4 }} />
                  ) : (
                    <Text style={[styles.unavailableText, { color: colors.error }]}>Item unavailable</Text>
                  )}

                  {isOutOfStock && (
                    <Text style={[styles.stockWarning, { color: colors.error }]}>
                      Only {product.stockQuantity} in stock
                    </Text>
                  )}

                  {/* Stepper & Delete */}
                  <View style={styles.stepperRow}>
                    <View
                      style={[
                        styles.stepper,
                        { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
                      ]}
                    >
                      <Pressable
                        style={styles.stepperBtn}
                        onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                        hitSlop={6}
                      >
                        <Minus size={14} color={colors.onSurface} />
                      </Pressable>
                      <Text style={[styles.stepperVal, { color: colors.onSurface }]}>
                        {item.quantity}
                      </Text>
                      <Pressable
                        style={styles.stepperBtn}
                        onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                        hitSlop={6}
                        disabled={item.quantity >= MAX_QTY_PER_ITEM}
                      >
                        <Plus
                          size={14}
                          color={item.quantity >= MAX_QTY_PER_ITEM ? colors.onSurfaceVariant : colors.onSurface}
                        />
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={() => removeItem(item.productId)}
                      style={styles.deleteBtn}
                      hitSlop={8}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* 3. Payment Method Selector */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Payment Method</Text>

          <View style={styles.methodSelector}>
            {/* Cash via Razorpay Option */}
            <Pressable
              disabled={!isOrderingAvailable}
              style={[
                styles.methodOption,
                {
                  backgroundColor:
                    paymentMethod === 'CASH' ? colors.primaryContainer : colors.surfaceVariant,
                  borderColor: paymentMethod === 'CASH' ? colors.primary : colors.outlineVariant,
                },
                !isOrderingAvailable && { opacity: 0.5 },
              ]}
              onPress={() => isOrderingAvailable && setPaymentMethod('CASH')}
            >
              <CreditCard
                size={18}
                color={paymentMethod === 'CASH' ? colors.onPrimaryContainer : colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.methodLabel,
                  {
                    color: paymentMethod === 'CASH' ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                    fontWeight: paymentMethod === 'CASH' ? '800' : '600',
                  },
                ]}
              >
                Cash (₹{Math.round(totalCashPaise / 100)})
              </Text>
            </Pressable>

            {/* Points Redemption Option */}
            <Pressable
              disabled={!isOrderingAvailable || !allAllowPoints || !canAffordPoints}
              style={[
                styles.methodOption,
                {
                  backgroundColor:
                    paymentMethod === 'POINTS' ? colors.secondaryContainer : colors.surfaceVariant,
                  borderColor: paymentMethod === 'POINTS' ? colors.secondary : colors.outlineVariant,
                },
                (!isOrderingAvailable || !allAllowPoints || !canAffordPoints) && { opacity: 0.5 },
              ]}
              onPress={() => isOrderingAvailable && setPaymentMethod('POINTS')}
            >
              <Zap
                size={18}
                color={paymentMethod === 'POINTS' ? colors.onSecondaryContainer : colors.onSurfaceVariant}
                fill={paymentMethod === 'POINTS' ? colors.secondary : 'transparent'}
              />
              <Text
                style={[
                  styles.methodLabel,
                  {
                    color:
                      paymentMethod === 'POINTS'
                        ? colors.onSecondaryContainer
                        : colors.onSurfaceVariant,
                    fontWeight: paymentMethod === 'POINTS' ? '800' : '600',
                  },
                ]}
              >
                Points ({totalPointsRequired} pts)
              </Text>
            </Pressable>
          </View>

          {/* Points Warnings */}
          {!allAllowPoints && (
            <Text style={[styles.methodWarning, { color: colors.error }]}>
              Some items in your cart are not eligible for Reward Points redemption.
            </Text>
          )}
          {allAllowPoints && !canAffordPoints && (
            <Text style={[styles.methodWarning, { color: colors.error }]}>
              Insufficient points balance. You have {userPoints || 0} pts, required {totalPointsRequired} pts.
            </Text>
          )}
        </View>

        {/* 4. Delivery Address Form */}
        <View
          onLayout={(e) => {
            addressCardYRef.current = e.nativeEvent.layout.y;
          }}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <Truck size={18} color={custom.primaryStrong} />
            <Text style={[styles.cardTitle, { color: colors.onSurface, marginBottom: 0 }]}>
              Delivery Address
            </Text>
          </View>

          {/* 1. Full name */}
          <View onLayout={(e) => handleFieldLayout('fullName', e)} style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Full Name *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: getFieldError('fullName') ? colors.error : colors.outlineVariant,
                  color: colors.onSurface,
                },
              ]}
              placeholder="Recipient's Name"
              placeholderTextColor={colors.onSurfaceVariant}
              value={address.fullName}
              onChangeText={(val) => handleFieldChange('fullName', val)}
              onBlur={() => handleFieldBlur('fullName')}
            />
            {getFieldError('fullName') ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{getFieldError('fullName')}</Text>
            ) : null}
          </View>

          {/* 2. Phone */}
          <View onLayout={(e) => handleFieldLayout('phone', e)} style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Phone *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: getFieldError('phone') ? colors.error : colors.outlineVariant,
                  color: colors.onSurface,
                },
              ]}
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="numeric"
              maxLength={10}
              value={address.phone}
              onChangeText={(val) => handleFieldChange('phone', val)}
              onBlur={() => handleFieldBlur('phone')}
            />
            {getFieldError('phone') ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{getFieldError('phone')}</Text>
            ) : null}
          </View>

          {/* 3. Flat / House / Building and full address (multiline) */}
          <View onLayout={(e) => handleFieldLayout('fullAddress', e)} style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
              Flat / House / Building and full address *
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.multilineInput,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: getFieldError('fullAddress') ? colors.error : colors.outlineVariant,
                  color: colors.onSurface,
                },
              ]}
              placeholder="Flat, House, Building, Street, Society"
              placeholderTextColor={colors.onSurfaceVariant}
              multiline
              numberOfLines={3}
              value={address.fullAddress}
              onChangeText={(val) => handleFieldChange('fullAddress', val)}
              onBlur={() => handleFieldBlur('fullAddress')}
            />
            {getFieldError('fullAddress') ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{getFieldError('fullAddress')}</Text>
            ) : null}
          </View>

          {/* 4. Floor (optional) */}
          <View onLayout={(e) => handleFieldLayout('floor', e)} style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Floor (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.outlineVariant,
                  color: colors.onSurface,
                },
              ]}
              placeholder="e.g. 3rd Floor"
              placeholderTextColor={colors.onSurfaceVariant}
              value={address.floor}
              onChangeText={(val) => handleFieldChange('floor', val)}
            />
          </View>

          {/* 5. Area / Landmark */}
          <View onLayout={(e) => handleFieldLayout('areaLandmark', e)} style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Area / Landmark</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.outlineVariant,
                  color: colors.onSurface,
                },
              ]}
              placeholder="Nearby landmark or area name"
              placeholderTextColor={colors.onSurfaceVariant}
              value={address.areaLandmark}
              onChangeText={(val) => handleFieldChange('areaLandmark', val)}
            />
          </View>

          {/* 6. City */}
          <View onLayout={(e) => handleFieldLayout('city', e)} style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>City *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: getFieldError('city') ? colors.error : colors.outlineVariant,
                  color: colors.onSurface,
                },
              ]}
              placeholder="City"
              placeholderTextColor={colors.onSurfaceVariant}
              value={address.city}
              onChangeText={(val) => handleFieldChange('city', val)}
              onBlur={() => handleFieldBlur('city')}
            />
            {getFieldError('city') ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{getFieldError('city')}</Text>
            ) : null}
          </View>

          {/* 7. State */}
          <View onLayout={(e) => handleFieldLayout('state', e)} style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>State *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: getFieldError('state') ? colors.error : colors.outlineVariant,
                  color: colors.onSurface,
                },
              ]}
              placeholder="State"
              placeholderTextColor={colors.onSurfaceVariant}
              value={address.state}
              onChangeText={(val) => handleFieldChange('state', val)}
              onBlur={() => handleFieldBlur('state')}
            />
            {getFieldError('state') ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{getFieldError('state')}</Text>
            ) : null}
          </View>

          {/* 8. PIN code (numeric keypad, maxLength 6) */}
          <View onLayout={(e) => handleFieldLayout('pincode', e)} style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>PIN Code *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: getFieldError('pincode') ? colors.error : colors.outlineVariant,
                  color: colors.onSurface,
                },
              ]}
              placeholder="6 Digits"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="numeric"
              maxLength={6}
              value={address.pincode}
              onChangeText={(val) => handleFieldChange('pincode', val)}
              onBlur={() => handleFieldBlur('pincode')}
            />
            {getFieldError('pincode') ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{getFieldError('pincode')}</Text>
            ) : null}
          </View>
        </View>

        {/* 5. Order Summary */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              Items Subtotal ({totalQuantity} units)
            </Text>
            <Text style={[styles.summaryValue, { color: colors.onSurface }]}>
              {paymentMethod === 'CASH'
                ? `₹${Math.round(totalCashPaise / 100)}`
                : `${totalPointsRequired} pts`}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>Shipping Fee</Text>
            <Text style={[styles.summaryValue, { color: custom.primaryStrong }]}>FREE</Text>
          </View>

          <View
            style={[
              styles.summaryDivider,
              { backgroundColor: colors.outlineVariant },
            ]}
          />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryTotalLabel, { color: colors.onSurface }]}>Total</Text>
            <Text style={[styles.summaryTotalValue, { color: custom.primaryStrong }]}>
              {paymentMethod === 'CASH'
                ? `₹${Math.round(totalCashPaise / 100)}`
                : `${totalPointsRequired} Points`}
            </Text>
          </View>
        </View>

        {pollStatus ? (
          <Text style={[styles.pollStatusText, { color: custom.accentText }]}>
            {pollStatus}
          </Text>
        ) : null}
      </ScrollView>

      {/* 6. Sticky Bottom Bar */}
      <View
        style={[
          styles.stickyBottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.outlineVariant,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View style={styles.bottomBarInfo}>
          <Text style={[styles.bottomBarTotalLabel, { color: colors.onSurfaceVariant }]}>
            Total Payable
          </Text>
          <Text style={[styles.bottomBarTotalValue, { color: custom.primaryStrong }]}>
            {paymentMethod === 'CASH'
              ? `₹${Math.round(totalCashPaise / 100)}`
              : `${totalPointsRequired} pts`}
          </Text>
        </View>

        <Pressable
          style={[
            styles.placeOrderBtn,
            { backgroundColor: colors.primary },
            isPlaceOrderDisabled && { opacity: 0.5 },
          ]}
          onPress={isPlaceOrderDisabled ? undefined : handleCheckout}
          disabled={isPlaceOrderDisabled}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <>
              <ShoppingBag size={18} color={colors.onPrimary} />
              <Text style={[styles.placeOrderBtnText, { color: colors.onPrimary }]}>
                {t('store.placeOrder')}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  orderingNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  orderingNoticeText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  limitNoticeRow: {
    marginBottom: spacing.md,
  },
  limitNoticeText: {
    fontSize: 12,
  },
  itemsSection: {
    marginBottom: spacing.lg,
  },
  itemCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: spacing.md,
    gap: 12,
  },
  itemImage: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  itemPricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pointsPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  unavailableText: {
    fontSize: 11,
    fontWeight: '700',
    marginVertical: 4,
  },
  stockWarning: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
    height: 28,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperVal: {
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 8,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.xs,
  },
  methodOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  methodLabel: {
    fontSize: 13,
  },
  methodWarning: {
    fontSize: 11,
    marginTop: 8,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  errorText: {
    fontSize: 11,
    marginTop: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  pollStatusText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    marginVertical: spacing.sm,
  },
  stickyBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  bottomBarInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  bottomBarTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomBarTotalValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: radius.md,
  },
  placeOrderBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
