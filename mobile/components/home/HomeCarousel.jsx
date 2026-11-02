import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../theme/ThemeContext';
import { ChevronRight } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Card width aligns with scrollContent's 16dp horizontal padding
const CARD_WIDTH = Math.round(SCREEN_WIDTH - 32);
// 2:1 aspect ratio matches the 1774x887 assets (approx 170-180dp height)
const CARD_HEIGHT = Math.min(Math.round(CARD_WIDTH * 0.5), 185);
const AUTO_SCROLL_INTERVAL = 3800;

export const DEFAULT_CAROUSEL_DATA = [
  {
    id: 'carousel-1',
    image: require('../../assets/images/Workoutpage.png'),
    tag: 'WORKOUT',
    title: 'Transform Your Body',
    subtitle: 'Start your fitness journey with personalized workout plans',
    route: '/(tabs)/workouts',
  },
  {
    id: 'carousel-2',
    image: require('../../assets/images/Challengespage.png'),
    tag: 'CHALLENGES',
    title: 'Fitness Challenges',
    subtitle: 'Compete, maintain streaks, and earn rewards',
    route: '/challenges',
  },
  {
    id: 'carousel-3',
    image: require('../../assets/images/Nutritionpage.png'),
    tag: 'NUTRITION',
    title: 'Fuel Your Progress',
    subtitle: 'Discover nutrition plans and healthy meal recommendations',
    route: '/(tabs)/nutrition',
  },
  {
    id: 'carousel-4',
    image: require('../../assets/images/Aiassistentpage.png'),
    tag: 'AI COACH',
    title: 'Your AI Fitness Companion',
    subtitle: 'Get smarter workout and fitness recommendations',
    route: '/ai-coach',
  },
  {
    id: 'carousel-5',
    image: require('../../assets/images/Storepage.png'),
    tag: 'STORE',
    title: 'FitMitra Store',
    subtitle: 'Explore supplements, fitness products, and essentials',
    route: '/store',
  },
];

export default function HomeCarousel({ data = DEFAULT_CAROUSEL_DATA, style }) {
  const { theme } = useAppTheme();
  const colors = theme.colors;
  const router = useRouter();

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const timerRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Auto-scroll loop
  const startAutoScroll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!data || data.length <= 1) return;

    timerRef.current = setInterval(() => {
      if (isDraggingRef.current || !flatListRef.current) return;

      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % data.length;
        try {
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
        } catch {
          // Ignore transient scrollToIndex errors before layout
        }
        return nextIndex;
      });
    }, AUTO_SCROLL_INTERVAL);
  }, [data]);

  const stopAutoScroll = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [startAutoScroll, stopAutoScroll]);

  const handleMomentumScrollEnd = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    if (index >= 0 && index < data.length) {
      setActiveIndex(index);
    }
    isDraggingRef.current = false;
  };

  const handleScrollBeginDrag = () => {
    isDraggingRef.current = true;
    stopAutoScroll();
  };

  const handleScrollEndDrag = () => {
    isDraggingRef.current = false;
    startAutoScroll();
  };

  const handleDotPress = (index) => {
    setActiveIndex(index);
    try {
      flatListRef.current?.scrollToIndex({ index, animated: true });
    } catch {
      // Safe fallback
    }
  };

  const handleSlidePress = (item) => {
    if (!item?.route) return;
    // Normalize aliases so navigation always lands on the right screen
    if (item.route === '/ai-assistant') {
      router.push('/ai-coach');
    } else if (item.route === '/(tabs)/workout' || item.route === '/workout') {
      router.push('/(tabs)/workouts');
    } else if (item.route === '/nutrition') {
      router.push('/(tabs)/nutrition');
    } else {
      router.push(item.route);
    }
  };

  const renderItem = ({ item }) => (
    <Pressable
      onPress={() => handleSlidePress(item)}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderColor: colors.outlineVariant,
          backgroundColor: colors.surfaceVariant,
          opacity: pressed ? 0.96 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.subtitle}`}
    >
      <Image
        source={item.image}
        style={styles.bannerImage}
        resizeMode="cover"
      />

      {/* Subtle bottom gradient to ensure text contrast and punchiness */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.40)', 'rgba(0, 0, 0, 0.82)']}
        style={styles.gradientOverlay}
      >
        <View style={styles.textRow}>
          <View style={styles.textCol}>
            {item.tag ? (
              <View style={[styles.tagPill, { backgroundColor: colors.primary }]}>
                <Text style={[styles.tagText, { color: colors.onPrimary || '#FFFFFF' }]}>{item.tag}</Text>
              </View>
            ) : null}
            <Text style={styles.slideTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.slideSubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>

          <View style={styles.actionIconWrapper}>
            <ChevronRight size={18} color="#FFFFFF" />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );

  if (!data || data.length === 0) return null;

  return (
    <View style={[styles.root, style]}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        bounces={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH,
          offset: CARD_WIDTH * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 100);
        }}
      />

      {/* Pagination Indicators */}
      <View style={styles.paginationRow}>
        {data.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <Pressable
              key={item.id}
              onPress={() => handleDotPress(index)}
              hitSlop={8}
              style={[
                styles.dot,
                isActive
                  ? [styles.activeDot, { backgroundColor: colors.primary }]
                  : [styles.inactiveDot, { backgroundColor: colors.outlineVariant }],
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${index + 1}`}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 16,
  },
  cardContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 28,
    paddingBottom: 10,
    justifyContent: 'flex-end',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  textCol: {
    flex: 1,
    marginRight: 8,
  },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  tagText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  slideTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  slideSubtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  activeDot: {
    width: 22,
  },
  inactiveDot: {
    width: 6,
  },
});

