import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Sparkles, CheckCircle2, ChevronDown, ChevronUp, FileText, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAppTheme } from '../../theme/ThemeContext';
import { nutritionService } from '../../services/nutritionService';
import { queryKeys } from '../../constants/queryKeys';
import AppCard from '../ui/AppCard';
import DietPlanProfileConfirmModal from './DietPlanProfileConfirmModal';

export default function AiDietPlanCard({ dietPlan, isLoading, profileSummary, onPlanGenerated, style }) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const queryClient = useQueryClient();

  const [generating, setGenerating] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const executeGeneration = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const newPlan = await nutritionService.generateDietPlan('User manual generation from nutrition tab');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dietPlan }),
        queryClient.invalidateQueries({ queryKey: queryKeys.nutritionTargets }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: ['nutrition'] }),
      ]);
      setConfirmModalVisible(false);
      if (onPlanGenerated) onPlanGenerated(newPlan);
      Alert.alert(
        'Plan Generated!',
        'Your personalized AI diet plan has been created and your daily targets are now unlocked.'
      );
    } catch (err) {
      console.error('AI diet plan generation error:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to generate AI diet plan. Please check your profile details and try again.';
      Alert.alert('Notice', msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleEditProfileFromModal = () => {
    setConfirmModalVisible(false);
    router.push('/edit-profile');
  };

  if (isLoading && !dietPlan) {
    return (
      <AppCard variant="elevated" style={[styles.card, style]}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={custom.primaryStrong} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Checking personalized nutrition plan...
          </Text>
        </View>
      </AppCard>
    );
  }

  // If no plan generated yet
  if (!dietPlan) {
    return (
      <>
        <AppCard
          variant="elevated"
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
            },
            style,
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primaryContainer }]}>
                <Sparkles size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.onSurface }]}>AI Nutrition Plan</Text>
                <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                  Tailored strictly to your profile biometrics & schedule
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.emptyDesc, { color: colors.onSurfaceVariant }]}>
            Your daily targets are currently 0. Generate your personalized AI Diet Plan to compute your custom calorie, macronutrient, and hydration targets.
          </Text>

          {profileSummary && (
            <View style={styles.profileChipsRow}>
              {profileSummary.goal ? (
                <View style={[styles.profileTag, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
                  <Text style={[styles.profileTagText, { color: colors.onSurface }]}>🎯 {profileSummary.goal}</Text>
                </View>
              ) : null}
              {profileSummary.workoutPlan ? (
                <View style={[styles.profileTag, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
                  <Text style={[styles.profileTagText, { color: colors.onSurface }]}>🏋️ {profileSummary.workoutPlan}</Text>
                </View>
              ) : null}
              {profileSummary.dietType ? (
                <View style={[styles.profileTag, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
                  <Text style={[styles.profileTagText, { color: colors.onSurface }]}>
                    🥗 {profileSummary.dietType === 'VEG' ? 'Vegetarian' : 'Non-Veg'}
                  </Text>
                </View>
              ) : null}
              {profileSummary.weight && profileSummary.height ? (
                <View style={[styles.profileTag, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
                  <Text style={[styles.profileTagText, { color: colors.onSurface }]}>
                    📏 {profileSummary.height}cm • {profileSummary.weight}kg
                  </Text>
                </View>
              ) : null}
              {profileSummary.budget ? (
                <View style={[styles.profileTag, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
                  <Text style={[styles.profileTagText, { color: colors.onSurface }]}>
                    💰 ₹{profileSummary.budget}/day
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          <Pressable
            style={[
              styles.generateBtn,
              { backgroundColor: custom.primaryStrong },
              generating && { opacity: 0.7 },
            ]}
            onPress={() => setConfirmModalVisible(true)}
            disabled={generating}
          >
            {generating ? (
              <View style={styles.btnRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.generateBtnText}>Creating Your Plan with AI...</Text>
              </View>
            ) : (
              <View style={styles.btnRow}>
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.generateBtnText}>Generate My AI Diet Plan</Text>
              </View>
            )}
          </Pressable>
        </AppCard>

        {/* Profile Confirmation Modal */}
        <DietPlanProfileConfirmModal
          visible={confirmModalVisible}
          onClose={() => setConfirmModalVisible(false)}
          profileSummary={profileSummary}
          onEditProfile={handleEditProfileFromModal}
          onConfirmGenerate={executeGeneration}
          generating={generating}
        />
      </>
    );
  }

  const adviceList = Array.isArray(dietPlan.advice) ? dietPlan.advice : [];
  const targets = dietPlan.dailyTargets || {};

  return (
    <AppCard
      variant="elevated"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.outlineVariant,
        },
        style,
      ]}
    >
      {/* Card Header (Without regenerate button - locked) */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryContainer }]}>
            <Sparkles size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
              {dietPlan.title || 'Personalized Nutrition Plan'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              Daily Target: {targets.calories || 2000} kcal • {targets.protein || 100}g Protein
            </Text>
          </View>
        </View>

        {/* Active Protocol Badge */}
        <View style={[styles.activeBadge, { backgroundColor: 'rgba(53, 208, 127, 0.15)' }]}>
          <ShieldCheck size={12} color="var(--primary, #35D07F)" />
          <Text style={styles.activeBadgeText}>ACTIVE</Text>
        </View>
      </View>

      {/* Plan Summary */}
      {dietPlan.summary ? (
        <Text style={[styles.summaryText, { color: colors.onSurfaceVariant }]}>
          {dietPlan.summary}
        </Text>
      ) : null}

      {/* Target Macros Quick Pill Summary */}
      <View style={styles.macroPillRow}>
        <View style={[styles.macroPill, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.macroPillLabel, { color: colors.onSurfaceVariant }]}>Calories</Text>
          <Text style={[styles.macroPillValue, { color: colors.onSurface }]}>
            {targets.calories || 0} kcal
          </Text>
        </View>
        <View style={[styles.macroPill, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.macroPillLabel, { color: colors.onSurfaceVariant }]}>Protein</Text>
          <Text style={[styles.macroPillValue, { color: colors.onSurface }]}>
            {targets.protein || 0}g
          </Text>
        </View>
        <View style={[styles.macroPill, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.macroPillLabel, { color: colors.onSurfaceVariant }]}>Carbs</Text>
          <Text style={[styles.macroPillValue, { color: colors.onSurface }]}>
            {targets.carbs || 0}g
          </Text>
        </View>
        <View style={[styles.macroPill, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.macroPillLabel, { color: colors.onSurfaceVariant }]}>Fats</Text>
          <Text style={[styles.macroPillValue, { color: colors.onSurface }]}>
            {targets.fat || 0}g
          </Text>
        </View>
      </View>

      {/* Expandable Advice Preview */}
      {adviceList.length > 0 && (
        <View style={[styles.adviceContainer, { backgroundColor: colors.surfaceVariant }]}>
          <Pressable
            style={styles.adviceToggleRow}
            onPress={() => setExpanded((prev) => !prev)}
            hitSlop={6}
          >
            <Text style={[styles.adviceToggleTitle, { color: colors.onSurface }]}>
              Actionable Nutrition Advice ({adviceList.length})
            </Text>
            {expanded ? (
              <ChevronUp size={16} color={colors.onSurfaceVariant} />
            ) : (
              <ChevronDown size={16} color={colors.onSurfaceVariant} />
            )}
          </Pressable>

          {expanded && (
            <View style={styles.adviceList}>
              {adviceList.map((adv, idx) => (
                <View key={idx} style={styles.adviceItem}>
                  <CheckCircle2 size={14} color="var(--primary, #35D07F)" style={{ marginTop: 2 }} />
                  <Text style={[styles.adviceItemText, { color: colors.onSurface }]}>{adv}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Button to Dedicated Full Diet Plan Page */}
      <Pressable
        style={[styles.viewPlanBtn, { backgroundColor: custom.primaryStrong }]}
        onPress={() => router.push('/diet-plan-detail')}
      >
        <View style={styles.btnRow}>
          <FileText size={15} color="#FFFFFF" />
          <Text style={styles.viewPlanBtnText}>View Full AI Diet Plan</Text>
          <ArrowRight size={15} color="#FFFFFF" />
        </View>
      </Pressable>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'var(--primary, #35D07F)',
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 12,
  },
  profileChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  profileTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  profileTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  generateBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryText: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 10,
  },
  macroPillRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  macroPill: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  macroPillLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  macroPillValue: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 1,
  },
  adviceContainer: {
    marginTop: 12,
    borderRadius: 10,
    padding: 10,
  },
  adviceToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adviceToggleTitle: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  adviceList: {
    marginTop: 8,
    gap: 6,
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  adviceItemText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  viewPlanBtn: {
    marginTop: 14,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewPlanBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
