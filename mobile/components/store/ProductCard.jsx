import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Zap, ShoppingBag, Package } from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { Badge } from '../common/Badge';

export function ProductCard({
  product,
  userPoints = 0,
  onBuyCash,
  onRedeemPoints,
}) {
  const priceRupees = Math.round((product.priceInPaise || 0) / 100);
  const regularRupees = Math.round((product.regularPriceInPaise || 0) / 100);
  const pointsPrice = product.pointsPrice || 0;
  const canAffordPoints = userPoints >= pointsPrice && product.allowPointsPurchase;
  const isOutOfStock = product.stockQuantity <= 0;

  // Image fallback
  const imageUrl =
    product.imageKeys?.[0] ||
    'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=500&auto=format&fit=crop&q=60';

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.badgesOverlay}>
          <Badge label={product.category} variant="neon" size="small" />
          {product.brand && (
            <Badge label={product.brand} variant="gray" size="small" />
          )}
        </View>
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.metaRow}>
          {product.flavor && <Text style={styles.metaText}>{product.flavor}</Text>}
          {product.sizeGrams && (
            <Text style={styles.metaText}>• {product.sizeGrams}g</Text>
          )}
          {product.servings && (
            <Text style={styles.metaText}>• {product.servings} Servings</Text>
          )}
        </View>

        {/* Pricing Rows */}
        <View style={styles.pricingSection}>
          <View style={styles.cashPriceRow}>
            <Text style={styles.cashPrice}>₹{priceRupees}</Text>
            {regularRupees > priceRupees && (
              <Text style={styles.regularPrice}>₹{regularRupees}</Text>
            )}
          </View>

          {product.allowPointsPurchase && (
            <View style={styles.pointsPriceRow}>
              <Zap size={14} color="#FFB800" fill="#FFB800" />
              <Text style={styles.pointsPriceText}>{pointsPrice} pts</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Pressable
            disabled={isOutOfStock}
            style={({ pressed }) => [
              styles.cashBtn,
              isOutOfStock && styles.btnDisabled,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => onBuyCash?.(product)}
          >
            <ShoppingBag size={14} color={Colors.bgDarkBase} />
            <Text style={styles.cashBtnText}>Buy ₹{priceRupees}</Text>
          </Pressable>

          {product.allowPointsPurchase && (
            <Pressable
              disabled={isOutOfStock || !canAffordPoints}
              style={({ pressed }) => [
                styles.pointsBtn,
                (!canAffordPoints || isOutOfStock) && styles.pointsBtnDisabled,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => onRedeemPoints?.(product)}
            >
              <Zap size={14} color={canAffordPoints ? '#FFB800' : '#64748B'} fill={canAffordPoints ? '#FFB800' : '#64748B'} />
              <Text
                style={[
                  styles.pointsBtnText,
                  !canAffordPoints && styles.pointsBtnTextDisabled,
                ]}
              >
                {pointsPrice} pts
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCardGlass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    height: 160,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgesOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 9, 19, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#FF3366',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  pricingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 14,
  },
  cashPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  cashPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  regularPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  pointsPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsPriceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFB800',
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
    backgroundColor: Colors.primaryNeon,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cashBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.bgDarkBase,
  },
  pointsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  pointsBtnDisabled: {
    opacity: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pointsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFB800',
  },
  pointsBtnTextDisabled: {
    color: '#64748B',
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
