import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../../theme/ThemeContext';
import { manualPaymentService } from '../../services/manualPaymentService';
import AppButton from '../ui/AppButton';

/**
 * ManualPaymentModal
 * Shows merchant UPI QR scanner, payment instructions, deep-link to UPI apps,
 * and handles UTR + receipt screenshot submission for manual verification.
 *
 * @param {boolean} visible
 * @param {object} orderContext { storeOrderId?: string, subscriptionPlanId?: string, amountInPaise?: number }
 * @param {Function} onClose
 * @param {Function} onSuccess (result) => void
 */
export default function ManualPaymentModal({
  visible,
  orderContext,
  onClose,
  onSuccess,
}) {
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [initError, setInitError] = useState(null);

  // Verification form state
  const [utrNumber, setUtrNumber] = useState('');
  const [userNote, setUserNote] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  // Initialize payment details when modal becomes visible
  const initPayment = useCallback(async () => {
    if (!orderContext) return;
    setLoading(true);
    setInitError(null);
    setSubmissionSuccess(null);
    setUtrNumber('');
    setUserNote('');
    setSelectedAsset(null);

    try {
      const payload = {};
      if (orderContext.storeOrderId) payload.storeOrderId = orderContext.storeOrderId;
      if (orderContext.subscriptionPlanId) payload.subscriptionPlanId = orderContext.subscriptionPlanId;

      const res = await manualPaymentService.createPaymentOrder(payload);
      setPaymentData(res);
    } catch (err) {
      setInitError(err.message || 'Unable to initialize manual UPI payment.');
    } finally {
      setLoading(false);
    }
  }, [orderContext]);

  useEffect(() => {
    if (visible) {
      initPayment();
    }
  }, [visible, initPayment]);

  // Handle Copy UPI ID
  const handleCopyUpi = () => {
    if (!paymentData?.merchantUpiId) return;
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Handle Copy Amount
  const handleCopyAmount = () => {
    if (!paymentData?.amountInRupees) return;
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2500);
  };

  // Open UPI Deep-link
  const handleOpenUpiApp = async () => {
    if (!paymentData?.upiIntentUrl) return;

    try {
      const supported = await Linking.canOpenURL(paymentData.upiIntentUrl);
      if (supported) {
        await Linking.openURL(paymentData.upiIntentUrl);
      } else {
        Alert.alert(
          'UPI Apps Not Found',
          `Could not open your UPI app automatically. Please open PhonePe, GPay, or Paytm, and pay to: ${paymentData.merchantUpiId}`
        );
      }
    } catch (err) {
      Alert.alert(
        'Payment App Error',
        `Could not launch UPI app. Please manually pay to: ${paymentData.merchantUpiId}`
      );
    }
  };

  // Pick Screenshot from Gallery
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow photo gallery access to upload your payment receipt screenshot.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setSelectedAsset(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to select image from gallery.');
    }
  };

  // Take Screenshot Photo via Camera
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow camera access to take a photo of your payment receipt.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setSelectedAsset(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to capture photo.');
    }
  };

  // Submit Verification Proof
  const handleSubmitProof = async () => {
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      Alert.alert('UTR Required', 'Please enter a valid 12-digit UTR or Transaction Reference Number.');
      return;
    }

    if (!selectedAsset) {
      Alert.alert('Screenshot Required', 'Please attach a screenshot of your successful UPI payment receipt.');
      return;
    }

    setSubmitting(true);
    setSubmitProgress('Uploading payment screenshot...');

    try {
      // Step 1: Upload screenshot to storage
      const proofImageUrl = await manualPaymentService.uploadPaymentProofScreenshot(selectedAsset);

      setSubmitProgress('Submitting verification proof...');

      // Step 2: Submit proof to backend
      const result = await manualPaymentService.submitPaymentProof({
        paymentId: paymentData.paymentId,
        orderId: orderContext?.storeOrderId,
        utrNumber: cleanUtr,
        proofImageUrl,
        userNote: userNote.trim() || undefined,
      });

      setSubmissionSuccess({
        utrNumber: cleanUtr,
        message: result.message || 'Payment proof submitted successfully!',
      });

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      Alert.alert('Submission Error', err?.message || 'Failed to submit payment verification proof. Please retry.');
    } finally {
      setSubmitting(false);
      setSubmitProgress('');
    }
  };

  // QR Code URL (uses merchant static QR or dynamically generates from UPI intent URL)
  const qrImageSource = paymentData?.qrCodeImageUrl
    ? { uri: paymentData.qrCodeImageUrl }
    : paymentData?.upiIntentUrl
    ? {
        uri: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
          paymentData.upiIntentUrl
        )}`,
      }
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={submitting ? undefined : onClose}
    >
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={styles.keyboardAvoid}
        >
          <View
            style={[
              styles.sheetContainer,
              { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
            ]}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
              <View style={styles.headerTitleWrap}>
                <View
                  style={[
                    styles.headerIconBox,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                >
                  <QrCode size={18} color={colors.onPrimaryContainer} />
                </View>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                    UPI QR Code Payment
                  </Text>
                  <Text style={[styles.headerSub, { color: colors.onSurfaceVariant }]}>
                    Scan, Pay & Submit Verification Proof
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={submitting ? undefined : onClose}
                hitSlop={10}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}
                disabled={submitting}
              >
                <X size={18} color={colors.onSurface} />
              </Pressable>
            </View>

            {/* Loading State */}
            {loading && (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
                  Generating payment QR details...
                </Text>
              </View>
            )}

            {/* Initialization Error State */}
            {!loading && initError && (
              <View style={styles.centerContainer}>
                <AlertCircle size={40} color={colors.error} />
                <Text style={[styles.errorTitle, { color: colors.error }]}>
                  Failed to Load Payment
                </Text>
                <Text style={[styles.errorMsg, { color: colors.onSurfaceVariant }]}>
                  {initError}
                </Text>
                <Pressable
                  style={[styles.retryBtn, { backgroundColor: colors.primary }]}
                  onPress={initPayment}
                >
                  <Text style={[styles.retryBtnText, { color: colors.onPrimary }]}>
                    Retry
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Success State Screen */}
            {!loading && submissionSuccess && (
              <View style={styles.successContainer}>
                <View
                  style={[
                    styles.successIconCircle,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                >
                  <CheckCircle2 size={54} color={colors.primary} />
                </View>
                <Text style={[styles.successTitle, { color: colors.onSurface }]}>
                  Proof Submitted for Review!
                </Text>
                <Text style={[styles.successDesc, { color: colors.onSurfaceVariant }]}>
                  Your UPI transaction is being verified by the FitMitra team. Your order or membership will be confirmed shortly once verified (usually within 15–30 minutes).
                </Text>

                <View
                  style={[
                    styles.successDetailBox,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
                  ]}
                >
                  <View style={styles.successRow}>
                    <Text style={[styles.successLabel, { color: colors.onSurfaceVariant }]}>
                      UTR / Ref ID:
                    </Text>
                    <Text style={[styles.successValue, { color: colors.onSurface }]}>
                      {submissionSuccess.utrNumber}
                    </Text>
                  </View>
                  <View style={styles.successRow}>
                    <Text style={[styles.successLabel, { color: colors.onSurfaceVariant }]}>
                      Status:
                    </Text>
                    <View style={styles.pendingBadge}>
                      <Clock size={12} color="#D97706" />
                      <Text style={styles.pendingBadgeText}>Verification Pending</Text>
                    </View>
                  </View>
                </View>

                <AppButton
                  tone="primary"
                  label="Done & View Orders"
                  onPress={onClose}
                  style={styles.successDoneBtn}
                />
              </View>
            )}

            {/* Main Payment & Upload Body */}
            {!loading && !initError && !submissionSuccess && paymentData && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                {/* Step 1: Scan & Pay Card */}
                <View
                  style={[
                    styles.card,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.stepBadge, { backgroundColor: colors.primary, color: colors.onPrimary }]}>
                      Step 1
                    </Text>
                    <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                      Scan QR or Pay via UPI
                    </Text>
                  </View>

                  {/* QR Image Box */}
                  <View style={styles.qrWrapper}>
                    {qrImageSource ? (
                      <View style={styles.qrImageFrame}>
                        <Image source={qrImageSource} style={styles.qrImage} resizeMode="contain" />
                      </View>
                    ) : (
                      <View style={styles.qrPlaceholder}>
                        <QrCode size={64} color={colors.onSurfaceVariant} />
                      </View>
                    )}
                  </View>

                  {/* Amount to Pay */}
                  <View style={styles.amountWrap}>
                    <Text style={[styles.amountLabel, { color: colors.onSurfaceVariant }]}>
                      Amount to Pay
                    </Text>
                    <View style={styles.amountValueRow}>
                      <Text style={[styles.amountValue, { color: colors.primary }]}>
                        ₹{Number(paymentData.amountInRupees).toFixed(2)}
                      </Text>
                      <Pressable
                        style={[styles.copyBtn, { backgroundColor: colors.surface }]}
                        onPress={handleCopyAmount}
                      >
                        {copiedAmount ? (
                          <Check size={14} color={colors.primary} />
                        ) : (
                          <Copy size={14} color={colors.onSurfaceVariant} />
                        )}
                        <Text style={[styles.copyBtnText, { color: colors.onSurfaceVariant }]}>
                          {copiedAmount ? 'Copied' : 'Copy'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* UPI ID Info Box */}
                  <View style={[styles.upiInfoRow, { backgroundColor: colors.surface }]}>
                    <View style={styles.upiTextWrap}>
                      <Text style={[styles.upiLabel, { color: colors.onSurfaceVariant }]}>
                        Merchant UPI ID
                      </Text>
                      <Text selectable style={[styles.upiValue, { color: colors.onSurface }]}>
                        {paymentData.merchantUpiId}
                      </Text>
                    </View>
                    <Pressable
                      style={[styles.copyBtn, { backgroundColor: colors.surfaceVariant }]}
                      onPress={handleCopyUpi}
                    >
                      {copiedUpi ? (
                        <Check size={14} color={colors.primary} />
                      ) : (
                        <Copy size={14} color={colors.onSurfaceVariant} />
                      )}
                      <Text style={[styles.copyBtnText, { color: colors.onSurfaceVariant }]}>
                        {copiedUpi ? 'Copied' : 'Copy UPI'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Open in UPI App Deep-link Button */}
                  <Pressable
                    style={[styles.openUpiBtn, { backgroundColor: custom?.primaryStrong || colors.primary }]}
                    onPress={handleOpenUpiApp}
                  >
                    <ExternalLink size={16} color="#FFFFFF" />
                    <Text style={styles.openUpiBtnText}>
                      Pay via GPay / PhonePe / Paytm
                    </Text>
                  </Pressable>
                </View>

                {/* Step 2: Verification Input Card */}
                <View
                  style={[
                    styles.card,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.stepBadge, { backgroundColor: colors.primary, color: colors.onPrimary }]}>
                      Step 2
                    </Text>
                    <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                      Submit Payment Proof
                    </Text>
                  </View>

                  {/* 12-digit UTR Input */}
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: colors.onSurface }]}>
                        Transaction Reference / UTR Number *
                      </Text>
                      <Text style={[styles.inputCounter, { color: colors.onSurfaceVariant }]}>
                        {utrNumber.trim().length > 0 ? `${utrNumber.trim().length} chars` : ''}
                      </Text>
                    </View>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.surface,
                          borderColor: utrNumber.trim().length >= 6 ? colors.primary : colors.outlineVariant,
                          color: colors.onSurface,
                        },
                      ]}
                      placeholder="e.g. 412356789012"
                      placeholderTextColor={colors.onSurfaceVariant}
                      value={utrNumber}
                      onChangeText={setUtrNumber}
                      keyboardType="number-pad"
                      maxLength={30}
                      autoCapitalize="characters"
                    />
                    <Text style={[styles.inputHint, { color: colors.onSurfaceVariant }]}>
                      Found in your bank/UPI payment receipt (12 digits for PhonePe, GPay, Paytm).
                    </Text>
                  </View>

                  {/* Screenshot Picker */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.onSurface }]}>
                      Payment Screenshot / Receipt *
                    </Text>

                    {selectedAsset ? (
                      <View style={[styles.previewFrame, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                        <Image source={{ uri: selectedAsset.uri }} style={styles.previewImage} resizeMode="contain" />
                        <View style={styles.previewActions}>
                          <Pressable
                            style={[styles.assetActionBtn, { backgroundColor: colors.surfaceVariant }]}
                            onPress={handlePickFromGallery}
                          >
                            <ImageIcon size={14} color={colors.onSurface} />
                            <Text style={[styles.assetActionText, { color: colors.onSurface }]}>Change</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.assetActionBtn, { backgroundColor: colors.surfaceVariant }]}
                            onPress={() => setSelectedAsset(null)}
                          >
                            <X size={14} color={colors.error} />
                            <Text style={[styles.assetActionText, { color: colors.error }]}>Remove</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.pickerBtnRow}>
                        <Pressable
                          style={[styles.pickerBtn, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
                          onPress={handleTakePhoto}
                        >
                          <Camera size={18} color={colors.primary} />
                          <Text style={[styles.pickerBtnText, { color: colors.onSurface }]}>
                            Take Photo
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[styles.pickerBtn, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
                          onPress={handlePickFromGallery}
                        >
                          <ImageIcon size={18} color={colors.primary} />
                          <Text style={[styles.pickerBtnText, { color: colors.onSurface }]}>
                            From Gallery
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>

                  {/* Optional Note */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.onSurface }]}>
                      Sender Name / Note (Optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        { backgroundColor: colors.surface, borderColor: colors.outlineVariant, color: colors.onSurface },
                      ]}
                      placeholder="e.g. Paid via GPay - Rahul"
                      placeholderTextColor={colors.onSurfaceVariant}
                      value={userNote}
                      onChangeText={setUserNote}
                      maxLength={150}
                    />
                  </View>

                  {/* Submission Progress Indicator */}
                  {submitting && (
                    <View style={styles.progressRow}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.progressText, { color: colors.primary }]}>
                        {submitProgress}
                      </Text>
                    </View>
                  )}

                  {/* Primary Submit Button */}
                  <Pressable
                    disabled={submitting || !utrNumber.trim() || !selectedAsset}
                    style={[
                      styles.submitBtn,
                      {
                        backgroundColor:
                          !utrNumber.trim() || !selectedAsset || submitting
                            ? colors.surfaceVariant
                            : colors.primary,
                      },
                    ]}
                    onPress={handleSubmitProof}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={colors.onPrimary} />
                    ) : (
                      <>
                        <ShieldCheck size={18} color={!utrNumber.trim() || !selectedAsset ? colors.onSurfaceVariant : colors.onPrimary} />
                        <Text
                          style={[
                            styles.submitBtnText,
                            {
                              color:
                                !utrNumber.trim() || !selectedAsset
                                  ? colors.onSurfaceVariant
                                  : colors.onPrimary,
                            },
                          ]}
                        >
                          Submit Proof for Verification
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>

                {/* Trust Footer Note */}
                <View style={styles.trustWrap}>
                  <ShieldCheck size={14} color={colors.onSurfaceVariant} />
                  <Text style={[styles.trustText, { color: colors.onSurfaceVariant }]}>
                    Payments are manually verified by authorized FitMitra staff against official bank credits.
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    maxHeight: '92%',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 16,
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 36,
    gap: 14,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  errorMsg: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  retryBtnText: {
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stepBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  qrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  qrImageFrame: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  qrImage: {
    width: 190,
    height: 190,
  },
  qrPlaceholder: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  amountWrap: {
    alignItems: 'center',
    gap: 4,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amountValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  upiInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  upiTextWrap: {
    flex: 1,
  },
  upiLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  upiValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  openUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  openUpiBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputCounter: {
    fontSize: 11,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputHint: {
    fontSize: 11,
    lineHeight: 15,
  },
  pickerBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  pickerBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewFrame: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    gap: 8,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  assetActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  assetActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  trustWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  trustText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    flex: 1,
  },
  successContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  successDetailBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginVertical: 6,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  successValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  successDoneBtn: {
    width: '100%',
    marginTop: 8,
  },
});

