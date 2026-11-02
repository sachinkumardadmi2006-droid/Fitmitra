import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Circle,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { TrendingDown, TrendingUp, Minus, Scale } from 'lucide-react-native';
import { useAppTheme } from '../../theme/ThemeContext';

/**
 * Format a YYYY-MM-DD or ISO string into a short readable date (e.g., "Oct 12")
 */
function formatDateLabel(dateStr) {
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

/**
 * Computes smooth cubic Bezier path coordinates between points
 */
function buildSmoothPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function WeightTrendChart({
  data = [],
  targetWeight = null,
  height = 200,
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

  // Filter and sort entries chronologically
  const sortedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    return [...data]
      .filter((d) => typeof d.weightKg === 'number' && d.weightKg > 0)
      .sort((a, b) => (a.dateKey || '').localeCompare(b.dateKey || ''));
  }, [data]);

  const activeIndex = selectedIndex !== null && selectedIndex >= 0 && selectedIndex < sortedData.length
    ? selectedIndex
    : sortedData.length - 1;

  const activeItem = sortedData[activeIndex] || null;

  // Chart layout dimensions
  const padLeft = 40;
  const padRight = 20;
  const padTop = 22;
  const padBottom = 26;
  const plotW = Math.max(10, containerWidth - padLeft - padRight);
  const plotH = Math.max(10, height - padTop - padBottom);

  // Domain computation
  const { yMin, yMax, yTicks, points, linePath, areaPath, targetY } = useMemo(() => {
    if (sortedData.length === 0) {
      return { yMin: 0, yMax: 100, yTicks: [], points: [], linePath: '', areaPath: '', targetY: null };
    }

    const weights = sortedData.map((d) => d.weightKg);
    const hasTarget = typeof targetWeight === 'number' && targetWeight > 0;
    const allVals = hasTarget ? [...weights, targetWeight] : weights;

    let min = Math.min(...allVals);
    let max = Math.max(...allVals);

    // If identical, add padding
    if (min === max) {
      min -= 2;
      max += 2;
    } else {
      const padding = Math.max((max - min) * 0.18, 1);
      min = Math.floor(min - padding);
      max = Math.ceil(max + padding);
    }

    const range = max - min || 1;

    // Build points
    const pts = sortedData.map((d, i) => {
      const x = padLeft + (sortedData.length > 1 ? (i / (sortedData.length - 1)) * plotW : plotW / 2);
      const y = padTop + plotH - ((d.weightKg - min) / range) * plotH;
      return { x, y, ...d };
    });

    const lPath = buildSmoothPath(pts);
    const firstX = pts[0]?.x ?? padLeft;
    const lastX = pts[pts.length - 1]?.x ?? (padLeft + plotW);
    const bottomY = padTop + plotH;
    const aPath = pts.length > 1 ? `${lPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z` : '';

    const tY = hasTarget ? padTop + plotH - ((targetWeight - min) / range) * plotH : null;

    // 3 clean Y ticks: min, mid, max
    const mid = Math.round((min + max) / 2);
    const ticks = [
      { val: max, y: padTop },
      { val: mid, y: padTop + plotH / 2 },
      { val: min, y: padTop + plotH },
    ];

    return {
      yMin: min,
      yMax: max,
      yTicks: ticks,
      points: pts,
      linePath: lPath,
      areaPath: aPath,
      targetY: tY,
    };
  }, [sortedData, targetWeight, plotW, plotH, padLeft, padTop]);

  // Overall net change for data set
  const netChange = useMemo(() => {
    if (sortedData.length < 2) return null;
    const start = sortedData[0].weightKg;
    const end = sortedData[sortedData.length - 1].weightKg;
    return Math.round((end - start) * 10) / 10;
  }, [sortedData]);

  // Handle tap to select closest point
  const handlePressChart = (evt) => {
    if (points.length < 2) return;
    const touchX = evt.nativeEvent.locationX;
    let closestIdx = 0;
    let minDist = Infinity;
    points.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - touchX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });
    setSelectedIndex(closestIdx);
  };

  const activePoint = points[activeIndex] || null;

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      {/* Header Stat & Selected Point Callout */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.onSurface }]}>Weight Trend</Text>
          {activeItem ? (
            <View style={styles.activePillRow}>
              <Text style={[styles.activeWeight, { color: colors.primary }]}>
                {activeItem.weightKg} <Text style={styles.kgUnit}>kg</Text>
              </Text>
              <Text style={[styles.activeDate, { color: colors.onSurfaceVariant }]}>
                • {formatDateLabel(activeItem.dateKey)}
              </Text>
              {typeof targetWeight === 'number' && targetWeight > 0 && (
                <Text
                  style={[
                    styles.targetDiff,
                    {
                      color:
                        activeItem.weightKg <= targetWeight
                          ? colors.primary
                          : colors.secondary,
                    },
                  ]}
                >
                  ({Math.round((activeItem.weightKg - targetWeight) * 10) / 10 > 0 ? '+' : ''}
                  {Math.round((activeItem.weightKg - targetWeight) * 10) / 10} kg to target)
                </Text>
              )}
            </View>
          ) : (
            <Text style={[styles.subText, { color: colors.onSurfaceVariant }]}>
              No weigh-ins in this period
            </Text>
          )}
        </View>

        {netChange !== null && (
          <View
            style={[
              styles.changeBadge,
              {
                backgroundColor: netChange <= 0 ? colors.primaryContainer : colors.surfaceVariant,
                borderColor: netChange <= 0 ? colors.primary : colors.outlineVariant,
              },
            ]}
          >
            {netChange < 0 ? (
              <TrendingDown size={14} color={colors.primary} />
            ) : netChange > 0 ? (
              <TrendingUp size={14} color={colors.secondary} />
            ) : (
              <Minus size={14} color={colors.onSurfaceVariant} />
            )}
            <Text
              style={[
                styles.changeBadgeText,
                { color: netChange <= 0 ? colors.onPrimaryContainer : colors.onSurface },
              ]}
            >
              {netChange > 0 ? `+${netChange}` : netChange} kg
            </Text>
          </View>
        )}
      </View>

      {/* SVG Canvas Area */}
      {sortedData.length === 0 ? (
        <View style={[styles.emptyChartWrap, { height }]}>
          <Scale size={32} color={colors.outlineVariant} />
          <Text style={[styles.emptyChartText, { color: colors.onSurfaceVariant }]}>
            Log at least one weigh-in to display your progress curve
          </Text>
        </View>
      ) : (
        <Pressable onPress={handlePressChart}>
          <Svg width={containerWidth} height={height}>
            <Defs>
              <LinearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.32} />
                <Stop offset="80%" stopColor={colors.primary} stopOpacity={0.06} />
                <Stop offset="100%" stopColor={colors.primary} stopOpacity={0.0} />
              </LinearGradient>
            </Defs>

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
                  fontSize={10}
                  fontWeight="600"
                  textAnchor="end"
                >
                  {tick.val}
                </SvgText>
              </G>
            ))}

            {/* Target Weight Guide Line (if configured) */}
            {targetY !== null && targetY >= padTop && targetY <= padTop + plotH && (
              <G>
                <Line
                  x1={padLeft}
                  y1={targetY}
                  x2={containerWidth - padRight}
                  y2={targetY}
                  stroke={colors.secondary || '#F59E0B'}
                  strokeWidth={1.5}
                  strokeDasharray="5,4"
                />
                <SvgText
                  x={containerWidth - padRight}
                  y={targetY - 5}
                  fill={colors.secondary || '#F59E0B'}
                  fontSize={9.5}
                  fontWeight="700"
                  textAnchor="end"
                >
                  Target {targetWeight} kg
                </SvgText>
              </G>
            )}

            {/* Gradient Area Fill */}
            {areaPath ? <Path d={areaPath} fill="url(#weightAreaGrad)" /> : null}

            {/* Smooth Curve Line */}
            {linePath ? (
              <Path
                d={linePath}
                fill="none"
                stroke={colors.primary}
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Active Vertical Guideline */}
            {activePoint && (
              <Line
                x1={activePoint.x}
                y1={padTop}
                x2={activePoint.x}
                y2={padTop + plotH}
                stroke={colors.primary}
                strokeWidth={1.2}
                strokeDasharray="3,3"
                opacity={0.5}
              />
            )}

            {/* Points on curve */}
            {points.map((pt, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <G key={`pt-${idx}`}>
                  {isSelected && (
                    <Circle
                      cx={pt.x}
                      cy={pt.y}
                      r={9}
                      fill={colors.primary}
                      opacity={0.22}
                    />
                  )}
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 5 : 3}
                    fill={isSelected ? colors.primary : colors.surface}
                    stroke={colors.primary}
                    strokeWidth={isSelected ? 2 : 1.5}
                  />
                </G>
              );
            })}

            {/* X-axis date labels: First, Middle, Last */}
            {points.length > 0 && (
              <SvgText
                x={points[0].x}
                y={padTop + plotH + 18}
                fill={colors.onSurfaceVariant}
                fontSize={10}
                fontWeight="500"
                textAnchor="start"
              >
                {formatDateLabel(points[0].dateKey)}
              </SvgText>
            )}
            {points.length > 2 && (
              <SvgText
                x={points[Math.floor(points.length / 2)].x}
                y={padTop + plotH + 18}
                fill={colors.onSurfaceVariant}
                fontSize={10}
                fontWeight="500"
                textAnchor="middle"
              >
                {formatDateLabel(points[Math.floor(points.length / 2)].dateKey)}
              </SvgText>
            )}
            {points.length > 1 && (
              <SvgText
                x={points[points.length - 1].x}
                y={padTop + plotH + 18}
                fill={colors.onSurfaceVariant}
                fontSize={10}
                fontWeight="500"
                textAnchor="end"
              >
                {formatDateLabel(points[points.length - 1].dateKey)}
              </SvgText>
            )}
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
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  activeWeight: {
    fontSize: 20,
    fontWeight: '800',
  },
  kgUnit: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  targetDiff: {
    fontSize: 11,
    fontWeight: '600',
  },
  subText: {
    fontSize: 12,
    marginTop: 2,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  changeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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

