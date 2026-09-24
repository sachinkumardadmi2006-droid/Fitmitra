// FitMitra Premium Subscription Screen & Confirmation Modal
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, Shield, X, Sparkles, Star, Crown, Flame, Gem } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { getUser, saveUser } from '../utils/db';

const PLANS = [
  {
    id: 'monthly',
    icon: '🔥',
    title: 'MONTHLY',
    price: '₹49',
    period: '/ month',
    rawPrice: 49,
    badge: null,
    features: [
      'All workout levels',
      'Diet plans',
      'Progress tracking',
    ],
  },
  {
    id: '3months',
    icon: '⭐',
    title: '3 MONTHS',
    price: '₹99',
    period: '',
    rawPrice: 99,
    badge: 'BEST VALUE',
    features: [
      'All workout levels',
      'Diet plans',
      'Progress tracking',
      'Premium exercises',
    ],
  },
  {
    id: '6months',
    icon: '💎',
    title: '6 MONTHS',
    price: '₹149',
    period: '',
    rawPrice: 149,
    badge: null,
    features: [
      'All workout levels',
      'Diet plans',
      'Progress tracking',
      'Premium exercises',
    ],
  },
  {
    id: 'yearly',
    icon: '👑',
    title: 'YEARLY',
    price: '₹249',
    period: '/ year',
    rawPrice: 249,
    badge: null,
    features: [
      'All workout levels',
      'Diet plans',
      'Progress tracking',
      'Premium exercises',
      'VIP Support',
    ],
  },
];

export default function PremiumScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    getUser().then(u => setUser(u));
  }, []);

  const handleOpenPlanModal = (plan) => {
    setSelectedPlan(plan);
    setModalVisible(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedPlan) return;
    setPaying(true);
    setTimeout(async () => {
      setPaying(false);
      setModalVisible(false);
      
      // Update user status
      const updatedUser = {
        ...(user || {}),
        isPremium: true,
        premiumPlan: selectedPlan.id,
        premiumPurchasedAt: new Date().toISOString(),
      };
      await saveUser(updatedUser);
      setUser(updatedUser);

      Alert.alert(
        '🎉 Payment Successful!',
        `Welcome to FitMitra Premium! You have unlocked full access with the ${selectedPlan.title} plan.`,
        [
          {
            text: 'Let\'s Go!',
            onPress: () => router.back(),
          },
        ]
      );
    }, 1200);
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>FitMitra Premium</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>💪</Text>
          <Text style={styles.heroTitle}>UNLOCK YOUR POTENTIAL</Text>
          <Text style={styles.heroSubtitle}>Train smarter. Get stronger.</Text>
        </View>

        {/* Subscription Plan Cards */}
        <View style={styles.plansWrap}>
          {PLANS.map((plan) => {
            const isBestValue = plan.badge === 'BEST VALUE';
            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  isBestValue && styles.bestValueCard,
                ]}
              >
                {/* Header Row */}
                <View style={styles.planCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 20 }}>{plan.icon}</Text>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                  </View>
                  {isBestValue && (
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>BEST VALUE</Text>
                    </View>
                  )}
                </View>

                {/* Price */}
                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>{plan.price}</Text>
                  {!!plan.period && <Text style={styles.periodText}>{' ' + plan.period}</Text>}
                </View>

                {/* Features List */}
                <View style={styles.featuresList}>
                  {plan.features.map((feat, idx) => (
                    <View key={idx} style={styles.featureRow}>
                      <Check size={16} color={Colors.primaryNeon} />
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                {/* Action Button */}
                <Pressable
                  style={[styles.planBtn, isBestValue && styles.bestValueBtn]}
                  onPress={() => handleOpenPlanModal(plan)}
                >
                  <Text style={[styles.planBtnText, isBestValue && styles.bestValueBtnText]}>
                    Get {plan.price} Plan
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Footer Guarantee */}
        <View style={styles.footerSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Shield size={18} color={Colors.primaryNeon} />
            <Text style={styles.footerTitle}>Secure payments</Text>
          </View>
          <Text style={styles.footerSub}>UPI • Cards • Net Banking</Text>
        </View>
      </ScrollView>

      {/* CONFIRM YOUR PLAN MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !paying && setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Close Button */}
            <Pressable style={styles.closeBtn} onPress={() => setModalVisible(false)} disabled={paying}>
              <X size={20} color={Colors.textSecondary} />
            </Pressable>

            <Text style={styles.confirmHeaderTitle}>Confirm Your Plan</Text>

            {selectedPlan && (
              <View style={styles.confirmBody}>
                {/* Brand & Selected Plan Name */}
                <Text style={styles.brandTitle}>FitMitra Premium</Text>
                <Text style={styles.confirmPlanName}>{selectedPlan.title}</Text>

                {/* Price */}
                <Text style={styles.confirmPrice}>{selectedPlan.price}</Text>

                {/* Checkable Included Features */}
                <View style={styles.confirmFeaturesWrap}>
                  {selectedPlan.features.map((feat, idx) => (
                    <View key={idx} style={styles.confirmFeatureRow}>
                      <Check size={16} color={Colors.primaryNeon} />
                      <Text style={styles.confirmFeatureText}>{feat}</Text>
                    </View>
                  ))}
                </View>

                {/* Pay Button */}
                <Pressable
                  style={styles.payBtn}
                  onPress={handleProcessPayment}
                  disabled={paying}
                >
                  {paying ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text style={styles.payBtnText}>Pay {selectedPlan.price}</Text>
                  )}
                </Pressable>

                {/* Secure Badge */}
                <View style={styles.secureBadgeRow}>
                  <Shield size={15} color={Colors.textSecondary} />
                  <Text style={styles.secureBadgeText}>Secure payment</Text>
                </View>
              </View>
            )}
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
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGlass,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  heroEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  plansWrap: {
    gap: 18,
    marginBottom: 28,
  },
  planCard: {
    backgroundColor: Colors.bgDarkCard,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.borderGlassBright,
    padding: 20,
  },
  bestValueCard: {
    borderColor: Colors.primaryNeon,
    backgroundColor: 'rgba(204, 255, 0, 0.04)',
    shadowColor: Colors.primaryNeon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  bestValueBadge: {
    backgroundColor: Colors.primaryNeon,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceText: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  periodText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  featuresList: {
    gap: 10,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  planBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justify: 'center',
  },
  bestValueBtn: {
    backgroundColor: Colors.primaryNeon,
  },
  planBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bestValueBtnText: {
    color: '#000000',
    fontWeight: '800',
  },
  footerSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  footerSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  confirmHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.authText,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmBody: {
    width: '100%',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 15,
    color: Colors.authSubtext,
    fontWeight: '600',
  },
  confirmPlanName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.authText,
    marginTop: 4,
  },
  confirmPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.authText,
    marginVertical: 16,
  },
  confirmFeaturesWrap: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  confirmFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confirmFeatureText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.authText,
  },
  payBtn: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.authText,
    borderRadius: 14,
    alignItems: 'center',
    justify: 'center',
    marginBottom: 16,
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  secureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secureBadgeText: {
    fontSize: 13,
    color: Colors.authSubtext,
  },
});
