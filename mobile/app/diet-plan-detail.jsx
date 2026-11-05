import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Droplets,
  Flame,
  Target,
  ShieldCheck,
  Utensils,
  Clock,
  ChefHat,
  Bot,
  Plus,
  RefreshCw,
} from 'lucide-react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { nutritionService } from '../services/nutritionService';
import { queryKeys } from '../constants/queryKeys';
import AppCard from '../components/ui/AppCard';

const MEAL_TYPE_META = {
  BREAKFAST: {
    label: 'Breakfast',
    emoji: '🍳',
    color: '#FF9F43',
    bgColor: 'rgba(255, 159, 67, 0.12)',
  },
  MORNING_SNACK: {
    label: 'Morning Fuel',
    emoji: '🍎',
    color: '#28C76F',
    bgColor: 'rgba(40, 199, 111, 0.12)',
  },
  LUNCH: {
    label: 'Power Lunch',
    emoji: '🍛',
    color: '#00CFE8',
    bgColor: 'rgba(0, 207, 232, 0.12)',
  },
  EVENING_SNACK: {
    label: 'Evening Snack',
    emoji: '☕',
    color: '#EA5455',
    bgColor: 'rgba(234, 84, 85, 0.12)',
  },
  DINNER: {
    label: 'Recovery Dinner',
    emoji: '🥗',
    color: '#7367F0',
    bgColor: 'rgba(115, 103, 240, 0.12)',
  },
  PRE_WORKOUT: {
    label: 'Pre-Workout Fuel',
    emoji: '⚡',
    color: '#FF9F43',
    bgColor: 'rgba(255, 159, 67, 0.12)',
  },
  POST_WORKOUT: {
    label: 'Post-Workout Recovery',
    emoji: '💪',
    color: '#28C76F',
    bgColor: 'rgba(40, 199, 111, 0.12)',
  },
  SNACK: {
    label: 'Snack',
    emoji: '🥪',
    color: '#FF9F43',
    bgColor: 'rgba(255, 159, 67, 0.12)',
  },
};

