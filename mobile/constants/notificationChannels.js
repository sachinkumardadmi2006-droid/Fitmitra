/**
 * FitMitra Android Notification Channels & Category Map
 * Must match backend constants/notification-channels.ts
 */

export const NOTIFICATION_CHANNEL_IDS = {
  WORKOUT_REMINDER: 'workout',
  NUTRITION_REMINDER: 'nutrition',
  CHALLENGE_EXPIRING: 'challenges',
  CHALLENGE_NEW: 'challenges',
  STREAK_AT_RISK: 'streak',
  STREAK_MILESTONE: 'streak',
  POINTS_EARNED: 'points',
  ORDER_UPDATE: 'orders',
  ORDER_CONFIRMED: 'orders',
  SUBSCRIPTION_UPDATE: 'subscription',
  SUBSCRIPTION_ACTIVATED: 'subscription',
  PROMOTION: 'promotions',
  SYSTEM: 'default',
};

export const ANDROID_CHANNELS = [
  { id: 'workout', name: 'Workout Reminders', importance: 'HIGH' },
  { id: 'nutrition', name: 'Nutrition Reminders', importance: 'DEFAULT' },
  { id: 'challenges', name: 'Challenges', importance: 'HIGH' },
  { id: 'streak', name: 'Streak Alerts', importance: 'HIGH' },
  { id: 'points', name: 'Points & Rewards', importance: 'DEFAULT' },
  { id: 'orders', name: 'Orders', importance: 'HIGH' },
  { id: 'subscription', name: 'Subscription', importance: 'HIGH' },
  { id: 'promotions', name: 'Promotions', importance: 'LOW' },
  { id: 'default', name: 'General', importance: 'DEFAULT' },
];

