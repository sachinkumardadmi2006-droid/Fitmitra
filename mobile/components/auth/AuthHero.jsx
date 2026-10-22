import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import AuthLogo from './AuthLogo';
import { authTypography } from './authTheme';

/**
 * Top hero section for Auth screens
 * Supports full-width hero image with overlay scrim and left-aligned text,
 * or plain theme-backed header when image is omitted.
 *
 * @param {{
 *   title: string,
 *   subtitle: string,
 *   image?: import('react-native').ImageSourcePropType,
 *   showBack?: boolean,
 *   onBack?: () => void,
 *   style?: object,
 * }} props
 */
export default function AuthHero({
  title,
  subtitle,
  image,
  showBack = false,
  onBack,
  style,
}) {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // Clamp hero height to between 300 and 400 pixels (~40% of screen height)
  const heroHeight = Math.max(300, Math.min(400, Math.round(windowHeight * 0.4)));

  // Scrim opacity chosen based on Part 0 image inspection:
  // Images have light sunny skies; 0.35 in light mode softens background art for text,
  // 0.55 in dark mode dims bright sky so onSurface text is clearly legible.
  const scrimOpacity = isDark ? 0.55 : 0.35;

  const renderHeaderNavigation = () => (
    <View style={styles.headerSection}>
      {showBack ? (
        <View style={styles.backRow}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
              pressed ? { opacity: 0.8 } : null,
            ]}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather
              name="arrow-left"
              size={20}
              color={theme.colors.onSurface}
            />
          </Pressable>
        </View>
      ) : null}
      <View style={styles.logoRow}>
        <AuthLogo />
      </View>
    </View>
  );

  const renderTextContent = () => (
    <View style={styles.textColumn}>
      <Text
        style={[
          styles.title,
          { color: theme.colors.onSurface },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        {subtitle}
      </Text>
    </View>
  );

  if (image) {
    return (
      <View style={[styles.imageHeroContainer, { height: heroHeight }, style]}>
        <ImageBackground
          source={image}
          style={styles.imageBackground}
          resizeMode="cover"
        >
          {/* Scrim View overlay for text readability without gradients */}
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: theme.colors.background,
                opacity: scrimOpacity,
              },
            ]}
          />

          {/* Content overlay on the left side of the hero */}
          <View
            style={[
              styles.imageContentContainer,
              {
                paddingTop: insets.top + 16,
                paddingBottom: 36,
              },
            ]}
          >
            {renderHeaderNavigation()}
            {renderTextContent()}
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.plainContainer,
        {
          paddingTop: insets.top + 16,
          backgroundColor: theme.colors.background,
        },
        style,
      ]}
    >
      {renderHeaderNavigation()}
      {renderTextContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  imageHeroContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  imageContentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  plainContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  headerSection: {
    alignItems: 'flex-start',
  },
  backRow: {
    marginBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    width: '65%', // Sits cleanly on the left empty space, leaving the athlete visible on right
    paddingRight: 8,
  },
  title: {
    fontSize: authTypography.headingSize,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: authTypography.bodySize,
    lineHeight: 20,
  },
});