export default function DietPlanDetailPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  const [upgrading, setUpgrading] = useState(false);
  const [loggingMealType, setLoggingMealType] = useState(null);

  const { data: dietPlan, isLoading } = useQuery({
    queryKey: queryKeys.dietPlan,
    queryFn: async () => {
      return await nutritionService.getCurrentDietPlan();
    },
    staleTime: 60 * 1000,
  });

  const targets = dietPlan?.dailyTargets || {};
  const mealsList = Array.isArray(dietPlan?.meals) ? dietPlan.meals : [];
  const adviceList = Array.isArray(dietPlan?.advice) ? dietPlan.advice : [];
  const snapshot = dietPlan?.inputSnapshot || {};

  const handleUpgradePlan = async () => {
    if (upgrading) return;
    setUpgrading(true);
    try {
      await nutritionService.generateDietPlan('Upgrade to detailed daily meal blueprint');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dietPlan }),
        queryClient.invalidateQueries({ queryKey: queryKeys.nutritionTargets }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: ['nutrition'] }),
      ]);
      Alert.alert(
        'Plan Upgraded! 🚀',
        'Your active AI Diet Plan now includes a detailed 5-meal schedule with portion sizes and recipe videos.'
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to upgrade plan right now. Please try again.';
      Alert.alert('Notice', msg);
    } finally {
      setUpgrading(false);
    }
  };

  const handleChangeWithAi = (meal) => {
    const prompt = `I want to change my ${meal.name || meal.mealType} (currently scheduled at ${meal.recommendedTime || 'mealtime'}). Please suggest an equal-protein alternative, check for recipes, and ask me to confirm before updating my diet plan.`;
    router.push({
      pathname: '/ai-coach',
      params: {
        initialPrompt: prompt,
        source: 'diet_plan_change',
      },
    });
  };

  const handleOpenRecipe = (recipeId, recipeRoute) => {
    let resolvedId = recipeId;
    if (!resolvedId && recipeRoute) {
      resolvedId = recipeRoute.replace('/recipe/', '');
    }
    if (resolvedId) {
      router.push(`/recipe/${resolvedId}`);
    }
  };

  const handleLogMeal = async (meal) => {
    if (loggingMealType) return;
    setLoggingMealType(meal.mealType);
    try {
      const itemsToLog =
        meal.items && meal.items.length > 0
          ? meal.items.map((it) => ({
              name: it.name,
              calories: Number(it.calories || 0),
              protein: Number(it.protein || 0),
              carbs: Number(it.carbs || 0),
              fat: Number(it.fat || 0),
              fiber: Number(it.fiber || 0),
              quantity: 1,
              unit: it.quantity || 'serving',
              source: 'AI_DIET_PLAN',
              estimatedBy: 'AI',
              ...(it.recipeId ? { recipeId: it.recipeId } : {}),
            }))
          : [
              {
                name: meal.name,
                calories: Number(meal.totalCalories || 0),
                protein: Number(meal.totalProtein || 0),
                carbs: Number(meal.totalCarbs || 0),
                fat: Number(meal.totalFat || 0),
                fiber: Number(meal.totalFiber || 0),
                quantity: 1,
                unit: 'meal',
                source: 'AI_DIET_PLAN',
                estimatedBy: 'AI',
                ...(meal.recipeId ? { recipeId: meal.recipeId } : {}),
              },
            ];

      let targetLogType = 'SNACK';
      const mt = String(meal.mealType || '').toUpperCase();
      if (mt === 'BREAKFAST') targetLogType = 'BREAKFAST';
      else if (mt === 'LUNCH') targetLogType = 'LUNCH';
      else if (mt === 'DINNER') targetLogType = 'DINNER';
      else targetLogType = 'SNACK';

      await nutritionService.addNutritionLog({
        mealType: targetLogType,
        name: meal.name,
        items: itemsToLog,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.nutritionLogs() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: ['nutrition'] }),
      ]);

      Alert.alert(
        'Meal Logged! ✅',
        `"${meal.name}" (${meal.totalCalories} kcal • ${meal.totalProtein}g protein) has been added to today's nutrition log.`
      );
    } catch (err) {
      console.error('Error logging meal from diet plan:', err);
      Alert.alert('Notice', 'Unable to log meal right now. Please try again.');
    } finally {
      setLoggingMealType(null);
    }
  };

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

          {/* Daily Meal Schedule Blueprint Section */}
          <View style={[styles.sectionHeaderRow, { marginTop: 12 }]}>
            <Utensils size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Daily Meal Blueprint
            </Text>
            <View style={[styles.mealCountBadge, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.mealCountBadgeText, { color: colors.onPrimaryContainer }]}>
                {mealsList.length > 0 ? `${mealsList.length} Scheduled Meals` : 'Legacy Plan'}
              </Text>
            </View>
          </View>

          {mealsList.length > 0 ? (
            <View style={styles.mealsContainer}>
              {mealsList.map((meal, mIdx) => {
                const meta = MEAL_TYPE_META[meal.mealType] || MEAL_TYPE_META.SNACK;
                const isLoggingThis = loggingMealType === meal.mealType;
                const hasRecipe = Boolean(meal.recipeId || meal.recipeRoute);

                return (
                  <AppCard
                    key={`${meal.mealType}_${mIdx}`}
                    variant="elevated"
                    style={[
                      styles.mealCard,
                      { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
                    ]}
                  >
                    {/* Meal Header */}
                    <View style={styles.mealHeaderRow}>
                      <View style={[styles.mealBadge, { backgroundColor: meta.bgColor }]}>
                        <Text style={styles.mealBadgeEmoji}>{meta.emoji}</Text>
                        <Text style={[styles.mealBadgeText, { color: meta.color }]}>
                          {meta.label.toUpperCase()}
                        </Text>
                      </View>

                      {meal.recommendedTime ? (
                        <View style={[styles.timeBadge, { backgroundColor: colors.surfaceVariant }]}>
                          <Clock size={12} color={colors.onSurfaceVariant} />
                          <Text style={[styles.timeBadgeText, { color: colors.onSurfaceVariant }]}>
                            {meal.recommendedTime}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Meal Name */}
                    <Text style={[styles.mealName, { color: colors.onSurface }]}>
                      {meal.name}
                    </Text>

                    {/* Macro Summary Pill Row */}
                    <View style={styles.macroPillRow}>
                      <View style={[styles.macroPill, { backgroundColor: colors.surfaceVariant }]}>
                        <Text style={[styles.macroPillText, { color: colors.onSurface }]}>
                          🔥 {meal.totalCalories} kcal
                        </Text>
                      </View>
                      <View style={[styles.macroPill, { backgroundColor: colors.surfaceVariant }]}>
                        <Text style={[styles.macroPillText, { color: colors.onSurface }]}>
                          🥩 {meal.totalProtein}g P
                        </Text>
                      </View>
                      <View style={[styles.macroPill, { backgroundColor: colors.surfaceVariant }]}>
                        <Text style={[styles.macroPillText, { color: colors.onSurface }]}>
                          🍚 {meal.totalCarbs}g C
                        </Text>
                      </View>
                      <View style={[styles.macroPill, { backgroundColor: colors.surfaceVariant }]}>
                        <Text style={[styles.macroPillText, { color: colors.onSurface }]}>
                          🥑 {meal.totalFat}g F
                        </Text>
                      </View>
                    </View>

                    {/* Preparation & Timing Guidelines */}
                    {meal.instructions ? (
                      <View style={[styles.instructionsBox, { backgroundColor: colors.surfaceVariant }]}>
                        <Clock size={13} color={colors.primary} style={{ marginTop: 2 }} />
                        <Text style={[styles.instructionsText, { color: colors.onSurfaceVariant }]}>
                          {meal.instructions}
                        </Text>
                      </View>
                    ) : null}

                    {/* Itemized Food List */}
                    {Array.isArray(meal.items) && meal.items.length > 0 && (
                      <View style={styles.foodItemsWrap}>
                        <Text style={[styles.foodItemsTitle, { color: colors.onSurfaceVariant }]}>
                          Prescribed Portions & Food Items
                        </Text>
                        {meal.items.map((item, itIdx) => (
                          <View
                            key={itIdx}
                            style={[
                              styles.foodItemRow,
                              {
                                borderBottomColor:
                                  itIdx === meal.items.length - 1 ? 'transparent' : colors.outlineVariant,
                              },
                            ]}
                          >
                            <View style={styles.foodItemMain}>
                              <Text style={[styles.foodItemName, { color: colors.onSurface }]}>
                                {item.name}
                              </Text>

                              <View style={styles.foodItemSubRow}>
                                <View
                                  style={[
                                    styles.quantityBadge,
                                    { backgroundColor: colors.primaryContainer },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.quantityBadgeText,
                                      { color: colors.onPrimaryContainer },
                                    ]}
                                  >
                                    ⚖️ {item.quantity}
                                  </Text>
                                </View>

                                <Text style={[styles.foodItemMacros, { color: colors.onSurfaceVariant }]}>
                                  {item.calories} kcal • {item.protein}g P • {item.carbs}g C • {item.fat}g F
                                </Text>
                              </View>

                              {item.notes ? (
                                <Text style={[styles.foodItemNotes, { color: colors.onSurfaceVariant }]}>
                                  💡 {item.notes}
                                </Text>
                              ) : null}

                              {/* Recipe direct link for item */}
                              {(item.recipeId || item.recipeRoute) && (
                                <Pressable
                                  style={styles.itemRecipeBtn}
                                  onPress={() => handleOpenRecipe(item.recipeId, item.recipeRoute)}
                                  hitSlop={6}
                                >
                                  <ChefHat size={12} color="var(--primary, #35D07F)" />
                                  <Text style={styles.itemRecipeBtnText}>View In-App Recipe 👨‍🍳</Text>
                                </Pressable>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Meal Actions Row */}
                    <View style={[styles.mealActionRow, { borderTopColor: colors.outlineVariant }]}>
                      {/* Change with AI Coach */}
                      <Pressable
                        style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant }]}
                        onPress={() => handleChangeWithAi(meal)}
                      >
                        <Bot size={14} color={colors.primary} />
                        <Text style={[styles.actionBtnText, { color: colors.onSurface }]}>
                          Change with AI
                        </Text>
                      </Pressable>

                      {/* View Recipe & Video if whole meal is matched */}
                      {hasRecipe && (
                        <Pressable
                          style={[styles.actionBtn, styles.recipeActionBtn]}
                          onPress={() => handleOpenRecipe(meal.recipeId, meal.recipeRoute)}
                        >
                          <ChefHat size={14} color="#FFFFFF" />
                          <Text style={styles.recipeActionBtnText}>
                            View Recipe 👨‍🍳
                          </Text>
                        </Pressable>
                      )}

                      {/* One-Tap Quick Log */}
                      <Pressable
                        style={[
                          styles.actionBtn,
                          { backgroundColor: custom.primaryStrong },
                          isLoggingThis && { opacity: 0.7 },
                        ]}
                        onPress={() => handleLogMeal(meal)}
                        disabled={isLoggingThis}
                      >
                        {isLoggingThis ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Plus size={14} color="#FFFFFF" />
                            <Text style={styles.logActionBtnText}>Log Meal</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </AppCard>
                );
              })}
            </View>
          ) : (
            /* Legacy Plan Upgrade Banner */
            <AppCard
              variant="elevated"
              style={[
                styles.upgradeCard,
                { backgroundColor: colors.surface, borderColor: colors.primary },
              ]}
            >
              <View style={styles.upgradeHeader}>
                <View style={[styles.upgradeIconWrap, { backgroundColor: colors.primaryContainer }]}>
                  <Sparkles size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.upgradeTitle, { color: colors.onSurface }]}>
                    Upgrade to Full Daily Meal Schedule
                  </Text>
                  <Text style={[styles.upgradeSubtitle, { color: colors.onSurfaceVariant }]}>
                    Your plan currently has high-level macro targets. Upgrade now to get exact food items, portion quantities, timings, and video cooking recipes!
                  </Text>
                </View>
              </View>

              <Pressable
                style={[
                  styles.upgradeBtn,
                  { backgroundColor: custom.primaryStrong },
                  upgrading && { opacity: 0.7 },
                ]}
                onPress={handleUpgradePlan}
                disabled={upgrading}
              >
                {upgrading ? (
                  <View style={styles.btnRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.upgradeBtnText}>Generating 5-Meal Protocol...</Text>
                  </View>
                ) : (
                  <View style={styles.btnRow}>
                    <RefreshCw size={15} color="#FFFFFF" />
                    <Text style={styles.upgradeBtnText}>Generate Detailed Meals Now</Text>
                  </View>
                )}
              </Pressable>
            </AppCard>
          )}

          {/* Actionable Nutrition Guidelines (Clean Bullet Points) */}
          <View style={[styles.sectionHeaderRow, { marginTop: 12 }]}>
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
  mealCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  mealCountBadgeText: {
    fontSize: 11,
    fontWeight: '600',
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
  mealsContainer: {
    gap: 14,
  },
  mealCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  mealHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  mealBadgeEmoji: {
    fontSize: 13,
  },
  mealBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  macroPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  macroPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  macroPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  instructionsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  foodItemsWrap: {
    gap: 8,
    marginTop: 4,
  },
  foodItemsTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  foodItemRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  foodItemMain: {
    gap: 4,
  },
  foodItemName: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 18,
  },
  foodItemSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  quantityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  quantityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  foodItemMacros: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  foodItemNotes: {
    fontSize: 11,
    lineHeight: 15,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemRecipeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  itemRecipeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'var(--primary, #35D07F)',
  },
  mealActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recipeActionBtn: {
    backgroundColor: '#FF9F43',
  },
  recipeActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  logActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  upgradeCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  upgradeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  upgradeTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  upgradeSubtitle: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  upgradeBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
