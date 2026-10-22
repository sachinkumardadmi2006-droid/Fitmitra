import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { useCart } from '../../hooks/useCart';

export default function AppHeader({
  title,
  subtitle,
  onBack,
  showBack = false,
  actions = [],
  showCart = false,
  centered = false,
}) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { totalQuantity } = useCart();

  const handleBack = onBack || (showBack ? () => router.back() : null);

  return (
    <Appbar.Header
      mode={centered ? 'center-aligned' : 'small'}
      elevated={false}
      style={{ backgroundColor: theme.colors.background }}
    >
      {handleBack ? <Appbar.BackAction onPress={handleBack} color={theme.colors.onSurface} /> : null}
      <Appbar.Content
        title={title}
        subtitle={subtitle}
        titleStyle={{ color: theme.colors.onSurface, fontWeight: '700' }}
        subtitleStyle={subtitle ? { color: theme.colors.onSurfaceVariant, fontSize: 12 } : undefined}
      />
      {actions.map((a, i) => (
        <View key={`${a.icon}-${i}`} style={styles.actionWrap}>
          <Appbar.Action
            icon={a.icon}
            onPress={a.onPress}
            color={theme.colors.onSurface}
            accessibilityLabel={a.accessibilityLabel}
          />
          {a.badge ? (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.badgeText, { color: theme.colors.onPrimary }]}>
                {typeof a.badge === 'number' && a.badge > 99 ? '99+' : a.badge}
              </Text>
            </View>
          ) : null}
        </View>
      ))}
      {showCart && (
        <Pressable
          onPress={() => router.push('/cart')}
          style={styles.cartBtn}
          hitSlop={8}
          accessibilityLabel="Shopping Cart"
        >
          <ShoppingBag size={20} color={theme.colors.onSurface} />
          {totalQuantity > 0 ? (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.badgeText, { color: theme.colors.onPrimary }]}>
                {totalQuantity > 99 ? '99+' : totalQuantity}
              </Text>
            </View>
          ) : null}
        </Pressable>
      )}
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  actionWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtn: {
    padding: 8,
    marginRight: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
});
