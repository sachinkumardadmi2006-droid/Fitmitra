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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Utensils,
  Plus,
  Trash2,
  Clock,
  Check,
  X,
  Search,
  Droplets,
  Flame,
  Info,
  ChevronRight,
  BookOpen,
} from 'lucide-react-native';
import { ProgressBar, Chip } from 'react-native-paper';
import { nutritionService } from '../../services/nutritionService';
import { queryKeys } from '../../constants/queryKeys';
import { TopBar } from '../../components/common/TopBar';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';

const MEAL_CATEGORIES = [
  { key: 'BREAKFAST', label: 'Breakfast' },
  { key: 'LUNCH', label: 'Lunch' },
  { key: 'DINNER', label: 'Dinner' },
  { key: 'SNACK', label: 'Snacks' },
];

export default function NutritionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Modals state
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

  // Recipe detail modal
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [recipeMealType, setRecipeMealType] = useState('LUNCH');
  const [recipeSearch, setRecipeSearch] = useState('');

  // 1. Targets Query
  const targetsQuery = useQuery({
    queryKey: queryKeys.nutritionTargets,
    queryFn: async () => {
      const res = await nutritionService.getTargets();
      const t = res?.data || res;
      return t?.calories ? t : { calories: 2200, protein: 140, carbs: 240, fat: 65, waterMl: 3000 };
    },
    staleTime: 60 * 1000,
  });

  // 2. Daily Log Query
  const logsQuery = useQuery({
    queryKey: queryKeys.nutritionLogs(todayDate),
    queryFn: async () => {
      const res = await nutritionService.getNutritionLogs(todayDate);
      const l = res?.data || res;
      return Array.isArray(l) ? l[0] : l || null;
    },
    staleTime: 60 * 1000,
  });

  // 3. Hydration Query
  const waterQuery = useQuery({
    queryKey: queryKeys.nutritionWater,
    queryFn: async () => {
      const res = await nutritionService.getWater();
      return typeof res === 'object' ? (res?.totalMl ?? 0) : Number(res || 0);
    },
    staleTime: 60 * 1000,
  });

  // 4. Recipes Query
  const recipesQuery = useQuery({
    queryKey: queryKeys.recipes(20),
    queryFn: async () => {
      const res = await nutritionService.getRecipes({ limit: 20 });
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

  const targets = targetsQuery.data || { calories: 2200, protein: 140, carbs: 240, fat: 65, waterMl: 3000 };
  const dailyLog = logsQuery.data || null;
  const waterMl = waterQuery.data ?? 0;
  const recipes = recipesQuery.data || [];

  const loading =
    (targetsQuery.isLoading && !targetsQuery.data) &&
    (logsQuery.isLoading && !logsQuery.data);

  const refreshing =
    targetsQuery.isRefetching ||
    logsQuery.isRefetching ||
    waterQuery.isRefetching ||
    recipesQuery.isRefetching;

  const onRefresh = useCallback(async () => {
    await Promise.all([
      targetsQuery.refetch(),
      logsQuery.refetch(),
      waterQuery.refetch(),
      recipesQuery.refetch(),
    ]);
  }, [targetsQuery, logsQuery, waterQuery, recipesQuery]);

  const handleAddWater = async (amount = 250) => {
    try {
      await nutritionService.logWater(amount);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.nutritionWater }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    } catch (e) {
      console.warn('[Nutrition] Water log error:', e.message);
    }
  };

  const openLogModalFor = (mealType) => {
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
      Alert.alert('Required Fields', 'Please enter at least the food name and estimated calories.');
      return;
    }

    setSubmittingMeal(true);
    try {
      await nutritionService.addNutritionLog({
        date: todayDate,
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
          },
        ],
      });

      setLogModalVisible(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.nutritionLogs(todayDate) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save meal item to server.');
    } finally {
      setSubmittingMeal(false);
    }
  };

  const handleDeleteItem = async (logId, itemId) => {
    if (!logId || !itemId) return;
    try {
      await nutritionService.deleteNutritionLogItem(logId, itemId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.nutritionLogs(todayDate) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to delete item.');
    }
  };

  const handleOpenRecipeDetail = (recipe) => {
    setActiveRecipe(recipe);
    setRecipeModalVisible(true);
  };

  const handleLogRecipeAsMeal = async () => {
    if (!activeRecipe) return;

    setSubmittingMeal(true);
    try {
      await nutritionService.addNutritionLog({
        date: todayDate,
        mealType: recipeMealType,
        items: [
          {
            recipeId: activeRecipe._id || activeRecipe.id,
            name: activeRecipe.name,
            quantity: 1,
            unit: 'serving',
            calories: Number(activeRecipe.calories) || 0,
            protein: Number(activeRecipe.protein) || 0,
            carbs: Number(activeRecipe.carbs) || 0,
            fat: Number(activeRecipe.fat || activeRecipe.fats) || 0,
          },
        ],
      });

      setRecipeModalVisible(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.nutritionLogs(todayDate) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
      Alert.alert('Recipe Logged!', `${activeRecipe.name} added to your ${recipeMealType.toLowerCase()} log.`);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to log recipe.');
    } finally {
      setSubmittingMeal(false);
    }
  };

  // Compute live daily totals from server log
  const totals = dailyLog?.dailyTotals || dailyLog?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const currentCalories = Math.round(totals.calories || 0);
  const currentProtein = Math.round(totals.protein || 0);
  const currentCarbs = Math.round(totals.carbs || 0);
  const currentFat = Math.round(totals.fat || totals.fats || 0);

  const targetCal = Math.max(1200, targets.calories || 2200);
  const targetProt = Math.max(30, targets.protein || 140);
  const targetCarb = Math.max(50, targets.carbs || 240);
  const targetF = Math.max(20, targets.fat || 65);
  const targetWat = Math.max(1000, targets.waterMl || 3000);

  const calProgress = Math.min(Math.max(currentCalories / targetCal, 0), 1);
  const protProgress = Math.min(Math.max(currentProtein / targetProt, 0), 1);
  const carbProgress = Math.min(Math.max(currentCarbs / targetCarb, 0), 1);
  const fatProgress = Math.min(Math.max(currentFat / targetF, 0), 1);
  const waterProgress = Math.min(Math.max(waterMl / targetWat, 0), 1);

  // Group meals
  const logId = dailyLog?._id || dailyLog?.id;
  const rawMeals = dailyLog?.meals || {};
  const mealsMap = {
    BREAKFAST: rawMeals.BREAKFAST || rawMeals.breakfast || [],
    LUNCH: rawMeals.LUNCH || rawMeals.lunch || [],
    DINNER: rawMeals.DINNER || rawMeals.dinner || [],
    SNACK: rawMeals.SNACK || rawMeals.snack || rawMeals.SNACKS || [],
  };

  const totalItemsCount = Object.values(mealsMap).reduce((sum, items) => sum + (items?.length || 0), 0);

  const filteredRecipes = recipes.filter((r) =>
    recipeSearch.trim()
      ? r.name?.toLowerCase().includes(recipeSearch.toLowerCase())
      : true
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TopBar title="Diet & Nutrition" subtitle="Macros, meals & recipes" />

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
                    Today's Goals & Targets
                  </Text>
                </View>
                <View
                  style={[
                    styles.calTargetPill,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
                  ]}
                >
                  <Flame size={14} color={colors.secondary} />
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
                    {Math.max(0, targetCal - currentCalories)} kcal remaining
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
                  <Text style={[styles.macroLabel, { color: colors.onSurfaceVariant }]}>Fats</Text>
                  <Text style={[styles.macroVal, { color: colors.onSurface }]}>
                    {currentFat} / {targetF}g
                  </Text>
                  <ProgressBar progress={fatProgress} color={colors.outline} style={styles.macroBar} />
                </View>
              </View>
            </AppCard>

            {/* 2. Hydration Tracking Card */}
            <AppCard variant="outlined" style={styles.hydrationCard}>
              <View style={styles.hydrationHeader}>
                <View style={styles.rowAlign}>
                  <Droplets size={18} color={colors.primary} />
                  <Text style={[styles.hydrationTitle, { color: colors.onSurface }]}>
                    Hydration Tracker
                  </Text>
                </View>
                <Text style={[styles.waterVal, { color: colors.onSurface }]}>
                  {waterMl} <Text style={styles.waterTargetSub}>/ {targetWat} ml</Text>
                </Text>
              </View>

              <ProgressBar
                progress={waterProgress}
                color={colors.primary}
                style={styles.waterProgressBar}
              />

              <View style={styles.waterActionRow}>
                <Text style={[styles.waterPct, { color: colors.onSurfaceVariant }]}>
                  {Math.round(waterProgress * 100)}% of daily recommendation
                </Text>

                <Pressable
                  style={[
                    styles.addWaterBtn,
                    {
                      backgroundColor: colors.primaryContainer,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => handleAddWater(250)}
                >
                  <Plus size={14} color={colors.onPrimaryContainer} />
                  <Text style={[styles.addWaterBtnText, { color: colors.onPrimaryContainer }]}>
                    +250 ml
                  </Text>
                </Pressable>
              </View>
            </AppCard>

            {/* 3. Meals Logged Section */}
            <SectionHeader
              title={`Today's Meals (${totalItemsCount} items)`}
              actionLabel="Add Food"
              onAction={() => openLogModalFor('BREAKFAST')}
            />

            {MEAL_CATEGORIES.map((cat) => {
              const items = mealsMap[cat.key] || [];
              const categoryCalories = items.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);

              return (
                <AppCard key={cat.key} variant="elevated" style={styles.mealCard}>
                  <View style={styles.mealHeaderRow}>
                    <View style={styles.rowAlign}>
                      <Text style={[styles.mealCategoryTitle, { color: colors.onSurface }]}>
                        {cat.label}
                      </Text>
                      {items.length > 0 && (
                        <View style={[styles.mealCountBadge, { backgroundColor: colors.surfaceVariant }]}>
                          <Text style={[styles.mealCountText, { color: colors.onSurfaceVariant }]}>
                            {categoryCalories} kcal
                          </Text>
                        </View>
                      )}
                    </View>

                    <Pressable
                      style={[styles.addMealIconBtn, { backgroundColor: colors.surfaceVariant }]}
                      onPress={() => openLogModalFor(cat.key)}
                      hitSlop={8}
                    >
                      <Plus size={16} color={colors.onSurface} />
                    </Pressable>
                  </View>

                  {items.length > 0 ? (
                    <View style={styles.itemsList}>
                      {items.map((item, idx) => (
                        <View
                          key={item._id || item.id || idx}
                          style={[
                            styles.itemRow,
                            idx > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.outlineVariant } : null,
                          ]}
                        >
                          <View style={styles.itemMetaCol}>
                            <Text style={[styles.itemName, { color: colors.onSurface }]}>
                              {item.name}
                            </Text>
                            <Text style={[styles.itemSub, { color: colors.onSurfaceVariant }]}>
                              {item.calories} kcal • {item.protein || 0}g P • {item.carbs || 0}g C • {item.fat || 0}g F
                            </Text>
                          </View>

                          {logId && (
                            <Pressable
                              style={styles.deleteBtn}
                              onPress={() => handleDeleteItem(logId, item._id || item.id)}
                              hitSlop={8}
                            >
                              <Trash2 size={16} color={colors.error} />
                            </Pressable>
                          )}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.emptyMealText, { color: colors.onSurfaceVariant }]}>
                      No {cat.label.toLowerCase()} items logged yet.
                    </Text>
                  )}
                </AppCard>
              );
            })}

            {/* 4. Healthy Recipes Section */}
            <SectionHeader
              title={`Recipes Catalog (${recipes.length})`}
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
                placeholder="Search healthy recipes..."
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

            {filteredRecipes.length > 0 ? (
              filteredRecipes.map((recipe) => (
                <AppCard
                  key={recipe._id || recipe.id}
                  variant="outlined"
                  style={styles.recipeCard}
                  onPress={() => handleOpenRecipeDetail(recipe)}
                >
                  <View style={styles.recipeCardRow}>
                    <View style={styles.recipeMetaCol}>
                      <Text style={[styles.recipeTitle, { color: colors.onSurface }]}>
                        {recipe.name}
                      </Text>
                      <Text style={[styles.recipeMacros, { color: colors.onSurfaceVariant }]}>
                        {recipe.calories || 0} kcal • {recipe.protein || 0}g protein • {recipe.carbs || 0}g carbs
                      </Text>
                      {recipe.prepTimeMinutes && (
                        <View style={styles.rowAlign}>
                          <Clock size={12} color={colors.onSurfaceVariant} />
                          <Text style={[styles.recipeTime, { color: colors.onSurfaceVariant }]}>
                            {recipe.prepTimeMinutes} mins prep
                          </Text>
                        </View>
                      )}
                    </View>

                    <ChevronRight size={18} color={custom.primaryStrong} />
                  </View>
                </AppCard>
              ))
            ) : (
              <EmptyState
                icon="utensils"
                title="No Recipes Found"
                description={recipeSearch ? "No recipes matched your query." : "No recipes are currently loaded."}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* 5. Custom Meal Log Modal */}
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
                Log Meal Item
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
              placeholder="e.g., Grilled Chicken Salad, Oatmeal"
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

      {/* 6. Recipe Details & Log Modal */}
      <Modal visible={recipeModalVisible} transparent animationType="slide" onRequestClose={() => setRecipeModalVisible(false)}>
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
              <Text style={[styles.modalTitle, { color: colors.onSurface }]} numberOfLines={1}>
                {activeRecipe?.name || 'Recipe Details'}
              </Text>
              <Pressable onPress={() => setRecipeModalVisible(false)} hitSlop={8}>
                <X size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <View style={styles.recipeBadgeRow}>
              <View style={[styles.recipeMetricPill, { backgroundColor: colors.primaryContainer }]}>
                <Flame size={13} color={colors.onPrimaryContainer} />
                <Text style={[styles.recipeMetricText, { color: colors.onPrimaryContainer }]}>
                  {activeRecipe?.calories || 0} kcal
                </Text>
              </View>

              <View style={[styles.recipeMetricPill, { backgroundColor: colors.secondaryContainer }]}>
                <Text style={[styles.recipeMetricText, { color: colors.onSecondaryContainer }]}>
                  {activeRecipe?.protein || 0}g Protein
                </Text>
              </View>

              <View style={[styles.recipeMetricPill, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.recipeMetricText, { color: colors.onSurfaceVariant }]}>
                  {activeRecipe?.carbs || 0}g Carbs
                </Text>
              </View>
            </View>

            {activeRecipe?.description && (
              <Text style={[styles.recipeModalDesc, { color: colors.onSurfaceVariant }]}>
                {activeRecipe.description}
              </Text>
            )}

            {/* Meal Destination Selector */}
            <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, marginTop: 12 }]}>
              Log To Meal:
            </Text>
            <View style={styles.chipRow}>
              {MEAL_CATEGORIES.map((cat) => (
                <Chip
                  key={cat.key}
                  selected={recipeMealType === cat.key}
                  onPress={() => setRecipeMealType(cat.key)}
                  style={[
                    styles.categoryChip,
                    recipeMealType === cat.key
                      ? { backgroundColor: colors.primaryContainer }
                      : { backgroundColor: colors.surfaceVariant },
                  ]}
                  textStyle={{
                    color: recipeMealType === cat.key ? colors.onPrimaryContainer : colors.onSurfaceVariant,
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
                label={`Log as ${recipeMealType.toLowerCase()}`}
                loading={submittingMeal}
                onPress={handleLogRecipeAsMeal}
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
    paddingTop: 8,
    paddingBottom: 40,
  },
  skeletonWrap: {
    paddingVertical: 12,
  },
  mbLg: {
    marginBottom: 16,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  summaryDate: {
    fontSize: 12,
    marginTop: 2,
  },
  calTargetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  calTargetPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  calSection: {
    marginBottom: 14,
  },
  calProgressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  calRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calEaten: {
    fontSize: 16,
    fontWeight: '800',
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 12,
  },
  macroCol: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  macroVal: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  macroBar: {
    height: 4,
    borderRadius: 2,
  },
  hydrationCard: {
    marginBottom: 16,
  },
  hydrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hydrationTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  waterVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  waterTargetSub: {
    fontSize: 12,
    fontWeight: '400',
  },
  waterProgressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  waterActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterPct: {
    fontSize: 12,
  },
  addWaterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  addWaterBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mealCard: {
    marginBottom: 12,
  },
  mealHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealCategoryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  mealCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  mealCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addMealIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsList: {
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemMetaCol: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemSub: {
    fontSize: 12,
  },
  deleteBtn: {
    padding: 6,
  },
  emptyMealText: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  recipeCard: {
    marginBottom: 8,
  },
  recipeCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recipeMetaCol: {
    flex: 1,
    marginRight: 8,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  recipeMacros: {
    fontSize: 12,
    marginBottom: 2,
  },
  recipeTime: {
    fontSize: 11,
    marginLeft: 4,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  categoryChip: {
    borderRadius: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  twoColInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActionWrap: {
    marginTop: 8,
    marginBottom: 16,
  },
  recipeBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  recipeMetricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recipeMetricText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recipeModalDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
});
