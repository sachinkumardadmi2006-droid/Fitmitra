// Structured Programs Tab — mirrors frontend Programs.jsx
// Powered by live GET /api/v1/programs API
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Calendar,
  Clock,
  Award,
  Target,
  ChevronRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';
import { Colors } from '../../constants/theme';
import { workoutService, authService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { onDbUpdate } from '../../utils/events';
import { t } from '../../utils/i18n';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export default function ProgramsTab() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeProgramId, setActiveProgramId] = useState(user?.activeProgramId || null);

  const lang = user?.language || 'en';

  const loadData = useCallback(async () => {
    try {
      const result = await workoutService.getPrograms({ limit: 50 });
      const items = Array.isArray(result) ? result : result?.programs || result?.items || [];
      setPrograms(items);

      if (items.length > 0) {
        setSelectedProgram((prev) => {
          if (prev) {
            const stillExists = items.find((p) => (p._id || p.id) === (prev._id || prev.id));
            return stillExists || items[0];
          }
          return items[0];
        });
      }
    } catch (e) {
      console.warn('Error loading programs from server:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData();
    const unsub = onDbUpdate(loadData);
    return unsub;
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleStartProgram = async (programId) => {
    try {
      setActiveProgramId(programId);
      const localUser = await authService.getLocalUser();
      if (localUser) {
        await authService.saveLocalUser({
          ...localUser,
          activeProgramId: programId,
          activeProgramWeek: 1,
        });
      }
      Alert.alert(
        'Program Activated!',
        `You have enrolled in ${selectedProgram?.name || 'this program'}. Check your Dashboard for daily sessions!`
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to activate program.');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading training programs from server..." fullScreen />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryNeon} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('fitnessPrograms', lang)}</Text>
        <Text style={styles.headerSubtitle}>
          Structured multi-week periodized plans built for total transformation
        </Text>
      </View>

      {/* Program Selector Carousel / List */}
      <Text style={styles.sectionHeader}>{t('availablePrograms', lang)}</Text>
      {programs.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No Programs Available"
          description="Check back soon as new structured fitness programs are added to the library."
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingBottom: 10 }}
        >
          {programs.map((prog) => {
            const progId = prog._id || prog.id;
            const isActive = activeProgramId === progId;
            const isSelected = (selectedProgram?._id || selectedProgram?.id) === progId;

            return (
              <Pressable
                key={progId}
                style={[
                  styles.progCard,
                  isSelected && styles.progCardSelected,
                  isActive && styles.progCardActive,
                ]}
                onPress={() => setSelectedProgram(prog)}
              >
                <View style={styles.cardBadgeRow}>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>{prog.level || 'ALL LEVELS'}</Text>
                  </View>
                  {isActive && (
                    <View style={styles.activeTag}>
                      <Text style={styles.activeTagText}>Active</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.progCardTitle} numberOfLines={2}>
                  {prog.name}
                </Text>
                <Text style={styles.progCardTagline} numberOfLines={2}>
                  {prog.description || 'Targeted training routine'}
                </Text>

                <View style={styles.progCardMeta}>
                  <View style={styles.metaItem}>
                    <Clock size={12} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {prog.durationWeeks ? `${prog.durationWeeks} Weeks` : '4 Weeks'}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Target size={12} color={Colors.primaryNeon} />
                    <Text style={[styles.metaText, { color: Colors.primaryNeon }]}>
                      {prog.goal || 'Fitness'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Selected Program Details */}
      {selectedProgram && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{selectedProgram.level || 'ALL LEVELS'}</Text>
                </View>
                {activeProgramId === (selectedProgram._id || selectedProgram.id) && (
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTagText}>Enrolled & Active</Text>
                  </View>
                )}
              </View>
              <Text style={styles.detailTitle}>{selectedProgram.name}</Text>
              <Text style={styles.detailTagline}>{selectedProgram.description}</Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricStrip}>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{selectedProgram.durationWeeks || 4}</Text>
              <Text style={styles.metricLbl}>Weeks Total</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{selectedProgram.daysPerWeek || 5}</Text>
              <Text style={styles.metricLbl}>Days / Week</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{selectedProgram.level || 'INTERMEDIATE'}</Text>
              <Text style={styles.metricLbl}>Difficulty</Text>
            </View>
          </View>

          {/* Start Program Action */}
          {activeProgramId === (selectedProgram._id || selectedProgram.id) ? (
            <View style={styles.enrolledBox}>
              <CheckCircle2 size={18} color={Colors.primaryNeon} />
              <Text style={styles.enrolledText}>
                You are currently enrolled in this program!
              </Text>
            </View>
          ) : (
            <Pressable
              style={styles.startBtn}
              onPress={() => handleStartProgram(selectedProgram._id || selectedProgram.id)}
            >
              <Sparkles size={16} color="#000" />
              <Text style={styles.startBtnText}>Start This Program</Text>
            </Pressable>
          )}

          {/* Equipment needed */}
          {selectedProgram.equipment?.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.scheduleTitle}>Equipment Required</Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                {selectedProgram.equipment.join(' • ')}
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDarkBase,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  progCard: {
    width: 220,
    backgroundColor: Colors.bgCardGlass,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: 16,
    justifyContent: 'space-between',
  },
  progCardSelected: {
    borderColor: Colors.primaryNeon,
    backgroundColor: 'rgba(0, 245, 155, 0.04)',
  },
  progCardActive: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryNeon,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  activeTag: {
    backgroundColor: 'rgba(0, 245, 155, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryNeon,
  },
  progCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  progCardTagline: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 14,
  },
  progCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailCard: {
    backgroundColor: Colors.bgCardGlass,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: 20,
    marginTop: 16,
  },
  detailHeader: {
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  detailTagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  metricStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 12,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  metricLbl: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryNeon,
    paddingVertical: 14,
    borderRadius: 14,
  },
  startBtnText: {
    color: Colors.bgDarkBase,
    fontWeight: '800',
    fontSize: 14,
  },
  enrolledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 245, 155, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 155, 0.25)',
    borderRadius: 14,
    padding: 14,
  },
  enrolledText: {
    color: Colors.primaryNeon,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
});
