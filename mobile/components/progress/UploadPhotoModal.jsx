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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Camera, Image as ImageIcon, UploadCloud } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '../../theme/ThemeContext';
import AppButton from '../ui/AppButton';
import { progressService } from '../../services/progressService';

export default function UploadPhotoModal({
  visible,
  onClose,
  onPhotoUploaded,
  defaultWeight = '',
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;

  const [imageUri, setImageUri] = useState(null);
  const [weightInput, setWeightInput] = useState(defaultWeight ? String(defaultWeight) : '');
  const [noteInput, setNoteInput] = useState('');
  const [uploading, setUploading] = useState(false);

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please enable photo library access in your settings.');
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
        Alert.alert('Permission Denied', 'Please enable camera access in your settings.');
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

  const handleUpload = async () => {
    if (!imageUri) {
      Alert.alert('Photo Required', 'Please select or take a progress photo first.');
      return;
    }

    setUploading(true);
    try {
      // Step 1: Request pre-signed S3/R2 upload URL
      const { uploadUrl, photoKey } = await progressService.getPhotoUploadUrl({
        contentType: 'image/jpeg',
      });

      // Step 2: Read image as blob and upload via PUT
      const response = await fetch(imageUri);
      const blob = await response.blob();
      await progressService.uploadPhotoToS3(uploadUrl, blob, 'image/jpeg');

      // Step 3: Confirm photo in database
      const payload = { photoKey };
      const parsedWeight = parseFloat(weightInput.trim());
      if (!isNaN(parsedWeight) && parsedWeight >= 20 && parsedWeight <= 400) {
        payload.weightKg = parsedWeight;
      }
      if (noteInput.trim()) {
        payload.note = noteInput.trim().slice(0, 200);
      }

      await progressService.confirmPhoto(payload);

      setImageUri(null);
      setNoteInput('');
      if (onPhotoUploaded) {
        onPhotoUploaded();
      }
      onClose();
      Alert.alert('Success', 'Transformation photo uploaded successfully.');
    } catch (err) {
      Alert.alert('Upload Failed', err?.message || 'Failed to upload photo to storage.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;
    setImageUri(null);
    setNoteInput('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      >
        <View
          style={[
            styles.modalCard,
            { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
              Add Transformation Photo
            </Text>
            <Pressable onPress={handleClose} hitSlop={8} disabled={uploading}>
              <X size={20} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <Text style={[styles.modalSub, { color: colors.onSurfaceVariant }]}>
            Capture your physique progress. Photos remain private and accessible only to you.
          </Text>

          {/* Photo Picker / Preview */}
          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <Pressable
                style={[styles.changePhotoBtn, { backgroundColor: colors.surface }]}
                onPress={() => setImageUri(null)}
                disabled={uploading}
              >
                <X size={14} color={colors.onSurface} />
                <Text style={[styles.changePhotoText, { color: colors.onSurface }]}>Change</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.pickerRow}>
              <Pressable
                style={[
                  styles.pickerBtn,
                  { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
                ]}
                onPress={handleTakePhoto}
              >
                <Camera size={24} color={colors.primary} />
                <Text style={[styles.pickerBtnText, { color: colors.onSurface }]}>Take Photo</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.pickerBtn,
                  { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
                ]}
                onPress={handlePickFromGallery}
              >
                <ImageIcon size={24} color={colors.secondary} />
                <Text style={[styles.pickerBtnText, { color: colors.onSurface }]}>Choose Gallery</Text>
              </Pressable>
            </View>
          )}

          {/* Optional Weight & Note */}
          <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
            Current Weight (kg) — optional
          </Text>
          <TextInput
            style={[
              styles.modalInput,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.outlineVariant,
                color: colors.onSurface,
              },
            ]}
            placeholder="e.g., 68.5"
            placeholderTextColor={colors.onSurfaceVariant}
            keyboardType="numeric"
            value={weightInput}
            onChangeText={setWeightInput}
            editable={!uploading}
          />

          <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
            Caption / Note — optional (max 200 chars)
          </Text>
          <TextInput
            style={[
              styles.modalInput,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.outlineVariant,
                color: colors.onSurface,
              },
            ]}
            placeholder="e.g., Week 8 cutting phase, feeling energetic"
            placeholderTextColor={colors.onSurfaceVariant}
            maxLength={200}
            value={noteInput}
            onChangeText={setNoteInput}
            editable={!uploading}
          />

          <View style={styles.modalActionWrap}>
            <AppButton
              tone="primary"
              label={uploading ? 'Uploading Photo...' : 'Upload & Save Photo'}
              loading={uploading}
              onPress={handleUpload}
              disabled={!imageUri || uploading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pickerBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pickerBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewContainer: {
    position: 'relative',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  changePhotoBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 14,
  },
  modalActionWrap: {
    marginTop: 6,
    marginBottom: 16,
  },
});

