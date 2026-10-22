import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { X, Zap, Plus, Minus, Package } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useAppTheme } from '../../theme/ThemeContext';
import { resolveMediaUrl } from '../../utils/media';
import { storeService } from '../../services/storeService';
import { queryKeys } from '../../constants/queryKeys';
import { useCart } from '../../hooks/useCart';
import AppButton from '../ui/AppButton';
import { Skeleton } from '../ui/Skeleton';
import ErrorState from '../ui/ErrorState';

export function ProductDetailModal({
  visible,
  product: initialProduct,
  onClose,
  onAddedToCart,
}) {
  const { theme } = useAppTheme();
  const { colors, custom } = theme;
  const { width } = useWindowDimensions();
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Refetch latest product details from server
  const productQuery = useQuery({
    queryKey: queryKeys.storeProduct(initialProduct?.slug || ''),
    queryFn: () => storeService.getProduct(initialProduct.slug),
    enabled: Boolean(visible && initialProduct?.slug),
    staleTime: 60 * 1000,
  });

  if (!visible && !initialProduct) return null;

  const product = productQuery.data || initialProduct || {};
  const stockQuantity = typeof product.stockQuantity === 'number' ? product.stockQuantity : 0;
  const isOutOfStock = stockQuantity <= 0;
  const maxAllowedQty = Math.max(1, Math.min(10, stockQuantity || 1));

  const priceRupees = Math.round((product.priceInPaise || 0) / 100);
  const regularRupees = Math.round((product.regularPriceInPaise || 0) / 100);
  const pointsPrice = product.pointsPrice || 0;

  const imageKeys = Array.isArray(product.imageKeys) ? product.imageKeys : [];
  const galleryWidth = width - 32;

  const handleDecreaseQty = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncreaseQty = () => {
    setQuantity((prev) => Math.min(maxAllowedQty, prev + 1));
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    const success = await addItem(product, quantity);
    if (success) {
      onClose?.();
      onAddedToCart?.();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.backdrop }]}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: custom.radius.xl,
              borderTopRightRadius: custom.radius.xl,
            },
          ]}
        >
          {/* Header Bar */}
          <View style={styles.dragBarContainer}>
            <View style={[styles.dragHandle, { backgroundColor: colors.outlineVariant }]} />
          </View>

          <View style={styles.headerRow}>
            <Text style={[styles.headerCategory, { color: colors.primary }]}>
              {product.category || 'SUPPLEMENT'}
            </Text>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}
              hitSlop={8}
            >
              <X size={18} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          {/* Refetch Error State inside sheet */}
          {productQuery.isError && !productQuery.data && !initialProduct ? (
            <View style={styles.innerErrorWrap}>
              <ErrorState
                title="Could not load product"
                message="Please check your connection and try again."
                onRetry={() => productQuery.refetch()}
              />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollBody}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Image Gallery */}
              <View style={[styles.galleryContainer, { backgroundColor: colors.surfaceVariant }]}>
                {imageKeys.length > 0 ? (
                  <>
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onScroll={(e) => {
                        const offsetX = e.nativeEvent.contentOffset.x;
                        const page = Math.round(offsetX / galleryWidth);
                        setActiveImageIndex(page);
                      }}
                      scrollEventThrottle={16}
                      style={{ width: galleryWidth, height: 220 }}
                    >
                      {imageKeys.map((key, idx) => {
                        const uri = resolveMediaUrl(key);
                        return (
                          <View key={String(key || idx)} style={{ width: galleryWidth, height: 220 }}>
                            {uri ? (
                              <Image
                                source={{ uri }}
                                style={styles.galleryImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.emptyGalleryWrap}>
                                <Package size={48} color={colors.onSurfaceVariant} />
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </ScrollView>

                    {/* Pagination Dots */}
                    {imageKeys.length > 1 && (
                      <View style={styles.dotsRow}>
                        {imageKeys.map((_, idx) => (
                          <View
                            key={String(idx)}
                            style={[
                              styles.dot,
                              {
                                backgroundColor:
                                  idx === activeImageIndex
                                    ? colors.primary
                                    : colors.outlineVariant,
                                width: idx === activeImageIndex ? 16 : 6,
                              },
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyGalleryWrap}>
                    <Package size={52} color={colors.onSurfaceVariant} />
                    <Text style={[styles.noImageText, { color: colors.onSurfaceVariant }]}>
                      Product Image
                    </Text>
                  </View>
                )}
              </View>

              {/* Title & Brand */}
              <View style={styles.infoSection}>
                <View style={styles.badgesRow}>
                  {product.brand ? (
                    <View style={[styles.pillChip, { backgroundColor: colors.surfaceVariant }]}>
                      <Text style={[styles.pillChipText, { color: colors.onSurfaceVariant }]}>
                        {product.brand}
                      </Text>
                    </View>
                  ) : null}

                  {/* Stock Badge */}
                  {isOutOfStock ? (
                    <View style={[styles.pillChip, { backgroundColor: colors.errorContainer }]}>
                      <Text style={[styles.pillChipText, { color: colors.onErrorContainer }]}>
                        Out of stock
                      </Text>
                    </View>
                  ) : stockQuantity <= 5 ? (
                    <View style={[styles.pillChip, { backgroundColor: colors.tertiaryContainer || colors.surfaceVariant }]}>
                      <Text style={[styles.pillChipText, { color: colors.onTertiaryContainer || colors.onSurface }]}>
                        Only {stockQuantity} left
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.pillChip, { backgroundColor: colors.primaryContainer }]}>
                      <Text style={[styles.pillChipText, { color: colors.onPrimaryContainer }]}>
                        In stock
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.productName, { color: colors.onSurface }]}>
                  {product.name}
                </Text>

                {/* Price Display */}
                <View style={styles.pricingRow}>
                  <View style={styles.cashPricingCol}>
                    <Text style={[styles.cashPriceText, { color: colors.onSurface }]}>
                      ₹{priceRupees}
                    </Text>
                    {regularRupees > priceRupees && (
                      <Text style={[styles.regularPriceText, { color: colors.onSurfaceVariant }]}>
                        ₹{regularRupees}
                      </Text>
                    )}
                  </View>

                  {product.allowPointsPurchase && pointsPrice > 0 ? (
                    <View
                      style={[
                        styles.pointsBadge,
                        {
                          backgroundColor: colors.secondaryContainer,
                          borderColor: colors.secondary,
                        },
                      ]}
                    >
                      <Zap size={14} color={colors.secondary} fill={colors.secondary} />
                      <Text style={[styles.pointsBadgeText, { color: colors.onSecondaryContainer }]}>
                        {pointsPrice} pts
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Serving & Dimension info */}
                {(product.flavor || product.sizeGrams || product.servings) && (
                  <View
                    style={[
                      styles.specificationsCard,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.outlineVariant,
                      },
                    ]}
                  >
                    {product.flavor ? (
                      <View style={styles.specRow}>
                        <Text style={[styles.specLabel, { color: colors.onSurfaceVariant }]}>
                          Flavor
                        </Text>
                        <Text style={[styles.specValue, { color: colors.onSurface }]}>
                          {product.flavor}
                        </Text>
                      </View>
                    ) : null}
                    {product.sizeGrams ? (
                      <View style={styles.specRow}>
                        <Text style={[styles.specLabel, { color: colors.onSurfaceVariant }]}>
                          Net Weight
                        </Text>
                        <Text style={[styles.specValue, { color: colors.onSurface }]}>
                          {product.sizeGrams}g
                        </Text>
                      </View>
                    ) : null}
                    {product.servings ? (
                      <View style={styles.specRow}>
                        <Text style={[styles.specLabel, { color: colors.onSurfaceVariant }]}>
                          Servings
                        </Text>
                        <Text style={[styles.specValue, { color: colors.onSurface }]}>
                          {product.servings} Servings
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}

                {/* Description */}
                <View style={styles.descSection}>
                  <Text style={[styles.descTitle, { color: colors.onSurface }]}>Description</Text>
                  {productQuery.isLoading && !product.description ? (
                    <Skeleton height={60} radius={custom.radius.sm} />
                  ) : (
                    <Text style={[styles.descText, { color: colors.onSurfaceVariant }]}>
                      {product.description || 'Authentic supplements tailored to power your training.'}
                    </Text>
                  )}
                </View>

                {/* Nutritional Info Rows (if present) */}
                {product.nutritionalInfo && typeof product.nutritionalInfo === 'object' && (
                  <View style={styles.descSection}>
                    <Text style={[styles.descTitle, { color: colors.onSurface }]}>
                      Nutritional Information
                    </Text>
                    <View
                      style={[
                        styles.specificationsCard,
                        {
                          backgroundColor: colors.surfaceVariant,
                          borderColor: colors.outlineVariant,
                        },
                      ]}
                    >
                      {Object.entries(product.nutritionalInfo).map(([k, val]) => (
                        <View key={String(k)} style={styles.specRow}>
                          <Text style={[styles.specLabel, { color: colors.onSurfaceVariant }]}>
                            {k}
                          </Text>
                          <Text style={[styles.specValue, { color: colors.onSurface }]}>
                            {String(val)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          )}

          {/* Bottom Action Footer with Quantity Stepper and Add to Cart */}
          <View
            style={[
              styles.footerContainer,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.outlineVariant,
              },
            ]}
          >
            {/* Quantity Stepper */}
            <View
              style={[
                styles.stepperWrap,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <Pressable
                disabled={quantity <= 1 || isOutOfStock}
                onPress={handleDecreaseQty}
                style={[
                  styles.stepperBtn,
                  (quantity <= 1 || isOutOfStock) && { opacity: 0.4 },
                ]}
                hitSlop={6}
              >
                <Minus size={16} color={colors.onSurface} />
              </Pressable>

              <Text style={[styles.stepperValue, { color: colors.onSurface }]}>
                {quantity}
              </Text>

              <Pressable
                disabled={quantity >= maxAllowedQty || isOutOfStock}
                onPress={handleIncreaseQty}
                style={[
                  styles.stepperBtn,
                  (quantity >= maxAllowedQty || isOutOfStock) && { opacity: 0.4 },
                ]}
                hitSlop={6}
              >
                <Plus size={16} color={colors.onSurface} />
              </Pressable>
            </View>

            {/* ONE always-enabled Add to Cart button */}
            <View style={styles.addToCartWrap}>
              <AppButton
                tone="primary"
                disabled={isOutOfStock}
                icon="shopping-bag"
                label={isOutOfStock ? 'Out of Stock' : `Add to Cart • ₹${priceRupees * quantity}`}
                onPress={handleAddToCart}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    maxHeight: '85%',
    width: '100%',
    paddingBottom: 20,
    overflow: 'hidden',
  },
  dragBarContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerCategory: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  innerErrorWrap: {
    padding: 32,
    alignItems: 'center',
  },
  galleryContainer: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  emptyGalleryWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noImageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  infoSection: {
    gap: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pillChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  productName: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginTop: 2,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  cashPricingCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  cashPriceText: {
    fontSize: 22,
    fontWeight: '900',
  },
  regularPriceText: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  pointsBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  specificationsCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 13,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  descSection: {
    marginTop: 8,
    gap: 4,
  },
  descTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  descText: {
    fontSize: 13,
    lineHeight: 20,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 6,
    height: 48,
    gap: 10,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  addToCartWrap: {
    flex: 1,
  },
});
