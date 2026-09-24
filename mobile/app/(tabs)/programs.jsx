// Structured Programs Tab — mirrors frontend Programs.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
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
import { getUser, saveUser } from '../../utils/db';
import { PROGRAMS } from '../../data/mockData';
import { onDbUpdate } from '../../utils/events';
import { t } from '../../utils/i18n';

export default function ProgramsTab() {
  const [user, setUser] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const u = await getUser();
      setUser(u);
      if (PROGRAMS && PROGRAMS.length > 0) {
        setSelectedProgram((prev) => prev || PROGRAMS[0]);
      }
    } catch (e) {
      console.warn('Error loading programs:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = onDbUpdate(loadData);
    return unsub;
  }, [loadData]);

  const handleStartProgram = async (programId) => {
    try {
      const updatedUser = {
        ...user,
        activeProgramId: programId,
        activeProgramWeek: 1,
      };
      await saveUser(updatedUser);
      setUser(updatedUser);
      Alert.alert(
        'Program Activated!',
        `You have enrolled in ${selectedProgram?.name || 'this program'}. Check your Dashboard for daily tasks!`
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to activate program.');
    }
  };

  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryNeon} />
        <Text style={styles.loadingText}>Loading training programs...</Text>
      </View>
    );
  }

  const lang = user?.language || 'en';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('fitnessPrograms', lang)}</Text>
        <Text style={styles.headerSubtitle}>
          Structured multi-week periodized plans built for total transformation
        </Text>
      </View>

      {/* Program Selector Carousel / List */}
      <Text style={styles.sectionHeader}>{t('availablePrograms', lang)}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingBottom: 10 }}
      >
        {PROGRAMS.map((prog) => {
          const isActive = user.activeProgramId === prog.id;
          const isSelected = selectedProgram?.id === prog.id;

          return (
            <Pressable
              key={prog.id}
              style={[
                styles.progCard,
                isSelected && styles.progCardSelected,
                isActive && styles.progCardActive,
              ]}
              onPress={() => setSelectedProgram(prog)}
            >
              <View style={styles.cardBadgeRow}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{prog.level}</Text>
                </View>
                {isActive && (
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTagText}>Active</Text>
                  </View>
                )}
              </View>

              <Text style={styles.progCardTitle}>
                {lang === 'kn' && prog.nameKn ? prog.nameKn : prog.name}
              </Text>
              <Text style={styles.progCardTagline} numberOfLines={2}>
                {lang === 'kn' && prog.taglineKn ? prog.taglineKn : prog.tagline}
              </Text>

              <View style={styles.progCardMeta}>
                <View style={styles.metaItem}>
                  <Clock size={12} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{prog.durationWeeks} Weeks</Text>
                </View>
                <View style={styles.metaItem}>
                  <Target size={12} color={Colors.primaryNeon} />
                  <Text style={[styles.metaText, { color: Colors.primaryNeon }]}>
                    {prog.goal}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Selected Program Details */}
      {selectedProgram && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{selectedProgram.level}</Text>
                </View>
                {user.activeProgramId === selectedProgram.id && (
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTagText}>Enrolled & Active</Text>
                  </View>
                )}
              </View>
              <Text style={styles.detailTitle}>
                {lang === 'kn' && selectedProgram.nameKn
                  ? selectedProgram.nameKn
                  : selectedProgram.name}
              </Text>
              <Text style={styles.detailTagline}>
                {lang === 'kn' && selectedProgram.taglineKn
                  ? selectedProgram.taglineKn
                  : selectedProgram.tagline}
              </Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricStrip}>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{selectedProgram.durationWeeks}</Text>
              <Text style={styles.metricLbl}>Weeks Total</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{selectedProgram.daysPerWeek || 5}</Text>
              <Text style={styles.metricLbl}>Days / Week</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{selectedProgram.level}</Text>
              <Text style={styles.metricLbl}>Difficulty</Text>
            </View>
          </View>

          {/* Start Program Action */}
          {user.activeProgramId === selectedProgram.id ? (
            <View style={styles.enrolledBox}>
              <CheckCircle2 size={18} color={Colors.primaryNeon} />
              <Text style={styles.enrolledText}>
                You are currently following Week {user.activeProgramWeek || 1} of this program
              </Text>
            </View>
          ) : (
            <Pressable
              style={styles.startBtn}
              onPress={() => handleStartProgram(selectedProgram.id)}
            >
              <Sparkles size={16} color="#000" />
              <Text style={styles.startBtnText}>Start This Program</Text>
            </Pressable>
          )}

          {/* Weekly Schedule Breakdown */}
          <Text style={styles.scheduleTitle}>7-Day Routine Breakdown</Text>
          <View style={styles.scheduleList}>
            {selectedProgram.schedule?.map((item, idx) => {
              const isRest = item.activity.toLowerCase().includes('rest');
              return (
                <View key={idx} style={[styles.dayRow, isRest && styles.dayRowRest]}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>Day {item.day}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dayActivity, isRest && styles.dayActivityRest]}>
                      {item.activity}
                    </Text>
                    {item.focus && (
                      <Text style={styles.dayFocus}>Focus: {item.focus}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Highlights & Requirements */}
          {selectedProgram.description && (
            <View style={styles.descBox}>
              <Text style={styles.descTitle}>Program Overview</Text>
              <Text style={styles.descText}>{selectedProgram.description}</Text>
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
  sectionHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  progCard: {
    width: 230,
    backgroundColor: Colors.bgDarkCard,
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    justifyContent: 'space-between',
  },
  progCardSelected: {
    borderColor: Colors.primaryNeon,
    backgroundColor: 'rgba(204, 255, 0, 0.04)',
  },
  progCardActive: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondaryCyan,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCyan,
  },
  activeTag: {
    backgroundColor: Colors.secondaryCyan,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
  },
  progCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  progCardTagline: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginBottom: 12,
  },
  progCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: Colors.bgDarkCard,
    borderColor: Colors.borderGlass,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  detailTagline: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  metricStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryNeon,
  },
  metricLbl: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: '60%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  startBtn: {
    backgroundColor: Colors.primaryNeon,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 20,
  },
  startBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  enrolledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
    borderColor: Colors.primaryNeon,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  enrolledText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primaryNeon,
    fontWeight: '700',
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  scheduleList: {
    gap: 8,
    marginBottom: 16,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 10,
  },
  dayRowRest: {
    opacity: 0.6,
  },
  dayBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dayActivity: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dayActivityRest: {
    color: Colors.textSecondary,
  },
  dayFocus: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  descBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
  descTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  descText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
