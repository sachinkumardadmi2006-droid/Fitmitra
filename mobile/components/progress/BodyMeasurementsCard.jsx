import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ruler, Plus, TrendingDown, TrendingUp, Minus } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from '../ui/AppCard';

const MEASUREMENT_FIELDS = [
  { key: 'chestCm', label: 'Chest' },
  { key: 'waistCm', label: 'Waist' },
  { key: 'armsCm', label: 'Arms' },
  { key: 'thighsCm', label: 'Thighs' },
];

export default function BodyMeasurementsCard({
  measurementsData,
  onOpenLogModal,
  style,
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;

  const changes = measurementsData?.changes || {};
  const entries = measurementsData?.entries || [];

  return (
    <AppCard variant="elevated" style={[styles.root, style]}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <View style={[styles.rulerWrap, { backgroundColor: colors.primaryContainer }]}>
            <Ruler size={18} color={colors.onPrimaryContainer} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.onSurface }]}>Body Circumference</Text>
            <Text style={[styles.subTitle, { color: colors.onSurfaceVariant }]}>
              {entries.length > 0 ? `${entries.length} log ${entries.length === 1 ? 'entry' : 'entries'} recorded` : 'Track chest, waist, arms & thighs'}
            </Text>
          </View>
        </View>

        {onOpenLogModal && (
          <Pressable
            style={[
              styles.logBtn,
              { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
            ]}
            onPress={onOpenLogModal}
          >
            <Plus size={14} color={colors.onPrimaryContainer} />
            <Text style={[styles.logBtnText, { color: colors.onPrimaryContainer }]}>
              Log
            </Text>
          </Pressable>
        )}
      </View>

      {/* 4 Metric Tiles Grid (2x2) */}
      <View style={styles.grid}>
        {MEASUREMENT_FIELDS.map((f) => {
          const fieldData = changes[f.key];
          const latestVal = fieldData?.latest ?? null;
          const delta = fieldData?.sinceLast ?? null;

          return (
            <View
              key={f.key}
              style={[
                styles.tile,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
              ]}
            >
              <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
                {f.label}
              </Text>

              <Text style={[styles.fieldVal, { color: colors.onSurface }]}>
                {latestVal !== null ? (
                  <>
                    {latestVal} <Text style={styles.cmUnit}>cm</Text>
                  </>
                ) : (
                  '—'
                )}
              </Text>

              {delta !== null ? (
                <View style={styles.deltaRow}>
                  {delta < 0 ? (
                    <TrendingDown size={12} color={colors.primary} />
                  ) : delta > 0 ? (
                    <TrendingUp size={12} color={colors.secondary} />
                  ) : (
                    <Minus size={12} color={colors.onSurfaceVariant} />
                  )}
                  <Text
                    style={[
                      styles.deltaText,
                      { color: delta < 0 ? colors.primary : delta > 0 ? colors.secondary : colors.onSurfaceVariant },
                    ]}
                  >
                    {delta > 0 ? `+${delta}` : delta} cm
                  </Text>
                </View>
              ) : (
                <Text style={[styles.noDeltaText, { color: colors.onSurfaceVariant }]}>
                  {latestVal !== null ? 'First entry' : 'Not logged'}
                </Text>
              )}
            </View>
          );
        })}
      </View>
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
  rulerWrap: {
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
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  logBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldVal: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  cmUnit: {
    fontSize: 12,
    fontWeight: '500',
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deltaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noDeltaText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});

