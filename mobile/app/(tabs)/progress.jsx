// Progress & Weight Transformation Tab — mirrors frontend Progress.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import {
  TrendingUp,
  History,
  Plus,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Flame,
} from 'lucide-react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line,
  Path,
  Circle,
  Text as SvgText,
} from 'react-native-svg';
import { Colors } from '../../constants/theme';
import {
  getUser,
  getWeightHistory,
  getWorkoutHistory,
  addWeightLog,
} from '../../utils/db';
import { onDbUpdate } from '../../utils/events';
import { t } from '../../utils/i18n';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProgressTab() {
  const [user, setUser] = useState(null);
  const [weightLogs, setWeightLogs] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [inputWeight, setInputWeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const u = await getUser();
      const weights = await getWeightHistory();
      const workouts = await getWorkoutHistory();
      setUser(u);
      setWeightLogs(weights || []);
      setWorkoutLogs(workouts || []);
    } catch (e) {
      console.warn('Error loading progress data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = onDbUpdate(loadData);
    return unsub;
  }, [loadData]);

  const handleAddWeight = async () => {
    const val = parseFloat(inputWeight);
    if (isNaN(val) || val <= 20 || val >= 300) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in KG (e.g. 72.5).');
      return;
    }

    try {
      setLogging(true);
      await addWeightLog(val);
      setInputWeight('');
      Alert.alert('Success', `Logged today's weight: ${val} kg`);
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to log weight entry.');
    } finally {
      setLogging(false);
    }
  };

  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryNeon} />
        <Text style={styles.loadingText}>Loading progress metrics...</Text>
      </View>
    );
  }

  const lang = user?.language || 'en';

  // Weight calculations
  const starting = Number(user.startingWeight) || 78;
  const current = Number(user.currentWeight) || (weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : 72);
  const goal = Number(user.goalWeight) || 68;

  let weightProgressPct = 0;
  const totalChangeNeeded = Math.abs(starting - goal);
  const totalChangeAchieved = Math.abs(starting - current);
  if (totalChangeNeeded > 0) {
    weightProgressPct = Math.min(100, Math.round((totalChangeAchieved / totalChangeNeeded) * 100));
  }

  // Render SVG Chart
  const renderSvgChart = () => {
    if (weightLogs.length < 2) {
      return (
        <View style={styles.chartFallback}>
          <AlertCircle size={24} color={Colors.textSecondary} />
          <Text style={styles.chartFallbackText}>
            Please log your weight on at least 2 different days to view the trend line.
          </Text>
        </View>
      );
    }

    const chartWidth = SCREEN_WIDTH - 64;
    const chartHeight = 160;
    const padding = 24;

    const weights = weightLogs.map((l) => Number(l.weight));
    const minW = Math.min(...weights) - 0.5;
    const maxW = Math.max(...weights) + 0.5;
    const wRange = maxW - minW === 0 ? 1 : maxW - minW;

    const points = weightLogs.map((log, index) => {
      const x = padding + (index / (weightLogs.length - 1)) * (chartWidth - padding * 2);
      const y =
        chartHeight -
        padding -
        ((Number(log.weight) - minW) / wRange) * (chartHeight - padding * 2);
      return { x, y, weight: log.weight, date: log.date };
    });

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    const fillPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(
      chartHeight - padding
    ).toFixed(1)} L ${points[0].x.toFixed(1)} ${(chartHeight - padding).toFixed(1)} Z`;

    return (
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <SvgLinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={Colors.primaryNeon} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={Colors.primaryNeon} stopOpacity="0.0" />
            </SvgLinearGradient>
          </Defs>

          {/* Grid lines */}
          <Line
            x1={padding}
            y1={padding}
            x2={chartWidth - padding}
            y2={padding}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
          <Line
            x1={padding}
            y1={chartHeight / 2}
            x2={chartWidth - padding}
            y2={chartHeight / 2}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
          <Line
            x1={padding}
            y1={chartHeight - padding}
            x2={chartWidth - padding}
            y2={chartHeight - padding}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />

          {/* Area fill */}
          <Path d={fillPath} fill="url(#chartGrad)" />

          {/* Stroke Line */}
          <Path
            d={linePath}
            fill="none"
            stroke={Colors.primaryNeon}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Points */}
          {points.map((p, i) => (
            <React.Fragment key={i}>
              <Circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill={Colors.primaryNeon}
                stroke={Colors.bgDarkCard}
                strokeWidth="2"
              />
              <SvgText
                x={p.x}
                y={p.y - 8}
                textAnchor="middle"
                fill={Colors.primaryNeon}
                fontSize="9"
                fontWeight="bold"
              >
                {p.weight}
              </SvgText>
              <SvgText
                x={p.x}
                y={chartHeight - 6}
                textAnchor="middle"
                fill={Colors.textSecondary}
                fontSize="8"
              >
                {p.date ? p.date.split('-')[2] : ''}
              </SvgText>
            </React.Fragment>
          ))}
        </Svg>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('progress', lang)}</Text>
        <Text style={styles.headerSubtitle}>
          Track body weights, trends, and review historical workout sessions
        </Text>
      </View>

      {/* Goal Transformation Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weight Transformation Goal</Text>

        <View style={styles.transRow}>
          <View style={styles.transBox}>
            <Text style={styles.transLabel}>Starting</Text>
            <Text style={styles.transVal}>{starting}</Text>
            <Text style={styles.transUnit}>KG</Text>
          </View>
          <Text style={styles.transArrow}>➔</Text>
          <View style={[styles.transBox, styles.transBoxActive]}>
            <Text style={[styles.transLabel, { color: Colors.primaryNeon }]}>Current</Text>
            <Text style={[styles.transVal, { color: Colors.primaryNeon }]}>{current}</Text>
            <Text style={styles.transUnit}>KG</Text>
          </View>
          <Text style={styles.transArrow}>➔</Text>
          <View style={styles.transBox}>
            <Text style={styles.transLabel}>Target Goal</Text>
            <Text style={styles.transVal}>{goal}</Text>
            <Text style={styles.transUnit}>KG</Text>
          </View>
        </View>

        {/* Bar */}
        <View style={styles.barLabelRow}>
          <Text style={styles.barLabelText}>Goal Progress</Text>
          <Text style={styles.barPctText}>{weightProgressPct}% Achieved</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${weightProgressPct}%` }]} />
        </View>

        {/* Chart */}
        <View style={styles.chartOuter}>
          <Text style={styles.chartSubtitle}>Weight Progression (KG)</Text>
          {renderSvgChart()}
        </View>
      </View>

      {/* Log Today's Weight */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Log Weight Entry</Text>
        <View style={styles.logWeightRow}>
          <TextInput
            style={styles.weightInput}
            placeholder="e.g. 71.8"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="numeric"
            value={inputWeight}
            onChangeText={setInputWeight}
          />
          <Pressable
            style={styles.logWeightBtn}
            onPress={handleAddWeight}
            disabled={logging}
          >
            {logging ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Plus size={16} color="#000" />
                <Text style={styles.logWeightBtnText}>Log Entry</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* Weight History Table */}
      <View style={styles.card}>
        <View style={styles.cardHeaderWithIcon}>
          <TrendingUp size={18} color={Colors.secondaryCyan} />
          <Text style={styles.cardTitle}>Weight Log Records</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.2 }]}>Date</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Weight</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Change</Text>
        </View>

        {weightLogs.slice().reverse().map((log, idx, arr) => {
          const nextLog = arr[idx + 1];
          let diffText = '-';
          let diffColor = Colors.textSecondary;
          if (nextLog) {
            const diff = Number(log.weight) - Number(nextLog.weight);
            if (diff > 0) {
              diffText = `+${diff.toFixed(1)} KG`;
              diffColor = Colors.accentRose;
            } else if (diff < 0) {
              diffText = `${diff.toFixed(1)} KG`;
              diffColor = Colors.secondaryCyan;
            } else {
              diffText = '0.0 KG';
            }
          }

          return (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 1.2, color: Colors.textSecondary }]}>
                {log.date}
              </Text>
              <Text style={[styles.td, { flex: 1, textAlign: 'center', fontWeight: '700' }]}>
                {log.weight} KG
              </Text>
              <Text style={[styles.td, { flex: 1, textAlign: 'right', color: diffColor, fontWeight: '700' }]}>
                {diffText}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Completed Workouts History */}
      <View style={styles.card}>
        <View style={styles.cardHeaderWithIcon}>
          <History size={18} color={Colors.primaryNeon} />
          <Text style={styles.cardTitle}>
            Completed Workouts ({workoutLogs.length})
          </Text>
        </View>

        {workoutLogs.length === 0 ? (
          <View style={styles.emptyWorkouts}>
            <AlertCircle size={28} color={Colors.textSecondary} />
            <Text style={styles.emptyWorkoutsText}>
              No workouts logged yet. Open the Workout tab to start a session!
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {workoutLogs.slice().reverse().map((w, idx) => (
              <View key={idx} style={styles.workoutRow}>
                <View style={styles.checkBadge}>
                  <CheckCircle2 size={16} color={Colors.primaryNeon} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.workoutName}>{w.name}</Text>
                  <Text style={styles.workoutMeta}>
                    {w.date} • {w.duration} mins
                  </Text>
                </View>
                <View style={styles.calBadge}>
                  <Flame size={12} color={Colors.accentAmber} />
                  <Text style={styles.calBadgeText}>+{w.calories} Kcal</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDarkBase,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 48,
    paddingBottom: 90,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bgDarkBase,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 10,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.bgDarkCard,
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  transRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
  },
  transBox: {
    alignItems: 'center',
    flex: 1,
  },
  transBoxActive: {
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
  },
  transLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  transVal: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  transUnit: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  transArrow: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barLabelText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  barPctText: {
    fontSize: 11,
    color: Colors.primaryNeon,
    fontWeight: '700',
  },
  progressTrack: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primaryNeon,
    borderRadius: 4,
  },
  chartOuter: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  chartSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  chartWrapper: {
    alignItems: 'center',
  },
  chartFallback: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  chartFallbackText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  logWeightRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  weightInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  logWeightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryNeon,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
  logWeightBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 6,
  },
  th: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  td: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  emptyWorkouts: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyWorkoutsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 12,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  workoutMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  calBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  calBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentAmber,
  },
});
