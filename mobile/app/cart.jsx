// FitMitra — Multi-Item Shopping Cart & Checkout Screen
// Powered by live store catalog, AsyncStorage persistence, and unified Razorpay WebView checkout

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Zap,
  ShoppingBag,
  AlertCircle,
  Truck,
  CheckCircle2,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { spacing, radius } from '../theme/tokens';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';
import { useAppConfig } from '../hooks/useAppConfig';
import { storeService } from '../services/storeService';
import { openCheckout, mapCashOrderToCheckout } from '../services/paymentCheckout';
import { queryKeys } from '../constants/queryKeys';
import Skeleton, { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

export default function CartScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const { user, points: userPoints, refreshProfile } = useAuth();
  const { storeEnabled, shippingEnabled } = useAppConfig();
  const {
    items: cartItems,
    itemCount,
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
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  const [addressErrors, setAddressErrors] = useState({});

  // Idempotency Key Ref: created once per checkout attempt, reused on retry of same cart
  const idempotencyKeyRef = useRef(Crypto.randomUUID());
  const pendingOrderIdRef = useRef(null);

  // Cart Fingerprint: item ids + quantities + payment method + delivery address fields
  const cartFingerprint = useMemo(() => {
    const itemsPart = cartItems
      .map((i) => `${i.productId}:${i.quantity}`)
      .sort()
      .join('|');
    const addressPart = [
      (address.fullName || '').trim(),
      (address.phone || '').trim(),
      (address.addressLine1 || '').trim(),
      (address.addressLine2 || '').trim(),
      (address.city || '').trim(),
      (address.state || '').trim(),
      (address.pincode || '').trim(),
      address.country || 'India',
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
    queryKey: ['cart', 'products', cartSignature],
    queryFn: async () => {
      if (cartItems.length === 0) return {};
      const results = await Promise.all(
        cartItems.map(async (item) => {
          try {
            const prod = await storeService.getProduct(item.slug);
            return { [item.productId]: prod };
          } catch (e) {
            return { [item.productId]: null };
          }
        })
      );
      return Object.assign({}, ...results);
    },
    enabled: cartItems.length > 0,
    staleTime: 60 * 1000,
  });

  const serverProducts = productQueries.data || {};
  const isFetchingProducts = productQueries.isLoading;

  // Validate Delivery Address matching store.validators.ts exactly
  const validateAddress = () => {
    const errors = {};
    if (!address.fullName || address.fullName.trim().length < 2) {
      errors.fullName = 'Full name is required (min 2 characters)';
    }
    if (!address.phone || !/^[6-9]\d{9}$/.test(address.phone.trim())) {
      errors.phone = 'Valid 10-digit Indian phone number required';
    }
    if (!address.addressLine1 || address.addressLine1.trim().length < 5) {
      errors.addressLine1 = 'Address line 1 is required (min 5 characters)';
    }
    if (!address.city || address.city.trim().length < 2) {
      errors.city = 'City is required (min 2 characters)';
    }
    if (!address.state || address.state.trim().length < 2) {
      errors.state = 'State is required (min 2 characters)';
    }
    if (!address.pincode || !/^\d{6}$/.test(address.pincode.trim())) {
      errors.pincode = 'Valid 6-digit Indian PIN code required';
    }
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
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
      const prod = serverProducts[item.productId];
      if (prod) {
        totalCash += (prod.priceInPaise || 0) * item.quantity;
        totalPoints += (prod.pointsPrice || 0) * item.quantity;
        if (!prod.allowPointsPurchase) {
          allowPoints = false;
        }
        if ((prod.stockQuantity || 0) < item.quantity) {
          outOfStock = true;
        }
      } else if (!isFetchingProducts && serverProducts[item.productId] === null) {
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
    if (!storeEnabled) {
      Alert.alert(
        'Store Closed',
        'The store is currently closed. Orders cannot be processed.'
      );
      return;
    }

    if (hasOutOfStock || hasUnpublished) {
      Alert.alert(
        'Item Unavailable',
        'Some items in your cart are out of stock or no longer available. Please adjust your cart before proceeding.'
      );
      return;
    }

    if (!validateAddress()) {
      Alert.alert('Delivery Address Incomplete', 'Please check and complete all required address fields.');
      return;
    }

    setSubmitting(true);
    setPollStatus('');

    const formattedItems = cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const formattedAddress = {
      fullName: address.fullName.trim(),
      phone: address.phone.trim(),
      addressLine1: address.addressLine1.trim(),
      addressLine2: address.addressLine2 ? address.addressLine2.trim() : null,
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
        const res = await storeService.createPointsOrder(
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
        // Cart kept, order remains PENDING_PAYMENT. Retry reuses the same order and idempotency key
        Alert.alert('Checkout Cancelled', 'Payment was cancelled. You can retry checkout when ready.');
      } else {
        // Failed
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

  // Loading Screen
  if (cartLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Skeleton width="40%" height={24} />
        </View>
        <SkeletonCard lines={3} style={{ margin: spacing.lg }} />
        <SkeletonCard lines={4} style={{ margin: spacing.lg }} />
      </View>
    );
  }

  // Empty Cart State
  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ArrowLeft size={22} color={colors.onSurface} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Cart</Text>
          <View style={{ width: 36 }} />
        </View>
        <EmptyState
          icon="cart-outline"
          title="Your Cart is Empty"
          message="Browse the FitMitra store for premium supplements, shaker bottles, and accessories."
          actionLabel="Browse Supplements"
          onAction={() => router.replace('/(tabs)/store')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          Shopping Cart ({totalQuantity})
        </Text>
        <Pressable onPress={clearCart} hitSlop={8}>
          <Text style={[styles.clearBtnText, { color: colors.error }]}>Clear</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Store Closed Banner if disabled */}
        {!storeEnabled && (
          <View
            style={[
              styles.closedBanner,
              { backgroundColor: colors.errorContainer, borderColor: colors.error },
            ]}
          >
            <AlertCircle size={18} color={colors.onErrorContainer} />
            <Text style={[styles.closedBannerText, { color: colors.onErrorContainer }]}>
              The store is currently closed. Orders cannot be processed.
            </Text>
          </View>
        )}

        {/* Limits notice */}
        <View style={styles.limitNoticeRow}>
          <Text style={[styles.limitNoticeText, { color: colors.onSurfaceVariant }]}>
            Cart limits: up to {MAX_ITEMS} products, max {MAX_QTY_PER_ITEM} units per item.
          </Text>
        </View>

        {/* Cart Item Cards */}
        <View style={styles.itemsSection}>
          {cartItems.map((item) => {
            const product = serverProducts[item.productId];
            const isOutOfStock = product && product.stockQuantity < item.quantity;
            const priceRupees = product ? Math.round(product.priceInPaise / 100) : 0;
            const pointsPrice = product?.pointsPrice || 0;
            const imageUrl =
              product?.imageKeys?.[0] ||
              'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=500&auto=format&fit=crop&q=60';

            return (
              <View
                key={item.productId}
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
                        <Plus size={14} color={item.quantity >= MAX_QTY_PER_ITEM ? colors.onSurfaceVariant : colors.onSurface} />
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

        {/* Payment Method Selector (One per checkout: Cash or Points) */}
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
              style={[
                styles.methodOption,
                {
                  backgroundColor:
                    paymentMethod === 'CASH' ? colors.primaryContainer : colors.surfaceVariant,
                  borderColor: paymentMethod === 'CASH' ? colors.primary : colors.outlineVariant,
                },
              ]}
              onPress={() => setPaymentMethod('CASH')}
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
              disabled={!allAllowPoints || !canAffordPoints}
              style={[
                styles.methodOption,
                {
                  backgroundColor:
                    paymentMethod === 'POINTS' ? colors.secondaryContainer : colors.surfaceVariant,
                  borderColor: paymentMethod === 'POINTS' ? colors.secondary : colors.outlineVariant,
                },
                (!allAllowPoints || !canAffordPoints) && { opacity: 0.5 },
              ]}
              onPress={() => setPaymentMethod('POINTS')}
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

        {/* Delivery Address Form */}
        <View
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

          {/* Full Name */}
          <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Full Name *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: addressErrors.fullName ? colors.error : colors.outlineVariant,
                color: colors.onSurface,
              },
            ]}
            placeholder="Recipient's Name"
            placeholderTextColor={colors.onSurfaceVariant}
            value={address.fullName}
            onChangeText={(val) => setAddress((prev) => ({ ...prev, fullName: val }))}
          />
          {addressErrors.fullName && (
            <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.fullName}</Text>
          )}

          {/* Phone */}
          <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>10-Digit Mobile *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: addressErrors.phone ? colors.error : colors.outlineVariant,
                color: colors.onSurface,
              },
            ]}
            placeholder="e.g. 9876543210"
            placeholderTextColor={colors.onSurfaceVariant}
            keyboardType="phone-pad"
            maxLength={10}
            value={address.phone}
            onChangeText={(val) => setAddress((prev) => ({ ...prev, phone: val }))}
          />
          {addressErrors.phone && (
            <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.phone}</Text>
          )}

          {/* Address Line 1 */}
          <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Address Line 1 *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: addressErrors.addressLine1 ? colors.error : colors.outlineVariant,
                color: colors.onSurface,
              },
            ]}
            placeholder="House/Flat No, Building, Street"
            placeholderTextColor={colors.onSurfaceVariant}
            value={address.addressLine1}
            onChangeText={(val) => setAddress((prev) => ({ ...prev, addressLine1: val }))}
          />
          {addressErrors.addressLine1 && (
            <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.addressLine1}</Text>
          )}

          {/* Address Line 2 */}
          <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Address Line 2 (Optional)</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.outlineVariant,
                color: colors.onSurface,
              },
            ]}
            placeholder="Landmark, Area, Sector"
            placeholderTextColor={colors.onSurfaceVariant}
            value={address.addressLine2}
            onChangeText={(val) => setAddress((prev) => ({ ...prev, addressLine2: val }))}
          />

          {/* City & State Row */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>City *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: addressErrors.city ? colors.error : colors.outlineVariant,
                    color: colors.onSurface,
                  },
                ]}
                placeholder="City"
                placeholderTextColor={colors.onSurfaceVariant}
                value={address.city}
                onChangeText={(val) => setAddress((prev) => ({ ...prev, city: val }))}
              />
              {addressErrors.city && (
                <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.city}</Text>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>State *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: addressErrors.state ? colors.error : colors.outlineVariant,
                    color: colors.onSurface,
                  },
                ]}
                placeholder="State"
                placeholderTextColor={colors.onSurfaceVariant}
                value={address.state}
                onChangeText={(val) => setAddress((prev) => ({ ...prev, state: val }))}
              />
              {addressErrors.state && (
                <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.state}</Text>
              )}
            </View>
          </View>

          {/* PIN code & Country Row */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>PIN Code *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: addressErrors.pincode ? colors.error : colors.outlineVariant,
                    color: colors.onSurface,
                  },
                ]}
                placeholder="6 Digits"
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="numeric"
                maxLength={6}
                value={address.pincode}
                onChangeText={(val) => setAddress((prev) => ({ ...prev, pincode: val }))}
              />
              {addressErrors.pincode && (
                <Text style={[styles.errorText, { color: colors.error }]}>{addressErrors.pincode}</Text>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Country</Text>
              <TextInput
                editable={false}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.outlineVariant,
                    color: colors.onSurfaceVariant,
                  },
                ]}
                value="India"
              />
            </View>
          </View>
        </View>

        {/* Order Summary & Price Breakdown */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>
              Items ({totalQuantity} units)
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
            <Text style={[styles.summaryTotalLabel, { color: colors.onSurface }]}>Total Payable</Text>
            <Text style={[styles.summaryTotalValue, { color: custom.primaryStrong }]}>
              {paymentMethod === 'CASH'
                ? `₹${Math.round(totalCashPaise / 100)}`
                : `${totalPointsRequired} Points`}
            </Text>
          </View>
        </View>

        {/* Checkout Button */}
        <Pressable
          style={[
            styles.checkoutBtn,
            { backgroundColor: colors.primary },
            (submitting ||
              !storeEnabled ||
              hasOutOfStock ||
              hasUnpublished ||
              (paymentMethod === 'POINTS' && (!allAllowPoints || !canAffordPoints))) && {
              opacity: 0.5,
            },
          ]}
          onPress={handleCheckout}
          disabled={
            submitting ||
            !storeEnabled ||
            hasOutOfStock ||
            hasUnpublished ||
            (paymentMethod === 'POINTS' && (!allAllowPoints || !canAffordPoints))
          }
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <>
              <ShoppingBag size={18} color={colors.onPrimary} />
              <Text style={[styles.checkoutBtnText, { color: colors.onPrimary }]}>
                {paymentMethod === 'CASH'
                  ? `Pay ₹${Math.round(totalCashPaise / 100)}`
                  : `Redeem ${totalPointsRequired} Points`}
              </Text>
            </>
          )}
        </Pressable>

        {pollStatus ? (
          <Text style={[styles.pollStatusText, { color: custom.accentText }]}>
            {pollStatus}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  closedBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  errorText: {
    fontSize: 11,
    marginTop: 2,
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
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 15,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  checkoutBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  pollStatusText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
});
