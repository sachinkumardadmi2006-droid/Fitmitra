import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Trophy,
  Flame,
  Sparkles,
  ShoppingBag,
  Settings,
  LogOut,
  ChevronRight,
  Zap,
  Crown,
  Layers,
  Package,
  Bell,
} from 'lucide-react-native';
import { TopBar } from '../../components/common/TopBar';
import { useAppTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useAppConfig } from '../../hooks/useAppConfig';

/**
 * Single-line menu row matching reference image:
 * [ Outline Icon ]   [ Title ]   [ > ]
 */
function MenuRow({
  icon: IconComponent,
  title,
  onPress,
  isLast = false,
  destructive = false,
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.menuRow,
          pressed && {
            backgroundColor: colors.surfaceVariant
              ? colors.surfaceVariant + '60'
              : '#f5f5f5',
          },
        ]}
        onPress={onPress}
        android_ripple={{ color: colors.outlineVariant || '#e5e7eb' }}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <View style={styles.iconContainer}>
          <IconComponent
            size={22}
            color={destructive ? colors.error : colors.onSurface}
            strokeWidth={1.6}
          />
        </View>

        <Text
          style={[
            styles.rowTitle,
            { color: destructive ? colors.error : colors.onSurface },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        <ChevronRight
          size={18}
          color={destructive ? colors.error : colors.onSurfaceVariant}
          strokeWidth={1.6}
        />
      </Pressable>
      {!isLast && (
        <View
          style={[
            styles.rowDivider,
            { backgroundColor: colors.outlineVariant },
          ]}
        />
      )}
    </>
  );
}

export default function MoreHub() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { colors } = theme;
  const { user: authUser, profile: authProfile, logout } = useAuth();
  const { storeEnabled } = useAppConfig();

  const user = {
    displayName: authUser?.displayName || authUser?.name || 'FitMitra Athlete',
    email: authUser?.email || 'athlete@fitmitra.com',
  };

  const profile = {
    points: authProfile?.points ?? 0,
    goal: authProfile?.goal ?? 'General Fitness',
  };

  const userInitial = (user.displayName || 'A')[0].toUpperCase();

  const handleLogout = () => {
    const doLogout = async () => {
      try {
        await logout();
        router.replace('/login');
      } catch (err) {
        console.warn('[More] Logout failed, forcing redirect:', err?.message || err);
        router.replace('/login');
      }
    };

    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm('Are you sure you want to sign out of FitMitra?')
          : true;
      if (confirmed) {
        doLogout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out of FitMitra?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: doLogout,
        },
      ]);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TopBar title="More" subtitle="Feature Hub & Preferences" icon={Layers} showCart />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Profile Section - Click navigates to Profile */}
        <Pressable
          style={({ pressed }) => [
            styles.profileSection,
            pressed && { opacity: 0.88 },
          ]}
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          accessibilityLabel="Open user profile"
        >
          <View style={styles.profileRow}>
            <View
              style={[
                styles.avatarWrap,
                {
                  backgroundColor: colors.primaryContainer,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarInitial,
                  { color: colors.onPrimaryContainer },
                ]}
              >
                {userInitial}
              </Text>
            </View>

            <View style={styles.profileMetaCol}>
              <Text
                style={[styles.profileName, { color: colors.onSurface }]}
                numberOfLines={1}
              >
                {user.displayName}
              </Text>
              <Text
                style={[styles.profileEmail, { color: colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {user.email}
              </Text>

              <View style={styles.profileTagsRow}>
                <View
                  style={[
                    styles.goalPill,
                    { backgroundColor: colors.surfaceVariant },
                  ]}
                >
                  <Text style={[styles.goalText, { color: colors.primary }]}>
                    {profile.goal}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push('/points')}
                  style={[
                    styles.pointsPill,
                    { backgroundColor: colors.secondaryContainer },
                  ]}
                  accessibilityLabel="View Mitra Points"
                >
                  <Zap size={11} color={colors.secondary} fill={colors.secondary} />
                  <Text
                    style={[
                      styles.pointsText,
                      { color: colors.onSecondaryContainer },
                    ]}
                  >
                    {profile.points} pts
                  </Text>
                </Pressable>
              </View>
            </View>

            <View
              style={[
                styles.editPill,
                {
                  borderColor: colors.outlineVariant,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Text style={[styles.editPillText, { color: colors.primary }]}>
                Edit
              </Text>
              <ChevronRight size={14} color={colors.primary} />
            </View>
          </View>
        </Pressable>

        {/* All in one card with border like in the reference image */}
        <View
          style={[
            styles.allInOneCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <MenuRow
            icon={Crown}
            title="FitMitra PRO"
            onPress={() => router.push('/premium')}
          />
          <MenuRow
            icon={Sparkles}
            title="AI Fitness Coach"
            onPress={() => router.push('/ai-coach')}
          />
          <MenuRow
            icon={Trophy}
            title="Community Leaderboard"
            onPress={() => router.push('/leaderboard')}
          />
          <MenuRow
            icon={Flame}
            title="Fitness Challenges"
            onPress={() => router.push('/challenges')}
          />
          <MenuRow
            icon={ShoppingBag}
            title="Supplements Store"
            onPress={() => router.push('/store')}
          />
          <MenuRow
            icon={Package}
            title="My Orders & Tracking"
            onPress={() => router.push('/orders')}
          />
          <MenuRow
            icon={Bell}
            title="Notifications & Alerts"
            onPress={() => router.push('/notifications')}
          />
          <MenuRow
            icon={Settings}
            title="Settings & Appearance"
            onPress={() => router.push('/settings')}
          />
          <MenuRow
            icon={LogOut}
            title="Sign Out"
            destructive
            onPress={handleLogout}
            isLast
          />
        </View>

        {/* Version Footer */}
        <View style={styles.footerContainer}>
          <Text style={[styles.versionText, { color: colors.onSurfaceVariant }]}>
            FitMitra v1.0.0 • Fitness & Nutrition
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  profileSection: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
  },
  profileMetaCol: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  profileTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  goalPill: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  goalText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  pointsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 2,
    marginLeft: 8,
  },
  editPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  allInOneCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      },
    }),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 17,
    paddingHorizontal: 18,
  },
  iconContainer: {
    width: 28,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
