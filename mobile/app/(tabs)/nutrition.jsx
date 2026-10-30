import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Utensils,
  Plus,
  Clock,
  X,
  Search,
  Flame,
  Sun,
  Sunset,
  Moon,
  Apple,
  Calendar,
} from 'lucide-react-native';
import { ProgressBar, Chip } from 'react-native-paper';
import { nutritionService } from '../../services/nutritionService';
import { queryKeys } from '../../constants/queryKeys';
import { TopBar } from '../../components/common/TopBar';
import { useAppTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../utils/i18n';
import { resolveMediaUrl } from '../../utils/media';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import WaterTrackerCard from '../../components/nutrition/WaterTrackerCard';
import AiDietPlanCard from '../../components/nutrition/AiDietPlanCard';
import MealSectionCard from '../../components/nutrition/MealSectionCard';

const MEAL_CATEGORIES = [
  { key: 'BREAKFAST', label: 'Breakfast', icon: Sun },
  { key: 'LUNCH', label: 'Lunch', icon: Sunset },
  { key: 'DINNER', label: 'Dinner', icon: Moon },
  { key: 'SNACK', label: 'Snacks', icon: Apple },
];

const GOAL_OPTIONS = [
  { key: 'ALL', labelKey: 'recipes.goals.all', fallback: 'All Goals' },
  { key: 'HIGH_PROTEIN', labelKey: 'recipes.goals.highProtein', fallback: 'High Protein' },
  { key: 'MUSCLE_GAIN', labelKey: 'recipes.goals.muscleGain', fallback: 'Muscle Gain' },
  { key: 'FAT_LOSS', labelKey: 'recipes.goals.fatLoss', fallback: 'Fat Loss' },
  { key: 'VEGETARIAN', labelKey: 'recipes.goals.vegetarian', fallback: 'Vegetarian' },
  { key: 'QUICK_MEAL', labelKey: 'recipes.goals.quickMeal', fallback: 'Quick Meal' },
  { key: 'DIABETES_FRIENDLY', labelKey: 'recipes.goals.diabetesFriendly', fallback: 'Diabetes Friendly' },
];

const formatGoalLabel = (tag, t) => {
  if (!tag) return '';
  const match = GOAL_OPTIONS.find((g) => g.key === tag);
  if (match) return t(match.labelKey);
  return tag
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export default function NutritionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const language = profile?.language || user?.language || 'en';

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Modals state: Custom Food Entry
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('BREAKFAST');
  const [foodName, setFoodName] = useState('');
  const [caloriesInput, setCaloriesInput] = useState('');
  const [proteinInput, setProteinInput] = useState('');
  const [carbsInput, setCarbsInput] = useState('');
  const [fatInput, setFatInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('1');
  const [unitInput, setUnitInput] = useState('serving');
  const [submittingMeal, setSubmittingMeal] = useState(false);

  // Modals state: Quick Recipe Log
  const [quickRecipe, setQuickRecipe] = useState(null);
  const [recipeModalMeal, setRecipeModalMeal] = useState('LUNCH');
  const [submittingRecipeLog, setSubmittingRecipeLog] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);

  // Recipe filters
  const [selectedGoalTag, setSelectedGoalTag] = useState('ALL');
  const [recipeSearch, setRecipeSearch] = useState('');

  // 1. Targets Query (Personalized TDEE & macro goals)
  const targetsQuery = useQuery({
    queryKey: queryKeys.nutritionTargets,
    queryFn: async () => {
      const res = await nutritionService.getTargets();
      return res || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, waterMl: 0, hasActivePlan: false };
    },
    staleTime: 60 * 1000,
  });

  // 2. Daily Log Query for Selected Date
  const logsQuery = useQuery({
    queryKey: queryKeys.nutritionLogs(selectedDate),
    queryFn: async () => {
      const res = await nutritionService.getNutritionLogs(selectedDate);
      const l = res?.data || res;
      return Array.isArray(l) ? l[0] : l || null;
    },
    staleTime: 60 * 1000,
  });

  // 3. AI Diet Plan Query
  const dietPlanQuery = useQuery({
    queryKey: queryKeys.dietPlan,
    queryFn: async () => {
      try {
        return await nutritionService.getCurrentDietPlan();
      } catch (_) {
        return null;
      }
    },
    staleTime: 60 * 1000,
  });

  // 4. Recipes Catalog Query
  const recipesQuery = useQuery({
    queryKey: ['nutrition', 'recipes', language, selectedGoalTag],
    queryFn: async () => {
      const params = { limit: 50, language };
      if (selectedGoalTag !== 'ALL') {
        params.goal = selectedGoalTag;
      }
      const res = await nutritionService.getRecipes(params);
      return Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
        ? res
        : [];
    },
    staleTime: 60 * 1000,
  });

  const targets = targetsQuery.data || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, waterMl: 0, hasActivePlan: false };
  const dailyLog = logsQuery.data || null;
  const dietPlan = dietPlanQuery.data || null;
  const recipes = useMemo(() => recipesQuery.data || [], [recipesQuery.data]);

  const hasActivePlan = Boolean(dietPlan && targets.calories > 0);

  const loading = targetsQuery.isLoading && !targetsQuery.data && logsQuery.isLoading && !logsQuery.data;
  const refreshing = targetsQuery.isRefetching || logsQuery.isRefetching || recipesQuery.isRefetching;

  const onRefresh = useCallback(async () => {
    await Promise.all([
      targetsQuery.refetch(),
      logsQuery.refetch(),
      dietPlanQuery.refetch(),
      recipesQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: queryKeys.nutritionWater }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ]);
  }, [targetsQuery, logsQuery, dietPlanQuery, recipesQuery, queryClient]);

  // Robust extraction of meal items from Mongoose array: [{ mealType: 'BREAKFAST', items: [...] }]
  const getMealItems = useCallback(
    (mealKey) => {
      if (!dailyLog?.meals) return [];
      if (Array.isArray(dailyLog.meals)) {
        const found = dailyLog.meals.find(
          (m) => String(m.mealType).toUpperCase() === String(mealKey).toUpperCase()
        );
        return found?.items || [];
      }
      return dailyLog.meals[mealKey] || [];
    },
    [dailyLog]
  );

  // Compute daily macros
  const currentCalories = dailyLog?.totals?.calories || dailyLog?.dailyTotals?.calories || 0;
  const currentProtein = dailyLog?.totals?.protein || dailyLog?.dailyTotals?.protein || 0;
  const currentCarbs = dailyLog?.totals?.carbs || dailyLog?.dailyTotals?.carbs || 0;
  const currentFat = dailyLog?.totals?.fat || dailyLog?.dailyTotals?.fat || 0;
  const currentFiber = dailyLog?.totals?.fiber || dailyLog?.dailyTotals?.fiber || 0;

  const targetCal = hasActivePlan ? Number(targets.calories || 0) : 0;
  const targetProt = hasActivePlan ? Number(targets.protein || targets.proteinG || 0) : 0;
  const targetCarb = hasActivePlan ? Number(targets.carbs || targets.carbsG || 0) : 0;
  const targetF = hasActivePlan ? Number(targets.fat || targets.fatsG || 0) : 0;
  const targetWat = hasActivePlan ? Number(targets.waterMl || 0) : 0;

  const calProgress = targetCal > 0 ? Math.min(Math.max(currentCalories / targetCal, 0), 1) : 0;
  const protProgress = targetProt > 0 ? Math.min(Math.max(currentProtein / targetProt, 0), 1) : 0;
  const carbProgress = targetCarb > 0 ? Math.min(Math.max(currentCarbs / targetCarb, 0), 1) : 0;
  const fatProgress = targetF > 0 ? Math.min(Math.max(currentFat / targetF, 0), 1) : 0;

  const profileSummary = useMemo(() => {
    return {
      goal: typeof profile?.selectedGoal === 'object' && profile.selectedGoal !== null
        ? profile.selectedGoal.name || profile.selectedGoal.title
        : user?.programName || null,
      workoutPlan: typeof profile?.selectedWorkoutPlan === 'object' && profile.selectedWorkoutPlan !== null
        ? profile.selectedWorkoutPlan.name || profile.selectedWorkoutPlan.title
        : user?.workoutPlanName || null,
      age: profile?.age || user?.age,
      gender: profile?.gender || user?.gender,
      dietType: profile?.dietType || user?.dietType || 'VEG',
      height: profile?.heightCm || user?.height,
      weight: profile?.weight || profile?.weightKg || user?.weight,
      experienceLevel: profile?.experienceLevel || 'Intermediate',
      workoutLocation: profile?.preferredWorkoutLocation || 'GYM',
      workoutDays: profile?.preferredWorkoutDays || 5,
      workoutTime: profile?.preferredWorkoutTime || 'Morning',
      budget: profile?.dailyDietBudget || 250,
    };
  }, [profile, user]);

  const promptGeneratePlan = () => {
    Alert.alert(
      'AI Diet Plan Required',
      'Your daily targets are currently 0. Please tap "Generate My AI Diet Plan" to calculate and set your personalized calorie, macro, and water targets based on your profile.'
    );
  };

  const openLogModalFor = (mealType) => {
    if (!hasActivePlan) {
      promptGeneratePlan();
      return;
    }
    setSelectedMealType(mealType);
    setFoodName('');
    setCaloriesInput('');
    setProteinInput('');
    setCarbsInput('');
    setFatInput('');
    setQuantityInput('1');
    setUnitInput('serving');
    setLogModalVisible(true);
  };

  const handleSubmitCustomMeal = async () => {
    if (!foodName.trim() || !caloriesInput.trim()) {
      Alert.alert('Required Fields', 'Please enter at least the food name and calories.');
      return;
    }

    setSubmittingMeal(true);
    try {
      await nutritionService.addNutritionLog({
        date: selectedDate,
        mealType: selectedMealType,
        items: [
          {
            name: foodName.trim(),
            quantity: Number(quantityInput) || 1,
            unit: unitInput.trim() || 'serving',
            calories: Math.max(0, Number(caloriesInput) || 0),
            protein: Math.max(0, Number(proteinInput) || 0),
            carbs: Math.max(0, Number(carbsInput) || 0),
            fat: Math.max(0, Number(fatInput) || 0),
            source: 'CUSTOM',
            estimatedBy: 'USER',
          },
        ],
      });

      setLogModalVisible(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.nutritionLogs(selectedDate) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to log food.');
    } finally {
      setSubmittingMeal(false);
    }
  };

  // Quick Log Recipe Action
  const handleQuickLogRecipe = async () => {
    if (!hasActivePlan) {
      promptGeneratePlan();
      return;
    }
    if (!quickRecipe) return;

    setSubmittingRecipeLog(true);
    try {
      const cal = quickRecipe.nutritionPerServing?.calories ?? quickRecipe.calories ?? 0;
      const p = quickRecipe.nutritionPerServing?.protein ?? quickRecipe.protein ?? 0;
      const c = quickRecipe.nutritionPerServing?.carbs ?? quickRecipe.carbs ?? 0;
      const f = quickRecipe.nutritionPerServing?.fat ?? quickRecipe.fat ?? 0;
      const fib = quickRecipe.nutritionPerServing?.fiber ?? quickRecipe.fiber ?? 0;

      await nutritionService.addNutritionLog({
        date: selectedDate,
        mealType: recipeModalMeal,
        items: [
          {
            name: quickRecipe.title || 'Recipe meal',
            quantity: 1,
            unit: 'serving',
            calories: cal,
            protein: p,
            carbs: c,
            fat: f,
            fiber: fib,
            source: 'RECIPE',
            recipeId: quickRecipe._id || quickRecipe.id,
            estimatedBy: 'RECIPE',
          },
        ],
      });

      setQuickRecipe(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.nutritionLogs(selectedDate) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
      Alert.alert('Logged!', `Added "${quickRecipe.title}" to ${recipeModalMeal.toLowerCase()}.`);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to log recipe.');
    } finally {
      setSubmittingRecipeLog(false);
    }
  };

  const handleDeleteItem = async (logId, itemId) => {
    if (!logId || !itemId) return;
    setDeletingItemId(itemId);
    try {
      await nutritionService.deleteNutritionLogItem(logId, itemId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.nutritionLogs(selectedDate) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to delete item.');
    } finally {
      setDeletingItemId(null);
    }
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const titleMatches = (r.title || '').toLowerCase().includes(recipeSearch.toLowerCase().trim());
      const goalMatches =
        selectedGoalTag === 'ALL' ||
        (Array.isArray(r.goalTags) && r.goalTags.includes(selectedGoalTag));
      return titleMatches && goalMatches;
    });
  }, [recipes, recipeSearch, selectedGoalTag]);

  const logId = dailyLog?._id || dailyLog?.id;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TopBar title="Diet & Nutrition" subtitle="Macros, meals & recipes" />

      {/* Date Switcher Strip */}
      <View style={[styles.dateStrip, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <View style={styles.dateRow}>
          <Pressable
            style={[
              styles.datePill,
              selectedDate === yesterdayStr
                ? { backgroundColor: colors.primaryContainer, borderColor: colors.primary }
                : { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
            ]}
            onPress={() => setSelectedDate(yesterdayStr)}
          >
            <Text
              style={[
                styles.datePillText,
                { color: selectedDate === yesterdayStr ? colors.onPrimaryContainer : colors.onSurfaceVariant },
              ]}
            >
              Yesterday
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.datePill,
              selectedDate === todayStr
                ? { backgroundColor: colors.primaryContainer, borderColor: colors.primary }
                : { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
            ]}
            onPress={() => setSelectedDate(todayStr)}
          >
            <Text
              style={[
                styles.datePillText,
                { color: selectedDate === todayStr ? colors.onPrimaryContainer : colors.onSurfaceVariant },
              ]}
            >
              Today
            </Text>
          </Pressable>
        </View>

        <View style={styles.dateLabelRow}>
          <Calendar size={13} color={colors.onSurfaceVariant} />
          <Text style={[styles.currentDateLabel, { color: colors.onSurfaceVariant }]}>
            {selectedDate === todayStr ? 'Today' : selectedDate}
          </Text>
        </View>
      </View>

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
        {/* Loading Skeleton */}
        {loading && !dailyLog && recipes.length === 0 ? (
          <View style={styles.skeletonWrap}>
            <Skeleton height={180} radius={custom.radius.lg} style={styles.mbLg} />
            <Skeleton height={100} radius={custom.radius.lg} style={styles.mbLg} />
            <Skeleton height={120} radius={custom.radius.lg} />
          </View>
        ) : (
          <>
            {/* 1. Daily Calorie & Macronutrient Summary Card */}
            <AppCard variant="elevated" style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                <View>
                  <Text style={[styles.summaryTitle, { color: colors.onSurface }]}>
                    Daily Macro Intake
                  </Text>
                  <Text style={[styles.summaryDate, { color: colors.onSurfaceVariant }]}>
                    {hasActivePlan
                      ? (selectedDate === todayStr ? "Today's Targets" : `Log for ${selectedDate}`)
                      : 'Targets unlock with AI Plan'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.calTargetPill,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
                  ]}
                >
                  <Flame size={14} color={hasActivePlan ? colors.secondary : colors.onSurfaceVariant} />
                  <Text style={[styles.calTargetPillText, { color: colors.onSurface }]}>
                    Target: {targetCal} kcal
                  </Text>
                </View>
              </View>

              {/* Calorie Gauge */}
              <View style={styles.calSection}>
                <ProgressBar
                  progress={calProgress}
                  color={colors.primary}
                  style={styles.calProgressBar}
                />
                <View style={styles.calRow}>
                  <Text style={[styles.calEaten, { color: colors.onSurface }]}>
                    {currentCalories} <Text style={styles.calUnit}>kcal eaten</Text>
                  </Text>
                  <Text style={[styles.calRemaining, { color: colors.onSurfaceVariant }]}>
                    {hasActivePlan
                      ? (targetCal >= currentCalories
                        ? `${targetCal - currentCalories} kcal left`
                        : `${currentCalories - targetCal} kcal over`)
                      : '0 kcal target'}
                  </Text>
                </View>
              </View>

              {/* Macro Breakdown Columns */}
              <View style={styles.macroColumnsRow}>
                <View style={styles.macroCol}>
                  <Text style={[styles.macroLabel, { color: colors.onSurfaceVariant }]}>Protein</Text>
                  <Text style={[styles.macroVal, { color: colors.onSurface }]}>
                    {currentProtein} / {targetProt}g
                  </Text>
                  <ProgressBar progress={protProgress} color={colors.primary} style={styles.macroBar} />
                </View>

                <View style={styles.macroCol}>
                  <Text style={[styles.macroLabel, { color: colors.onSurfaceVariant }]}>Carbs</Text>
                  <Text style={[styles.macroVal, { color: colors.onSurface }]}>
                    {currentCarbs} / {targetCarb}g
                  </Text>
                  <ProgressBar progress={carbProgress} color={colors.secondary} style={styles.macroBar} />
                </View>

                <View style={styles.macroCol}>
                  <Text style={[styles.macroLabel, { color: colors.onSurfaceVariant }]}>Fat</Text>
                  <Text style={[styles.macroVal, { color: colors.onSurface }]}>
                    {currentFat} / {targetF}g
                  </Text>
                  <ProgressBar progress={fatProgress} color={colors.outline} style={styles.macroBar} />
                </View>

                {hasActivePlan && currentFiber > 0 && (
                  <View style={styles.macroCol}>
                    <Text style={[styles.macroLabel, { color: colors.onSurfaceVariant }]}>Fiber</Text>
                    <Text style={[styles.macroVal, { color: colors.onSurface }]}>
                      {currentFiber} / 30g
                    </Text>
                    <ProgressBar
                      progress={Math.min(currentFiber / 30, 1)}
                      color={custom.primaryStrong}
                      style={styles.macroBar}
                    />
                  </View>
                )}
              </View>
            </AppCard>

            {/* 2. AI Diet Plan Card */}
            <AiDietPlanCard
              dietPlan={dietPlan}
              isLoading={dietPlanQuery.isLoading}
              profileSummary={profileSummary}
              onPlanGenerated={() => {
                targetsQuery.refetch();
                dietPlanQuery.refetch();
              }}
            />

            {/* 3. Hydration Tracking Card */}
            <WaterTrackerCard
              targetWater={targetWat}
              isLocked={!hasActivePlan}
              onPromptPlan={promptGeneratePlan}
            />

            {/* 4. Meals Breakdown Section */}
            <SectionHeader
              title="Daily Meals"
              actionLabel="Add Food"
              onAction={() => openLogModalFor('BREAKFAST')}
            />

            {MEAL_CATEGORIES.map((cat) => {
              const items = getMealItems(cat.key);
              return (
                <MealSectionCard
                  key={cat.key}
                  mealType={cat.key}
                  label={cat.label}
                  icon={cat.icon}
                  items={items}
                  logId={logId}
                  onAddFood={openLogModalFor}
                  onDeleteItem={handleDeleteItem}
                  deletingItemId={deletingItemId}
                />
              );
            })}

            {/* 5. Healthy Recipes Section */}
            <SectionHeader
              title={`${t('recipes.catalogTitle')} (${recipes.length})`}
              style={{ marginTop: 20 }}
            />

            {/* Recipe search */}
            <View
              style={[
                styles.searchBox,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
              ]}
            >
              <Search size={16} color={colors.onSurfaceVariant} />
              <TextInput
                style={[styles.searchInput, { color: colors.onSurface }]}
                placeholder={t('searchRecipes') || 'Search healthy recipes...'}
                placeholderTextColor={colors.onSurfaceVariant}
                value={recipeSearch}
                onChangeText={setRecipeSearch}
              />
              {recipeSearch ? (
                <Pressable onPress={() => setRecipeSearch('')} hitSlop={8}>
                  <X size={16} color={colors.onSurfaceVariant} />
                </Pressable>
              ) : null}
            </View>

            {/* Goal filter chips */}
            <View style={styles.goalChipsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.goalChipsScroll}
              >
                {GOAL_OPTIONS.map((goal) => {
                  const isSelected = selectedGoalTag === goal.key;
                  return (
                    <Pressable
                      key={goal.key}
                      style={[
                        styles.goalChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                          borderColor: isSelected ? colors.primary : colors.outlineVariant,
                        },
                      ]}
                      onPress={() => setSelectedGoalTag(goal.key)}
                    >
                      <Text
                        style={[
                          styles.goalChipText,
                          {
                            color: isSelected ? colors.onPrimary : colors.onSurfaceVariant,
                          },
                        ]}
                      >
                        {t(goal.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Recipes Feed with 1-Tap Quick Log */}
            {filteredRecipes.length > 0 ? (
              filteredRecipes.map((recipe, rIdx) => {
                const recipeId = recipe._id?._id || recipe._id || recipe.id;
                const imgUrl = recipe.imageUrl || resolveMediaUrl(recipe.imageKey);
                const cal = recipe.nutritionPerServing?.calories ?? recipe.calories ?? 0;
                const p = recipe.nutritionPerServing?.protein ?? recipe.protein ?? 0;
                const c = recipe.nutritionPerServing?.carbs ?? recipe.carbs ?? 0;
                const f = recipe.nutritionPerServing?.fat ?? recipe.fat ?? 0;
                const servings = recipe.servings || 1;
                const prepTime = recipe.preparationTimeMinutes;
                const firstGoal = Array.isArray(recipe.goalTags) && recipe.goalTags.length > 0 ? recipe.goalTags[0] : null;

                return (
                  <AppCard
                    key={`recipe-${String(recipeId || 'item')}-${rIdx}`}
                    variant="outlined"
                    style={styles.recipeCard}
                    onPress={() => router.push(`/recipe/${recipeId}`)}
                  >
                    <View style={styles.recipeCardContent}>
                      {imgUrl ? (
                        <Image
                          source={{ uri: imgUrl }}
                          style={styles.recipeThumb}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.recipeThumbPlaceholder,
                            { backgroundColor: colors.surfaceVariant },
                          ]}
                        >
                          <Utensils size={24} color={colors.onSurfaceVariant} />
                        </View>
                      )}

                      <View style={styles.recipeInfoCol}>
                        <Text style={[styles.recipeTitle, { color: colors.onSurface }]} numberOfLines={1}>
                          {recipe.title || 'Untitled Recipe'}
                        </Text>
                        <Text style={[styles.recipeMacroText, { color: colors.onSurfaceVariant }]}>
                          {cal} kcal • P: {p}g • C: {c}g • F: {f}g
                        </Text>

                        <View style={styles.recipeMetaRow}>
                          <Text style={[styles.recipeMetaText, { color: colors.onSurfaceVariant }]}>
                            {servings} {servings === 1 ? 'serving' : 'servings'}
                          </Text>
                          {prepTime ? (
                            <>
                              <Text style={[styles.recipeMetaDot, { color: colors.onSurfaceVariant }]}>•</Text>
                              <Clock size={11} color={colors.onSurfaceVariant} />
                              <Text style={[styles.recipeMetaText, { color: colors.onSurfaceVariant }]}>
                                {prepTime}m
                              </Text>
                            </>
                          ) : null}
                          {firstGoal ? (
                            <View
                              style={[
                                styles.recipeGoalTag,
                                { backgroundColor: colors.secondaryContainer },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.recipeGoalTagText,
                                  { color: colors.onSecondaryContainer },
                                ]}
                              >
                                {formatGoalLabel(firstGoal, t)}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      {/* Quick Log Action */}
                      <Pressable
                        style={[styles.quickLogBtn, { backgroundColor: colors.primaryContainer }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          setQuickRecipe(recipe);
                        }}
                        hitSlop={6}
                      >
                        <Plus size={14} color={colors.onPrimaryContainer} />
                        <Text style={[styles.quickLogText, { color: colors.onPrimaryContainer }]}>
                          Log
                        </Text>
                      </Pressable>
                    </View>
                  </AppCard>
                );
              })
            ) : (
              <EmptyState
                icon="silverware-fork-knife"
                title={t('recipes.noRecipesFound')}
                description={recipeSearch ? t('recipes.noRecipesMatched') : t('recipes.noRecipesLoaded')}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* 6. Quick Recipe Log Modal */}
      {quickRecipe && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setQuickRecipe(null)}>
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                  Log Recipe to Meal
                </Text>
                <Pressable onPress={() => setQuickRecipe(null)} hitSlop={8}>
                  <X size={20} color={colors.onSurfaceVariant} />
                </Pressable>
              </View>

              <Text style={[styles.quickRecipeSub, { color: colors.onSurfaceVariant }]}>
                Adding <Text style={{ fontWeight: '700', color: colors.onSurface }}>{quickRecipe.title}</Text> ({quickRecipe.nutritionPerServing?.calories ?? quickRecipe.calories ?? 0} kcal, 1 serving) to:
              </Text>

              <View style={styles.chipRow}>
                {MEAL_CATEGORIES.map((cat) => (
                  <Chip
                    key={cat.key}
                    selected={recipeModalMeal === cat.key}
                    onPress={() => setRecipeModalMeal(cat.key)}
                    style={[
                      styles.categoryChip,
                      recipeModalMeal === cat.key
                        ? { backgroundColor: colors.primaryContainer }
                        : { backgroundColor: colors.surfaceVariant },
                    ]}
                    textStyle={{
                      color: recipeModalMeal === cat.key ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {cat.label}
                  </Chip>
                ))}
              </View>

              <View style={styles.modalActionWrap}>
                <AppButton
                  tone="primary"
                  label={`Log to ${recipeModalMeal.toLowerCase()}`}
                  loading={submittingRecipeLog}
                  onPress={handleQuickLogRecipe}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 7. Custom Meal Log Modal */}
      <Modal visible={logModalVisible} transparent animationType="slide" onRequestClose={() => setLogModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                Log Food Item
              </Text>
              <Pressable onPress={() => setLogModalVisible(false)} hitSlop={8}>
                <X size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            {/* Meal Type Selector Chips */}
            <View style={styles.chipRow}>
              {MEAL_CATEGORIES.map((cat) => (
                <Chip
                  key={cat.key}
                  selected={selectedMealType === cat.key}
                  onPress={() => setSelectedMealType(cat.key)}
                  style={[
                    styles.categoryChip,
                    selectedMealType === cat.key
                      ? { backgroundColor: colors.primaryContainer }
                      : { backgroundColor: colors.surfaceVariant },
                  ]}
                  textStyle={{
                    color: selectedMealType === cat.key ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {cat.label}
                </Chip>
              ))}
            </View>

            {/* Inputs */}
            <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Food Name *</Text>
            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant, color: colors.onSurface },
              ]}
              placeholder="e.g., Oatmeal with Berries, Chicken Salad"
              placeholderTextColor={colors.onSurfaceVariant}
              value={foodName}
              onChangeText={setFoodName}
            />

            <View style={styles.twoColInputRow}>
              <View style={styles.flex}>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Calories (kcal) *</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant, color: colors.onSurface },
                  ]}
                  placeholder="e.g., 350"
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="numeric"
                  value={caloriesInput}
                  onChangeText={setCaloriesInput}
                />
              </View>

              <View style={styles.flex}>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Protein (g)</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant, color: colors.onSurface },
                  ]}
                  placeholder="e.g., 28"
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="numeric"
                  value={proteinInput}
                  onChangeText={setProteinInput}
                />
              </View>
            </View>

            <View style={styles.twoColInputRow}>
              <View style={styles.flex}>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Carbs (g)</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant, color: colors.onSurface },
                  ]}
                  placeholder="e.g., 40"
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="numeric"
                  value={carbsInput}
                  onChangeText={setCarbsInput}
                />
              </View>

              <View style={styles.flex}>
                <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Fat (g)</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant, color: colors.onSurface },
                  ]}
                  placeholder="e.g., 10"
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="numeric"
                  value={fatInput}
                  onChangeText={setFatInput}
                />
              </View>
            </View>

            <View style={styles.modalActionWrap}>
              <AppButton
                tone="primary"
                label="Save Food to Daily Log"
                loading={submittingMeal}
                onPress={handleSubmitCustomMeal}
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
  dateStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currentDateLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  skeletonWrap: {
    paddingVertical: 12,
  },
  mbLg: {
    marginBottom: 16,
  },
  summaryCard: {
    padding: 16,
    marginBottom: 16,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryDate: {
    fontSize: 12,
    marginTop: 2,
  },
  calTargetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  calTargetPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  calSection: {
    marginBottom: 16,
  },
  calProgressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  calRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calEaten: {
    fontSize: 14,
    fontWeight: '700',
  },
  calUnit: {
    fontSize: 12,
    fontWeight: '400',
  },
  calRemaining: {
    fontSize: 12,
  },
  macroColumnsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroCol: {
    flex: 1,
    gap: 4,
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  macroVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  macroBar: {
    height: 4,
    borderRadius: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  goalChipsContainer: {
    marginBottom: 14,
  },
  goalChipsScroll: {
    gap: 8,
  },
  goalChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  goalChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recipeCard: {
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  recipeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 12,
  },
  recipeThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  recipeThumbPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeInfoCol: {
    flex: 1,
    gap: 3,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  recipeMacroText: {
    fontSize: 11,
    fontWeight: '500',
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeMetaText: {
    fontSize: 11,
  },
  recipeMetaDot: {
    fontSize: 11,
  },
  recipeGoalTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 2,
  },
  recipeGoalTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  quickLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  quickLogText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickRecipeSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    padding: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  categoryChip: {
    height: 32,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 12,
  },
  twoColInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalActionWrap: {
    marginTop: 8,
    marginBottom: 8,
  },
});
