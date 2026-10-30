import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Zap, ChevronRight, Package } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { resolveMediaUrl } from '../../utils/media';
import AppCard from '../ui/AppCard';

export function ProductCard({ product, onPress }) {
  const { theme } = useAppTheme();
  const { colors } = theme;

  const priceRupees = Math.round((product.priceInPaise || 0) / 100);
  const regularRupees = Math.round((product.regularPriceInPaise || 0) / 100);
  const pointsPrice = product.pointsPrice || 0;
  const isOutOfStock = product.stockQuantity <= 0;

  const rawKey = product.imageKeys?.[0];
  const imageUrl = resolveMediaUrl(rawKey);

  return (
    <AppCard
      variant="elevated"
      padded={false}
      style={styles.card}
      onPress={() => onPress?.(product)}
    >
      <View style={[styles.imageContainer, { backgroundColor: colors.surfaceVariant }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderWrap}>
            <Package size={40} color={colors.onSurfaceVariant} />
          </View>
        )}

        <View style={styles.badgesOverlay}>
          {product.category && (
            <View style={[styles.badgePill, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.badgePillText, { color: colors.onPrimaryContainer }]}>
                {product.category}
              </Text>
            </View>
          )}
          {product.brand ? (
            <View style={[styles.badgePill, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.badgePillText, { color: colors.onSurfaceVariant }]}>
                {product.brand}
              </Text>
            </View>
          ) : null}
        </View>

        {isOutOfStock && (
          <View style={[styles.outOfStockOverlay, { backgroundColor: colors.scrim || 'rgba(0,0,0,0.6)' }]}>
            <Text style={[styles.outOfStockText, { color: colors.inverseOnSurface || '#FFFFFF' }]}>
              OUT OF STOCK
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={2}>
            {product.name}
          </Text>
          <ChevronRight size={18} color={colors.onSurfaceVariant} style={styles.chevron} />
        </View>

        <View style={styles.metaRow}>
          {product.flavor ? (
            <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>{product.flavor}</Text>
          ) : null}
          {product.sizeGrams ? (
            <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>• {product.sizeGrams}g</Text>
          ) : null}
          {product.servings ? (
            <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>• {product.servings} Servings</Text>
          ) : null}
        </View>

        {/* Pricing Rows */}
        <View style={styles.pricingSection}>
          <View style={styles.cashPriceRow}>
            <Text style={[styles.cashPrice, { color: colors.onSurface }]}>₹{priceRupees}</Text>
            {regularRupees > priceRupees && (
              <Text style={[styles.regularPrice, { color: colors.onSurfaceVariant }]}>₹{regularRupees}</Text>
            )}
          </View>

          {product.allowPointsPurchase && pointsPrice > 0 ? (
            <View style={styles.pointsPriceRow}>
              <Zap size={14} color={colors.secondary} fill={colors.secondary} />
              <Text style={[styles.pointsPriceText, { color: colors.secondary }]}>{pointsPrice} pts</Text>
            </View>
          ) : null}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
  content: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  chevron: {
    marginTop: 2,
    marginLeft: 6,
  },
  name: {
    flex: 1,
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
});
