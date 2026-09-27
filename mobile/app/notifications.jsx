import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Bell,
  Package,
  Dumbbell,
  Flame,
  CheckCheck,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { notificationService } from '../services/notificationService';
import { TopBar } from '../components/common/TopBar';
import { MaterialCard } from '../components/common/MaterialCard';
import { useTheme } from '../context/ThemeContext';
import { FontSize, BorderRadius } from '../constants/theme';

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications({ limit: 30 });
      if (res?.notifications) {
        setNotifications(res.notifications);
      } else if (Array.isArray(res)) {
        setNotifications(res);
      }
    } catch (err) {
      console.warn('Notifications fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.warn('Mark all read error:', err.message);
    }
  };

  const handleItemPress = async (item) => {
    if (!item.isRead) {
      try {
        await notificationService.markAsRead(item._id || item.id);
        setNotifications((prev) =>
          prev.map((n) =>
            (n._id === item._id || n.id === item.id) ? { ...n, isRead: true } : n
          )
        );
      } catch (_) {}
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ORDER':
      case 'SHIPMENT':
        return <Package size={20} color={colors.secondaryCyan} />;
      case 'WORKOUT':
        return <Dumbbell size={20} color={colors.primary} />;
      case 'STREAK':
        return <Flame size={20} color="#FF7A00" />;
      default:
        return <Bell size={20} color={colors.accentPurple} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      {/* Context-Aware TopBar */}
      <TopBar
        title="Notifications"
        subtitle="Updates & Alerts"
        showBack
        icon={Bell}
        rightAction={
          notifications.some((n) => !n.isRead) ? (
            <Pressable
              style={[styles.markAllBtn, { borderColor: colors.border }]}
              onPress={handleMarkAllRead}
            >
              <CheckCheck size={16} color={colors.primary} />
              <Text style={[styles.markAllText, { color: colors.primary }]}>
                Read All
              </Text>
            </Pressable>
          ) : null
        }
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
        {loading && !notifications.length ? (
          <View style={styles.centerSpinner}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Checking for new notifications...
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Bell size={36} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No notifications yet
            </Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              You're all caught up! Order tracking updates, streak alerts, and rewards will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((item, index) => {
              const isUnread = !item.isRead;
              return (
                <MaterialCard
                  key={item._id || item.id || index}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: isUnread
                        ? (isDark ? colors.surfaceElevated : colors.surface)
                        : colors.surface,
                      borderColor: isUnread ? colors.primary + '55' : colors.border,
                    },
                  ]}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={styles.itemRow}>
                    <View
                      style={[
                        styles.iconWrap,
                        { backgroundColor: colors.surfaceElevated },
                      ]}
                    >
                      {getNotificationIcon(item.type)}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.itemTitleRow}>
                        <Text
                          style={[
                            styles.itemTitle,
                            { color: colors.textPrimary, fontWeight: isUnread ? '800' : '600' },
                          ]}
                        >
                          {item.title || 'FitMitra Update'}
                        </Text>
                        {isUnread && (
                          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                        )}
                      </View>
                      <Text style={[styles.itemBody, { color: colors.textSecondary }]}>
                        {item.body || item.message || ''}
                      </Text>
                      {item.createdAt && (
                        <View style={styles.timeRow}>
                          <Clock size={11} color={colors.textMuted} />
                          <Text style={[styles.timeText, { color: colors.textMuted }]}>
                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </MaterialCard>
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
    paddingTop: 16,
  },
  centerSpinner: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: FontSize.sm,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  markAllText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    gap: 10,
  },
  itemCard: {
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: FontSize.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemBody: {
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  timeText: {
    fontSize: 10,
  },
});
