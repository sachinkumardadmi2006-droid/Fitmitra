// Nutrition & Diet Tracker Tab — mirrors frontend Nutrition.jsx
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
} from 'react-native';
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
  CreditCard,
  CheckCircle,
} from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import {
  getUser,
  getTodayNutritionLogs,
  addNutritionLog,
  deleteNutritionLog,
  saveUser,
} from '../../utils/db';
import { RECIPES } from '../../data/mockData';
import { t } from '../../utils/i18n';
import { onDbUpdate } from '../../utils/events';

const EXPIRED_RECIPES = [
  {
    id: 'expired-shake',
    name: 'Summer Mango Protein Shake',
    nameKn: 'ಬೇಸಿಗೆ ಮಾವಿನ ಪ್ರೋಟೀನ್ ಶೇಕ್',
    category: 'Snacks',
    calories: 280,
    protein: 25,
    carbs: 35,
    fats: 4,
    prepTime: 5,
    cookTime: 0,
    imageUrl:
      'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=60',
    ingredients: [
      '1 cup Sweet Mango pulp',
      '1 scoop Vanilla Whey Protein',
      '1 cup Almond Milk',
      'Ice cubes',
    ],
    preparation: [
      'Combine all ingredients in a blender.',
      'Blend on high until completely smooth.',
      'Pour into a chilled glass and serve immediately.',
    ],
    isExpired: true,
  },
];

