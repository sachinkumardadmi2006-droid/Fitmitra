/**
 * FitMitra — Canonical React Query Keys
 * All keys use stable primitive values to prevent cache misses or re-render loops.
 */

export const queryKeys = {
  // App & Metadata
  appConfig: ['app', 'config'],

  // User & Auth
  user: ['user'],
  profile: ['profile'],
  settings: ['settings'],

  // Home Dashboard
  dashboard: ['dashboard'],

  // Workouts
  todayWorkout: ['workouts', 'today'],
  currentProgram: ['programs', 'current'],
  programs: (goal = 'ALL') => ['programs', 'list', String(goal)],
  program: (id) => ['programs', 'detail', String(id)],
  workoutHistory: (limit = 10) => ['workouts', 'history', Number(limit)],
  workoutStats: ['workouts', 'stats'],

  // Nutrition / Diet
  nutritionTargets: ['nutrition', 'targets'],
  nutritionLogs: (date = 'today') => ['nutrition', 'logs', String(date)],
  nutritionWater: ['nutrition', 'water'],
  recipes: (limit = 20) => ['nutrition', 'recipes', Number(limit)],
  recipe: (id) => ['nutrition', 'recipes', 'detail', String(id)],

  // Store & Orders
  storeProducts: (category = 'ALL', search = '') => [
    'store',
    'products',
    String(category || 'ALL'),
    String(search || ''),
  ],
  storeProduct: (slug) => ['store', 'products', 'detail', String(slug)],
  storeOrders: ['store', 'orders'],

  // Subscriptions
  subscriptionPlans: ['subscriptions', 'plans'],
  subscriptionCurrent: ['subscriptions', 'current'],
  subscriptionMe: ['subscriptions', 'current'],

  // Progress
  progressSummary: (days = 90) => ['progress', 'summary', Number(days)],
  progressWeight: (days = 90) => ['progress', 'weight', Number(days)],

  // Notifications & Leaderboard
  notifications: (limit = 40) => ['notifications', 'list', Number(limit)],
  leaderboard: ['leaderboard'],

  // AI Coach
  aiUsage: ['ai', 'usage'],
  aiMemories: ['ai', 'memories'],
};

export default queryKeys;
