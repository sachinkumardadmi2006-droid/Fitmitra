// Welcome / Landing Screen — with Core Features restored
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Dumbbell, ArrowRight, Zap, Target, Apple, BarChart3, Sparkles, Heart } from 'lucide-react-native';
import { Colors, FontSize, BorderRadius } from '../constants/theme';

const features = [
  {
    icon: Dumbbell,
    color: Colors.primaryNeon,
    title: 'Smart Workouts',
    desc: 'Follow guided workout sessions with real-time timers, set tracking, and burn calculations.',
  },
  {
    icon: Apple,
    color: Colors.secondaryCyan,
    title: 'Nutrition Logger',
    desc: 'Log meals, track macros, and hit your daily protein targets effortlessly.',
  },
  {
    icon: BarChart3,
    color: Colors.accentPurple,
    title: 'Visual Progress',
    desc: 'Track body weight changes over time with interactive graphs and milestone markers.',
  },
  {
    icon: Sparkles,
    color: Colors.primaryNeon,
    title: 'AI Coach',
    desc: 'Get instant personalized workout tips, diet advice, and offline-style coaching answers.',
  },
  {
    icon: Target,
    color: Colors.secondaryCyan,
    title: 'Training Programs',
    desc: 'Curated 4, 8, and 12-week programs tailored to muscle building, fat loss, or strength.',
  },
  {
    icon: Heart,
    color: Colors.accentRose,
    title: 'Wellness Focus',
    desc: 'Track rest days, recovery prompts, and water intake to stay at your peak.',
  },
];

export default function Landing() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <Dumbbell size={28} color={Colors.primaryNeon} />
          <Text style={styles.brandText}>FITMITRA</Text>
        </View>

        <View style={styles.chip}>
          <Zap size={12} color={Colors.primaryNeon} />
          <Text style={styles.chipText}>#1 FITNESS COMPANION</Text>
        </View>

        <Text style={styles.heroTitle}>
          TRANSFORM{'\n'}YOUR{' '}
          <Text style={{ color: Colors.primaryNeon }}>BODY.</Text>
          {'\n'}
          <Text style={{ color: Colors.secondaryCyan }}>ELEVATE</Text> YOUR LIFE.
        </Text>

        <Text style={styles.heroSubtitle}>
          Train smarter, eat better, and track every rep of your transformation. FitMitra is the all-in-one fitness platform built for real results.
        </Text>

        <Pressable style={styles.btnPrimary} onPress={() => router.push('/signup')}>
          <Text style={styles.btnPrimaryText}>Start Free Today</Text>
          <ArrowRight size={18} color="#000" />
        </Pressable>

        <Pressable style={styles.btnGhost} onPress={() => router.push('/login')}>
          <Text style={styles.btnGhostText}>Log In</Text>
        </Pressable>
      </View>

      {/* Core Features */}
      <View style={styles.featuresSection}>
        <View style={styles.sectionHeader}>
          <View style={[styles.chip, { marginBottom: 12 }]}>
            <Target size={12} color={Colors.primaryNeon} />
            <Text style={styles.chipText}>CORE FEATURES</Text>
          </View>
          <Text style={styles.sectionTitle}>
            Everything You Need to <Text style={{ color: Colors.primaryNeon }}>Crush It</Text>
          </Text>
          <Text style={styles.sectionSubtitle}>
            One platform to replace your workout tracker, calorie counter, and fitness coach.
          </Text>
        </View>

        <View style={styles.featuresGrid}>
          {features.map((item, index) => {
            const IconComp = item.icon;
            return (
              <View key={index} style={styles.featureCard}>
                <View style={[styles.iconWrapper, { backgroundColor: item.color + '18', borderColor: item.color + '33' }]}>
                  <IconComp size={24} color={item.color} />
                </View>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDesc}>{item.desc}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        <Text style={styles.ctaTitle}>
          Ready to Start Your <Text style={{ color: Colors.primaryNeon }}>Transformation?</Text>
        </Text>
        <Pressable style={styles.btnPrimary} onPress={() => router.push('/signup')}>
          <Text style={styles.btnPrimaryText}>Create Free Account</Text>
          <ArrowRight size={18} color="#000" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDarkBase },
  contentContainer: { paddingBottom: 40 },
  hero: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 36 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  brandText: { fontWeight: '800', fontSize: FontSize.xl, color: Colors.textPrimary, letterSpacing: 1 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryNeonDim, borderColor: 'rgba(204,255,0,0.2)', borderWidth: 1,
    borderRadius: BorderRadius.full, paddingVertical: 6, paddingHorizontal: 14,
    alignSelf: 'flex-start', marginBottom: 20,
  },
  chipText: { fontSize: 10, fontWeight: '700', color: Colors.primaryNeon, letterSpacing: 1.5 },
  heroTitle: { fontSize: 34, fontWeight: '800', color: Colors.textPrimary, lineHeight: 40, marginBottom: 16 },
  heroSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24, marginBottom: 28 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primaryNeon, paddingVertical: 16, paddingHorizontal: 28,
    borderRadius: BorderRadius.md, marginBottom: 12, width: '100%',
  },
  btnPrimaryText: { fontWeight: '700', fontSize: FontSize.lg, color: '#000' },
  btnGhost: {
    alignItems: 'center', paddingVertical: 14, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.borderGlassBright, width: '100%',
  },
  btnGhostText: { fontWeight: '600', fontSize: FontSize.md, color: Colors.textSecondary },

  /* Features Section */
  featuresSection: { paddingHorizontal: 24, paddingVertical: 32, backgroundColor: Colors.bgDarkCard, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.borderGlass },
  sectionHeader: { marginBottom: 24 },
  sectionTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, lineHeight: 32, marginBottom: 8 },
  sectionSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  featuresGrid: { gap: 16 },
  featureCard: {
    backgroundColor: Colors.bgDarkBase,
    padding: 20,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  featureDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  /* CTA */
  cta: { padding: 24, paddingTop: 40, alignItems: 'center' },
  ctaTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 20, lineHeight: 30 },
});

