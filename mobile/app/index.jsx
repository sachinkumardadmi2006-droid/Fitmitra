// Welcome / Landing Screen — Dribbble Onboarding Style with gym_hero background
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ImageBackground,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Dumbbell } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { FontSize, BorderRadius } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Landing() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [activeSlide, setActiveSlide] = useState(0);

  const heroSlides = [
    {
      title: 'FITMITRA EVENTS\nCOMMUNITY',
      subtitle: 'Achieve your peak fitness with smart AI coaching & real-time tracking',
    },
    {
      title: 'TRAIN. TRANSFORM.\nELEVATE.',
      subtitle: 'Personalized programs tailored for muscle gain, fat loss, and strength',
    },
    {
      title: 'YOUR ULTIMATE\nFITNESS PARTNER',
      subtitle: 'Log daily workouts, monitor macros, and track every milestone',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top ~65% Height Hero Background Image */}
      <ImageBackground
        source={require('../assets/gym_hero.jpg')}
        style={styles.heroBackground}
        resizeMode="cover"
      >
        {/* Dark Overlay Gradients */}
        <View style={styles.topVignette} />
        <View style={styles.bottomVignette} />

        {/* Top Floating Header */}
        <SafeAreaView style={styles.safeHeader}>
          <View style={styles.headerRow}>
            <View style={styles.brandBadge}>
              <Dumbbell size={20} color="#B7FF00" />
              <Text style={styles.brandText}>
                fit<Text style={{ color: '#B7FF00' }}>mitra</Text>
              </Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Hero Headline Overlay on Image */}
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{heroSlides[activeSlide].title}</Text>

          {/* Carousel Pagination Dots */}
          <View style={styles.indicatorRow}>
            {heroSlides.map((_, idx) => (
              <Pressable
                key={idx}
                onPress={() => setActiveSlide(idx)}
                style={[
                  styles.indicatorDot,
                  activeSlide === idx ? styles.indicatorActive : styles.indicatorInactive,
                ]}
              />
            ))}
          </View>
        </View>
      </ImageBackground>

      {/* Bottom Sheet Card with Rounded Top Corners */}
      <View style={[styles.bottomCard, { backgroundColor: isDark ? '#10131A' : '#FFFFFF' }]}>
        <View style={styles.cardContent}>
          {/* Black Pill Log In Button */}
          <Pressable
            style={[
              styles.btnLogIn,
              { backgroundColor: isDark ? '#B7FF00' : '#111111' },
            ]}
            onPress={() => router.push('/login')}
          >
            <Text
              style={[
                styles.btnLogInText,
                { color: isDark ? '#000000' : '#FFFFFF' },
              ]}
            >
              Log in
            </Text>
          </Pressable>

          {/* Light / Secondary Pill Sign Up Button */}
          <Pressable
            style={[
              styles.btnSignUp,
              {
                backgroundColor: isDark ? '#171B24' : '#F5F5F7',
                borderColor: isDark ? '#252B36' : '#E5E7EB',
              },
            ]}
            onPress={() => router.push('/signup')}
          >
            <Text
              style={[
                styles.btnSignUpText,
                { color: isDark ? '#FFFFFF' : '#111111' },
              ]}
            >
              Sign up
            </Text>
          </Pressable>

          {/* Footer Terms */}
          <Text style={[styles.footerText, { color: isDark ? '#A8AFBA' : '#6B7280' }]}>
            By continuing, you agree to FitMitra's{' '}
            <Text style={[styles.legalLink, { color: isDark ? '#FFFFFF' : '#111111' }]}>
              Privacy Policy
            </Text>{' '}
            and{' '}
            <Text style={[styles.legalLink, { color: isDark ? '#FFFFFF' : '#111111' }]}>
              Terms of Use
            </Text>
            .
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroBackground: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.65,
    justifyContent: 'space-between',
  },
  topVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    height: '40%',
  },
  bottomVignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  safeHeader: {
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  brandText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  heroContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: 36,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicatorDot: {
    height: 6,
    borderRadius: 3,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  indicatorInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  bottomCard: {
    flex: 1,
    marginTop: -28,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardContent: {
    gap: 14,
    alignItems: 'center',
  },
  btnLogIn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLogInText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  btnSignUp: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnSignUpText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 12,
  },
  legalLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

