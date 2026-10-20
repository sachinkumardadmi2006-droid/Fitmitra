import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Shield,
  X,
  Sparkles,
  Crown,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react-native';
import { subscriptionService } from '../services/subscriptionService';
import { api } from '../services/api';
import { queryKeys } from '../constants/queryKeys';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../theme/ThemeContext';
import AppHeader from '../components/ui/AppHeader';
import AppCard from '../components/ui/AppCard';
import AppButton from '../components/ui/AppButton';
import Skeleton from '../components/ui/Skeleton';

export default function PremiumScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuth();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Payment order details when checkout required
  const [paymentOrder, setPaymentOrder] = useState(null);

  // 1. Subscription Plans Query
  const plansQuery = useQuery({
    queryKey: queryKeys.subscriptionPlans,
    queryFn: async () => {
      const plansRes = await subscriptionService.getPlans();
      const planItems = Array.isArray(plansRes?.data)
        ? plansRes.data
        : Array.isArray(plansRes)
          ? plansRes
          : Array.isArray(plansRes?.plans)
            ? plansRes.plans
            : [];
      return planItems;
    },
    staleTime: 60 * 1000,
  });

  // 2. Current Active Subscription Query
  const subQuery = useQuery({
    queryKey: queryKeys.subscriptionCurrent,
    queryFn: async () => {
      const subRes = await subscriptionService.getMySubscription();
      const s = subRes?.data || subRes;
      return s && s.status !== 'INACTIVE' ? s : null;
    },
    staleTime: 60 * 1000,
  });

  const plans = plansQuery.data || [];
  const currentSub = subQuery.data || null;

  const loading = plansQuery.isLoading && !plansQuery.data;
  const refreshing = plansQuery.isRefetching || subQuery.isRefetching;

  const onRefresh = useCallback(async () => {
    refreshProfile?.();
    await Promise.all([
      plansQuery.refetch(),
      subQuery.refetch(),
    ]);
  }, [plansQuery, subQuery, refreshProfile]);

  const handleOpenPlanModal = async (plan) => {
    setSelectedPlan(plan);
    setPaymentOrder(null);
    setModalVisible(true);

    // If plan has no trial, prepare the payment order from real backend
    if (!plan.trialDays || plan.trialDays <= 0) {
      try {
        const orderRes = await api.post('/payments/create-order', {
          subscriptionPlanId: plan._id || plan.id,
        });
        const orderData = orderRes?.data || orderRes;
        setPaymentOrder(orderData);
      } catch (err) {
        console.warn('[Premium] Failed to prepare payment order:', err.message);
      }
    }
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan) return;
    try {
      setSubmitting(true);
      const planId = selectedPlan._id || selectedPlan.id;
      const res = await subscriptionService.createSubscription({ planId });
      const resData = res?.data || res;

      if (resData?.type === 'TRIAL_STARTED') {
        setModalVisible(false);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionCurrent }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
          queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
        ]);
        refreshProfile?.();
        Alert.alert(
          'Free Trial Activated! 🎉',
          `Your ${selectedPlan.trialDays}-day trial of ${selectedPlan.name} is now active. All Pro programs are unlocked!`
        );
      } else if (resData?.type === 'PAYMENT_REQUIRED') {
        // Real payment requirement
        Alert.alert(
          'Payment Required',
          `This plan requires an active Razorpay payment of ₹${Math.round((selectedPlan.priceInPaise || 0) / 100)}. Online payment gateway integration is processing server-side.`
        );
      } else {
        setModalVisible(false);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionCurrent }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
          queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
        ]);
        refreshProfile?.();
      }
    } catch (err) {
      Alert.alert(
        'Subscription Request',
        err.message || 'Unable to complete subscription request right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isCurrentPlanActive = (plan) => {
    const planId = plan._id || plan.id;
    const activePlanId = currentSub?.planId?._id || currentSub?.planId || currentSub?.plan?._id;
    return activePlanId === planId && (currentSub?.status === 'ACTIVE' || currentSub?.status === 'TRIALING');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="FitMitra PRO" onBack={() => router.back()} />

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
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.secondaryContainer, borderColor: colors.secondary },
            ]}
          >
            <Crown size={36} color={colors.secondary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.onSurface }]}>
            Upgrade to FitMitra PRO
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.onSurfaceVariant }]}>
            Unlock structured fitness programs, full exercise libraries, and unrestricted AI Coach guidance.
          </Text>
        </View>

        {/* Current Active Subscription Banner */}
        {currentSub && (
          <AppCard variant="elevated" style={styles.activeBanner}>
            <View style={styles.activeBannerRow}>
              <CheckCircle2 size={22} color={colors.primary} />
              <View style={styles.activeMetaCol}>
                <Text style={[styles.activeBannerTitle, { color: colors.onSurface }]}>
                  Active Membership
                </Text>
                <Text style={[styles.activeBannerSub, { color: colors.onSurfaceVariant }]}>
                  {currentSub.planId?.name || currentSub.tier || 'PRO Member'} • Status: {currentSub.status}
                </Text>
                {currentSub.currentPeriodEnd && (
                  <Text style={[styles.activeExpiryText, { color: colors.onSurfaceVariant }]}>
                    Valid until: {new Date(currentSub.currentPeriodEnd).toLocaleDateString()}
                  </Text>
                )}
                {currentSub.trialEndsAt && (
                  <Text style={[styles.activeExpiryText, { color: colors.secondary }]}>
                    Trial ends: {new Date(currentSub.trialEndsAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          </AppCard>
        )}

        {/* Plans List */}
        <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
          Available Membership Tiers
        </Text>

        {loading && plans.length === 0 ? (
          <View style={styles.skeletonWrap}>
            <Skeleton height={140} radius={custom.radius.lg} style={styles.mbLg} />
            <Skeleton height={140} radius={custom.radius.lg} style={styles.mbLg} />
          </View>
        ) : plans.length > 0 ? (
          plans.map((plan) => {
            const planId = plan._id || plan.id;
            const priceRupees = Math.round((plan.priceInPaise || 0) / 100);
            const regularRupees = Math.round((plan.regularPriceInPaise || 0) / 100);
            const isActive = isCurrentPlanActive(plan);

            return (
              <AppCard
                key={planId}
                variant="elevated"
                style={[
                  styles.planCard,
                  isActive ? { borderColor: colors.primary, borderWidth: 2 } : null,
                ]}
              >
                <View style={styles.planHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.planBadgeRow}>
                      <View style={[styles.tierBadge, { backgroundColor: colors.surfaceVariant }]}>
                        <Text style={[styles.tierBadgeText, { color: colors.onSurfaceVariant }]}>
                          {plan.tier}
                        </Text>
                      </View>
                      {isActive && (
                        <View style={[styles.activePill, { backgroundColor: colors.primaryContainer }]}>
                          <Text style={[styles.activePillText, { color: colors.onPrimaryContainer }]}>
                            CURRENT PLAN
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.planTitle, { color: colors.onSurface }]}>
                      {plan.name}
                    </Text>
                  </View>

                  <View style={styles.planPriceCol}>
                    <Text style={[styles.priceRupees, { color: colors.onSurface }]}>
                      ₹{priceRupees}
                    </Text>
                    <Text style={[styles.billingPeriod, { color: colors.onSurfaceVariant }]}>
                      /{plan.billingPeriod?.toLowerCase() || 'mo'}
                    </Text>
                  </View>
                </View>

                {regularRupees > priceRupees && (
                  <Text style={[styles.regularPrice, { color: colors.onSurfaceVariant }]}>
                    Regular: ₹{regularRupees}
                  </Text>
                )}

                {plan.trialDays > 0 && (
                  <View style={[styles.trialBadge, { backgroundColor: colors.secondaryContainer }]}>
                    <Zap size={13} color={colors.onSecondaryContainer} />
                    <Text style={[styles.trialBadgeText, { color: colors.onSecondaryContainer }]}>
                      {plan.trialDays}-Day Free Trial Included
                    </Text>
                  </View>
                )}

                {/* Features list */}
                {Array.isArray(plan.features) && plan.features.length > 0 && (
                  <View style={styles.featuresList}>
                    {plan.features.map((feat, fIdx) => (
                      <View key={fIdx} style={styles.featureItemRow}>
                        <Check size={14} color={colors.primary} />
                        <Text style={[styles.featureItemText, { color: colors.onSurface }]}>
                          {feat}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.planActionWrap}>
                  {isActive ? (
                    <AppButton mode="outlined" label="Active Plan" disabled />
                  ) : (
                    <AppButton
                      tone={plan.trialDays > 0 ? 'accent' : 'primary'}
                      label={plan.trialDays > 0 ? `Start ${plan.trialDays}-Day Free Trial` : `Select Plan (₹${priceRupees})`}
                      onPress={() => handleOpenPlanModal(plan)}
                    />
                  )}
                </View>
              </AppCard>
            );
          })
        ) : (
          <AppCard variant="outlined" style={styles.noPlansCard}>
            <Text style={[styles.noPlansText, { color: colors.onSurfaceVariant }]}>
              No subscription plans currently listed on the server.
            </Text>
          </AppCard>
        )}
      </ScrollView>

      {/* Subscription Confirmation Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                {selectedPlan?.name || 'Membership'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <X size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <Text style={[styles.modalSub, { color: colors.onSurfaceVariant }]}>
              {selectedPlan?.trialDays > 0
                ? `You will receive a ${selectedPlan.trialDays}-day full-access trial. After the trial, membership renews at ₹${Math.round((selectedPlan?.priceInPaise || 0) / 100)}/${selectedPlan?.billingPeriod?.toLowerCase() || 'month'}.`
                : `Plan pricing: ₹${Math.round((selectedPlan?.priceInPaise || 0) / 100)} per ${selectedPlan?.billingPeriod?.toLowerCase() || 'month'}.`}
            </Text>

            {paymentOrder && (
              <View style={[styles.paymentOrderBox, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.paymentOrderLabel, { color: colors.onSurfaceVariant }]}>
                  Razorpay Order: {paymentOrder.razorpayOrderId || 'Pending gateway'}
                </Text>
                <Text style={[styles.paymentOrderAmount, { color: colors.onSurface }]}>
                  Amount: ₹{Math.round((paymentOrder.amountInPaise || selectedPlan?.priceInPaise || 0) / 100)}
                </Text>
              </View>
            )}

            <View style={styles.modalActionWrap}>
              <AppButton
                tone="primary"
                label={selectedPlan?.trialDays > 0 ? 'Activate Free Trial' : 'Confirm Order'}
                loading={submitting}
                onPress={handleConfirmSubscription}
              />
            </View>
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
  heroSection: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  activeBanner: {
    marginBottom: 16,
  },
  activeBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeMetaCol: {
    flex: 1,
  },
  activeBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  activeBannerSub: {
    fontSize: 13,
  },
  activeExpiryText: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  skeletonWrap: {
    paddingVertical: 12,
  },
  mbLg: {
    marginBottom: 16,
  },
  planCard: {
    marginBottom: 16,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  planBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  planPriceCol: {
    alignItems: 'flex-end',
  },
  priceRupees: {
    fontSize: 22,
    fontWeight: '900',
  },
  billingPeriod: {
    fontSize: 12,
  },
  regularPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    marginBottom: 6,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 10,
  },
  trialBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  featuresList: {
    gap: 6,
    marginVertical: 10,
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureItemText: {
    fontSize: 13,
  },
  planActionWrap: {
    marginTop: 10,
  },
  noPlansCard: {
    padding: 24,
    alignItems: 'center',
  },
  noPlansText: {
    fontSize: 13,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  paymentOrderBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  paymentOrderLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  paymentOrderAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalActionWrap: {
    marginBottom: 16,
  },
});
