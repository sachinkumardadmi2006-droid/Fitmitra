import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  Sparkles,
  Edit3,
  X,
  Target,
  Dumbbell,
  User,
  Ruler,
  Scale,
  Utensils,
  IndianRupee,
  Clock,
  MapPin,
  AlertTriangle,
} from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';

export default function DietPlanProfileConfirmModal({
  visible,
  onClose,
  profileSummary,
  onEditProfile,
  onConfirmGenerate,
  generating,
}) {
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  if (!visible) return null;

  const hasMissingMetrics =
    !profileSummary?.height ||
    !profileSummary?.weight ||
    !profileSummary?.goal ||
    !profileSummary?.workoutPlan;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={generating ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
            <View style={styles.headerTitleWrap}>
              <View style={[styles.iconBox, { backgroundColor: colors.primaryContainer }]}>
                <Sparkles size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.onSurface }]}>
                  Confirm Profile Details
                </Text>
                <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                  For AI Clinical Nutrition Plan
                </Text>
              </View>
            </View>

            {!generating && (
              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}
              >
                <X size={16} color={colors.onSurface} />
              </Pressable>
            )}
          </View>

          {/* Body */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Instruction Banner */}
            <View
              style={[
                styles.instructionBanner,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <Text style={[styles.instructionText, { color: colors.onSurfaceVariant }]}>
                FitMitra&apos;s AI Clinical Nutritionist strictly uses these exact metrics and schedules
                to formulate your daily caloric target, macronutrient split, and hydration protocol.
              </Text>
            </View>

            {/* Warning if missing required metrics */}
            {hasMissingMetrics && (
              <View
                style={[
                  styles.warningBox,
                  { backgroundColor: 'rgba(255, 180, 0, 0.12)', borderColor: '#FFA000' },
                ]}
              >
                <AlertTriangle size={16} color="#FFA000" style={{ marginTop: 1 }} />
                <Text style={[styles.warningText, { color: colors.onSurface }]}>
                  Some key profile fields (height, weight, or plans) appear to be missing. Please tap
                  &quot;Edit Profile&quot; below to fill them in before generating.
                </Text>
              </View>
            )}

            {/* Metrics List */}
            <View style={styles.metricsList}>
              {/* Goal Program */}
              <View style={[styles.metricRow, { borderColor: colors.outlineVariant }]}>
                <View style={styles.metricLeft}>
                  <Target size={16} color={colors.primary} />
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                    Goal Program
                  </Text>
                </View>
                <Text
                  style={[
                    styles.metricValue,
                    { color: profileSummary?.goal ? colors.onSurface : colors.error },
                  ]}
                  numberOfLines={1}
                >
                  {profileSummary?.goal || 'Not Assigned'}
                </Text>
              </View>

              {/* Workout Plan */}
              <View style={[styles.metricRow, { borderColor: colors.outlineVariant }]}>
                <View style={styles.metricLeft}>
                  <Dumbbell size={16} color={colors.primary} />
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                    Workout Plan
                  </Text>
                </View>
                <Text
                  style={[
                    styles.metricValue,
                    { color: profileSummary?.workoutPlan ? colors.onSurface : colors.error },
                  ]}
                  numberOfLines={1}
                >
                  {profileSummary?.workoutPlan || 'Not Assigned'}
                </Text>
              </View>

              {/* Demographics: Age & Gender */}
              <View style={[styles.metricRow, { borderColor: colors.outlineVariant }]}>
                <View style={styles.metricLeft}>
                  <User size={16} color={colors.primary} />
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                    Demographics
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: colors.onSurface }]}>
                  {profileSummary?.age ? `${profileSummary.age} yrs` : 'Age N/A'} •{' '}
                  {profileSummary?.gender || 'Gender N/A'}
                </Text>
              </View>

              {/* Height & Weight */}
              <View style={[styles.metricRow, { borderColor: colors.outlineVariant }]}>
                <View style={styles.metricLeft}>
                  <Scale size={16} color={colors.primary} />
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                    Height & Weight
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: colors.onSurface }]}>
                  {profileSummary?.height ? `${profileSummary.height} cm` : 'Height N/A'} •{' '}
                  {profileSummary?.weight ? `${profileSummary.weight} kg` : 'Weight N/A'}
                </Text>
              </View>

              {/* Experience Level */}
              <View style={[styles.metricRow, { borderColor: colors.outlineVariant }]}>
                <View style={styles.metricLeft}>
                  <Ruler size={16} color={colors.primary} />
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                    Experience Level
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: colors.onSurface }]}>
                  {profileSummary?.experienceLevel || 'Intermediate'}
                </Text>
              </View>

              {/* Location & Frequency */}
              <View style={[styles.metricRow, { borderColor: colors.outlineVariant }]}>
                <View style={styles.metricLeft}>
                  <MapPin size={16} color={colors.primary} />
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                    Setting & Split
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: colors.onSurface }]}>
                  {profileSummary?.workoutLocation || 'GYM'} •{' '}
                  {profileSummary?.workoutDays || 5} days/wk
                </Text>
              </View>

              {/* Workout Time */}
              <View style={[styles.metricRow, { borderColor: colors.outlineVariant }]}>
                <View style={styles.metricLeft}>
                  <Clock size={16} color={colors.primary} />
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                    Workout Timing
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: colors.onSurface }]}>
                  {profileSummary?.workoutTime || 'Morning'}
                </Text>
              </View>

              {/* Diet Preference */}
              <View style={[styles.metricRow, { borderColor: colors.outlineVariant }]}>
                <View style={styles.metricLeft}>
                  <Utensils size={16} color={colors.primary} />
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                    Diet Preference
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: colors.onSurface }]}>
                  {profileSummary?.dietType === 'VEG' ? 'Vegetarian' : 'Non-Vegetarian'}
                </Text>
              </View>

              {/* Daily Budget */}
              <View style={[styles.metricRow, { borderColor: colors.outlineVariant }]}>
                <View style={styles.metricLeft}>
                  <IndianRupee size={16} color={colors.primary} />
                  <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
                    Food Budget
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: colors.onSurface }]}>
                  ₹{profileSummary?.budget || 250} / day
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.outlineVariant }]}>
            {/* Edit Profile Button */}
            <Pressable
              style={[
                styles.editBtn,
                {
                  borderColor: colors.outline,
                  backgroundColor: colors.surfaceVariant,
                },
                generating && { opacity: 0.5 },
              ]}
              onPress={onEditProfile}
              disabled={generating}
            >
              <Edit3 size={15} color={colors.onSurface} />
              <Text style={[styles.editBtnText, { color: colors.onSurface }]}>Edit Profile</Text>
            </Pressable>

            {/* Confirm & Generate Button */}
            <Pressable
              style={[
                styles.confirmBtn,
                { backgroundColor: custom.primaryStrong },
                (generating || hasMissingMetrics) && { opacity: 0.7 },
              ]}
              onPress={onConfirmGenerate}
              disabled={generating}
            >
              {generating ? (
                <View style={styles.btnRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.confirmBtnText}>Creating Plan...</Text>
                </View>
              ) : (
                <View style={styles.btnRow}>
                  <Sparkles size={16} color="#FFFFFF" />
                  <Text style={styles.confirmBtnText}>Confirm & Generate</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '60%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  instructionBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  instructionText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  warningText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
    fontWeight: '500',
  },
  metricsList: {
    gap: 8,
    marginTop: 4,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
