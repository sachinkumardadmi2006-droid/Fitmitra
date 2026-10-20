import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, Platform, RefreshControl, View } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';

export default function AppList({ data, renderItem, keyExtractor, onRefresh, refreshing = false, onEndReached, loadingMore = false, ListEmptyComponent, ListHeaderComponent, contentContainerStyle, itemSeparator = 12, ...rest }) {
  const { theme } = useAppTheme();
  const Separator = useCallback(() => <View style={{ height: itemSeparator }} />, [itemSeparator]);
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={Separator}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={loadingMore ? (
        <View style={{ paddingVertical: 16 }}><ActivityIndicator color={theme.custom.primaryStrong} /></View>
      ) : null}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews={Platform.OS === 'android'}
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? (
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.custom.primaryStrong} progressBackgroundColor={theme.colors.surface} />
      ) : undefined}
      contentContainerStyle={[{ padding: theme.custom.spacing.lg, paddingBottom: 32, flexGrow: 1 }, contentContainerStyle]}
      {...rest}
    />
  );
}
