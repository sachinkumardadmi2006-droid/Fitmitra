// Welcome / Landing Screen — Theme-aware
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Dumbbell, ArrowRight, Zap, Target, Apple, BarChart3, Sparkles, Heart } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { FontSize, BorderRadius } from '../constants/theme';

export default function Landing() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const features = [
    {
      icon: Dumbbell,
      color: colors.primary,
      title: 'Smart Workouts',
      desc: 'Follow guided workout sessions with real-time timers, set tracking, and burn calculations.',
    },
    {
      icon: Apple,
      color: colors.secondaryCyan,
      title: 'Nutrition Logger',
      desc: 'Log meals, track macros, and hit your daily protein targets effortlessly.',
    },
    {
      icon: BarChart3,
      color: colors.accentPurple,
      title: 'Visual Progress',
      desc: 'Track body weight changes over time with interactive graphs and milestone markers.',
    },
    {
      icon: Sparkles,
      color: colors.primary,
      title: 'AI Coach',
      desc: 'Get instant personalized workout tips, diet advice, and offline-style coaching answers.',
    },
    {
      icon: Target,
      color: colors.secondaryCyan,
      title: 'Training Programs',
      desc: 'Curated 4, 8, and 12-week programs tailored to muscle building, fat loss, or strength.',
    },
    {
      icon: Heart,
      color: colors.accentRose,
      title: 'Wellness Focus',
      desc: 'Track rest days, recovery prompts, and water intake to stay at your peak.',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgBase }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <Dumbbell size={28} color={colors.primary} />
          <Text style={[styles.brandText, { color: colors.textPrimary }]}>
            FIT<Text style={{ color: colors.primary }}>MITRA</Text>
          </Text>
        </View>

        <View style={[styles.chip, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '33' }]}>
          <Zap size={12} color={colors.primary} />
          <Text style={[styles.chipText, { color: colors.primary }]}>#1 FITNESS COMPANION</Text>
        </View>

        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
          TRANSFORM{'\n'}YOUR{' '}
          <Text style={{ color: colors.primary }}>BODY.</Text>
          {'\n'}
          <Text style={{ color: colors.secondaryCyan }}>ELEVATE</Text> YOUR LIFE.
        </Text>

        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Train smarter, eat better, and track every rep of your transformation. FitMitra is the all-in-one fitness platform built for real results.
        </Text>

        <Pressable
          style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.btnPrimaryText}>Start Free Today</Text>
          <ArrowRight size={18} color="#000" />
        </Pressable>

        <Pressable
          style={[styles.btnGhost, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => router.push('/login')}
        >
          <Text style={[styles.btnGhostText, { color: colors.textPrimary }]}>Log In</Text>
        </Pressable>
      </View>

      {/* Core Features */}
      <View style={[styles.featuresSection, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.chip, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '33', marginBottom: 12 }]}>
            <Target size={12} color={colors.primary} />
            <Text style={[styles.chipText, { color: colors.primary }]}>CORE FEATURES</Text>
          </View>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Everything You Need to <Text style={{ color: colors.primary }}>Crush It</Text>
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            One platform to replace your workout tracker, calorie counter, and fitness coach.
          </Text>
        </View>

        <View style={styles.featuresGrid}>
          {features.map((item, index) => {
            const IconComp = item.icon;
            return (
              <View
                key={index}
                style={[
                  styles.featureCard,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.iconWrapper, { backgroundColor: item.color + '18', borderColor: item.color + '33' }]}>
                  <IconComp size={24} color={item.color} />
                </View>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        <Text style={[styles.ctaTitle, { color: colors.textPrimary }]}>
          Ready to Start Your <Text style={{ color: colors.primary }}>Transformation?</Text>
        </Text>
        <Pressable
          style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.btnPrimaryText}>Create Free Account</Text>
          <ArrowRight size={18} color="#000" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: 40 },
  hero: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 36 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  brandText: { fontWeight: '900', fontSize: FontSize.xxl, letterSpacing: 1.5 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: BorderRadius.full, paddingVertical: 6, paddingHorizontal: 14,
    alignSelf: 'flex-start', marginBottom: 20,
  },
  chipText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { fontSize: 34, fontWeight: '900', lineHeight: 40, marginBottom: 16 },
  heroSubtitle: { fontSize: FontSize.md, lineHeight: 24, marginBottom: 28 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, paddingHorizontal: 28, borderRadius: BorderRadius.md, marginBottom: 12, width: '100%',
  },
  btnPrimaryText: { fontWeight: '800', fontSize: FontSize.lg, color: '#000' },
  btnGhost: {
    alignItems: 'center', paddingVertical: 14, borderRadius: BorderRadius.md,
    borderWidth: 1, width: '100%',
  },
  btnGhostText: { fontWeight: '700', fontSize: FontSize.md },

  /* Features Section */
  featuresSection: { paddingHorizontal: 24, paddingVertical: 32, borderTopWidth: 1, borderBottomWidth: 1 },
  sectionHeader: { marginBottom: 24 },
  sectionTitle: { fontSize: 26, fontWeight: '900', lineHeight: 32, marginBottom: 8 },
  sectionSubtitle: { fontSize: FontSize.md, lineHeight: 22 },
  featuresGrid: { gap: 16 },
  featureCard: {
    padding: 20,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  featureTitle: { fontSize: FontSize.lg, fontWeight: '800', marginBottom: 6 },
  featureDesc: { fontSize: FontSize.sm, lineHeight: 20 },

  /* CTA */
  cta: { padding: 24, paddingTop: 40, alignItems: 'center' },
  ctaTitle: { fontSize: FontSize.xxl, fontWeight: '900', textAlign: 'center', marginBottom: 20, lineHeight: 30 },
});
