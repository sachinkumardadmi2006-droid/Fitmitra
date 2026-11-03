/**
 * Centralized deep-link handler for FitMitra push & in-app notifications.
 * @param {object} data - Payload data object from push or notification item
 * @param {object} router - Expo Router instance (required)
 */
export function handleNotificationDeepLink(data, router) {
  if (!router) {
    console.warn('[DeepLink] Router not provided to handleNotificationDeepLink');
    return;
  }
  if (!data) return;

  const { type, targetId } = data;

  switch (type) {
    case 'WORKOUT_REMINDER':
      if (targetId) {
        router.push(`/workout/${targetId}`);
      } else {
        router.push('/(tabs)/workouts');
      }
      break;

    case 'NUTRITION_REMINDER':
      router.push('/(tabs)/nutrition');
      break;

    case 'CHALLENGE_EXPIRING':
    case 'CHALLENGE_NEW':
      if (targetId) {
        router.push(`/challenge/${targetId}`);
      } else {
        router.push('/challenges');
      }
      break;

    case 'STREAK_AT_RISK':
    case 'STREAK_MILESTONE':
      router.push('/profile');
      break;

    case 'POINTS_EARNED':
      router.push('/points');
      break;

    case 'ORDER_UPDATE':
    case 'ORDER_CONFIRMED':
      router.push('/orders');
      break;

    case 'SUBSCRIPTION_UPDATE':
    case 'SUBSCRIPTION_ACTIVATED':
      router.push('/premium');
      break;

    default:
      router.push('/notifications');
      break;
  }
}

