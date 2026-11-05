import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  Camera,
  Image as ImageIcon,
  Video,
  UploadCloud,
  Link,
  CheckCircle2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../../theme/ThemeContext';
import AppButton from '../ui/AppButton';
import {
  challengeService,
  PROOF_TYPES,
} from '../../services/challengeService';

export function SubmitProofModal({
  visible,
  challenge,
  onClose,
  onProofSubmitted,
}) {
  const { theme } = useAppTheme();
  const { colors, custom } = theme;

  const challengeId = challenge?._id || challenge?.id;
  const acceptedProofTypes = challenge?.proofTypes || [PROOF_TYPES.PHOTO];
  const allowsPhoto = acceptedProofTypes.includes(PROOF_TYPES.PHOTO);
  const allowsVideo = acceptedProofTypes.includes(PROOF_TYPES.VIDEO_LINK);

  // Tab: 'PHOTO' | 'VIDEO_LINK'
  const [selectedProofType, setSelectedProofType] = useState(
    allowsPhoto ? PROOF_TYPES.PHOTO : PROOF_TYPES.VIDEO_LINK
  );

  const [imageUri, setImageUri] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please grant photo library access to upload proof.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', err?.message || 'Could not select photo.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please grant camera access in device settings.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', err?.message || 'Could not take photo.');
    }
  };

  const handleSubmit = async () => {
    if (selectedProofType === PROOF_TYPES.PHOTO) {
      if (!imageUri) {
        Alert.alert('Photo Required', 'Please select or take a photo first.');
        return;
      }

      setSubmitting(true);
      try {
        // Step 1: Request presigned R2 upload URL
        const uploadData = await challengeService.getProofUploadUrl(challengeId, {
          mimeType: 'image/jpeg',
        });

        // Step 2: Convert local image to blob and upload via PUT
        const response = await fetch(imageUri);
        const blob = await response.blob();
        await challengeService.uploadPhotoToPresignedUrl(
          uploadData.uploadUrl,
          blob,
          'image/jpeg'
        );

        // Step 3: Register submission in database
        const result = await challengeService.submitProof(challengeId, {
          type: PROOF_TYPES.PHOTO,
          photoKey: uploadData.photoKey,
        });

        Alert.alert(
          'Proof Submitted! 🏅',
          'Your verification photo has been submitted. Our coaches will review and award your points.'
        );
        setImageUri(null);
        onProofSubmitted?.(result);
        onClose();
      } catch (err) {
        Alert.alert('Submission Failed', err?.message || 'Could not submit challenge proof.');
      } finally {
        setSubmitting(false);
      }
    } else {
      // VIDEO_LINK
      const trimmedUrl = videoUrl.trim();
      if (!trimmedUrl) {
        Alert.alert('URL Required', 'Please enter a valid video link (YouTube, Instagram, etc.).');
        return;
      }

      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        Alert.alert('Invalid URL', 'Please enter a full URL starting with https://');
        return;
      }

      setSubmitting(true);
      try {
        const result = await challengeService.submitProof(challengeId, {
          type: PROOF_TYPES.VIDEO_LINK,
          url: trimmedUrl,
        });

        Alert.alert(
          'Proof Submitted! 🏅',
          'Your video link has been submitted for verification. Points will be awarded once reviewed.'
        );
        setVideoUrl('');
        onProofSubmitted?.(result);
        onClose();
      } catch (err) {
        Alert.alert('Submission Failed', err?.message || 'Could not submit video proof.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.backdrop, { backgroundColor: colors.backdrop }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      >
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.onSurface }]}>
                Submit Challenge Proof
              </Text>
              <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
                {challenge?.title || 'Form & Task Verification'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}
            >
              <X size={18} color={colors.onSurface} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Proof Type Tabs (If both Photo and Video are allowed) */}
            {allowsPhoto && allowsVideo && (
              <View style={styles.toggleRow}>
                <Pressable
                  style={[
                    styles.toggleBtn,
                    selectedProofType === PROOF_TYPES.PHOTO
                      ? { backgroundColor: colors.primaryContainer }
                      : { backgroundColor: colors.surfaceVariant },
                  ]}
                  onPress={() => setSelectedProofType(PROOF_TYPES.PHOTO)}
                >
                  <Camera
                    size={15}
                    color={
                      selectedProofType === PROOF_TYPES.PHOTO
                        ? colors.onPrimaryContainer
                        : colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      styles.toggleBtnText,
                      {
                        color:
                          selectedProofType === PROOF_TYPES.PHOTO
                            ? colors.onPrimaryContainer
                            : colors.onSurfaceVariant,
                        fontWeight:
                          selectedProofType === PROOF_TYPES.PHOTO ? '700' : '500',
                      },
                    ]}
                  >
                    Photo Proof
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.toggleBtn,
                    selectedProofType === PROOF_TYPES.VIDEO_LINK
                      ? { backgroundColor: colors.primaryContainer }
                      : { backgroundColor: colors.surfaceVariant },
                  ]}
                  onPress={() => setSelectedProofType(PROOF_TYPES.VIDEO_LINK)}
                >
                  <Video
                    size={15}
                    color={
                      selectedProofType === PROOF_TYPES.VIDEO_LINK
                        ? colors.onPrimaryContainer
                        : colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      styles.toggleBtnText,
                      {
                        color:
                          selectedProofType === PROOF_TYPES.VIDEO_LINK
                            ? colors.onPrimaryContainer
                            : colors.onSurfaceVariant,
                        fontWeight:
                          selectedProofType === PROOF_TYPES.VIDEO_LINK ? '700' : '500',
                      },
                    ]}
                  >
                    Video Link
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Photo Proof UI */}
            {selectedProofType === PROOF_TYPES.PHOTO && (
              <View style={styles.section}>
                {imageUri ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: imageUri }} style={styles.previewImage} />
                    <Pressable
                      style={[styles.removeImageBtn, { backgroundColor: colors.error }]}
                      onPress={() => setImageUri(null)}
                      hitSlop={6}
                    >
                      <X size={14} color="#FFF" />
                    </Pressable>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.photoPickerBox,
                      { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceVariant + '40' },
                    ]}
                  >
                    <UploadCloud size={36} color={colors.primary} />
                    <Text style={[styles.pickerTitle, { color: colors.onSurface }]}>
                      Upload Workout / Form Photo
                    </Text>
                    <Text style={[styles.pickerSub, { color: colors.onSurfaceVariant }]}>
                      Clear photo showing required reps or completed task
                    </Text>

                    <View style={styles.actionButtonsRow}>
                      <Pressable
                        style={[styles.pickerBtn, { backgroundColor: colors.surfaceVariant }]}
                        onPress={handleTakePhoto}
                      >
                        <Camera size={16} color={colors.onSurface} />
                        <Text style={[styles.pickerBtnText, { color: colors.onSurface }]}>
                          Camera
                        </Text>
                      </Pressable>

                      <Pressable
                        style={[styles.pickerBtn, { backgroundColor: colors.surfaceVariant }]}
                        onPress={handlePickFromGallery}
                      >
                        <ImageIcon size={16} color={colors.onSurface} />
                        <Text style={[styles.pickerBtnText, { color: colors.onSurface }]}>
                          Gallery
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Video Link UI */}
            {selectedProofType === PROOF_TYPES.VIDEO_LINK && (
              <View style={styles.section}>
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>
                  Video URL (YouTube, Instagram Reel, Drive)
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
                  ]}
                >
                  <Link size={16} color={colors.onSurfaceVariant} />
                  <TextInput
                    style={[styles.textInput, { color: colors.onSurface }]}
                    placeholder="https://youtube.com/shorts/... or https://instagram.com/reel/..."
                    placeholderTextColor={colors.onSurfaceVariant}
                    value={videoUrl}
                    onChangeText={setVideoUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                </View>
                <Text style={[styles.inputHint, { color: colors.onSurfaceVariant }]}>
                  Ensure the video link is public so coaches can verify reps.
                </Text>
              </View>
            )}

            {/* Submit Action Button */}
            <View style={styles.submitRow}>
              <AppButton
                label={submitting ? 'Submitting Proof...' : 'Submit for Verification'}
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  toggleBtnText: {
    fontSize: 13,
  },
  section: {
    marginBottom: 20,
  },
  photoPickerBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  pickerSub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  pickerBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewContainer: {
    position: 'relative',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  inputHint: {
    fontSize: 11.5,
    marginTop: 6,
  },
  submitRow: {
    marginTop: 8,
  },
});

