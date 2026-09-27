// Nutrition & Diet Tracker Tab — connected to live Nutrition APIs
// GET /api/v1/nutrition/recipes, GET /api/v1/nutrition/logs, POST /api/v1/nutrition/logs
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Apple,
  Plus,
  Trash2,
  Clock,
  Check,
  X,
  Search,
  Lock,
  Sparkles,
  ChevronRight,
  Flame,
} from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { nutritionService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { onDbUpdate, emitDbUpdate } from '../../utils/events';
import { t } from '../../utils/i18n';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { TopBar } from '../../components/common/TopBar';
import { useTheme } from '../../context/ThemeContext';
import { Utensils } from 'lucide-react-native';

export default function NutritionTab() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { colors, isDark } = useTheme();

  const [recipes, setRecipes] = useState([]);
  const [nutritionLog, setNutritionLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState('All');
  const [recipeSearch, setRecipeSearch] = useState('');

  // Recipe Modal
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [targetMealType, setTargetMealType] = useState('BREAKFAST');

  // Custom Log Modal
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customMealType, setCustomMealType] = useState('BREAKFAST');
  const [customFoodName, setCustomFoodName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFats, setCustomFats] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lang = user?.language || 'en';
  const todayDate = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    try {
      // 1. Fetch real recipes
      const recipeRes = await nutritionService.getRecipes({ limit: 50 });
      const recipeList = Array.isArray(recipeRes)
        ? recipeRes
        : recipeRes?.recipes || recipeRes?.items || [];
      setRecipes(recipeList);

      // 2. Fetch today's meal logs
      const logRes = await nutritionService.getNutritionLogs(todayDate);
      // Backend may return single log object or array of logs
      const logData = Array.isArray(logRes) ? logRes[0] : logRes;
      setNutritionLog(logData || null);
    } catch (e) {
      console.warn('Error loading nutrition data from server:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [todayDate]);

  useEffect(() => {
    setLoading(true);
    loadData();
    const unsub = onDbUpdate(loadData);
    return unsub;
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Macro Goals & Calculations
  const targetCal = profile?.dailyCalorieTarget || user?.targetCal || 2200;
  const targetProtein = profile?.dailyProteinTargetGrams || user?.targetProtein || 140;
  const targetCarbs = profile?.dailyCarbsTargetGrams || user?.targetCarbs || 250;
  const targetFats = profile?.dailyFatTargetGrams || user?.targetFats || 65;

  const totals = nutritionLog?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const totalCalories = Math.round(totals.calories || 0);
  const totalProtein = Math.round(totals.protein || 0);
  const totalCarbs = Math.round(totals.carbs || 0);
  const totalFats = Math.round(totals.fat || totals.fats || 0);
  const remainingCal = Math.max(0, targetCal - totalCalories);

  // Group meals from server log
  const rawMeals = nutritionLog?.meals || {};
  const meals = {
    Breakfast: rawMeals.BREAKFAST || rawMeals.breakfast || [],
    Lunch: rawMeals.LUNCH || rawMeals.lunch || [],
    Dinner: rawMeals.DINNER || rawMeals.dinner || [],
    Snacks: rawMeals.SNACK || rawMeals.snack || rawMeals.SNACKS || [],
  };

  const handleAddRecipeMeal = async (recipe, mealCategory) => {
    const chosenType = (mealCategory || targetMealType || 'BREAKFAST').toUpperCase();
    const normalizedMealType = chosenType === 'SNACKS' ? 'SNACK' : chosenType;

    const mealName = lang === 'kn' && recipe.nameKn ? recipe.nameKn : recipe.name;
    try {
      setIsSubmitting(true);
      await nutritionService.addNutritionLog({
        date: todayDate,
        mealType: normalizedMealType,
        items: [
          {
            recipeId: recipe._id || recipe.id,
            name: mealName,
            quantity: 1,
            unit: 'serving',
            calories: Number(recipe.calories) || 0,
            protein: Number(recipe.protein) || 0,
            carbs: Number(recipe.carbs) || 0,
            fat: Number(recipe.fat || recipe.fats) || 0,
          },
        ],
      });

      setRecipeModalVisible(false);
      emitDbUpdate();
      Alert.alert('Meal Logged!', `${mealName} added to your daily intake.`);
      loadData();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to log recipe meal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomMeal = async () => {
    if (!customFoodName.trim() || !customCalories.trim()) {
      Alert.alert('Missing Info', 'Please enter at least food name and calories.');
      return;
    }
    const normalizedMealType = customMealType.toUpperCase() === 'SNACKS' ? 'SNACK' : customMealType.toUpperCase();

    try {
      setIsSubmitting(true);
      await nutritionService.addNutritionLog({
        date: todayDate,
        mealType: normalizedMealType,
        items: [
          {
            name: customFoodName.trim(),
            quantity: 1,
            unit: 'serving',
            calories: Number(customCalories) || 0,
            protein: Number(customProtein) || 0,
            carbs: Number(customCarbs) || 0,
            fat: Number(customFats) || 0,
          },
        ],
      });

      setCustomModalVisible(false);
      setCustomFoodName('');
      setCustomCalories('');
      setCustomProtein('');
      setCustomCarbs('');
      setCustomFats('');
      emitDbUpdate();
      loadData();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to add food log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!nutritionLog?._id) return;
    try {
      await nutritionService.deleteNutritionLogItem(nutritionLog._id, itemId);
      emitDbUpdate();
      loadData();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not delete meal item.');
    }
  };

  const openRecipeDetails = (recipe, defaultMealType) => {
    if (recipe.isPremium && !user?.isPremium) {
      router.push('/premium');
      return;
    }
    setSelectedRecipe(recipe);
    setTargetMealType(defaultMealType || 'BREAKFAST');
    setRecipeModalVisible(true);
  };

  // Filter Recipes
  const filteredRecipes = recipes.filter((r) => {
    const q = recipeSearch.toLowerCase();
    const nameMatch = (r.name || '').toLowerCase().includes(q);
    const catMatch = (r.category || '').toLowerCase().includes(q);
    const searchMatches = !q || nameMatch || catMatch;

    if (activeTab === 'All') return searchMatches;
    return (r.category || '').toLowerCase().includes(activeTab.toLowerCase()) && searchMatches;
  });

  if (loading) {
    return <LoadingSpinner message="Loading nutrition tracker..." fullScreen />;
  }

  const mealCategories = [
    { key: 'Breakfast', serverKey: 'BREAKFAST' },
    { key: 'Lunch', serverKey: 'LUNCH' },
    { key: 'Dinner', serverKey: 'DINNER' },
    { key: 'Snacks', serverKey: 'SNACK' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <TopBar
        title="Nutrition & Diet"
        subtitle="Track Calories & Macros"
        icon={Utensils}
        rightAction={
          <Pressable
            style={[styles.quickAddBtn, { backgroundColor: colors.primary }]}
            onPress={() => setCustomModalVisible(true)}
          >
            <Plus size={16} color="#000" />
            <Text style={styles.quickAddBtnText}>Add Food</Text>
          </Pressable>
        }
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bgBase }]}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
      {/* Energy Balance Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {lang === 'kn' ? 'ದೈನಂದಿನ ಶಕ್ತಿಯ ಸಮತೋಲನ' : 'Daily Energy Balance'}
        </Text>

        <View style={styles.calRow}>
          <View style={styles.calBox}>
            <Text style={styles.calLabel}>Goal</Text>
            <Text style={styles.calValue}>{targetCal}</Text>
            <Text style={styles.calUnit}>kcal</Text>
          </View>
          <View style={[styles.calBox, styles.calBoxActive]}>
            <Text style={[styles.calLabel, { color: Colors.primaryNeon }]}>Eaten</Text>
            <Text style={[styles.calValue, { color: Colors.primaryNeon }]}>{totalCalories}</Text>
            <Text style={styles.calUnit}>kcal</Text>
          </View>
          <View style={styles.calBox}>
            <Text style={styles.calLabel}>Remaining</Text>
            <Text style={styles.calValue}>{remainingCal}</Text>
            <Text style={styles.calUnit}>kcal</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.mainProgressTrack}>
          <View
            style={[
              styles.mainProgressFill,
              { width: `${Math.min(100, Math.round((totalCalories / (targetCal || 1)) * 100))}%` },
            ]}
          />
        </View>

        {/* Macro Bars */}
        <View style={styles.macrosRow}>
          {/* Protein */}
          <View style={styles.macroCol}>
            <View style={styles.macroHeader}>
              <Text style={styles.macroName}>{t('protein', lang)}</Text>
              <Text style={styles.macroVal}>
                {totalProtein}/{targetProtein}g
              </Text>
            </View>
            <View style={styles.miniTrack}>
              <View
                style={[
                  styles.miniFill,
                  {
                    backgroundColor: Colors.secondaryCyan,
                    width: `${Math.min(100, Math.round((totalProtein / (targetProtein || 1)) * 100))}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Carbs */}
          <View style={styles.macroCol}>
            <View style={styles.macroHeader}>
              <Text style={styles.macroName}>{t('carbs', lang)}</Text>
              <Text style={styles.macroVal}>
                {totalCarbs}/{targetCarbs}g
              </Text>
            </View>
            <View style={styles.miniTrack}>
              <View
                style={[
                  styles.miniFill,
                  {
                    backgroundColor: Colors.accentAmber,
                    width: `${Math.min(100, Math.round((totalCarbs / (targetCarbs || 1)) * 100))}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Fats */}
          <View style={styles.macroCol}>
            <View style={styles.macroHeader}>
              <Text style={styles.macroName}>{t('fats', lang)}</Text>
              <Text style={styles.macroVal}>
                {totalFats}/{targetFats}g
              </Text>
            </View>
            <View style={styles.miniTrack}>
              <View
                style={[
                  styles.miniFill,
                  {
                    backgroundColor: Colors.accentRose,
                    width: `${Math.min(100, Math.round((totalFats / (targetFats || 1)) * 100))}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Meals Log Section */}
      <Text style={styles.sectionHeader}>Today's Logged Meals</Text>
      {mealCategories.map(({ key, serverKey }) => {
        const list = meals[key] || [];
        const mealCals = list.reduce((a, b) => a + (Number(b.calories) || 0), 0);
        return (
          <View key={key} style={styles.mealGroupCard}>
            <View style={styles.mealGroupHeader}>
              <View>
                <Text style={styles.mealGroupTitle}>{key}</Text>
                <Text style={styles.mealGroupSub}>
                  {list.length} item{list.length === 1 ? '' : 's'}
                </Text>
              </View>
              <View style={styles.mealGroupRight}>
                <Text style={styles.mealGroupCals}>{mealCals} kcal</Text>
                <Pressable
                  style={styles.addMiniBtn}
                  onPress={() => {
                    setCustomMealType(serverKey);
                    setCustomModalVisible(true);
                  }}
                >
                  <Plus size={14} color={Colors.primaryNeon} />
                </Pressable>
              </View>
            </View>

            {list.length === 0 ? (
              <Text style={styles.emptyMealText}>No food logged yet for {key}</Text>
            ) : (
              list.map((item, idx) => (
                <View key={item._id || item.id || idx} style={styles.foodRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.foodName}>{item.name}</Text>
                    <Text style={styles.foodMacros}>
                      P: {item.protein || 0}g • C: {item.carbs || 0}g • F: {item.fat || item.fats || 0}g
                    </Text>
                  </View>
                  <Text style={styles.foodCals}>{item.calories} kcal</Text>
                  <Pressable
                    onPress={() => handleDeleteItem(item._id || item.id)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={16} color={Colors.accentRose} />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        );
      })}

      {/* Healthy Recipes Catalogue */}
      <View style={styles.recipeHeaderRow}>
        <Text style={styles.sectionHeader}>Curated Healthy Recipes</Text>
        {!user?.isPremium && (
          <Pressable
            style={styles.proPill}
            onPress={() => router.push('/premium')}
          >
            <Sparkles size={12} color="#000" />
            <Text style={styles.proPillText}>Upgrade PRO</Text>
          </Pressable>
        )}
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={{ gap: 8 }}
      >
        {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[styles.tabChipText, activeTab === tab && styles.tabChipTextActive]}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes, ingredients..."
          placeholderTextColor={Colors.textSecondary}
          value={recipeSearch}
          onChangeText={setRecipeSearch}
        />
        {recipeSearch ? (
          <Pressable onPress={() => setRecipeSearch('')}>
            <X size={16} color={Colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {/* Recipe Cards List */}
      <View style={{ gap: 14 }}>
        {filteredRecipes.length === 0 ? (
          <Text style={styles.emptyMealText}>No recipes match your criteria.</Text>
        ) : (
          filteredRecipes.map((recipe) => {
            const img =
              recipe.imageUrl ||
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60';

            return (
              <Pressable
                key={recipe._id || recipe.id}
                style={styles.recipeCard}
                onPress={() => openRecipeDetails(recipe)}
              >
                <Image source={{ uri: img }} style={styles.recipeImg} />
                <View style={styles.recipeBody}>
                  <View style={styles.recipeBadges}>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>{recipe.category || 'Healthy'}</Text>
                    </View>
                    {recipe.isPremium && (
                      <View style={styles.lockBadge}>
                        <Lock size={10} color={Colors.accentAmber} />
                        <Text style={styles.lockBadgeText}>PRO</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.recipeTitle}>{recipe.name}</Text>

                  <View style={styles.recipeMetaRow}>
                    <Text style={styles.recipeCals}>{recipe.calories} kcal</Text>
                    <Text style={styles.recipeDot}>•</Text>
                    <Text style={styles.recipeMetaText}>P: {recipe.protein}g</Text>
                    <Text style={styles.recipeDot}>•</Text>
                    <Text style={styles.recipeMetaText}>C: {recipe.carbs}g</Text>
                    <Text style={styles.recipeDot}>•</Text>
                    <Clock size={12} color={Colors.textSecondary} />
                    <Text style={styles.recipeMetaText}>
                      {(recipe.prepTimeMinutes || 10) + (recipe.cookTimeMinutes || 0)}m
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      {/* Recipe Detail Modal */}
      <Modal
        visible={recipeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRecipeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedRecipe && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image
                  source={{
                    uri:
                      selectedRecipe.imageUrl ||
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
                  }}
                  style={styles.modalHeroImg}
                />
                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => setRecipeModalVisible(false)}
                >
                  <X size={20} color="#fff" />
                </Pressable>

                <View style={styles.modalInner}>
                  <Text style={styles.modalRecipeTitle}>{selectedRecipe.name}</Text>

                  {/* Macros Strip */}
                  <View style={styles.modalMacroStrip}>
                    <View style={styles.modalMacroItem}>
                      <Text style={styles.modalMacroVal}>{selectedRecipe.calories}</Text>
                      <Text style={styles.modalMacroLbl}>Calories</Text>
                    </View>
                    <View style={styles.modalMacroItem}>
                      <Text style={styles.modalMacroVal}>{selectedRecipe.protein}g</Text>
                      <Text style={styles.modalMacroLbl}>Protein</Text>
                    </View>
                    <View style={styles.modalMacroItem}>
                      <Text style={styles.modalMacroVal}>{selectedRecipe.carbs}g</Text>
                      <Text style={styles.modalMacroLbl}>Carbs</Text>
                    </View>
                    <View style={styles.modalMacroItem}>
                      <Text style={styles.modalMacroVal}>
                        {selectedRecipe.fat || selectedRecipe.fats || 0}g
                      </Text>
                      <Text style={styles.modalMacroLbl}>Fats</Text>
                    </View>
                  </View>

                  {/* Meal Destination Selector */}
                  <Text style={styles.modalSectionLabel}>Log to Meal Category:</Text>
                  <View style={styles.targetMealRow}>
                    {mealCategories.map(({ key, serverKey }) => (
                      <Pressable
                        key={key}
                        style={[
                          styles.targetMealPill,
                          targetMealType === serverKey && styles.targetMealPillActive,
                        ]}
                        onPress={() => setTargetMealType(serverKey)}
                      >
                        <Text
                          style={[
                            styles.targetMealPillText,
                            targetMealType === serverKey && styles.targetMealPillTextActive,
                          ]}
                        >
                          {key}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Ingredients */}
                  {selectedRecipe.ingredients?.length > 0 && (
                    <>
                      <Text style={styles.modalSectionLabel}>Ingredients</Text>
                      <View style={styles.ingredBox}>
                        {selectedRecipe.ingredients.map((ing, i) => (
                          <Text key={i} style={styles.ingredItem}>
                            • {typeof ing === 'string' ? ing : ing.name}
                          </Text>
                        ))}
                      </View>
                    </>
                  )}

                  {/* Steps */}
                  {selectedRecipe.instructions?.length > 0 && (
                    <>
                      <Text style={styles.modalSectionLabel}>Preparation Instructions</Text>
                      <View style={{ gap: 10, marginBottom: 20 }}>
                        {selectedRecipe.instructions.map((step, idx) => (
                          <View key={idx} style={styles.stepRow}>
                            <View style={styles.stepNum}>
                              <Text style={styles.stepNumText}>{idx + 1}</Text>
                            </View>
                            <Text style={styles.stepText}>{step}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}

                  {/* Log Action Button */}
                  <Pressable
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.logActionBtn,
                      isSubmitting && { opacity: 0.6 },
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => handleAddRecipeMeal(selectedRecipe, targetMealType)}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <>
                        <Plus size={18} color="#000" />
                        <Text style={styles.logActionBtnText}>
                          Log This Recipe to {targetMealType}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Meal Log Modal */}
      <Modal
        visible={customModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Add Custom Food</Text>
              <Pressable onPress={() => setCustomModalVisible(false)}>
                <X size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {/* Meal type selector */}
            <View style={[styles.targetMealRow, { marginBottom: 16 }]}>
              {mealCategories.map(({ key, serverKey }) => (
                <Pressable
                  key={key}
                  style={[
                    styles.targetMealPill,
                    customMealType === serverKey && styles.targetMealPillActive,
                  ]}
                  onPress={() => setCustomMealType(serverKey)}
                >
                  <Text
                    style={[
                      styles.targetMealPillText,
                      customMealType === serverKey && styles.targetMealPillTextActive,
                    ]}
                  >
                    {key}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.customInput}
              placeholder="Food name (e.g. 2 Boiled Eggs, Dosa)"
              placeholderTextColor={Colors.textSecondary}
              value={customFoodName}
              onChangeText={setCustomFoodName}
            />

            <TextInput
              style={styles.customInput}
              placeholder="Calories (kcal) *"
              keyboardType="numeric"
              placeholderTextColor={Colors.textSecondary}
              value={customCalories}
              onChangeText={setCustomCalories}
            />

            <View style={styles.macroInputsRow}>
              <TextInput
                style={[styles.customInput, { flex: 1 }]}
                placeholder="Protein (g)"
                keyboardType="numeric"
                placeholderTextColor={Colors.textSecondary}
                value={customProtein}
                onChangeText={setCustomProtein}
              />
              <TextInput
                style={[styles.customInput, { flex: 1 }]}
                placeholder="Carbs (g)"
                keyboardType="numeric"
                placeholderTextColor={Colors.textSecondary}
                value={customCarbs}
                onChangeText={setCustomCarbs}
              />
              <TextInput
                style={[styles.customInput, { flex: 1 }]}
                placeholder="Fats (g)"
                keyboardType="numeric"
                placeholderTextColor={Colors.textSecondary}
                value={customFats}
                onChangeText={setCustomFats}
              />
            </View>

            <Pressable
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.logActionBtn,
                isSubmitting && { opacity: 0.6 },
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleAddCustomMeal}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Check size={18} color="#000" />
                  <Text style={styles.logActionBtnText}>Save Entry</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryNeon,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  quickAddBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
  },
  card: {
    backgroundColor: Colors.bgCardGlass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calBox: {
    alignItems: 'center',
    flex: 1,
  },
  calBoxActive: {
    backgroundColor: 'rgba(0, 245, 155, 0.08)',
    borderRadius: 12,
    paddingVertical: 4,
  },
  calLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  calValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginVertical: 2,
  },
  calUnit: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  mainProgressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  mainProgressFill: {
    height: '100%',
    backgroundColor: Colors.primaryNeon,
    borderRadius: 4,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroCol: {
    flex: 1,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  macroName: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  macroVal: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  miniTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  mealGroupCard: {
    backgroundColor: Colors.bgCardGlass,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: 16,
    marginBottom: 14,
  },
  mealGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealGroupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  mealGroupSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  mealGroupRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mealGroupCals: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryNeon,
  },
  addMiniBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 245, 155, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMealText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  foodName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  foodMacros: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  foodCals: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: 12,
  },
  deleteBtn: {
    padding: 6,
  },
  recipeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentAmber,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proPillText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
  },
  tabsScroll: {
    marginBottom: 12,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabChipActive: {
    backgroundColor: 'rgba(0, 245, 155, 0.15)',
    borderColor: Colors.primaryNeon,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabChipTextActive: {
    color: Colors.primaryNeon,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgCardGlass,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  recipeCard: {
    backgroundColor: Colors.bgCardGlass,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    overflow: 'hidden',
    flexDirection: 'row',
    height: 110,
  },
  recipeImg: {
    width: 110,
    height: '100%',
  },
  recipeBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  recipeBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  catBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accentAmber,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeCals: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryNeon,
  },
  recipeDot: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  recipeMetaText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 19, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0D1222',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
  },
  modalHeroImg: {
    width: '100%',
    height: 200,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInner: {
    padding: 24,
  },
  modalRecipeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  modalMacroStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  modalMacroItem: {
    flex: 1,
    alignItems: 'center',
  },
  modalMacroVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalMacroLbl: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalSectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  targetMealRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  targetMealPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  targetMealPillActive: {
    backgroundColor: 'rgba(0, 245, 155, 0.15)',
    borderColor: Colors.primaryNeon,
  },
  targetMealPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  targetMealPillTextActive: {
    color: Colors.primaryNeon,
    fontWeight: '800',
  },
  ingredBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 6,
  },
  ingredItem: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 245, 155, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryNeon,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  logActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryNeon,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 20,
  },
  logActionBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
  },
  customModalCard: {
    backgroundColor: '#0D1222',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  customInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  macroInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
