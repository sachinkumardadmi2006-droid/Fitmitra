# Implementation Plan: Home Screen Image Carousel Card (5 Slides)

**Target Application:** Fitmitra Mobile App (`Fitmitra/mobile`)  
**Target Screen:** Home Tab (`app/(tabs)/index.jsx`)  
**Placement:** Directly above the "Start Workout" / "Today's Workout" Hero Card  
**Status:** Planning Phase  
**Date:** November 2026

---

## 1. Overview & Image Asset Mapping

Five high-resolution promotional banners have been verified in `Fitmitra/mobile/assets/images/`.

### Verified Asset & Route Mapping

| Slide ID | File in `assets/images/` | Title | Subtitle | App Route |
| :--- | :--- | :--- | :--- | :--- |
| `carousel-1` | `Workoutpage.png` | **Transform Your Body** | Start your fitness journey with personalized workout plans | `/(tabs)/workouts` |
| `carousel-2` | `Challengespage.png` | **Fitness Challenges** | Compete, maintain streaks, and earn rewards | `/challenges` |
| `carousel-3` | `Nutritionpage.png` | **Fuel Your Progress** | Discover nutrition plans and healthy meal recommendations | `/(tabs)/nutrition` |
| `carousel-4` | `Aiassistentpage.png` | **Your AI Fitness Companion** | Get smarter workout and fitness recommendations | `/ai-coach` |
| `carousel-5` | `Storepage.png` | **FitMitra Store** | Explore supplements, fitness products, and essentials | `/store` |

> [!NOTE]
> - `Workoutpage.png` maps to the tab route `/(tabs)/workouts`.
> - `Aiassistentpage.png` maps to the app's existing route `/ai-coach` (as defined in `_layout.jsx`).
> - `Nutritionpage.png` maps to `/(tabs)/nutrition`.
> - `Challengespage.png` maps to `/challenges`.
> - `Storepage.png` maps to `/store`.

---

## 2. Updated Data Configuration

In `Fitmitra/mobile/components/home/HomeCarousel.jsx`:

```javascript
export const DEFAULT_CAROUSEL_DATA = [
  {
    id: 'carousel-1',
    image: require('../../assets/images/Workoutpage.png'),
    title: 'Transform Your Body',
    subtitle: 'Start your fitness journey with personalized workout plans',
    route: '/(tabs)/workouts',
  },
  {
    id: 'carousel-2',
    image: require('../../assets/images/Challengespage.png'),
    title: 'Fitness Challenges',
    subtitle: 'Compete, maintain streaks, and earn rewards',
    route: '/challenges',
  },
  {
    id: 'carousel-3',
    image: require('../../assets/images/Nutritionpage.png'),
    title: 'Fuel Your Progress',
    subtitle: 'Discover nutrition plans and healthy meal recommendations',
    route: '/(tabs)/nutrition',
  },
  {
    id: 'carousel-4',
    image: require('../../assets/images/Aiassistentpage.png'),
    title: 'Your AI Fitness Companion',
    subtitle: 'Get smarter workout and fitness recommendations',
    route: '/ai-coach',
  },
  {
    id: 'carousel-5',
    image: require('../../assets/images/Storepage.png'),
    title: 'FitMitra Store',
    subtitle: 'Explore supplements, fitness products, and essentials',
    route: '/store',
  },
];
```

---

## 3. Component Architecture: `HomeCarousel.jsx`

### File: `Fitmitra/mobile/components/home/HomeCarousel.jsx`

```jsx
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Card width accounts for 16dp horizontal padding on the scrollContent
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 165;
const AUTO_SCROLL_INTERVAL = 3800; // 3.8s per slide

export default function HomeCarousel({ data = DEFAULT_CAROUSEL_DATA, style }) {
  const { theme } = useAppTheme();
  const colors = theme.colors;
  const router = useRouter();

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const timerRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Auto-scroll logic
  const startAutoScroll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (isDraggingRef.current || !flatListRef.current || data.length <= 1) return;
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % data.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, AUTO_SCROLL_INTERVAL);
  }, [data.length]);

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

  const handleSlidePress = (item) => {
    if (item.route) {
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
          opacity: pressed ? 0.95 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <Image
        source={item.image}
        style={styles.bannerImage}
        resizeMode="cover"
      />
      
      {/* Subtle bottom gradient overlay for readability of typography */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.72)']}
        style={styles.gradientOverlay}
      >
        <Text style={styles.slideTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.slideSubtitle} numberOfLines={2}>
          {item.subtitle}
        </Text>
      </LinearGradient>
    </Pressable>
  );

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
      />

      {/* Pagination Indicators */}
      <View style={styles.paginationRow}>
        {data.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <View
              key={item.id}
              style={[
                styles.dot,
                isActive
                  ? [styles.activeDot, { backgroundColor: colors.primary }]
                  : [styles.inactiveDot, { backgroundColor: colors.outlineVariant }],
              ]}
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
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 14,
    justifyContent: 'flex-end',
  },
  slideTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  slideSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 22,
  },
  inactiveDot: {
    width: 6,
  },
});
```

---

## 4. Exact Placement in `app/(tabs)/index.jsx`

In `Fitmitra/mobile/app/(tabs)/index.jsx`:

1. **Import:**
   ```jsx
   import HomeCarousel from '../../components/home/HomeCarousel';
   ```

2. **JSX Insertion (Lines 233-248):**
   ```jsx
           {/* Email Verification Banner (Non-blocking Option B) */}
           <EmailVerificationBanner style={{ marginHorizontal: 0, marginBottom: 16 }} />

           {/* 5-Slide Feature Carousel Banner */}
           <HomeCarousel />

           {/* Loading Skeleton */}
           {loading && !dashboardData && !todayWorkout ? (
             <View style={styles.skeletonContainer}>
   ```

---

## 5. Verification Checklist

- [ ] All 5 image files load cleanly without bundler or path errors (`Workoutpage.png`, `Challengespage.png`, `Nutritionpage.png`, `Aiassistentpage.png`, `Storepage.png`).
- [ ] Auto-scroll smoothly rotates through all 5 slides every 3.8 seconds.
- [ ] Tapping each slide routes to the intended target:
  - Slide 1 -> `/(tabs)/workouts`
  - Slide 2 -> `/challenges`
  - Slide 3 -> `/(tabs)/nutrition`
  - Slide 4 -> `/ai-coach`
  - Slide 5 -> `/store`
- [ ] Active pagination dot smoothly expands into a 22px pill matching `colors.primary`.
- [ ] Touch gestures (drag/swipe) pause the auto-advance timer and resume without index skipping.
- [ ] Layout matches the exact width of the "Today's Workout" card (`CARD_WIDTH = SCREEN_WIDTH - 32`).
