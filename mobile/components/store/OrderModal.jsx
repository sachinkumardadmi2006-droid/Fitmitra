import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, ShoppingBag, Zap, MapPin, CheckCircle2 } from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { storeService } from '../../services';
import { emitDbUpdate } from '../../utils/events';

export function OrderModal({
  visible,
  product,
  mode = 'CASH', // 'CASH' | 'POINTS'
  userPoints = 0,
  onClose,
  onSuccess,
}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!product) return null;

  const priceRupees = Math.round((product.priceInPaise || 0) / 100);
  const pointsPrice = product.pointsPrice || 0;
  const isPoints = mode === 'POINTS';

  const handlePlaceOrder = async () => {
    if (!fullName.trim() || !phone.trim() || !addressLine1.trim() || !city.trim() || !pincode.trim()) {
      Alert.alert('Required Fields', 'Please complete all delivery address details.');
      return;
    }

    if (isPoints && userPoints < pointsPrice) {
      Alert.alert('Insufficient Points', 'You do not have enough points for this item.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        items: [
          {
            product: product._id || product.id,
            quantity: 1,
            variant: product.flavor || 'Standard',
          },
        ],
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          addressLine1: addressLine1.trim(),
          city: city.trim(),
          state: stateName.trim() || 'Karnataka',
          pincode: pincode.trim(),
          country: 'India',
        },
      };

      let result;
      if (isPoints) {
        result = await storeService.createPointsOrder(payload);
      } else {
        result = await storeService.createCashOrder(payload);
      }

      emitDbUpdate();
      Alert.alert(
        'Order Placed Successfully!',
        isPoints
          ? `Redeemed for ${pointsPrice} points! Your order will be dispatched via Shiprocket.`
          : `Order #${result?.orderNumber || 'confirmed'} has been placed!`
      );

      onSuccess?.(result);
      onClose?.();
    } catch (err) {
      Alert.alert('Order Failed', err.message || 'Could not complete your order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              {isPoints ? (
                <Zap size={20} color="#FFB800" fill="#FFB800" />
              ) : (
                <ShoppingBag size={20} color={Colors.primaryNeon} />
              )}
              <Text style={styles.headerTitle}>
                {isPoints ? 'Redeem with Points' : 'Cash Checkout'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Order summary box */}
            <View style={styles.productSummary}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productVariant}>
                  {product.brand} • {product.sizeGrams ? `${product.sizeGrams}g` : 'Standard'}
                </Text>
              </View>
              <View style={styles.priceTag}>
                {isPoints ? (
                  <Text style={styles.pointsPriceTag}>⚡ {pointsPrice} pts</Text>
                ) : (
                  <Text style={styles.cashPriceTag}>₹{priceRupees}</Text>
                )}
              </View>
            </View>

            {/* Address Form */}
            <View style={styles.sectionHeader}>
              <MapPin size={16} color={Colors.primaryNeon} />
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor={Colors.textSecondary}
              value={fullName}
              onChangeText={setFullName}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number (10 digits) *"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <TextInput
              style={styles.input}
              placeholder="Flat / House No. / Street Address *"
              placeholderTextColor={Colors.textSecondary}
              value={addressLine1}
              onChangeText={setAddressLine1}
            />

            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="City *"
                placeholderTextColor={Colors.textSecondary}
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="State"
                placeholderTextColor={Colors.textSecondary}
                value={stateName}
                onChangeText={setStateName}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Pincode (e.g. 560001) *"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
              value={pincode}
              onChangeText={setPincode}
            />

            <Pressable
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                isPoints && styles.pointsSubmitBtn,
                submitting && { opacity: 0.6 },
                pressed && { opacity: 0.8 },
              ]}
              onPress={handlePlaceOrder}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.bgDarkBase} />
              ) : (
                <>
                  <CheckCircle2 size={18} color={Colors.bgDarkBase} />
                  <Text style={styles.submitBtnText}>
                    {isPoints
                      ? `Confirm Redemption (⚡ ${pointsPrice} pts)`
                      : `Place Order (₹${priceRupees})`}
                  </Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 19, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0D1222',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.borderGlass,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  productSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCardGlass,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginBottom: 20,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  productVariant: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceTag: {
    paddingLeft: 12,
  },
  cashPriceTag: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  pointsPriceTag: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFB800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryNeon,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryNeon,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 24,
  },
  pointsSubmitBtn: {
    backgroundColor: '#FFB800',
  },
  submitBtnText: {
    color: Colors.bgDarkBase,
    fontWeight: '800',
    fontSize: 15,
  },
});
