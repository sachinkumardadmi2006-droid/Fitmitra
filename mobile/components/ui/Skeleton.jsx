import React, { useEffect, useState } from 'react';
import { Animated, View, Platform } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import AppCard from './AppCard';

export function Skeleton({ width = '100%', height = 16, radius, style }) {
  const { theme } = useAppTheme();
  const [opacity] = useState(() => new Animated.Value(0.55));
  useEffect(() => {
    const isNative = Platform.OS !== 'web';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: isNative }),
        Animated.timing(opacity, { toValue: 0.55, duration: 800, useNativeDriver: isNative }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ width, height, borderRadius: radius ?? theme.custom.radius.sm, backgroundColor: theme.custom.skeletonBase, opacity }, style]} />;
}

const LINE_WIDTHS = ['60%', '100%', '85%', '70%'];

export function SkeletonCard({ lines = 3, style }) {
  const { theme } = useAppTheme();
  return (
    <AppCard style={style}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={LINE_WIDTHS[i % LINE_WIDTHS.length]} height={i === 0 ? 20 : 14} style={{ marginTop: i === 0 ? 0 : theme.custom.spacing.md }} />
      ))}
    </AppCard>
  );
}

export function SkeletonList({ count = 4, lines = 3, style }) {
  const { theme } = useAppTheme();
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} style={{ marginBottom: theme.custom.spacing.md }} />
      ))}
    </View>
  );
}

export default Skeleton;

