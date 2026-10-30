import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Droplets, Plus } from 'lucide-react-native';
import { ProgressBar } from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppTheme } from '../../theme/ThemeContext';
import { nutritionService } from '../../services/nutritionService';
import { queryKeys } from '../../constants/queryKeys';
import AppCard from '../ui/AppCard';

export default function WaterTrackerCard({ targetWater = 0, style, isLocked = false, onPromptPlan }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const queryClient = useQueryClient();
  const [logging, setLogging] = useState(false);

  const waterQuery = useQuery({
    queryKey: queryKeys.nutritionWater,
    queryFn: async () => {
      const res = await nutritionService.getWater();
      return typeof res === 'object' ? (res?.totalMl ?? 0) : Number(res || 0);
    },
    staleTime: 60 * 1000,
  });

  const waterMl = waterQuery.data ?? 0;
  const effectiveTarget = Number(targetWater) || 0;
  const waterProgress = effectiveTarget > 0 ? Math.min(Math.max(waterMl / effectiveTarget, 0), 1) : 0;

  const handleAddWater = async (amount = 250) => {
    if (effectiveTarget === 0 || isLocked) {
      if (onPromptPlan) {
        onPromptPlan();
      } else {
        Alert.alert('AI Plan Required', 'Please generate your AI Diet Plan first to calculate and set your daily hydration target.');
      }
      return;
    }

    if (logging) return;
    setLogging(true);

    // Optimistically update TanStack cache
    const previousWater = queryClient.getQueryData(queryKeys.nutritionWater);
    queryClient.setQueryData(queryKeys.nutritionWater, (old) => {
      const current = typeof old === 'number' ? old : (old?.totalMl ?? 0);
      return current + amount;
    });

    try {
      await nutritionService.logWater(amount);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.nutritionWater }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    } catch (e) {
      // Rollback on error
      if (previousWater !== undefined) {
        queryClient.setQueryData(queryKeys.nutritionWater, previousWater);
      }
      console.warn('[WaterTrackerCard] Water log error:', e?.message || e);
    } finally {
      setLogging(false);
    }
  };

  return (
    <AppCard variant="outlined" style={[styles.hydrationCard, style]}>
      <View style={styles.hydrationHeader}>
        <View style={styles.rowAlign}>
          <Droplets size={18} color={colors.primary} />
          <Text style={[styles.hydrationTitle, { color: colors.onSurface }]}>
            Hydration Tracker
          </Text>
        </View>
        <Text style={[styles.waterVal, { color: colors.onSurface }]}>
          {waterMl} <Text style={styles.waterTargetSub}>/ {effectiveTarget} ml</Text>
        </Text>
      </View>

      <ProgressBar
        progress={waterProgress}
        color={colors.primary}
        style={styles.waterProgressBar}
      />

      <View style={styles.waterActionRow}>
        <Text style={[styles.waterPct, { color: colors.onSurfaceVariant }]}>
          {effectiveTarget > 0
            ? `${Math.round(waterProgress * 100)}% of daily target`
            : 'Target unlocks with AI plan'}
        </Text>

        <View style={styles.buttonsRow}>
          {waterMl > 0 && (
            <Pressable
              style={[
                styles.undoWaterBtn,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.outlineVariant,
                },
                logging && { opacity: 0.6 },
              ]}
              onPress={() => handleAddWater(-250)}
              disabled={logging}
              hitSlop={4}
            >
              <Text style={[styles.undoWaterBtnText, { color: colors.onSurfaceVariant }]}>
                -250 ml
              </Text>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.addWaterBtn,
              {
                backgroundColor: colors.primaryContainer,
                borderColor: colors.primary,
              },
              logging && { opacity: 0.7 },
            ]}
            onPress={() => handleAddWater(250)}
            disabled={logging}
          >
            <Plus size={13} color={colors.onPrimaryContainer} />
            <Text style={[styles.addWaterBtnText, { color: colors.onPrimaryContainer }]}>
              +250 ml
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.addWaterBtn,
              {
                backgroundColor: colors.primaryContainer,
                borderColor: colors.primary,
              },
              logging && { opacity: 0.7 },
            ]}
            onPress={() => handleAddWater(500)}
            disabled={logging}
          >
            <Plus size={13} color={colors.onPrimaryContainer} />
            <Text style={[styles.addWaterBtnText, { color: colors.onPrimaryContainer }]}>
              +500 ml
            </Text>
          </Pressable>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  hydrationCard: {
    marginBottom: 16,
  },
  hydrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hydrationTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  waterVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  waterTargetSub: {
    fontSize: 12,
    fontWeight: '400',
  },
  waterProgressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  waterActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waterPct: {
    fontSize: 12,
    fontWeight: '500',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  undoWaterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  undoWaterBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addWaterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  addWaterBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
