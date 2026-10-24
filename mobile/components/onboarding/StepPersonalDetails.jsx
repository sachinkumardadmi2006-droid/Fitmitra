import React, { useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { User, Calendar, Ruler, Scale, Activity } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from '../ui/AppCard';

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function StepPersonalDetails({
  name,
  setName,
  gender,
  setGender,
  age,
  setAge,
  height,
  setHeight,
  weight,
  setWeight,
}) {
  const { theme, isDark } = useAppTheme();
  const { colors, custom } = theme;

  // Calculate live BMI preview
  const bmiInfo = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return null;
    const hMeters = h / 100;
    const val = (w / (hMeters * hMeters)).toFixed(1);
    const num = parseFloat(val);

    let category = 'Normal weight';
    let isHealthy = true;
    if (num < 18.5) {
      category = 'Underweight';
      isHealthy = false;
    } else if (num >= 25 && num < 30) {
      category = 'Overweight';
      isHealthy = false;
    } else if (num >= 30) {
      category = 'Obese';
      isHealthy = false;
    }

    return { value: val, category, isHealthy };
  }, [height, weight]);

  return (
    <View style={styles.container}>
      <AppCard
        variant="elevated"
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? colors.elevation.level1
              : colors.surface,
            borderColor: colors.outlineVariant,
          },
        ]}
        padded={false}
      >
        <View style={styles.cardPadding}>
          {/* Full Name Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <User size={15} color={custom.primaryStrong || colors.primary} />
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Full Name
              </Text>
            </View>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark
                    ? colors.elevation.level2
                    : colors.surfaceVariant,
                  borderColor: name?.trim() ? colors.primary : colors.outlineVariant,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.onSurface }]}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={colors.onSurfaceVariant}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Biological Sex / Gender Chips */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Activity size={15} color={custom.primaryStrong || colors.primary} />
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Gender / Biological Sex
              </Text>
            </View>
            <View style={styles.chipGrid}>
              {GENDERS.map((g) => {
                const isSelected = gender === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() => setGender(g)}
                    style={[
                      styles.genderChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primaryContainer
                          : isDark
                            ? colors.elevation.level2
                            : colors.surfaceVariant,
                        borderColor: isSelected
                          ? (custom.primaryStrong || colors.primary)
                          : colors.outlineVariant,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderChipText,
                        {
                          color: isSelected
                            ? colors.onPrimaryContainer
                            : colors.onSurface,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {g}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Age & Height Row */}
          <View style={styles.row}>
            {/* Age */}
            <View style={[styles.inputGroup, styles.halfCol]}>
              <View style={styles.labelRow}>
                <Calendar size={15} color={custom.primaryStrong || colors.primary} />
                <Text style={[styles.label, { color: colors.onSurface }]}>
                  Age (years)
                </Text>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark
                      ? colors.elevation.level2
                      : colors.surfaceVariant,
                    borderColor: age ? colors.primary : colors.outlineVariant,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.onSurface }]}
                  placeholder="24"
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="number-pad"
                  maxLength={3}
                  value={age}
                  onChangeText={setAge}
                />
                <Text style={[styles.unitText, { color: colors.onSurfaceVariant }]}>
                  yrs
                </Text>
              </View>
            </View>

            {/* Height */}
            <View style={[styles.inputGroup, styles.halfCol]}>
              <View style={styles.labelRow}>
                <Ruler size={15} color={custom.primaryStrong || colors.primary} />
                <Text style={[styles.label, { color: colors.onSurface }]}>
                  Height (cm)
                </Text>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark
                      ? colors.elevation.level2
                      : colors.surfaceVariant,
                    borderColor: height ? colors.primary : colors.outlineVariant,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.onSurface }]}
                  placeholder="175"
                  placeholderTextColor={colors.onSurfaceVariant}
                  keyboardType="number-pad"
                  maxLength={3}
                  value={height}
                  onChangeText={setHeight}
                />
                <Text style={[styles.unitText, { color: colors.onSurfaceVariant }]}>
                  cm
                </Text>
              </View>
            </View>
          </View>

          {/* Weight */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Scale size={15} color={custom.primaryStrong || colors.primary} />
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Current Weight (kg)
              </Text>
            </View>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark
                    ? colors.elevation.level2
                    : colors.surfaceVariant,
                  borderColor: weight ? colors.primary : colors.outlineVariant,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.onSurface }]}
                placeholder="72.0"
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="decimal-pad"
                maxLength={5}
                value={weight}
                onChangeText={setWeight}
              />
              <Text style={[styles.unitText, { color: colors.onSurfaceVariant }]}>
                kg
              </Text>
            </View>
          </View>

          {/* Live BMI Preview Card */}
          {bmiInfo ? (
            <View
              style={[
                styles.bmiCard,
                {
                  backgroundColor: bmiInfo.isHealthy
                    ? colors.primaryContainer
                    : colors.secondaryContainer,
                  borderColor: bmiInfo.isHealthy
                    ? colors.primary
                    : colors.secondary,
                },
              ]}
            >
              <View style={styles.bmiLeft}>
                <Text
                  style={[
                    styles.bmiLabel,
                    {
                      color: bmiInfo.isHealthy
                        ? colors.onPrimaryContainer
                        : colors.onSecondaryContainer,
                    },
                  ]}
                >
                  ESTIMATED BMI
                </Text>
                <Text
                  style={[
                    styles.bmiValue,
                    {
                      color: bmiInfo.isHealthy
                        ? colors.onPrimaryContainer
                        : colors.onSecondaryContainer,
                    },
                  ]}
                >
                  {bmiInfo.value}
                </Text>
              </View>
              <View
                style={[
                  styles.bmiBadge,
                  {
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.bmiBadgeText,
                    {
                      color: bmiInfo.isHealthy
                        ? (custom.primaryStrong || colors.primary)
                        : (custom.accentText || colors.secondary),
                    },
                  ]}
                >
                  {bmiInfo.category}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
  },
  cardPadding: {
    padding: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '500',
  },
  unitText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  genderChipText: {
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  bmiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  bmiLeft: {
    gap: 2,
  },
  bmiLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bmiValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  bmiBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bmiBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
