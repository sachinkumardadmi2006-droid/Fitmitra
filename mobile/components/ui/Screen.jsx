import React from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/ThemeContext';

export default function Screen({ children, scroll = true, refreshing = false, onRefresh, padded = true, edges = ['top', 'bottom'], header = null, contentStyle, style, keyboardAware = false }) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const padding = padded ? theme.custom.spacing.lg : 0;
  const top = header ? 0 : edges.includes('top') ? insets.top : 0;
  const bottom = edges.includes('bottom') ? insets.bottom : 0;
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[{ padding, paddingBottom: padding + 24 }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? (
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.custom.primaryStrong} progressBackgroundColor={theme.colors.surface} />
      ) : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, { padding }, contentStyle]}>{children}</View>
  );
  const content = keyboardAware ? (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{body}</KeyboardAvoidingView>
  ) : body;
  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background, paddingTop: top, paddingBottom: bottom }, style]}>
      {header}
      {content}
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
