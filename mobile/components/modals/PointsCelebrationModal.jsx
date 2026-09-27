import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Zap, ShoppingBag, Sparkles, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/theme';

export function PointsCelebrationModal({
  visible,
  pointsEarned = 5,
  totalPoints = 0,
  onClose,
}) {
  const router = useRouter();

  const handleGoToStore = () => {
    onClose?.();
    router.push('/(tabs)/store');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X size={20} color={Colors.textSecondary} />
          </Pressable>

          <View style={styles.iconCircle}>
            <Zap size={44} color="#FFB800" fill="#FFB800" />
          </View>

          <View style={styles.sparkleRow}>
            <Sparkles size={16} color={Colors.primaryNeon} />
            <Text style={styles.badgeText}>WORKOUT COMPLETED</Text>
            <Sparkles size={16} color={Colors.primaryNeon} />
          </View>

          <Text style={styles.pointsText}>+{pointsEarned} Points!</Text>
          <Text style={styles.subtext}>
            Congratulations! You earned +{pointsEarned} FitMitra Reward Points.
          </Text>

          {totalPoints > 0 && (
            <View style={styles.balancePill}>
              <Text style={styles.balanceLabel}>Your Balance:</Text>
              <Text style={styles.balanceValue}>⚡ {totalPoints} pts</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.storeBtn, pressed && { opacity: 0.85 }]}
            onPress={handleGoToStore}
          >
            <ShoppingBag size={18} color={Colors.bgDarkBase} />
            <Text style={styles.storeBtnText}>Redeem in Supplements Store</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.7 }]}
            onPress={onClose}
          >
            <Text style={styles.dismissBtnText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 19, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#0D1222',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 184, 0, 0.4)',
    padding: 28,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    borderWidth: 2,
    borderColor: '#FFB800',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FFB800',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  badgeText: {
    color: Colors.primaryNeon,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  pointsText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFB800',
    marginBottom: 6,
  },
  subtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  storeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryNeon,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  storeBtnText: {
    color: Colors.bgDarkBase,
    fontWeight: '800',
    fontSize: 15,
  },
  dismissBtn: {
    paddingVertical: 10,
  },
  dismissBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
