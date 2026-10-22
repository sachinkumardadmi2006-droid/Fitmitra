import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Package,
  Dumbbell,
  Zap,
  Crown,
  CheckCheck,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import { notificationService } from '../services/notificationService';
import { queryKeys } from '../constants/queryKeys';
import { useAppTheme } from '../theme/ThemeContext';
import AppHeader from '../components/ui/AppHeader';
import AppCard from '../components/ui/AppCard';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/Skeleton';

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const { colors } = theme;

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications(40),
    queryFn: async () => {
      const res = await notificationService.getNotifications({ limit: 40 });
      const items = res?.items || res?.notifications || (Array.isArray(res) ? res : []);
      const unread = res?.unreadCount ?? items.filter((n) => !n.readAt && !n.isRead).length;
      return { items, unreadCount: unread };
    },
    staleTime: 60 * 1000,
  });

  const notifications = notificationsQuery.data?.items || [];
  const unreadCount = notificationsQuery.data?.unreadCount || 0;

  const loading = notificationsQuery.isLoading && !notificationsQuery.data;
  const refreshing = notificationsQuery.isRefetching;

  const onRefresh = useCallback(async () => {
    await notificationsQuery.refetch();
  }, [notificationsQuery]);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await notificationService.markAllAsRead();
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications(40) });
    } catch (err) {
      console.warn('[Notifications] Mark all read error:', err?.message || err);
      notificationsQuery.refetch();
    }
  };

  const handleNotificationPress = async (item) => {
    const isUnread = !item.readAt && !item.isRead;
    const notificationId = item._id || item.id;

    if (isUnread && notificationId) {
      try {
        await notificationService.markAsRead(notificationId);
        await queryClient.invalidateQueries({ queryKey: queryKeys.notifications(40) });
      } catch (err) {
        console.warn('[Notifications] Mark single read error:', err?.message || err);
      }
    }

    // Context-aware deep linking
    const data = item.data || {};
    if (data.orderId || item.type === 'ORDER_UPDATE' || item.type === 'ORDER_CONFIRMED') {
      router.push('/orders');
    } else if (data.workoutId) {
      const targetKind = data.kind || (data.workoutId === 'today' ? 'today' : 'session');
      router.push(`/workout/${data.workoutId}?kind=${targetKind}`);
    } else if (item.type === 'WORKOUT_REMINDER') {
      router.push('/workouts');
    } else if (item.type === 'SUBSCRIPTION_UPDATE' || item.type === 'SUBSCRIPTION_ACTIVATED') {
      router.push('/premium');
    } else if (item.type === 'POINTS_EARNED') {
      router.push('/leaderboard');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ORDER_UPDATE':
      case 'ORDER_CONFIRMED':
        return {
          icon: <Package size={20} color={colors.primary} />,
          bgColor: colors.primaryContainer,
        };
      case 'WORKOUT_REMINDER':
        return {
          icon: <Dumbbell size={20} color={colors.secondary} />,
          bgColor: colors.secondaryContainer,
        };
      case 'POINTS_EARNED':
        return {
          icon: <Zap size={20} color={theme.custom.accentText} />,
          bgColor: theme.colors.secondaryContainer,
        };
      case 'SUBSCRIPTION_UPDATE':
      case 'SUBSCRIPTION_ACTIVATED':
        return {
          icon: <Crown size={20} color={colors.secondary} />,
          bgColor: colors.secondaryContainer,
        };
      default:
        return {
          icon: <Bell size={20} color={colors.primary} />,
          bgColor: colors.surfaceVariant,
        };
    }
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch (_) {
      return '';
    }
  };

  const headerActions = unreadCount > 0 ? [
    {
      icon: 'check-all',
      accessibilityLabel: 'Mark all as read',
      onPress: handleMarkAllRead,
    },
  ] : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Notifications"
        onBack={() => router.back()}
        actions={headerActions}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header subtitle row */}
        {notifications.length > 0 && (
          <View style={styles.topInfoRow}>
            <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
            </Text>
            {unreadCount > 0 && (
              <Pressable
                onPress={handleMarkAllRead}
                style={styles.readAllButton}
                hitSlop={8}
              >
                <CheckCheck size={14} color={colors.primary} />
                <Text style={[styles.readAllText, { color: colors.primary }]}>
                  Mark all read
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {loading && !notifications.length ? (
          <View style={{ paddingTop: 20 }}>
            <SkeletonList count={5} />
          </View>
        ) : notifications.length === 0 ? (
          <EmptyState
            title="No Notifications"
            message="You're all caught up! Order tracking updates, workout reminders, and points alerts will appear here."
          />
        ) : (
          <View style={styles.list}>
            {notifications.map((item, index) => {
              const isUnread = !item.readAt && !item.isRead;
              const { icon, bgColor } = getNotificationIcon(item.type);
              const timeFormatted = formatTimestamp(item.createdAt);

              return (
                <AppCard
                  key={item._id || item.id || index}
                  variant={isUnread ? 'elevated' : 'outlined'}
                  onPress={() => handleNotificationPress(item)}
                  style={[
                    styles.itemCard,
                    isUnread && {
                      borderColor: colors.primary + '55',
                      borderWidth: 1.5,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <View style={styles.itemRow}>
                    <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
                      {icon}
                    </View>

                    <View style={styles.itemMetaCol}>
                      <View style={styles.itemTitleRow}>
                        <Text
                          style={[
                            styles.itemTitle,
                            {
                              color: colors.onSurface,
                              fontWeight: isUnread ? '800' : '600',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {item.title || 'FitMitra Update'}
                        </Text>
                        {isUnread && (
                          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                        )}
                      </View>

                      <Text
                        style={[
                          styles.itemBody,
                          {
                            color: isUnread ? colors.onSurface : colors.onSurfaceVariant,
                            fontWeight: isUnread ? '500' : '400',
                          },
                        ]}
                      >
                        {item.body || item.message || ''}
                      </Text>

                      <View style={styles.itemBottomRow}>
                        {timeFormatted ? (
                          <View style={styles.timeWrap}>
                            <Clock size={11} color={colors.onSurfaceVariant} />
                            <Text style={[styles.timeText, { color: colors.onSurfaceVariant }]}>
                              {timeFormatted}
                            </Text>
                          </View>
                        ) : null}

                        <ChevronRight size={14} color={colors.onSurfaceVariant} />
                      </View>
                    </View>
                  </View>
                </AppCard>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  readAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  itemCard: {
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMetaCol: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
  },
});
