import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Utensils, Wallet, CheckCircle2, Sparkles } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';

const DIET_TYPES = [
  {
    key: 'VEG',
    label: 'Vegetarian',
    desc: 'Lentils, paneer, tofu, legumes, dairy & whole grains',
  },
  {
    key: 'NON_VEG',
    label: 'Non-Vegetarian',
    desc: 'Chicken, fish, eggs, dairy & diverse whole foods (includes Eggetarian)',
  },
];

const BUDGET_TIERS = [
  {
    amount: 100,
    dailyLabel: '₹100 / day',
    monthlyLabel: '~₹3,000 / month',
    title: 'Essential Whole Foods',
    tag: 'Budget-Friendly',
    desc: 'Local staples, pulses, soya chunks, eggs/paneer, seasonal vegetables, and oats.',
  },
  {
    amount: 200,
    dailyLabel: '₹200 / day',
    monthlyLabel: '~₹6,000 / month',
    title: 'Optimal Balanced Variety',
    tag: 'Most Popular',
    desc: 'Higher protein density: Greek yogurt, paneer, eggs/chicken breast, nuts, seeds, and fresh fruit.',
  },
  {
    amount: 400,
    dailyLabel: '₹400 / day',
    monthlyLabel: '~₹12,000 / month',
    title: 'Performance & Premium',
    tag: 'Athlete Tier',
    desc: 'Whey protein isolate, fish/lean meats, organic produce, imported berries, and premium supplements.',
  },
];

export default function StepDietBudget({
  dietType,
  setDietType,
  dailyBudgetInr,
  setDailyBudgetInr,
}) {
  const { theme, isDark } = useAppTheme();
  const { colors, custom } = theme;

  return (
    <View style={styles.container}>
      {/* 1. Dietary Preference */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Utensils size={16} color={custom.primaryStrong || colors.primary} />
          <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
            Dietary Preference
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
          How do you prefer to get your daily nutrition?
        </Text>

        <View style={styles.dietList}>
          {DIET_TYPES.map((item) => {
            const isSelected = dietType === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setDietType(item.key)}
                style={[
                  styles.dietCard,
                  {
                    backgroundColor: isSelected
                      ? colors.primaryContainer
                      : isDark
                        ? colors.elevation.level1
                        : colors.surface,
                    borderColor: isSelected
                      ? (custom.primaryStrong || colors.primary)
                      : colors.outlineVariant,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.dietTitle,
                      {
                        color: isSelected
                          ? colors.onPrimaryContainer
                          : colors.onSurface,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.dietDesc,
                      {
                        color: isSelected
                          ? colors.onPrimaryContainer
                          : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {item.desc}
                  </Text>
                </View>

                {isSelected ? (
                  <CheckCircle2 size={18} color={custom.primaryStrong || colors.primary} />
                ) : (
                  <View
                    style={[
                      styles.unselectedRing,
                      { borderColor: colors.outlineVariant },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 2. Daily Grocery / Food Budget */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Wallet size={16} color={custom.primaryStrong || colors.primary} />
          <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
            Daily Nutrition Budget
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.onSurfaceVariant }]}>
          We customize meal recipes and grocery lists based on your realistic daily budget.
        </Text>

        <View style={styles.budgetList}>
          {BUDGET_TIERS.map((tier) => {
            const isSelected = dailyBudgetInr === tier.amount;
            return (
              <Pressable
                key={tier.amount}
                onPress={() => setDailyBudgetInr(tier.amount)}
                style={[
                  styles.budgetCard,
                  {
                    backgroundColor: isSelected
                      ? colors.primaryContainer
                      : isDark
                        ? colors.elevation.level1
                        : colors.surface,
                    borderColor: isSelected
                      ? (custom.primaryStrong || colors.primary)
                      : colors.outlineVariant,
                  },
                ]}
              >
                <View style={styles.budgetTop}>
                  <View>
                    <Text
                      style={[
                        styles.dailyLabel,
                        {
                          color: isSelected
                            ? (custom.primaryStrong || colors.primary)
                            : colors.onSurface,
                        },
                      ]}
                    >
                      {tier.dailyLabel}
                    </Text>
                    <Text
                      style={[
                        styles.monthlyLabel,
                        {
                          color: isSelected
                            ? colors.onPrimaryContainer
                            : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {tier.monthlyLabel}
                    </Text>
                  </View>

                  <View style={styles.tierRight}>
                    <View
                      style={[
                        styles.tierBadge,
                        {
                          backgroundColor: isSelected
                            ? colors.surface
                            : isDark
                              ? colors.elevation.level2
                              : colors.surfaceVariant,
                        },
                      ]}
                    >
                      <Sparkles
                        size={11}
                        color={custom.primaryStrong || colors.primary}
                      />
                      <Text
                        style={[
                          styles.tierBadgeText,
                          {
                            color: isSelected
                              ? (custom.primaryStrong || colors.primary)
                              : colors.onSurfaceVariant,
                          },
                        ]}
                      >
                        {tier.tag}
                      </Text>
                    </View>

                    {isSelected ? (
                      <CheckCircle2 size={18} color={custom.primaryStrong || colors.primary} />
                    ) : (
                      <View
                        style={[
                          styles.unselectedRing,
                          { borderColor: colors.outlineVariant },
                        ]}
                      />
                    )}
                  </View>
                </View>

                <Text
                  style={[
                    styles.tierTitle,
                    {
                      color: isSelected
                        ? colors.onPrimaryContainer
                        : colors.onSurface,
                    },
                  ]}
                >
                  {tier.title}
                </Text>

                <Text
                  style={[
                    styles.tierDesc,
                    {
                      color: isSelected
                        ? colors.onPrimaryContainer
                        : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {tier.desc}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  section: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
    marginBottom: 12,
  },
  dietList: {
    gap: 10,
  },
  dietCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  dietTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  dietDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  budgetList: {
    gap: 12,
  },
  budgetCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  budgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dailyLabel: {
    fontSize: 19,
    fontWeight: '800',
  },
  monthlyLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  tierRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  tierDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  unselectedRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
});
