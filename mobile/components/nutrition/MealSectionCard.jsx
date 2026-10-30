import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Plus, Trash2, Utensils, BookOpen } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from '../ui/AppCard';

export default function MealSectionCard({
  mealType,
  label,
  icon: IconComponent = Utensils,
  items = [],
  logId,
  onAddFood,
  onDeleteItem,
  deletingItemId,
  style,
}) {
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  const totalMealCalories = items.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);

  const confirmDelete = (item) => {
    const itemId = item._id || item.id;
    if (!logId || !itemId) return;

    Alert.alert(
      'Remove Food Item',
      `Are you sure you want to remove "${item.name}" from ${label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onDeleteItem(logId, itemId),
        },
      ]
    );
  };

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
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.leftTitleRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
            <IconComponent size={16} color={colors.onSurface} />
          </View>
          <View>
            <Text style={[styles.mealTitle, { color: colors.onSurface }]}>{label}</Text>
            <Text style={[styles.mealCalSub, { color: colors.onSurfaceVariant }]}>
              {totalMealCalories} kcal
            </Text>
          </View>
        </View>

        <Pressable
          style={[
            styles.addPillBtn,
            {
              backgroundColor: colors.primaryContainer,
              borderColor: colors.primary,
            },
          ]}
          onPress={() => onAddFood(mealType)}
          hitSlop={6}
        >
          <Plus size={13} color={colors.onPrimaryContainer} />
          <Text style={[styles.addPillText, { color: colors.onPrimaryContainer }]}>
            Add Food
          </Text>
        </Pressable>
      </View>

      {/* Items list or empty state */}
      {items.length === 0 ? (
        <View
          style={[
            styles.emptyBox,
            {
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            No meals logged for {label} yet.
          </Text>
        </View>
      ) : (
        <View style={styles.itemsList}>
          {items.map((item, idx) => {
            const itemId = item._id || item.id || idx;
            const isDeleting = deletingItemId === itemId;
            const qtyStr =
              typeof item.quantity === 'object' && item.quantity !== null
                ? `${item.quantity.amount || 1} ${item.quantity.unit || item.unit || 'serving'}`
                : `${item.quantity || 1} ${item.unit || 'serving'}`;

            return (
              <View
                key={itemId}
                style={[
                  styles.itemRow,
                  idx < items.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.outlineVariant,
                  },
                  isDeleting && { opacity: 0.5 },
                ]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.itemName, { color: colors.onSurface }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.source === 'RECIPE' && (
                      <View style={[styles.recipeTag, { backgroundColor: colors.surfaceVariant }]}>
                        <BookOpen size={9} color={colors.onSurfaceVariant} />
                        <Text style={[styles.recipeTagText, { color: colors.onSurfaceVariant }]}>
                          Recipe
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.itemSub, { color: colors.onSurfaceVariant }]}>
                    {qtyStr} • P: {item.protein || 0}g • C: {item.carbs || 0}g • F: {item.fat || 0}g
                  </Text>
                </View>

                <View style={styles.itemRightRow}>
                  <Text style={[styles.itemCalories, { color: custom.primaryStrong }]}>
                    {item.calories || 0} kcal
                  </Text>

                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => confirmDelete(item)}
                    disabled={isDeleting}
                    hitSlop={8}
                  >
                    <Trash2 size={15} color={colors.error || '#EF4444'} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  mealCalSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  addPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  addPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBox: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  itemsList: {
    marginTop: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: '85%',
  },
  recipeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  recipeTagText: {
    fontSize: 9,
    fontWeight: '600',
  },
  itemSub: {
    fontSize: 11,
  },
  itemRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemCalories: {
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
});