export default function NutritionTab() {
  const [user, setUser] = useState(null);
  const [todayLogs, setTodayLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState('All');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [inProgressIds, setInProgressIds] = useState([]);

  // Recipe Modal
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [targetMealType, setTargetMealType] = useState('Breakfast');

  // Custom Log Modal
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customMealType, setCustomMealType] = useState('Breakfast');
  const [customFoodName, setCustomFoodName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFats, setCustomFats] = useState('');

  // Premium Payment Modal
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNum, setCardNum] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const u = await getUser();
      const logs = await getTodayNutritionLogs();
      setUser(u);
      setTodayLogs(logs || []);
    } catch (e) {
      console.warn('Error loading nutrition data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = onDbUpdate(loadData);
    return unsub;
  }, [loadData]);

  const lang = user?.language || 'en';

  // Macro Calculations
  const targetCal = user?.targetCal || 2200;
  const targetProtein = user?.targetProtein || 140;
  const targetCarbs = user?.targetCarbs || 250;
  const targetFats = user?.targetFats || 65;

  const totalCalories = todayLogs.reduce((acc, l) => acc + (Number(l.calories) || 0), 0);
  const totalProtein = todayLogs.reduce((acc, l) => acc + (Number(l.protein) || 0), 0);
  const totalCarbs = todayLogs.reduce((acc, l) => acc + (Number(l.carbs) || 0), 0);
  const totalFats = todayLogs.reduce((acc, l) => acc + (Number(l.fats) || 0), 0);
  const remainingCal = Math.max(0, targetCal - totalCalories);

  // Group logs
  const meals = {
    Breakfast: todayLogs.filter((l) => l.mealType === 'Breakfast'),
    Lunch: todayLogs.filter((l) => l.mealType === 'Lunch'),
    Dinner: todayLogs.filter((l) => l.mealType === 'Dinner'),
    Snacks: todayLogs.filter((l) => l.mealType === 'Snacks'),
  };

  const handleAddRecipeMeal = async (recipe, mealType) => {
    const chosenType = mealType || targetMealType;
    const mealName = lang === 'kn' && recipe.nameKn ? recipe.nameKn : recipe.name;
    try {
      await addNutritionLog({
        mealType: chosenType,
        name: mealName,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fats: recipe.fats,
      });
      setInProgressIds((prev) => prev.filter((id) => id !== recipe.id));
      setRecipeModalVisible(false);
      Alert.alert('Success', `${mealName} logged to ${chosenType}!`);
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to log meal.');
    }
  };

  const handleAddCustomMeal = async () => {
    if (!customFoodName.trim() || !customCalories.trim()) {
      Alert.alert('Missing Info', 'Please enter at least food name and calories.');
      return;
    }
    try {
      await addNutritionLog({
        mealType: customMealType,
        name: customFoodName.trim(),
        calories: Number(customCalories) || 0,
        protein: Number(customProtein) || 0,
        carbs: Number(customCarbs) || 0,
        fats: Number(customFats) || 0,
      });
      setCustomModalVisible(false);
      setCustomFoodName('');
      setCustomCalories('');
      setCustomProtein('');
      setCustomCarbs('');
      setCustomFats('');
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to add food log.');
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      await deleteNutritionLog(id);
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Could not delete item.');
    }
  };

  const openRecipeDetails = (recipe, defaultMealType) => {
    if (recipe.isLocked && !user?.isPremium) {
      setPaymentModalVisible(true);
      return;
    }
    setSelectedRecipe(recipe);
    setTargetMealType(defaultMealType || recipe.category || 'Breakfast');
    setRecipeModalVisible(true);
    if (!inProgressIds.includes(recipe.id) && !recipe.isExpired) {
      setInProgressIds((prev) => [...prev, recipe.id]);
    }
  };

  const handleProcessPayment = async () => {
    setPaymentProcessing(true);
    setTimeout(async () => {
      setPaymentProcessing(false);
      setPaymentSuccess(true);
      setTimeout(async () => {
        const updated = { ...user, isPremium: true };
        await saveUser(updated);
        setUser(updated);
        setPaymentModalVisible(false);
        setPaymentSuccess(false);
        setUpiId('');
        setCardNum('');
        Alert.alert('FitMitra PRO', 'Congratulations! Premium unlocked successfully.');
        loadData();
      }, 1000);
    }, 1500);
  };

  // Filter Recipes
  const taggedRecipes = (RECIPES || []).map((recipe) => {
    const isLocked = !user?.isPremium && (recipe.id === 'salmon-potato' || recipe.id === 'jolada-roti');
    const freePreview = recipe.id === 'ragi-mudde' || recipe.id === 'paneer-salad' || recipe.id === 'protein-oats';
    const isNew = recipe.id === 'salmon-potato' || recipe.id === 'ragi-mudde' || recipe.id === 'idli-sambar';
    return { ...recipe, isLocked, freePreview, isNew };
  });

  const getFilteredRecipes = () => {
    let list = taggedRecipes;
    if (activeTab === 'In Progress') {
      list = taggedRecipes.filter((r) => inProgressIds.includes(r.id));
    } else if (activeTab === 'Completed') {
      list = taggedRecipes.filter((r) =>
        todayLogs.some((l) => l.name === r.name || l.name === r.nameKn)
      );
    } else if (activeTab === 'Expired') {
      list = EXPIRED_RECIPES;
    }

    if (recipeSearch.trim()) {
      const q = recipeSearch.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.nameKn && r.nameKn.toLowerCase().includes(q)) ||
          r.category.toLowerCase().includes(q)
      );
    }
    return list;
  };

  const filteredRecipes = getFilteredRecipes();

  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryNeon} />
        <Text style={styles.loadingText}>Loading nutrition...</Text>
      </View>
    );
  }

  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('nutritionLogger', lang)}</Text>
          <Text style={styles.headerSubtitle}>{t('trackYourDailyMeals', lang)}</Text>
        </View>
        <Pressable
          style={styles.quickAddBtn}
          onPress={() => setCustomModalVisible(true)}
        >
          <Plus size={16} color="#000" />
          <Text style={styles.quickAddBtnText}>Add Food</Text>
        </Pressable>
      </View>

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
              { width: `${Math.min(100, Math.round((totalCalories / targetCal) * 100))}%` },
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
                    width: `${Math.min(100, Math.round((totalProtein / targetProtein) * 100))}%`,
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
                    width: `${Math.min(100, Math.round((totalCarbs / targetCarbs) * 100))}%`,
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
                    width: `${Math.min(100, Math.round((totalFats / targetFats) * 100))}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Meals Log Section */}
      <Text style={styles.sectionHeader}>Today's Logged Meals</Text>
      {mealTypes.map((mt) => {
        const list = meals[mt] || [];
        const mealCals = list.reduce((a, b) => a + (Number(b.calories) || 0), 0);
        return (
          <View key={mt} style={styles.mealGroupCard}>
            <View style={styles.mealGroupHeader}>
              <View>
                <Text style={styles.mealGroupTitle}>{mt}</Text>
                <Text style={styles.mealGroupSub}>{list.length} item{list.length === 1 ? '' : 's'}</Text>
              </View>
              <View style={styles.mealGroupRight}>
                <Text style={styles.mealGroupCals}>{mealCals} kcal</Text>
                <Pressable
                  style={styles.addMiniBtn}
                  onPress={() => {
                    setCustomMealType(mt);
                    setCustomModalVisible(true);
                  }}
                >
                  <Plus size={14} color={Colors.primaryNeon} />
                </Pressable>
              </View>
            </View>

            {list.length === 0 ? (
              <Text style={styles.emptyMealText}>No food logged yet for {mt}</Text>
            ) : (
              list.map((item) => (
                <View key={item.id} style={styles.foodRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.foodName}>{item.name}</Text>
                    <Text style={styles.foodMacros}>
                      P: {item.protein || 0}g • C: {item.carbs || 0}g • F: {item.fats || 0}g
                    </Text>
                  </View>
                  <Text style={styles.foodCals}>{item.calories} kcal</Text>
                  <Pressable
                    onPress={() => handleDeleteLog(item.id)}
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
            onPress={() => setPaymentModalVisible(true)}
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
        {['All', 'In Progress', 'Completed', 'Expired'].map((tab) => (
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
        {filteredRecipes.map((recipe) => {
          const isDone = todayLogs.some(
            (l) => l.name === recipe.name || l.name === recipe.nameKn
          );
          return (
            <Pressable
              key={recipe.id}
              style={styles.recipeCard}
              onPress={() => openRecipeDetails(recipe)}
            >
              <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImg} />
              <View style={styles.recipeBody}>
                <View style={styles.recipeBadges}>
                  <View style={styles.catBadge}>
                    <Text style={styles.catBadgeText}>{recipe.category}</Text>
                  </View>
                  {recipe.isLocked && (
                    <View style={styles.lockBadge}>
                      <Lock size={10} color={Colors.accentAmber} />
                      <Text style={styles.lockBadgeText}>PRO</Text>
                    </View>
                  )}
                  {recipe.freePreview && (
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeText}>Free Preview</Text>
                    </View>
                  )}
                  {isDone && (
                    <View style={styles.doneBadge}>
                      <Check size={10} color="#000" />
                      <Text style={styles.doneBadgeText}>Logged</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.recipeTitle}>
                  {lang === 'kn' && recipe.nameKn ? recipe.nameKn : recipe.name}
                </Text>

                <View style={styles.recipeMetaRow}>
                  <Text style={styles.recipeCals}>{recipe.calories} kcal</Text>
                  <Text style={styles.recipeDot}>•</Text>
                  <Text style={styles.recipeMetaText}>P: {recipe.protein}g</Text>
                  <Text style={styles.recipeDot}>•</Text>
                  <Text style={styles.recipeMetaText}>C: {recipe.carbs}g</Text>
                  <Text style={styles.recipeDot}>•</Text>
                  <Clock size={12} color={Colors.textSecondary} />
                  <Text style={styles.recipeMetaText}>
                    {(recipe.prepTime || 0) + (recipe.cookTime || 0)}m
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
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
                <Image source={{ uri: selectedRecipe.imageUrl }} style={styles.modalHeroImg} />
                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => setRecipeModalVisible(false)}
                >
                  <X size={20} color="#fff" />
                </Pressable>

                <View style={styles.modalInner}>
                  <Text style={styles.modalRecipeTitle}>
                    {lang === 'kn' && selectedRecipe.nameKn
                      ? selectedRecipe.nameKn
                      : selectedRecipe.name}
                  </Text>

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
                      <Text style={styles.modalMacroVal}>{selectedRecipe.fats}g</Text>
                      <Text style={styles.modalMacroLbl}>Fats</Text>
                    </View>
                  </View>

                  {/* Meal Destination Selector */}
                  <Text style={styles.modalSectionLabel}>Log to Meal Category:</Text>
                  <View style={styles.targetMealRow}>
                    {mealTypes.map((mt) => (
                      <Pressable
                        key={mt}
                        style={[
                          styles.targetMealPill,
                          targetMealType === mt && styles.targetMealPillActive,
                        ]}
                        onPress={() => setTargetMealType(mt)}
                      >
                        <Text
                          style={[
                            styles.targetMealPillText,
                            targetMealType === mt && styles.targetMealPillTextActive,
                          ]}
                        >
                          {mt}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Ingredients */}
                  <Text style={styles.modalSectionLabel}>Ingredients</Text>
                  <View style={styles.ingredBox}>
                    {selectedRecipe.ingredients?.map((ing, i) => (
                      <Text key={i} style={styles.ingredItem}>
                        • {ing}
                      </Text>
                    ))}
                  </View>

                  {/* Steps */}
                  <Text style={styles.modalSectionLabel}>Preparation Instructions</Text>
                  <View style={{ gap: 10, marginBottom: 20 }}>
                    {selectedRecipe.preparation?.map((step, idx) => (
                      <View key={idx} style={styles.stepRow}>
                        <View style={styles.stepNum}>
                          <Text style={styles.stepNumText}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Log Action Button */}
                  <Pressable
                    style={styles.logActionBtn}
                    onPress={() => handleAddRecipeMeal(selectedRecipe, targetMealType)}
                  >
                    <Plus size={18} color="#000" />
                    <Text style={styles.logActionBtnText}>
                      Log This Recipe to {targetMealType}
                    </Text>
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
              {mealTypes.map((mt) => (
                <Pressable
                  key={mt}
                  style={[
                    styles.targetMealPill,
                    customMealType === mt && styles.targetMealPillActive,
                  ]}
                  onPress={() => setCustomMealType(mt)}
                >
                  <Text
                    style={[
                      styles.targetMealPillText,
                      customMealType === mt && styles.targetMealPillTextActive,
                    ]}
                  >
                    {mt}
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

            <Pressable style={styles.saveCustomBtn} onPress={handleAddCustomMeal}>
              <Text style={styles.saveCustomBtnText}>Log to Daily Journal</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Upgrade to PRO Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={18} color={Colors.accentAmber} />
                <Text style={styles.paymentTitle}>FitMitra PRO</Text>
              </View>
              <Pressable onPress={() => setPaymentModalVisible(false)}>
                <X size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {paymentSuccess ? (
              <View style={styles.successBox}>
                <CheckCircle size={48} color={Colors.primaryNeon} />
                <Text style={styles.successTitle}>Payment Successful!</Text>
                <Text style={styles.successSub}>Unlocking FitMitra PRO...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.paymentSubtitle}>
                  Unlock all regional Indian keto recipes, personalized macro adjustments, and advanced dietitian charts.
                </Text>

                {/* Plan Selection */}
                <View style={styles.planRow}>
                  <Pressable
                    style={[styles.planCard, paymentPlan === 'monthly' && styles.planCardActive]}
                    onPress={() => setPaymentPlan('monthly')}
                  >
                    <Text style={styles.planName}>Monthly</Text>
                    <Text style={styles.planPrice}>₹299/mo</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.planCard, paymentPlan === 'annual' && styles.planCardActive]}
                    onPress={() => setPaymentPlan('annual')}
                  >
                    <View style={styles.saveTag}>
                      <Text style={styles.saveTagText}>SAVE 40%</Text>
                    </View>
                    <Text style={styles.planName}>Annual</Text>
                    <Text style={styles.planPrice}>₹1,999/yr</Text>
                  </Pressable>
                </View>

                {/* Method Toggle */}
                <View style={styles.methodToggle}>
                  <Pressable
                    style={[styles.methodBtn, paymentMethod === 'upi' && styles.methodBtnActive]}
                    onPress={() => setPaymentMethod('upi')}
                  >
                    <Text
                      style={[
                        styles.methodBtnText,
                        paymentMethod === 'upi' && styles.methodBtnTextActive,
                      ]}
                    >
                      UPI / GPay / PhonePe
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.methodBtn, paymentMethod === 'card' && styles.methodBtnActive]}
                    onPress={() => setPaymentMethod('card')}
                  >
                    <Text
                      style={[
                        styles.methodBtnText,
                        paymentMethod === 'card' && styles.methodBtnTextActive,
                      ]}
                    >
                      Credit / Debit Card
                    </Text>
                  </Pressable>
                </View>

                {paymentMethod === 'upi' ? (
                  <TextInput
                    style={styles.customInput}
                    placeholder="Enter UPI ID (e.g. user@okhdfcbank)"
                    placeholderTextColor={Colors.textSecondary}
                    value={upiId}
                    onChangeText={setUpiId}
                  />
                ) : (
                  <View style={{ gap: 10 }}>
                    <TextInput
                      style={styles.customInput}
                      placeholder="Card Number"
                      keyboardType="numeric"
                      placeholderTextColor={Colors.textSecondary}
                      value={cardNum}
                      onChangeText={setCardNum}
                    />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TextInput
                        style={[styles.customInput, { flex: 1 }]}
                        placeholder="MM/YY"
                        placeholderTextColor={Colors.textSecondary}
                        value={cardExp}
                        onChangeText={setCardExp}
                      />
                      <TextInput
                        style={[styles.customInput, { flex: 1 }]}
                        placeholder="CVV"
                        keyboardType="numeric"
                        placeholderTextColor={Colors.textSecondary}
                        value={cardCvv}
                        onChangeText={setCardCvv}
                      />
                    </View>
                  </View>
                )}

                <Pressable
                  style={styles.payBtn}
                  onPress={handleProcessPayment}
                  disabled={paymentProcessing}
                >
                  {paymentProcessing ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.payBtnText}>
                      Pay {paymentPlan === 'monthly' ? '₹299' : '₹1,999'} & Unlock
                    </Text>
                  )}
                </Pressable>
              </ScrollView>
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
    padding: 16,
    paddingTop: 48,
    paddingBottom: 90,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bgDarkBase,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
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
    gap: 4,
    backgroundColor: Colors.primaryNeon,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  quickAddBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 12,
  },
  card: {
    backgroundColor: Colors.bgDarkCard,
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  calRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calBox: {
    alignItems: 'center',
    flex: 1,
  },
  calBoxActive: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  calLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  calValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  calUnit: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  mainProgressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
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
    marginBottom: 4,
  },
  macroName: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  macroVal: {
    fontSize: 10,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  miniTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  mealGroupCard: {
    backgroundColor: 'rgba(13, 18, 34, 0.7)',
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  mealGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealGroupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  mealGroupSub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  mealGroupRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mealGroupCals: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryNeon,
  },
  addMiniBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMealText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  foodName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  foodMacros: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  foodCals: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: 10,
  },
  deleteBtn: {
    padding: 4,
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
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  proPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000',
  },
  tabsScroll: {
    marginBottom: 14,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.bgDarkCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  tabChipActive: {
    backgroundColor: Colors.primaryNeon,
    borderColor: Colors.primaryNeon,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabChipTextActive: {
    color: '#000',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgDarkCard,
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  recipeCard: {
    backgroundColor: Colors.bgDarkCard,
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  recipeImg: {
    width: 105,
    height: 105,
  },
  recipeBody: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  recipeBadges: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  catBadge: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catBadgeText: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockBadgeText: {
    fontSize: 9,
    color: Colors.accentAmber,
    fontWeight: '700',
  },
  freeBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeBadgeText: {
    fontSize: 9,
    color: Colors.secondaryCyan,
    fontWeight: '700',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.primaryNeon,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  doneBadgeText: {
    fontSize: 9,
    color: '#000',
    fontWeight: '700',
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  recipeCals: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryNeon,
  },
  recipeDot: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
  recipeMetaText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.bgDarkCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeroImg: {
    width: '100%',
    height: 200,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInner: {
    padding: 20,
    paddingBottom: 40,
  },
  modalRecipeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  modalMacroStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-around',
    marginBottom: 18,
  },
  modalMacroItem: {
    alignItems: 'center',
  },
  modalMacroVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryNeon,
  },
  modalMacroLbl: {
    fontSize: 10,
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
    marginBottom: 18,
  },
  targetMealPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  targetMealPillActive: {
    backgroundColor: Colors.primaryNeon,
  },
  targetMealPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  targetMealPillTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  ingredBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    marginBottom: 18,
  },
  ingredItem: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: Colors.primaryNeon,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  logActionBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
  customModalCard: {
    backgroundColor: Colors.bgDarkCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  customInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
    marginBottom: 10,
  },
  macroInputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  saveCustomBtn: {
    backgroundColor: Colors.primaryNeon,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveCustomBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
  },
  paymentModalCard: {
    backgroundColor: Colors.bgDarkCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.accentAmber,
  },
  paymentSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  planRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  planCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  planCardActive: {
    borderColor: Colors.accentAmber,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  saveTag: {
    backgroundColor: Colors.accentAmber,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  saveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
  },
  planName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 4,
    marginBottom: 14,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  methodBtnActive: {
    backgroundColor: Colors.bgDarkBase,
  },
  methodBtnText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  methodBtnTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  payBtn: {
    backgroundColor: Colors.primaryNeon,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  payBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryNeon,
  },
  successSub: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
