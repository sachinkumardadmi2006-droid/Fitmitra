import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Crown,
  CheckCircle2,
  Sparkles,
  Lock,
  Zap,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react-native';
import { subscriptionService } from '../../services/subscriptionService';
import { openCheckout } from '../../services/paymentCheckout';
import { queryKeys } from '../../constants/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from '../ui/AppCard';
import AppButton from '../ui/AppButton';
import Skeleton, { SkeletonCard } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import ErrorState from '../ui/ErrorState';

export default function StepSubscriptionGate({
  isVerified,
  setIsVerified,
}) {
  const { theme, isDark } = useAppTheme();
  const { colors, custom } = theme;
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // 1. Current Subscription Query
  const {
    data: currentSub,
    isLoading: isLoadingSub,
    isRefetching: isRefetchingSub,
    refetch: refetchSub,
  } = useQuery({
    queryKey: queryKeys.subscriptionCurrent,
    queryFn: async () => {
      const res = await subscriptionService.getMySubscription();
      const s = res?.data || res;
      return s && s.status !== 'INACTIVE' ? s : null;
    },
    staleTime: 30 * 1000,
  });

  // 2. Available Plans Query
  const {
    data: plansData,
    isLoading: isLoadingPlans,
    isError: isPlansError,
    error: plansError,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: queryKeys.subscriptionPlans,
    queryFn: async () => {
      const res = await subscriptionService.getPlans();
      const items = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : Array.isArray(res?.plans)
            ? res.plans
            : [];
      return items;
    },
    staleTime: 60 * 1000,
  });

  const plans = plansData || [];
  const isActive = Boolean(
    currentSub &&
    (currentSub.status === 'ACTIVE' || currentSub.status === 'TRIALING')
  );

  // Sync verified state upward whenever subscription query resolves
  useEffect(() => {
    if (isActive) {
      setIsVerified(true);
      setCheckoutError('');
    } else {
      setIsVerified(false);
    }
  }, [isActive, setIsVerified]);

  // Pre-select first plan when plans arrive
  useEffect(() => {
    if (!selectedPlanId && plans.length > 0) {
      const firstId = plans[0]._id || plans[0].id;
      setSelectedPlanId(firstId);
    }
  }, [plans, selectedPlanId]);

  const pollSubscriptionActive = async () => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const subRes = await subscriptionService.getMySubscription();
        const s = subRes?.data || subRes;
        if (s && (s.status === 'ACTIVE' || s.status === 'TRIALING')) {
          return true;
        }
      } catch (_) {}
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
    return false;
  };

  const handleSubscribe = async () => {
    if (!selectedPlanId) {
      Alert.alert('Select a Plan', 'Please select a subscription tier to continue.');
      return;
    }

    const selectedPlan = plans.find(
      (p) => (p._id || p.id) === selectedPlanId
    );
    if (!selectedPlan) return;

    setSubmitting(true);
    setCheckoutError('');

    try {
      // 1. Create subscription on server
      const createRes = await subscriptionService.createSubscription({
        planId: selectedPlanId,
      });
      const createData = createRes?.data || createRes;

      // Case A: Free trial started directly
      if (createData?.type === 'TRIAL_STARTED') {
        await queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionCurrent });
        await refetchSub();
        setIsVerified(true);
        refreshProfile?.();
        Alert.alert(
          'Trial Activated! 🎉',
          `Your free trial of ${selectedPlan.name || 'FitMitra Pro'} is now active!`
        );
        return;
      }

      // Case B: Payment required via Razorpay
      if (createData?.type === 'PAYMENT_REQUIRED' || !createData?.type) {
        const orderRes = await subscriptionService.createPaymentOrder({
          subscriptionPlanId: selectedPlanId,
        });
        const orderData = orderRes?.data || orderRes;

        if (!orderData?.providerOrderId) {
          throw new Error('Server order did not return valid payment credentials.');
        }

        const checkoutResult = await openCheckout({
          providerOrderId: orderData.providerOrderId,
          keyId: orderData.keyId,
          amountInPaise: orderData.amountInPaise || selectedPlan.priceInPaise,
          currency: orderData.currency || 'INR',
          prefill: {
            name: user?.name || user?.displayName || '',
            email: user?.email || '',
            phone: user?.phone || '',
          },
          verifyPayload: {
            subscriptionPlanId: selectedPlanId,
          },
        });

        if (checkoutResult.status === 'success' || checkoutResult.status === 'pending') {
          const confirmed = await pollSubscriptionActive();
          await queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionCurrent });
          await refetchSub();

          if (confirmed) {
            setIsVerified(true);
            refreshProfile?.();
            Alert.alert(
              'Subscription Active! 🏆',
              'Welcome to FitMitra Pro! You can now proceed to finalize your plan.'
            );
          } else {
            setIsVerified(true);
            Alert.alert(
              'Payment Confirming',
              'Payment received, confirmation in progress. Your plan will activate shortly.'
            );
          }
        } else if (checkoutResult.status === 'cancelled') {
          setCheckoutError('Payment cancelled. Please subscribe to unlock your personalized plan.');
        } else {
          setCheckoutError(checkoutResult.message || 'Payment transaction could not be completed.');
        }
      }
    } catch (err) {
      console.warn('Subscription checkout error:', err?.message || err);
      setCheckoutError(err?.message || 'Failed to initialize subscription checkout. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoadingSub) {
    return (
      <View style={styles.loadingContainer}>
        <SkeletonCard lines={3} />
      </View>
    );
  }

  // Active Subscription View (Unlocked Gate)
  if (isActive) {
    const tierName = currentSub.tier || currentSub.planName || 'FitMitra Pro';
    return (
      <View style={styles.container}>
        <AppCard
          variant="elevated"
          style={[
            styles.activeCard,
            {
              backgroundColor: colors.primaryContainer,
              borderColor: custom.primaryStrong || colors.primary,
            },
          ]}
          padded={false}
        >
          <View style={styles.activeCardPadding}>
            <View style={styles.activeHeader}>
              <View
                style={[
                  styles.activeIconWrap,
                  { backgroundColor: custom.primaryStrong || colors.primary },
                ]}
              >
                <Crown size={24} color={colors.onPrimary} />
              </View>
              <View
                style={[
                  styles.verifiedBadge,
                  { backgroundColor: colors.surface },
                ]}
              >
                <ShieldCheck
                  size={14}
                  color={custom.primaryStrong || colors.primary}
                />
                <Text
                  style={[
                    styles.verifiedBadgeText,
                    { color: custom.primaryStrong || colors.primary },
                  ]}
                >
                  VERIFIED ACTIVE
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.activeTitle,
                { color: colors.onPrimaryContainer },
              ]}
            >
              FitMitra Membership Active
            </Text>
            <Text
              style={[
                styles.activeDesc,
                { color: colors.onPrimaryContainer },
              ]}
            >
              Your {tierName} subscription is verified. You have full access to personalized programs, macronutrient targets, and AI coaching.
            </Text>

            <View
              style={[
                styles.activeFeatureRow,
                { borderTopColor: colors.outlineVariant },
              ]}
            >
              <CheckCircle2
                size={16}
                color={custom.primaryStrong || colors.primary}
              />
              <Text
                style={[
                  styles.activeFeatureText,
                  { color: colors.onPrimaryContainer },
                ]}
              >
                Ready to review and generate your tailored workout plan.
              </Text>
            </View>
          </View>
        </AppCard>
      </View>
    );
  }

  // Inactive Subscription View (Gated)
  return (
    <View style={styles.container}>
      {/* Premium Gate Banner */}
      <AppCard
        variant="elevated"
        style={[
          styles.gateCard,
          {
            backgroundColor: isDark
              ? colors.elevation.level1
              : colors.surface,
            borderColor: colors.secondary,
          },
        ]}
        padded={false}
      >
        <View style={styles.gateCardPadding}>
          <View style={styles.gateHeaderRow}>
            <View
              style={[
                styles.crownIconBox,
                { backgroundColor: colors.secondaryContainer },
              ]}
            >
              <Crown size={22} color={custom.accentText || colors.secondary} />
            </View>
            <View
              style={[
                styles.lockBadge,
                { backgroundColor: isDark ? colors.elevation.level2 : colors.surfaceVariant },
              ]}
            >
              <Lock size={12} color={colors.onSurfaceVariant} />
              <Text
                style={[
                  styles.lockBadgeText,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                SUBSCRIPTION REQUIRED
              </Text>
            </View>
          </View>

          <Text style={[styles.gateTitle, { color: colors.onSurface }]}>
            FitMitra Pro Access
          </Text>
          <Text style={[styles.gateDesc, { color: colors.onSurfaceVariant }]}>
            An active membership is required to calibrate your custom training split, daily macronutrient targets, and AI coach.
          </Text>

          {/* Premium Value Props */}
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <CheckCircle2
                size={16}
                color={custom.primaryStrong || colors.primary}
              />
              <Text style={[styles.benefitText, { color: colors.onSurface }]}>
                Tailored progressive workout regimen & exercise video guides
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <CheckCircle2
                size={16}
                color={custom.primaryStrong || colors.primary}
              />
              <Text style={[styles.benefitText, { color: colors.onSurface }]}>
                Daily calorie, protein, carbohydrate & healthy fat calibration
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <CheckCircle2
                size={16}
                color={custom.primaryStrong || colors.primary}
              />
              <Text style={[styles.benefitText, { color: colors.onSurface }]}>
                Personal AI Coach for form corrections and nutrition queries
              </Text>
            </View>
          </View>
        </View>
      </AppCard>

      {/* Checkout Error Message */}
      {checkoutError ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.errorContainer,
              borderColor: colors.error,
            },
          ]}
        >
          <AlertCircle size={16} color={colors.onErrorContainer} />
          <Text
            style={[
              styles.errorBannerText,
              { color: colors.onErrorContainer },
            ]}
          >
            {checkoutError}
          </Text>
        </View>
      ) : null}

      {/* Subscription Plans Selection */}
      <View style={styles.plansSection}>
        <Text style={[styles.plansSectionTitle, { color: colors.onSurface }]}>
          Select Membership Tier
        </Text>

        {isLoadingPlans ? (
          <View style={{ gap: 10 }}>
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </View>
        ) : isPlansError ? (
          <ErrorState
            error={plansError}
            message="Failed to load subscription plans. Tap to retry."
            onRetry={refetchPlans}
          />
        ) : plans.length === 0 ? (
          <EmptyState
            icon="card-bulleted-outline"
            title="No Plans Available"
            message="Subscription tiers are being updated on the server. Please tap retry."
            actionLabel="Retry"
            onAction={refetchPlans}
          />
        ) : (
          <View style={styles.plansList}>
            {plans.map((p) => {
              const pId = p._id || p.id;
              const isSelected = selectedPlanId === pId;
              const priceDisplay = p.priceInPaise
                ? `₹${Math.round(p.priceInPaise / 100)}`
                : p.priceFormatted || '₹499';

              return (
                <Pressable
                  key={pId}
                  onPress={() => setSelectedPlanId(pId)}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: isSelected
                        ? colors.primaryContainer
                        : isDark
                          ? colors.elevation.level1
                          : colors.surface,
                      borderColor: isSelected
                        ? (custom.primaryStrong || colors.primary)
                        : colors.outlineVariant,
                    },
                  ]}
                >
                  <View style={styles.planCardLeft}>
                    <Text
                      style={[
                        styles.planName,
                        {
                          color: isSelected
                            ? colors.onPrimaryContainer
                            : colors.onSurface,
                        },
                      ]}
                    >
                      {p.name || 'Pro Tier'}
                    </Text>
                    {p.description ? (
                      <Text
                        style={[
                          styles.planDesc,
                          {
                            color: isSelected
                              ? colors.onPrimaryContainer
                              : colors.onSurfaceVariant,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {p.description}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.planCardRight}>
                    <Text
                      style={[
                        styles.planPrice,
                        {
                          color: isSelected
                            ? (custom.primaryStrong || colors.primary)
                            : colors.onSurface,
                        },
                      ]}
                    >
                      {priceDisplay}
                    </Text>
                    <Text
                      style={[
                        styles.planBilling,
                        {
                          color: isSelected
                            ? colors.onPrimaryContainer
                            : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      /{p.billingCycle?.toLowerCase() || 'month'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Subscribe Button */}
      {plans.length > 0 && (
        <View style={styles.actionWrap}>
          <AppButton
            label={submitting ? 'Connecting Secure Gateway...' : 'Subscribe & Continue'}
            onPress={handleSubscribe}
            loading={submitting}
            disabled={submitting || !selectedPlanId}
            icon="shield-check"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  loadingContainer: {
    width: '100%',
  },
  activeCard: {
    borderRadius: 16,
    borderWidth: 2,
  },
  activeCardPadding: {
    padding: 18,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  activeTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  activeDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  activeFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  activeFeatureText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  gateCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  gateCardPadding: {
    padding: 18,
  },
  gateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  crownIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  gateTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  gateDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  plansSection: {
    marginBottom: 16,
  },
  plansSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  plansList: {
    gap: 10,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  planCardLeft: {
    flex: 1,
  },
  planName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  planDesc: {
    fontSize: 12,
  },
  planCardRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '800',
  },
  planBilling: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionWrap: {
    marginTop: 4,
  },
});
