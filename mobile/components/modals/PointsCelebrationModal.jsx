import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Zap, ShoppingBag, Sparkles, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../theme/ThemeContext';

export function PointsCelebrationModal({
  visible,
  pointsEarned = 5,
  totalPoints = 0,
  onClose,
}) {
  const router = useRouter();
  const { theme } = useAppTheme();

  const handleGoToStore = () => {
    onClose?.();
    router.push('/(tabs)/store');
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.dark ? theme.colors.elevation.level2 : theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <X size={20} color={theme.colors.onSurfaceVariant} />
          </Pressable>

          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: theme.colors.secondaryContainer,
                borderColor: theme.colors.secondary,
              },
            ]}
          >
            <Zap size={44} color={theme.colors.secondary} fill={theme.colors.secondary} />
          </View>

          <View style={styles.sparkleRow}>
            <Sparkles size={16} color={theme.colors.primary} />
            <Text style={[styles.badgeText, { color: theme.colors.primary }]}>WORKOUT COMPLETED</Text>
            <Sparkles size={16} color={theme.colors.primary} />
          </View>

          <Text style={[styles.pointsText, { color: theme.colors.onSurface }]}>
            +{pointsEarned} Points!
          </Text>
          <Text style={[styles.subtext, { color: theme.colors.onSurfaceVariant }]}>
            Congratulations! You earned +{pointsEarned} FitMitra Reward Points.
          </Text>

          {totalPoints > 0 && (
            <View
              style={[
                styles.balancePill,
                {
                  backgroundColor: theme.dark ? theme.colors.elevation.level3 : theme.colors.surfaceVariant,
                },
              ]}
            >
              <Text style={[styles.balanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                Your Balance:
              </Text>
              <Text style={[styles.balanceValue, { color: theme.colors.onSurface }]}>
                ⚡ {totalPoints} pts
              </Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.storeBtn,
              { backgroundColor: theme.colors.primary },
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleGoToStore}
          >
            <ShoppingBag size={18} color={theme.colors.onPrimary} />
            <Text style={[styles.storeBtnText, { color: theme.colors.onPrimary }]}>
              Redeem in Store
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.7 }]}
            onPress={onClose}
          >
            <Text style={[styles.dismissBtnText, { color: theme.colors.onSurfaceVariant }]}>
              Continue
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  pointsText: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 6,
  },
  subtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 13,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  storeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  storeBtnText: {
    fontWeight: '800',
    fontSize: 15,
  },
  dismissBtn: {
    paddingVertical: 10,
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
