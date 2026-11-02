import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { Camera, Plus, Trash2, Calendar, Scale, X } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from '../ui/AppCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 48) / 2;

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (_) {
    return dateStr;
  }
}

export default function TransformationPhotosCard({
  photos = [],
  onOpenUploadModal,
  onDeletePhoto,
  style,
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;

  const [viewingPhoto, setViewingPhoto] = useState(null);

  return (
    <AppCard variant="elevated" style={[styles.root, style]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryContainer }]}>
            <Camera size={18} color={colors.onPrimaryContainer} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.onSurface }]}>Physique Photos</Text>
            <Text style={[styles.subTitle, { color: colors.onSurfaceVariant }]}>
              {photos.length > 0 ? `${photos.length} transformation ${photos.length === 1 ? 'photo' : 'photos'}` : 'Visual physique progress logs'}
            </Text>
          </View>
        </View>

        {onOpenUploadModal && (
          <Pressable
            style={[
              styles.addBtn,
              { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
            ]}
            onPress={onOpenUploadModal}
          >
            <Plus size={14} color={colors.onPrimaryContainer} />
            <Text style={[styles.addBtnText, { color: colors.onPrimaryContainer }]}>Add Photo</Text>
          </Pressable>
        )}
      </View>

      {/* Photos Grid or Empty State */}
      {photos.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Camera size={32} color={colors.outlineVariant} />
          <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            Capture regular front, side, or back progress photos to visually track your body recomposition over time.
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {photos.map((item) => (
            <Pressable
              key={item.id}
              style={[
                styles.photoCard,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
              ]}
              onPress={() => setViewingPhoto(item)}
            >
              <Image
                source={{ uri: item.url }}
                style={styles.thumbnail}
                resizeMode="cover"
              />

              <View style={styles.photoMetaOverlay}>
                <View style={styles.metaRow}>
                  <View style={styles.dateBadge}>
                    <Calendar size={10} color="#fff" />
                    <Text style={styles.dateBadgeText}>{formatDate(item.dateKey)}</Text>
                  </View>

                  {item.weightKg && (
                    <View style={styles.weightBadge}>
                      <Scale size={10} color="#fff" />
                      <Text style={styles.weightBadgeText}>{item.weightKg} kg</Text>
                    </View>
                  )}
                </View>

                {onDeletePhoto && (
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => onDeletePhoto(item.id)}
                    hitSlop={8}
                  >
                    <Trash2 size={13} color="#fff" />
                  </Pressable>
                )}
              </View>

              {item.note ? (
                <Text
                  style={[styles.noteText, { color: colors.onSurfaceVariant }]}
                  numberOfLines={1}
                >
                  {item.note}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      )}

      {/* Full Size Photo View Modal */}
      <Modal
        visible={!!viewingPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingPhoto(null)}
      >
        <View style={styles.fullscreenBackdrop}>
          <Pressable
            style={styles.closeFullscreenBtn}
            onPress={() => setViewingPhoto(null)}
            hitSlop={12}
          >
            <X size={24} color="#fff" />
          </Pressable>

          {viewingPhoto && (
            <View style={styles.fullscreenContent}>
              <Image
                source={{ uri: viewingPhoto.url }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
              <View style={styles.fullscreenCaption}>
                <Text style={styles.fullscreenDate}>
                  {formatDate(viewingPhoto.dateKey)}
                  {viewingPhoto.weightKg ? ` • ${viewingPhoto.weightKg} kg` : ''}
                </Text>
                {viewingPhoto.note ? (
                  <Text style={styles.fullscreenNote}>{viewingPhoto.note}</Text>
                ) : null}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subTitle: {
    fontSize: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyWrap: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: GRID_ITEM_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    paddingBottom: 6,
  },
  thumbnail: {
    width: '100%',
    height: GRID_ITEM_WIDTH * 1.25,
  },
  photoMetaOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metaRow: {
    flexDirection: 'column',
    gap: 4,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dateBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  weightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  weightBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    padding: 5,
    borderRadius: 12,
  },
  noteText: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFullscreenBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullscreenContent: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '90%',
    height: '85%',
  },
  fullscreenCaption: {
    marginTop: 12,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  fullscreenDate: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  fullscreenNote: {
    color: '#ccc',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});

