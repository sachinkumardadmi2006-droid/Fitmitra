// FitMitra — Recipe Detail Screen
// Standalone stack screen featuring video playback, macros breakdown, ingredients, numbered instructions, and meal logging

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Clock,
  Users,
  Flame,
  CheckCircle2,
  X,
} from 'lucide-react-native';
import { Chip } from 'react-native-paper';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../utils/i18n';
import { spacing, radius } from '../../theme/tokens';
import { nutritionService } from '../../services/nutritionService';
import { queryKeys } from '../../constants/queryKeys';
import { resolveMediaUrl } from '../../utils/media';
import AppHeader from '../../components/ui/AppHeader';
import AppCard from '../../components/ui/AppCard';
import AppButton from '../../components/ui/AppButton';
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const MEAL_CATEGORIES = [
  { key: 'BREAKFAST', label: 'Breakfast' },
  { key: 'LUNCH', label: 'Lunch' },
  { key: 'DINNER', label: 'Dinner' },
  { key: 'SNACK', label: 'Snacks' },
];

function RecipeVideoPlayer({ source }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
  });

  return (
    <View style={styles.videoWrap}>
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        contentFit="cover"
      />
    </View>
  );
}

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { recipeId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const { t } = useTranslation();

  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Meal logging modal
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('LUNCH');
  const [servingsToLog, setServingsToLog] = useState(1);
  const [submittingMeal, setSubmittingMeal] = useState(false);

  const recipeQuery = useQuery({
    queryKey: queryKeys.recipe(recipeId),
    queryFn: async () => {
      const res = await nutritionService.getRecipe(recipeId);
      return res?.data?.recipe || res?.data || res?.recipe || res;
    },
    enabled: Boolean(recipeId),
    staleTime: 5 * 60 * 1000,
  });

  const recipe = recipeQuery.data;
  const isLoading = recipeQuery.isLoading;

  const videoSource = useMemo(() => {
    if (!recipe) return null;
    return recipe.videoUrl || resolveMediaUrl(recipe.videoKey);
  }, [recipe]);

  const imageSource = useMemo(() => {
    if (!recipe) return null;
    return recipe.imageUrl || resolveMediaUrl(recipe.imageKey);
  }, [recipe]);

  const handleLogMeal = async () => {
    if (!recipe) return;

    setSubmittingMeal(true);
    try {
      const numServings = Math.max(0.5, Number(servingsToLog) || 1);
      const perServing = recipe.nutritionPerServing || {};
      const cals = Math.round((Number(perServing.calories) || Number(recipe.calories) || 0) * numServings);
      const prot = Math.round(((Number(perServing.protein) || Number(recipe.protein) || 0) * numServings) * 10) / 10;
      const carb = Math.round(((Number(perServing.carbs) || Number(recipe.carbs) || 0) * numServings) * 10) / 10;
      const fat = Math.round(((Number(perServing.fat) || Number(recipe.fat) || 0) * numServings) * 10) / 10;

      await nutritionService.addNutritionLog({
        date: todayDate,
        mealType: selectedMealType,
        items: [
          {
            recipeId: recipe._id || recipe.id || recipeId,
            name: recipe.title,
            quantity: numServings,
            unit: numServings === 1 ? 'serving' : 'servings',
            calories: cals,
            protein: prot,
            carbs: carb,
            fat: fat,
          },
        ],
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.nutritionLogs(todayDate) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);

      setLogModalVisible(false);
      Alert.alert(
        t('recipes.logSuccessTitle'),
        `"${recipe.title}" was added to your ${selectedMealType.toLowerCase()} log.`
      );
    } catch (err) {
      Alert.alert(t('recipes.logFailed'), err.message || 'Could not log recipe as meal.');
    } finally {
      setSubmittingMeal(false);
    }
  };

  // Loading Screen
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader title="Recipe" onBack={() => router.back()} />
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Skeleton height={200} radius={radius.lg} />
          <Skeleton height={28} width="70%" />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
        </View>
      </View>
    );
  }

  // Not Found / Error Screen
  if (!recipe || recipeQuery.isError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader title={t('recipes.headerTitle')} onBack={() => router.back()} />
        <EmptyState
          icon="silverware-fork-knife"
          title={t('recipes.notFoundTitle')}
          message={t('recipes.notFoundDesc')}
          actionLabel={t('recipes.backToRecipes')}
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const {
    title,
    description,
    preparationTimeMinutes,
    servings = 1,
    nutritionPerServing = { calories: 0, protein: 0, carbs: 0, fat: 0 },
    ingredients = [],
    instructions = [],
    goalTags = [],
  } = recipe;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title={title}
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Media: Video Player if videoUrl exists, else Image Banner */}
        {videoSource ? (
          <RecipeVideoPlayer source={videoSource} />
        ) : imageSource ? (
          <Image source={{ uri: imageSource }} style={styles.bannerImage} resizeMode="cover" />
        ) : null}

        {/* Title & Metadata Card */}
        <AppCard style={styles.card}>
          <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>

          {/* Goal Tags */}
          {goalTags.length > 0 && (
            <View style={styles.tagRow}>
              {goalTags.map((tag) => (
                <View
                  key={tag}
                  style={[styles.tagPill, { backgroundColor: colors.surfaceVariant }]}
                >
                  <Text style={[styles.tagText, { color: colors.onSurfaceVariant }]}>
                    {tag.replace(/_/g, ' ')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {description ? (
            <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>
              {description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            {preparationTimeMinutes ? (
              <View style={styles.metaItem}>
                <Clock size={16} color={custom.primaryStrong} />
                <Text style={[styles.metaText, { color: colors.onSurface }]}>
                  {preparationTimeMinutes} {t('recipes.minsPrep')}
                </Text>
              </View>
            ) : null}

            {servings ? (
              <View style={styles.metaItem}>
                <Users size={16} color={custom.primaryStrong} />
                <Text style={[styles.metaText, { color: colors.onSurface }]}>
                  {servings} {servings === 1 ? t('recipes.serving') : t('recipes.servings')}
                </Text>
              </View>
            ) : null}
          </View>
        </AppCard>

        {/* Nutrition per Serving */}
        <AppCard style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Flame size={18} color={custom.primaryStrong} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Nutrition Per Serving
            </Text>
          </View>

          <View style={styles.macrosGrid}>
            <View
              style={[
                styles.macroBox,
                { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
              ]}
            >
              <Text style={[styles.macroValue, { color: colors.onPrimaryContainer }]}>
                {nutritionPerServing.calories || 0}
              </Text>
              <Text style={[styles.macroLabel, { color: colors.onPrimaryContainer }]}>{t('calories')}</Text>
            </View>

            <View
              style={[
                styles.macroBox,
                { backgroundColor: colors.secondaryContainer, borderColor: colors.secondary },
              ]}
            >
              <Text style={[styles.macroValue, { color: colors.onSecondaryContainer }]}>
                {nutritionPerServing.protein || 0}g
              </Text>
              <Text style={[styles.macroLabel, { color: colors.onSecondaryContainer }]}>{t('protein')}</Text>
            </View>

            <View
              style={[
                styles.macroBox,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
              ]}
            >
              <Text style={[styles.macroValue, { color: colors.onSurfaceVariant }]}>
                {nutritionPerServing.carbs || 0}g
              </Text>
              <Text style={[styles.macroLabel, { color: colors.onSurfaceVariant }]}>{t('carbs')}</Text>
            </View>

            <View
              style={[
                styles.macroBox,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
              ]}
            >
              <Text style={[styles.macroValue, { color: colors.onSurfaceVariant }]}>
                {nutritionPerServing.fat || 0}g
              </Text>
              <Text style={[styles.macroLabel, { color: colors.onSurfaceVariant }]}>{t('fats')}</Text>
            </View>
          </View>
        </AppCard>

        {/* Ingredients Checklist */}
        <AppCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, marginBottom: spacing.md }]}>
            {t('recipes.ingredients')} ({ingredients.length})
          </Text>

          {ingredients.length > 0 ? (
            ingredients.map((ing, idx) => {
              const name = typeof ing === 'string' ? ing : ing.name || 'Ingredient';
              const qty = typeof ing === 'object' && ing.quantity ? String(ing.quantity) : '';
              const unit = typeof ing === 'object' && ing.unit ? ing.unit : '';
              const measure = [qty, unit].filter(Boolean).join(' ');

              return (
                <View
                  key={idx}
                  style={[
                    styles.ingredientRow,
                    idx > 0 && { borderTopWidth: 1, borderTopColor: colors.outlineVariant },
                  ]}
                >
                  <CheckCircle2 size={16} color={custom.primaryStrong} style={{ marginTop: 2 }} />
                  <View style={styles.ingredientTextCol}>
                    <Text style={[styles.ingredientName, { color: colors.onSurface }]}>
                      {name}
                    </Text>
                    {measure ? (
                      <Text style={[styles.ingredientMeasure, { color: colors.onSurfaceVariant }]}>
                        {measure}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
              {t('recipes.noIngredients')}
            </Text>
          )}
        </AppCard>

        {/* Instructions / Steps (Numbered cards) */}
        <View style={styles.stepsSection}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, marginBottom: spacing.md }]}>
            {t('recipes.instructions')} ({instructions.length})
          </Text>

          {instructions.length > 0 ? (
            instructions.map((step, idx) => (
              <AppCard key={idx} style={styles.stepCard}>
                <View style={styles.stepHeaderRow}>
                  <View
                    style={[
                      styles.stepBadge,
                      { backgroundColor: colors.primaryContainer },
                    ]}
                  >
                    <Text style={[styles.stepBadgeText, { color: colors.onPrimaryContainer }]}>
                      Step {idx + 1}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.stepText, { color: colors.onSurface }]}>{step}</Text>
              </AppCard>
            ))
          ) : (
            <AppCard style={styles.card}>
              <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
                {t('recipes.noInstructions')}
              </Text>
            </AppCard>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar with "Log as Meal" Button */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.outlineVariant,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <AppButton
          tone="primary"
          icon="plus"
          label={t('recipes.logRecipeBtn')}
          style={styles.logButton}
          onPress={() => setLogModalVisible(true)}
        />
      </View>

      {/* Log as Meal Modal */}
      <Modal
        visible={logModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLogModalVisible(false)}
      >
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
                {t('recipes.logModalTitle')}
              </Text>
              <Pressable onPress={() => setLogModalVisible(false)} hitSlop={8}>
                <X size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <Text style={[styles.chipGroupLabel, { color: colors.onSurfaceVariant }]}>
              {t('recipes.servingsToLog')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Pressable
                style={[styles.stepperBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}
                onPress={() => setServingsToLog(Math.max(1, servingsToLog - 1))}
              >
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.onSurface }}>−</Text>
              </Pressable>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.onSurface, minWidth: 30, textAlign: 'center' }}>
                {servingsToLog}
              </Text>
              <Pressable
                style={[styles.stepperBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}
                onPress={() => setServingsToLog(servingsToLog + 1)}
              >
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.onSurface }}>+</Text>
              </Pressable>
              <Text style={{ fontSize: 13, color: colors.onSurfaceVariant, marginLeft: 6 }}>
                ({Math.round((Number(nutritionPerServing.calories) || 0) * servingsToLog)} kcal)
              </Text>
            </View>

            <Text style={[styles.chipGroupLabel, { color: colors.onSurfaceVariant }]}>
              {t('recipes.selectMealType')}
            </Text>
            <View style={styles.chipRow}>
              {MEAL_CATEGORIES.map((cat) => (
                <Chip
                  key={cat.key}
                  selected={selectedMealType === cat.key}
                  onPress={() => setSelectedMealType(cat.key)}
                  style={[
                    styles.modalChip,
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

            <View style={styles.modalActionWrap}>
              <AppButton
                tone="primary"
                label={t('recipes.logToDiary')}
                loading={submittingMeal}
                onPress={handleLogMeal}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  videoWrap: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  bannerImage: {
    width: '100%',
    height: 210,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: spacing.xs,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.15)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  macroBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  macroLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 10,
  },
  ingredientTextCol: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '700',
  },
  ingredientMeasure: {
    fontSize: 12,
    marginTop: 2,
  },
  stepsSection: {
    marginBottom: spacing.md,
  },
  stepCard: {
    marginBottom: spacing.sm,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepText: {
    fontSize: 14,
    lineHeight: 21,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  logButton: {
    width: '100%',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  chipGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.lg,
  },
  modalChip: {
    borderRadius: radius.md,
  },
  modalActionWrap: {
    marginTop: spacing.xs,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
