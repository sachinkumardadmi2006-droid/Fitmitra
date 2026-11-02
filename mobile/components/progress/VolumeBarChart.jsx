import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, {
  Rect,
  Line,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { Dumbbell, Calendar } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';

function formatWeekLabel(dateStr) {
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

function formatVolumeK(val) {
  if (!val || val === 0) return '0 kg';
  if (val >= 1000) {
    return `${(val / 1000).toFixed(1)}k kg`;
  }
  return `${Math.round(val)} kg`;
}

export default function VolumeBarChart({
  data = [],
  height = 190,
  style,
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;

  const [containerWidth, setContainerWidth] = useState(320);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const onLayout = useCallback((e) => {
    const w = e.nativeEvent.layout.width;
    if (w > 50) {
      setContainerWidth(w);
    }
  }, []);

  // Sort weeks chronologically
  const sortedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    return [...data].sort((a, b) => (a.weekStartKey || '').localeCompare(b.weekStartKey || ''));
  }, [data]);

  const activeIndex = selectedIndex !== null && selectedIndex >= 0 && selectedIndex < sortedData.length
    ? selectedIndex
    : sortedData.length - 1;

  const activeItem = sortedData[activeIndex] || null;

  // Total volume across all weeks
  const totalVolume = useMemo(() => {
    return sortedData.reduce((acc, curr) => acc + (Number(curr.volumeKg) || 0), 0);
  }, [sortedData]);

  // Dimensions
  const padLeft = 44;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 26;
  const plotW = Math.max(10, containerWidth - padLeft - padRight);
  const plotH = Math.max(10, height - padTop - padBottom);

  const maxVolume = useMemo(() => {
    if (sortedData.length === 0) return 1000;
    const maxVal = Math.max(...sortedData.map((d) => Number(d.volumeKg) || 0));
    return maxVal > 0 ? Math.ceil(maxVal * 1.15) : 1000;
  }, [sortedData]);

  // Compute bar positions
  const barItems = useMemo(() => {
    const count = sortedData.length;
    if (count === 0) return [];

    const slotW = plotW / count;
    const barW = Math.min(Math.max(slotW * 0.55, 10), 32);

    return sortedData.map((item, idx) => {
      const vol = Number(item.volumeKg) || 0;
      const barH = maxVolume > 0 ? (vol / maxVolume) * plotH : 0;
      const x = padLeft + idx * slotW + (slotW - barW) / 2;
      const y = padTop + plotH - barH;

      return {
        ...item,
        barX: x,
        barY: y,
        barW,
        barH: Math.max(barH, 3), // At least 3px visible height
        centerX: x + barW / 2,
      };
    });
  }, [sortedData, plotW, plotH, padLeft, padTop, maxVolume]);

  const yTicks = useMemo(() => {
    return [
      { val: maxVolume, y: padTop },
      { val: Math.round(maxVolume / 2), y: padTop + plotH / 2 },
      { val: 0, y: padTop + plotH },
    ];
  }, [maxVolume, padTop, plotH]);

  const handlePressChart = (evt) => {
    if (barItems.length === 0) return;
    const touchX = evt.nativeEvent.locationX;
    let closestIdx = 0;
    let minDist = Infinity;
    barItems.forEach((bar, idx) => {
      const dist = Math.abs(bar.centerX - touchX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });
    setSelectedIndex(closestIdx);
  };

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      {/* Header with Title and Selected Week Details */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Weekly Training Volume
          </Text>
          {activeItem ? (
            <View style={styles.activePillRow}>
              <Text style={[styles.activeVol, { color: colors.primary }]}>
                {Math.round(activeItem.volumeKg || 0).toLocaleString()} <Text style={styles.kgUnit}>kg</Text>
              </Text>
              <Text style={[styles.activeMeta, { color: colors.onSurfaceVariant }]}>
                • Week of {formatWeekLabel(activeItem.weekStartKey)}
              </Text>
              <View
                style={[
                  styles.sessionsBadge,
                  { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant },
                ]}
              >
                <Dumbbell size={11} color={colors.primary} />
                <Text style={[styles.sessionsBadgeText, { color: colors.onSurface }]}>
                  {activeItem.sessions || 0} {activeItem.sessions === 1 ? 'session' : 'sessions'}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.subText, { color: colors.onSurfaceVariant }]}>
              No volume recorded in this timeframe
            </Text>
          )}
        </View>

        {totalVolume > 0 && (
          <View style={styles.totalWrap}>
            <Text style={[styles.totalLabel, { color: colors.onSurfaceVariant }]}>
              Total Volume
            </Text>
            <Text style={[styles.totalVal, { color: colors.onSurface }]}>
              {formatVolumeK(totalVolume)}
            </Text>
          </View>
        )}
      </View>

      {/* SVG Bar Chart Canvas */}
      {sortedData.length === 0 ? (
        <View style={[styles.emptyChartWrap, { height }]}>
          <Dumbbell size={32} color={colors.outlineVariant} />
          <Text style={[styles.emptyChartText, { color: colors.onSurfaceVariant }]}>
            Completed workouts with logged weights and reps will automatically populate your volume trends here.
          </Text>
        </View>
      ) : (
        <Pressable onPress={handlePressChart}>
          <Svg width={containerWidth} height={height}>
            {/* Horizontal Grid lines and Y labels */}
            {yTicks.map((tick, idx) => (
              <G key={`ytick-${idx}`}>
                <Line
                  x1={padLeft}
                  y1={tick.y}
                  x2={containerWidth - padRight}
                  y2={tick.y}
                  stroke={colors.outlineVariant}
                  strokeWidth={0.8}
                  strokeDasharray="4,4"
                  opacity={0.6}
                />
                <SvgText
                  x={padLeft - 6}
                  y={tick.y + 3.5}
                  fill={colors.onSurfaceVariant}
                  fontSize={9.5}
                  fontWeight="600"
                  textAnchor="end"
                >
                  {tick.val >= 1000 ? `${Math.round(tick.val / 1000)}k` : tick.val}
                </SvgText>
              </G>
            ))}

            {/* Volume Bars */}
            {barItems.map((bar, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <G key={`bar-${idx}`}>
                  <Rect
                    x={bar.barX}
                    y={bar.barY}
                    width={bar.barW}
                    height={bar.barH}
                    rx={4}
                    ry={4}
                    fill={isSelected ? colors.primary : colors.primaryContainer}
                  />
                  {/* Highlight outline when selected */}
                  {isSelected && (
                    <Rect
                      x={bar.barX - 1.5}
                      y={bar.barY - 1.5}
                      width={bar.barW + 3}
                      height={bar.barH + 3}
                      rx={5}
                      ry={5}
                      fill="none"
                      stroke={colors.primary}
                      strokeWidth={1.5}
                    />
                  )}

                  {/* Session count mini text above bar */}
                  {bar.sessions > 0 && (
                    <SvgText
                      x={bar.centerX}
                      y={Math.max(padTop - 2, bar.barY - 4)}
                      fill={isSelected ? colors.primary : colors.onSurfaceVariant}
                      fontSize={9}
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {bar.sessions}x
                    </SvgText>
                  )}

                  {/* X-axis week label */}
                  <SvgText
                    x={bar.centerX}
                    y={padTop + plotH + 18}
                    fill={isSelected ? colors.primary : colors.onSurfaceVariant}
                    fontSize={9.5}
                    fontWeight={isSelected ? '700' : '500'}
                    textAnchor="middle"
                  >
                    {formatWeekLabel(bar.weekStartKey)}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  activePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  activeVol: {
    fontSize: 18,
    fontWeight: '800',
  },
  kgUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeMeta: {
    fontSize: 11,
    fontWeight: '500',
  },
  sessionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 2,
  },
  sessionsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
  },
  totalWrap: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptyChartWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyChartText: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
});

