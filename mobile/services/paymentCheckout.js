// FitMitra — Unified Payment Checkout Service
// Controls the lifecycle of Razorpay Checkout via PaymentCheckoutModal

let checkoutHandler = null;

/**
 * Internal registration function used by PaymentCheckoutModal
 * @param {Function} handler (order, resolve) => void
 * @returns {Function} unregister cleanup
 */
export function registerCheckoutHandler(handler) {
  checkoutHandler = handler;
  return () => {
    if (checkoutHandler === handler) {
      checkoutHandler = null;
    }
  };
}

/**
 * Open Razorpay Checkout WebView modal
 * @param {object} order
 * @param {string} order.providerOrderId Razorpay Order ID from backend
 * @param {string} order.keyId Razorpay Key ID
 * @param {number} order.amountInPaise Amount in paise from server order
 * @param {string} [order.currency='INR'] Currency code
 * @param {object} [order.prefill] User contact details { name, email, phone }
 * @param {object} order.verifyPayload Either { storeOrderId } or { subscriptionPlanId }
 * @returns {Promise<{ status: 'success' | 'failed' | 'cancelled', message?: string }>}
 */
export async function openCheckout(order) {
  if (!checkoutHandler) {
    return {
      status: 'failed',
      message: 'PaymentCheckoutModal is not mounted in the application root.',
    };
  }

  return new Promise((resolve) => {
    checkoutHandler(order, resolve);
  });
}

/**
 * Map backend cash order response to openCheckout options
 * @param {object} orderDoc Server Order document
 * @param {object} paymentInfo Server Payment credentials
 * @param {object} [user] User contact details
 * @param {object} [fallbackAddress] Delivery address fallback
 */
export function mapCashOrderToCheckout(orderDoc, paymentInfo, user = {}, fallbackAddress = {}) {
  const address = orderDoc?.deliveryAddress || fallbackAddress;
  return {
    providerOrderId: paymentInfo?.providerOrderId,
    keyId: paymentInfo?.keyId,
    amountInPaise: paymentInfo?.amountInPaise || orderDoc?.totalAmountInPaise,
    currency: paymentInfo?.currency || 'INR',
    prefill: {
      name: address?.fullName || user?.name || user?.displayName || '',
      email: user?.email || '',
      phone: address?.phone || user?.phone || '',
    },
    verifyPayload: {
      storeOrderId: orderDoc?._id,
    },
  };
}

