import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Zap, ShoppingBag } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from '../ui/AppCard';

export function ProductCard({
  product,
  userPoints = 0,
  onBuyCash,
  onRedeemPoints,
}) {
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  const priceRupees = Math.round((product.priceInPaise || 0) / 100);
  const regularRupees = Math.round((product.regularPriceInPaise || 0) / 100);
  const pointsPrice = product.pointsPrice || 0;
  const canAffordPoints = userPoints >= pointsPrice && product.allowPointsPurchase;
  const isOutOfStock = product.stockQuantity <= 0;

  const imageUrl =
    product.imageKeys?.[0] ||
    'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=500&auto=format&fit=crop&q=60';

  return (
    <AppCard variant="elevated" padded={false} style={styles.card}>
      <View style={[styles.imageContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.badgesOverlay}>
          <View style={[styles.badgePill, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[styles.badgePillText, { color: colors.onPrimaryContainer }]}>
              {product.category}
            </Text>
          </View>
          {product.brand && (
            <View style={[styles.badgePill, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.badgePillText, { color: colors.onSurfaceVariant }]}>
                {product.brand}
              </Text>
            </View>
          )}
        </View>

        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.metaRow}>
          {product.flavor && <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>{product.flavor}</Text>}
          {product.sizeGrams && (
            <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>• {product.sizeGrams}g</Text>
          )}
          {product.servings && (
            <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>• {product.servings} Servings</Text>
          )}
        </View>

        {/* Pricing Rows */}
        <View style={styles.pricingSection}>
          <View style={styles.cashPriceRow}>
            <Text style={[styles.cashPrice, { color: colors.onSurface }]}>₹{priceRupees}</Text>
            {regularRupees > priceRupees && (
              <Text style={[styles.regularPrice, { color: colors.onSurfaceVariant }]}>₹{regularRupees}</Text>
            )}
          </View>

          {product.allowPointsPurchase && (
            <View style={styles.pointsPriceRow}>
              <Zap size={14} color={colors.secondary} fill={colors.secondary} />
              <Text style={[styles.pointsPriceText, { color: colors.secondary }]}>{pointsPrice} pts</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Pressable
            disabled={isOutOfStock}
            style={[
              styles.cashBtn,
              { backgroundColor: colors.primary },
              isOutOfStock && { opacity: 0.5 },
            ]}
            onPress={() => onBuyCash?.(product)}
          >
            <ShoppingBag size={14} color={colors.onPrimary} />
            <Text style={[styles.cashBtnText, { color: colors.onPrimary }]}>
              Buy ₹{priceRupees}
            </Text>
          </Pressable>

          {product.allowPointsPurchase && (
            <Pressable
              disabled={isOutOfStock || !canAffordPoints}
              style={[
                styles.pointsBtn,
                {
                  backgroundColor: canAffordPoints ? colors.secondaryContainer : colors.surfaceVariant,
                  borderColor: canAffordPoints ? colors.secondary : colors.outlineVariant,
                },
                (!canAffordPoints || isOutOfStock) && { opacity: 0.6 },
              ]}
              onPress={() => onRedeemPoints?.(product)}
            >
              <Zap
                size={14}
                color={canAffordPoints ? colors.secondary : colors.onSurfaceVariant}
                fill={canAffordPoints ? colors.secondary : 'transparent'}
              />
              <Text
                style={[
                  styles.pointsBtnText,
                  { color: canAffordPoints ? colors.onSecondaryContainer : colors.onSurfaceVariant },
                ]}
              >
                {pointsPrice} pts
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgesOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
  content: {
    padding: 14,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 12,
  },
  pricingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cashPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  cashPrice: {
    fontSize: 18,
    fontWeight: '900',
  },
  regularPrice: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  pointsPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsPriceText: {
    fontSize: 13,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cashBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cashBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  pointsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  pointsBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
