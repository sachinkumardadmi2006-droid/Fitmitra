// FitMitra — Razorpay Checkout Modal
// Full-screen WebView modal hosting Razorpay Checkout with verification and deep-linking protection

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { X, ShieldCheck } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { spacing, radius } from '../../theme/tokens';
import { api } from '../../services/api';
import { registerCheckoutHandler } from '../../services/paymentCheckout';

export default function PaymentCheckoutModal() {
  const { theme } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const resolverRef = useRef(null);

  const closeModal = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setVisible(false);
    setOrder(null);
    setLoading(true);
    setVerifying(false);
  }, []);

  const handleCancel = useCallback(() => {
    closeModal({ status: 'cancelled', message: 'Payment cancelled by user.' });
  }, [closeModal]);

  const handleFailure = useCallback((description) => {
    closeModal({ status: 'failed', message: description || 'Payment transaction failed.' });
  }, [closeModal]);

  const handleSuccess = useCallback(async (payload) => {
    setVerifying(true);
    try {
      // Exact request fields per server verifyPaymentSchema
      const verifyPayload = {
        razorpay_order_id: payload.razorpay_order_id,
        razorpay_payment_id: payload.razorpay_payment_id,
        razorpay_signature: payload.razorpay_signature,
        ...(order?.verifyPayload || {}),
      };

      const res = await api.post('/payments/verify', verifyPayload);
      closeModal({ status: 'success', data: res });
    } catch (err) {
      const isNetworkError =
        !err.status ||
        err.code === 'ERR_NETWORK' ||
        err.name === 'AbortError' ||
        err.message?.includes('network') ||
        err.message?.includes('connection');

      if (isNetworkError) {
        closeModal({
          status: 'pending',
          message: 'Payment received, confirming...',
        });
      } else {
        closeModal({
          status: 'failed',
          message: err.message || 'Payment signature verification failed on server.',
        });
      }
    } finally {
      setVerifying(false);
    }
  }, [closeModal, order]);

  // Register checkout handler with module controller
  useEffect(() => {
    const unregister = registerCheckoutHandler((newOrder, resolve) => {
      resolverRef.current = resolve;
      setOrder(newOrder);
      setLoading(true);
      setVerifying(false);
      setVisible(true);
    });
    return unregister;
  }, []);

  // Hardware Back Handler on Android
  useEffect(() => {
    if (!visible) return;
    const onBackPress = () => {
      handleCancel();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [visible, handleCancel]);

  // Deep-link protection and domain whitelist
  const handleShouldStartLoadWithRequest = (request) => {
    const { url } = request;
    if (!url) return false;

    // Allow inline about:blank and data:
    if (url.startsWith('about:blank') || url.startsWith('data:')) {
      return true;
    }

    // App schemes for UPI (Google Pay, PhonePe, Paytm, etc.)
    const upiSchemes = ['upi:', 'phonepe:', 'paytmmp:', 'gpay:', 'tez:', 'intent:'];
    const isAppScheme = upiSchemes.some((scheme) => url.toLowerCase().startsWith(scheme));
    if (isAppScheme) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Payment App', 'No UPI app found, choose another payment method');
      });
      return false;
    }

    // Allow only https URLs on razorpay.com domains
    if (url.startsWith('https://')) {
      const isRazorpay = /^https:\/\/([a-zA-Z0-9-]+\.)*razorpay\.com(\/|$)/i.test(url);
      if (isRazorpay) {
        return true;
      }
    }

    // Block every other URL
    return false;
  };

  // WebView message dispatcher
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SUCCESS') {
        handleSuccess(data.payload);
      } else if (data.type === 'FAILURE') {
        handleFailure(data.payload?.description);
      } else if (data.type === 'DISMISS') {
        handleCancel();
      }
    } catch (err) {
      console.warn('[PaymentCheckoutModal] Error parsing message:', err.message);
    }
  };

  if (!visible || !order) {
    return null;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #0b0d12;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
          .status {
            font-size: 14px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="status">Connecting to Razorpay Secure Gateway...</div>
        <script>
          window.onload = function() {
            try {
              var options = {
                key: ${JSON.stringify(order.keyId || '')},
                amount: ${Number(order.amountInPaise)},
                currency: ${JSON.stringify(order.currency || 'INR')},
                name: "FitMitra",
                description: "Secure Order Payment",
                order_id: ${JSON.stringify(order.providerOrderId || '')},
                prefill: {
                  name: ${JSON.stringify(order.prefill?.name || '')},
                  email: ${JSON.stringify(order.prefill?.email || '')},
                  contact: ${JSON.stringify(order.prefill?.phone || '')}
                },
                theme: {
                  color: "#B7FF00"
                },
                handler: function (response) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'SUCCESS',
                    payload: {
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature
                    }
                  }));
                },
                modal: {
                  ondismiss: function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'DISMISS'
                    }));
                  }
                }
              };
              var rzp = new Razorpay(options);
              rzp.on('payment.failed', function (response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'FAILURE',
                  payload: {
                    description: response.error ? response.error.description : 'Payment transaction failed'
                  }
                }));
              });
              rzp.open();
            } catch (err) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'FAILURE',
                payload: {
                  description: err.message || 'Initialization error'
                }
              }));
            }
          };
        </script>
      </body>
    </html>
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleCancel}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top', 'bottom']}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <ShieldCheck size={18} color={theme.custom.primaryStrong} />
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              Secure Checkout
            </Text>
          </View>
          <Pressable
            style={styles.closeBtn}
            onPress={handleCancel}
            hitSlop={10}
            disabled={verifying}
          >
            <X size={20} color={theme.colors.onSurfaceVariant} />
          </Pressable>
        </View>

        {/* WebView Container */}
        <View style={styles.webContainer}>
          <WebView
            originWhitelist={['*']}
            source={{ html, baseUrl: 'https://checkout.razorpay.com' }}
            onMessage={handleMessage}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            style={styles.webView}
          />

          {(loading || verifying) && (
            <View
              style={[
                styles.loadingOverlay,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <ActivityIndicator size="large" color={theme.custom.primaryStrong} />
              <Text
                style={[
                  styles.loadingText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {verifying
                  ? 'Verifying payment with bank...'
                  : 'Loading secure payment form...'}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  webContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 13,
    fontWeight: '600',
  },
});
