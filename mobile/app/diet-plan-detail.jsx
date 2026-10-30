import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Droplets,
  Flame,
  Target,
  ShieldCheck,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { nutritionService } from '../services/nutritionService';
import { queryKeys } from '../constants/queryKeys';
import AppCard from '../components/ui/AppCard';

export default function DietPlanDetailPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  const { data: dietPlan, isLoading } = useQuery({
    queryKey: queryKeys.dietPlan,
    queryFn: async () => {
      return await nutritionService.getCurrentDietPlan();
    },
    staleTime: 60 * 1000,
  });

  const targets = dietPlan?.dailyTargets || {};
  const adviceList = Array.isArray(dietPlan?.advice) ? dietPlan.advice : [];
  const snapshot = dietPlan?.inputSnapshot || {};

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 12) + 6,
            backgroundColor: colors.surface,
            borderBottomColor: colors.outlineVariant,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={[styles.backBtn, { backgroundColor: colors.surfaceVariant }]}
        >
          <ArrowLeft size={18} color={colors.onSurface} />
        </Pressable>
        <View style={styles.topBarTitleWrap}>
          <Text style={[styles.topBarTitle, { color: colors.onSurface }]}>
            My AI Diet Plan
          </Text>
          <Text style={[styles.topBarSubtitle, { color: colors.onSurfaceVariant }]}>
            Clinical Sports Nutrition Protocol
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Content */}
      {isLoading && !dietPlan ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={custom.primaryStrong} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Loading your nutrition protocol...
          </Text>
        </View>
      ) : !dietPlan ? (
        <View style={styles.emptyWrap}>
          <Sparkles size={40} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
            No Active Diet Plan
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
            Generate your personalized AI Diet Plan from the Nutrition tab to view your full protocol.
          </Text>
          <Pressable
            style={[styles.backHomeBtn, { backgroundColor: custom.primaryStrong }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backHomeBtnText}>Back to Nutrition Tab</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Plan Identity Card */}
          <AppCard
            variant="elevated"
            style={[
              styles.heroCard,
              { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
            ]}
          >
            <View style={styles.badgeRow}>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(53, 208, 127, 0.15)' }]}>
                <ShieldCheck size={13} color="var(--primary, #35D07F)" />
                <Text style={styles.statusBadgeText}>ACTIVE PROTOCOL</Text>
              </View>
              {dietPlan.createdAt && (
                <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
                  {new Date(dietPlan.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              )}
            </View>

            <Text style={[styles.planTitle, { color: colors.onSurface }]}>
              {dietPlan.title || 'Personalized AI Nutrition Plan'}
            </Text>

            {dietPlan.summary && (
              <Text style={[styles.planSummary, { color: colors.onSurfaceVariant }]}>
                {dietPlan.summary}
              </Text>
            )}
          </AppCard>

          {/* Daily Macronutrient Targets Grid */}
          <View style={styles.sectionHeaderRow}>
            <Flame size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Calculated Daily Targets
            </Text>
          </View>

          <View style={styles.targetsGrid}>
            {/* Calories Card */}
            <AppCard
              style={[
                styles.targetCard,
                styles.targetCardFeatured,
                { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
              ]}
            >
              <View style={styles.targetCardIconWrap}>
                <Flame size={16} color={colors.primary} />
                <Text style={[styles.targetCardLabel, { color: colors.onPrimaryContainer }]}>
                  Daily Energy
                </Text>
              </View>
              <Text style={[styles.targetCardValue, { color: colors.onPrimaryContainer }]}>
                {targets.calories || 0}
              </Text>
              <Text style={[styles.targetCardUnit, { color: colors.onPrimaryContainer }]}>
                kcal / day
              </Text>
            </AppCard>

            {/* Protein Card */}
            <AppCard
              style={[
                styles.targetCard,
                { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
              ]}
            >
              <Text style={[styles.targetCardLabel, { color: colors.onSurfaceVariant }]}>
                🥩 Protein
              </Text>
              <Text style={[styles.targetCardValue, { color: colors.onSurface }]}>
                {targets.protein || 0}g
              </Text>
              <Text style={[styles.targetCardSub, { color: colors.onSurfaceVariant }]}>
                {Math.round(((targets.protein || 0) * 4 / Math.max(targets.calories || 1, 1)) * 100)}% of calories
              </Text>
            </AppCard>

            {/* Carbs Card */}
            <AppCard
              style={[
                styles.targetCard,
                { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
              ]}
            >
              <Text style={[styles.targetCardLabel, { color: colors.onSurfaceVariant }]}>
                🍚 Carbs
              </Text>
              <Text style={[styles.targetCardValue, { color: colors.onSurface }]}>
                {targets.carbs || 0}g
              </Text>
              <Text style={[styles.targetCardSub, { color: colors.onSurfaceVariant }]}>
                {Math.round(((targets.carbs || 0) * 4 / Math.max(targets.calories || 1, 1)) * 100)}% of calories
              </Text>
            </AppCard>

            {/* Fats Card */}
            <AppCard
              style={[
                styles.targetCard,
                { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
              ]}
            >
              <Text style={[styles.targetCardLabel, { color: colors.onSurfaceVariant }]}>
                🥑 Fats
              </Text>
              <Text style={[styles.targetCardValue, { color: colors.onSurface }]}>
                {targets.fat || 0}g
              </Text>
              <Text style={[styles.targetCardSub, { color: colors.onSurfaceVariant }]}>
                {Math.round(((targets.fat || 0) * 9 / Math.max(targets.calories || 1, 1)) * 100)}% of calories
              </Text>
            </AppCard>

            {/* Fiber Card */}
            <AppCard
              style={[
                styles.targetCard,
                { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
              ]}
            >
              <Text style={[styles.targetCardLabel, { color: colors.onSurfaceVariant }]}>
                🌾 Dietary Fiber
              </Text>
              <Text style={[styles.targetCardValue, { color: colors.onSurface }]}>
                {targets.fiber || 30}g
              </Text>
              <Text style={[styles.targetCardSub, { color: colors.onSurfaceVariant }]}>
                Digestive health
              </Text>
            </AppCard>

            {/* Hydration Card */}
            <AppCard
              style={[
                styles.targetCard,
                { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Droplets size={14} color="#4DA3FF" />
                <Text style={[styles.targetCardLabel, { color: colors.onSurfaceVariant }]}>
                  Hydration
                </Text>
              </View>
              <Text style={[styles.targetCardValue, { color: colors.onSurface }]}>
                {((targets.waterMl || 2500) / 1000).toFixed(1)} L
              </Text>
              <Text style={[styles.targetCardSub, { color: colors.onSurfaceVariant }]}>
                {targets.waterMl || 2500} ml / day
              </Text>
            </AppCard>
          </View>

          {/* Actionable Nutrition Guidelines (Clean Bullet Points) */}
          <View style={[styles.sectionHeaderRow, { marginTop: 10 }]}>
            <Sparkles size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Clinical Advice & Actionable Rules
            </Text>
          </View>

          <AppCard
            variant="elevated"
            style={[
              styles.adviceCard,
              { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
            ]}
          >
            {adviceList.length === 0 ? (
              <Text style={[styles.noAdviceText, { color: colors.onSurfaceVariant }]}>
                Follow your daily caloric and macronutrient targets consistently to achieve optimal progress.
              </Text>
            ) : (
              <View style={styles.adviceBulletsWrap}>
                {adviceList.map((adviceItem, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <View
                      style={[
                        styles.bulletIconBox,
                        { backgroundColor: 'rgba(53, 208, 127, 0.15)' },
                      ]}
                    >
                      <CheckCircle2 size={15} color="var(--primary, #35D07F)" />
                    </View>
                    <View style={styles.bulletContent}>
                      <Text style={[styles.bulletText, { color: colors.onSurface }]}>
                        {adviceItem}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </AppCard>

          {/* Athlete Profile Snapshot Card */}
          {snapshot && (snapshot.goalProgram || snapshot.weight) && (
            <>
              <View style={[styles.sectionHeaderRow, { marginTop: 10 }]}>
                <Target size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                  Athlete Metrics Snapshot
                </Text>
              </View>

              <AppCard
                variant="outlined"
                style={[
                  styles.snapshotCard,
                  { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
                ]}
              >
                <View style={styles.snapshotGrid}>
                  {snapshot.goalProgram ? (
                    <View style={styles.snapshotItem}>
                      <Text style={[styles.snapshotLabel, { color: colors.onSurfaceVariant }]}>
                        Goal Program
                      </Text>
                      <Text style={[styles.snapshotValue, { color: colors.onSurface }]}>
                        {snapshot.goalProgram}
                      </Text>
                    </View>
                  ) : null}

                  {snapshot.workoutPlan ? (
                    <View style={styles.snapshotItem}>
                      <Text style={[styles.snapshotLabel, { color: colors.onSurfaceVariant }]}>
                        Workout Plan
                      </Text>
                      <Text style={[styles.snapshotValue, { color: colors.onSurface }]}>
                        {snapshot.workoutPlan}
                      </Text>
                    </View>
                  ) : null}

                  {snapshot.weight && snapshot.heightCm ? (
                    <View style={styles.snapshotItem}>
                      <Text style={[styles.snapshotLabel, { color: colors.onSurfaceVariant }]}>
                        Biometrics
                      </Text>
                      <Text style={[styles.snapshotValue, { color: colors.onSurface }]}>
                        {snapshot.heightCm} cm • {snapshot.weight} kg
                      </Text>
                    </View>
                  ) : null}

                  {snapshot.dietType ? (
                    <View style={styles.snapshotItem}>
                      <Text style={[styles.snapshotLabel, { color: colors.onSurfaceVariant }]}>
                        Dietary Preference
                      </Text>
                      <Text style={[styles.snapshotValue, { color: colors.onSurface }]}>
                        {snapshot.dietType === 'VEG' ? 'Vegetarian' : 'Non-Vegetarian'}
                      </Text>
                    </View>
                  ) : null}

                  {snapshot.dailyBudget ? (
                    <View style={styles.snapshotItem}>
                      <Text style={[styles.snapshotLabel, { color: colors.onSurfaceVariant }]}>
                        Daily Food Budget
                      </Text>
                      <Text style={[styles.snapshotValue, { color: colors.onSurface }]}>
                        ₹{snapshot.dailyBudget} / day
                      </Text>
                    </View>
                  ) : null}

                  {snapshot.workoutDays ? (
                    <View style={styles.snapshotItem}>
                      <Text style={[styles.snapshotLabel, { color: colors.onSurfaceVariant }]}>
                        Training Schedule
                      </Text>
                      <Text style={[styles.snapshotValue, { color: colors.onSurface }]}>
                        {snapshot.workoutLocation || 'GYM'} • {snapshot.workoutDays} days/wk
                      </Text>
                    </View>
                  ) : null}
                </View>
              </AppCard>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleWrap: {
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  topBarSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  backHomeBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  backHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  heroCard: {
    padding: 18,
    borderRadius: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'var(--primary, #35D07F)',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 8,
  },
  planSummary: {
    fontSize: 13,
    lineHeight: 19,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: -4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  targetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  targetCard: {
    width: '48.5%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  targetCardFeatured: {
    width: '100%',
    paddingVertical: 16,
  },
  targetCardIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetCardLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  targetCardValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  targetCardUnit: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  targetCardSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  adviceCard: {
    padding: 16,
    borderRadius: 16,
  },
  noAdviceText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  adviceBulletsWrap: {
    gap: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  bulletContent: {
    flex: 1,
  },
  bulletText: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '500',
  },
  snapshotCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  snapshotItem: {
    width: '47%',
    gap: 2,
  },
  snapshotLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  snapshotValue: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
