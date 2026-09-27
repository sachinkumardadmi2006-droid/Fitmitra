import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dumbbell, Bell, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { notificationService } from '../../services/notificationService';
import { FontSize, BorderRadius } from '../../constants/theme';

export const TopBar = ({
  title,
  subtitle,
  showBack = false,
  rightAction,
  icon: TitleIcon,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await notificationService.getNotifications({ limit: 20 });
        if (isMounted && res?.notifications) {
          const count = res.notifications.filter((n) => !n.isRead).length;
          setUnreadCount(count);
        }
      } catch (_) {}
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 12) + 4,
          backgroundColor: colors.bgBase,
          borderBottomColor: colors.borderLight,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left Section */}
        <View style={styles.leftRow}>
          {showBack ? (
            <Pressable
              onPress={() => router.back()}
              style={[styles.backBtn, { borderColor: colors.border }]}
              hitSlop={8}
            >
              <ChevronLeft size={22} color={colors.textPrimary} />
            </Pressable>
          ) : null}

          {title ? (
            <View style={styles.titleWrap}>
              <View style={styles.titleRow}>
                {TitleIcon ? (
                  <TitleIcon size={20} color={colors.primary} style={{ marginRight: 8 }} />
                ) : null}
                <Text style={[styles.titleText, { color: colors.textPrimary }]}>
                  {title}
                </Text>
              </View>
              {subtitle ? (
                <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : (
            /* Default Brand Logo Header (Home screen) */
            <Pressable
              style={styles.brandRow}
              onPress={() => router.push('/(tabs)')}
            >
              <View style={[styles.logoIconWrap, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '33' }]}>
                <Dumbbell size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.brandText, { color: colors.textPrimary }]}>
                  FIT<Text style={{ color: colors.primary }}>MITRA</Text>
                </Text>
                <Text style={[styles.brandSub, { color: colors.textSecondary }]}>
                  ELEVATE YOUR LIFE
                </Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightAction ? (
            rightAction
          ) : (
            <Pressable
              onPress={() => router.push('/notifications')}
              style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              hitSlop={8}
            >
              <Bell size={20} color={colors.textPrimary} />
              {unreadCount > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: FontSize.lg,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  brandSub: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: -2,
  },
  titleWrap: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitleText: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '800',
  },
});
