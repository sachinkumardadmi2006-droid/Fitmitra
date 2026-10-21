// FitMitra — useCart Hook
// Backed by AsyncStorage key 'fitmitra_cart_items'.
// Items store only { productId, slug, quantity }. Live prices and stock come from the server.

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const CART_STORAGE_KEY = 'fitmitra_cart_items';
const MAX_ITEMS = 20;
const MAX_QTY_PER_ITEM = 10;

// Listeners array for multi-component sync without heavy context
const listeners = new Set();
let memoryItems = [];
let isInitialized = false;

const notifyListeners = () => {
  listeners.forEach((listener) => listener([...memoryItems]));
};

export function useCart() {
  const [items, setItems] = useState(memoryItems);
  const [loading, setLoading] = useState(!isInitialized);

  useEffect(() => {
    listeners.add(setItems);

    if (!isInitialized) {
      AsyncStorage.getItem(CART_STORAGE_KEY)
        .then((raw) => {
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                memoryItems = parsed.map((item) => ({
                  productId: String(item.productId || item._id || item.id),
                  slug: String(item.slug || ''),
                  quantity: Math.min(MAX_QTY_PER_ITEM, Math.max(1, Number(item.quantity) || 1)),
                }));
              }
            } catch (_) {
              memoryItems = [];
            }
          }
          isInitialized = true;
          setItems([...memoryItems]);
          setLoading(false);
          notifyListeners();
        })
        .catch(() => {
          isInitialized = true;
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      listeners.delete(setItems);
    };
  }, []);

  const saveToStorage = async (newItems) => {
    memoryItems = newItems;
    setItems(newItems);
    notifyListeners();
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.warn('[useCart] Failed to persist cart to storage:', e);
    }
  };

  const addItem = useCallback(
    async (product, quantity = 1) => {
      const pId = String(product._id || product.id || product.productId);
      const slug = String(product.slug || '');
      const addQty = Math.max(1, Math.min(MAX_QTY_PER_ITEM, Number(quantity) || 1));

      const existingIndex = memoryItems.findIndex((i) => i.productId === pId);

      if (existingIndex >= 0) {
        const currentQty = memoryItems[existingIndex].quantity;
        const newQty = Math.min(MAX_QTY_PER_ITEM, currentQty + addQty);
        if (currentQty >= MAX_QTY_PER_ITEM) {
          Alert.alert('Maximum Quantity Reached', `You cannot add more than ${MAX_QTY_PER_ITEM} units of this item.`);
          return false;
        }
        const updated = [...memoryItems];
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        await saveToStorage(updated);
        return true;
      }

      if (memoryItems.length >= MAX_ITEMS) {
        Alert.alert('Cart Limit Reached', `Your cart cannot hold more than ${MAX_ITEMS} different items.`);
        return false;
      }

      const updated = [
        ...memoryItems,
        {
          productId: pId,
          slug,
          quantity: addQty,
        },
      ];
      await saveToStorage(updated);
      return true;
    },
    []
  );

  const removeItem = useCallback(async (productId) => {
    const updated = memoryItems.filter((i) => i.productId !== String(productId));
    await saveToStorage(updated);
  }, []);

  const updateQuantity = useCallback(async (productId, quantity) => {
    const targetQty = Number(quantity);
    if (targetQty <= 0) {
      await removeItem(productId);
      return;
    }
    const clampedQty = Math.min(MAX_QTY_PER_ITEM, Math.max(1, targetQty));
    const updated = memoryItems.map((item) =>
      item.productId === String(productId) ? { ...item, quantity: clampedQty } : item
    );
    await saveToStorage(updated);
  }, [removeItem]);

  const clearCart = useCallback(async () => {
    await saveToStorage([]);
  }, []);

  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return {
    items,
    itemCount: items.length,
    totalQuantity,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    loading,
    MAX_ITEMS,
    MAX_QTY_PER_ITEM,
  };
}

export default useCart;
