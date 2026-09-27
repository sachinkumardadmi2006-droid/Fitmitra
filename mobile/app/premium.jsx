// FitMitra Premium Subscription Screen & Checkout Modal
// Powered by live backend API: GET /api/v1/subscriptions/plans & POST /api/v1/subscriptions/create
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Check,
  Shield,
  X,
  Sparkles,
  Star,
  Crown,
  Flame,
  Gem,
  CheckCircle2,
} from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { subscriptionService } from '../services';
import { useAuth } from '../context/AuthContext';
import { onDbUpdate, emitDbUpdate } from '../utils/events';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export default function PremiumScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadSubscriptionData = useCallback(async () => {
    try {
      // 1. Fetch real plans from server
      const plansRes = await subscriptionService.getPlans();
      const planItems = Array.isArray(plansRes)
        ? plansRes
        : plansRes?.plans || plansRes?.items || [];
      setPlans(planItems);

      // 2. Fetch user's current subscription
      try {
        const sub = await subscriptionService.getMySubscription();
        setCurrentSub(sub && sub.status !== 'INACTIVE' ? sub : null);
      } catch (_) {
        setCurrentSub(null);
      }
    } catch (e) {
      console.warn('Error loading subscription plans:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadSubscriptionData();
    const unsub = onDbUpdate(loadSubscriptionData);
    return unsub;
  }, [loadSubscriptionData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSubscriptionData();
  };

  const handleOpenPlanModal = (plan) => {
    setSelectedPlan(plan);
    setModalVisible(true);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan) return;
    try {
      setSubmitting(true);
      const planId = selectedPlan._id || selectedPlan.id;
      const res = await subscriptionService.createSubscription({ planId });

      emitDbUpdate();
      setModalVisible(false);
      Alert.alert(
        'Subscription Activated! 🎉',
        `Welcome to ${selectedPlan.name}! You now have full access to all workouts, recipes, and features.`
      );
      loadSubscriptionData();
    } catch (err) {
      Alert.alert(
        'Subscription Failed',
        err.message || 'Unable to activate subscription right now. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading subscription plans..." fullScreen />;
  }

  const isCurrentPlanActive = (plan) => {
    const planId = plan._id || plan.id;
    const activePlanId = currentSub?.planId?._id || currentSub?.planId || currentSub?.plan?._id;
    return activePlanId === planId && (currentSub?.status === 'ACTIVE' || currentSub?.status === 'TRIALING');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryNeon} />
      }
    >
      {/* Header bar */}
      <View style={styles.navBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.navTitle}>FitMitra PRO</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero Badge */}
      <View style={styles.heroSection}>
        <View style={styles.iconCircle}>
          <Crown size={36} color="#FFB800" />
        </View>
        <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
        <Text style={styles.heroSubtitle}>
          Choose your plan for personalized coaching, complete workout libraries, and customized meal plans.
        </Text>
      </View>

      {/* Active Subscription Banner if already subscribed */}
      {currentSub && (
        <View style={styles.activeBanner}>
          <CheckCircle2 size={20} color={Colors.primaryNeon} />
          <View style={{ flex: 1 }}>
            <Text style={styles.activeBannerTitle}>Active Membership</Text>
            <Text style={styles.activeBannerSub}>
              {currentSub.planId?.name || currentSub.tier || 'PRO'} • Status:{' '}
              {currentSub.status}
            </Text>
          </View>
        </View>
      )}

      {/* Plans List */}
      <View style={styles.plansContainer}>
        {plans.map((plan) => {
          const planId = plan._id || plan.id;
          const priceRupees = Math.round((plan.priceInPaise || 0) / 100);
          const regularRupees = Math.round((plan.regularPriceInPaise || 0) / 100);
          const isActive = isCurrentPlanActive(plan);

          return (
            <View
              key={planId}
              style={[
                styles.planCard,
                isActive && styles.planCardActive,
                plan.tier === 'ADVANCED' && styles.planCardAdvanced,
              ]}
            >
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTier}>{plan.tier}</Text>
                  <Text style={styles.planName}>{plan.name}</Text>
                </View>
                <View style={styles.priceWrap}>
                  <Text style={styles.priceText}>₹{priceRupees}</Text>
                  <Text style={styles.periodText}>/{plan.billingPeriod?.toLowerCase() || 'mo'}</Text>
                </View>
              </View>

              {regularRupees > priceRupees && (
                <Text style={styles.regularPriceText}>Regular: ₹{regularRupees}</Text>
              )}

              {plan.trialDays > 0 && (
                <View style={styles.trialPill}>
                  <Text style={styles.trialPillText}>{plan.trialDays}-Day Free Trial Included</Text>
                </View>
              )}

              {/* Features list */}
              <View style={styles.featuresList}>
                {(plan.features || []).map((feat, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <Check size={14} color={Colors.primaryNeon} />
                    <Text style={styles.featureText}>{feat}</Text>
                  </View>
                ))}
              </View>

              {/* Action Button */}
              {isActive ? (
                <View style={styles.activeBtn}>
                  <CheckCircle2 size={16} color={Colors.primaryNeon} />
                  <Text style={styles.activeBtnText}>Current Active Plan</Text>
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.chooseBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => handleOpenPlanModal(plan)}
                >
                  <Sparkles size={16} color={Colors.bgDarkBase} />
                  <Text style={styles.chooseBtnText}>Select {plan.name}</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      {/* Trust Guarantee */}
      <View style={styles.trustBox}>
        <Shield size={20} color={Colors.primaryNeon} />
        <Text style={styles.trustText}>
          Secure payments powered by Razorpay. Cancel anytime with zero questions asked.
        </Text>
      </View>

      {/* Confirmation Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.backdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Subscription</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <X size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {selectedPlan && (
              <>
                <View style={styles.summaryBox}>
                  <View>
                    <Text style={styles.summaryName}>{selectedPlan.name}</Text>
                    <Text style={styles.summaryPeriod}>
                      Billed {selectedPlan.billingPeriod?.toLowerCase()}
                    </Text>
                  </View>
                  <Text style={styles.summaryPrice}>
                    ₹{Math.round((selectedPlan.priceInPaise || 0) / 100)}
                  </Text>
                </View>

                {selectedPlan.trialDays > 0 && (
                  <Text style={styles.trialNotice}>
                    ⚡ Your first {selectedPlan.trialDays} days are 100% free! You can cancel anytime before the trial ends.
                  </Text>
                )}

                <Pressable
                  disabled={submitting}
                  style={({ pressed }) => [
                    styles.confirmBtn,
                    submitting && { opacity: 0.6 },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={handleConfirmSubscription}
                >
                  {submitting ? (
                    <ActivityIndicator color={Colors.bgDarkBase} />
                  ) : (
                    <>
                      <Sparkles size={18} color={Colors.bgDarkBase} />
                      <Text style={styles.confirmBtnText}>
                        {selectedPlan.trialDays > 0
                          ? `Start ${selectedPlan.trialDays}-Day Free Trial`
                          : `Subscribe for ₹${Math.round((selectedPlan.priceInPaise || 0) / 100)}`}
                      </Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDarkBase,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 184, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 245, 155, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 155, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  activeBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryNeon,
  },
  activeBannerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  plansContainer: {
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: Colors.bgCardGlass,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: 20,
  },
  planCardActive: {
    borderColor: Colors.primaryNeon,
    backgroundColor: 'rgba(0, 245, 155, 0.04)',
  },
  planCardAdvanced: {
    borderColor: 'rgba(255, 184, 0, 0.4)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planTier: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryNeon,
    letterSpacing: 1,
    marginBottom: 2,
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  periodText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  regularPriceText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
    marginBottom: 10,
  },
  trialPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 216, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 216, 246, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 14,
  },
  trialPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D8F6',
  },
  featuresList: {
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  chooseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryNeon,
    paddingVertical: 14,
    borderRadius: 14,
  },
  chooseBtnText: {
    color: Colors.bgDarkBase,
    fontWeight: '800',
    fontSize: 14,
  },
  activeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 245, 155, 0.12)',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 155, 0.3)',
  },
  activeBtnText: {
    color: Colors.primaryNeon,
    fontWeight: '800',
    fontSize: 14,
  },
  trustBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
  },
  trustText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 19, 0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0D1222',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.borderGlass,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalClose: {
    padding: 4,
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgCardGlass,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginBottom: 16,
  },
  summaryName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  summaryPeriod: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  trialNotice: {
    fontSize: 12,
    color: '#00D8F6',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryNeon,
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 20,
  },
  confirmBtnText: {
    color: Colors.bgDarkBase,
    fontWeight: '800',
    fontSize: 15,
  },
});
