/**
 * FitMitra — Shared React Query Client & Cache Architecture
 *
 * Configures the centralized QueryClient, canonical query keys,
 * sensible stale times, and complete cache isolation on logout.
 */

import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';

export { queryKeys };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

/**
 * Isolates and cleans all user-specific data from cache on logout or account switch.
 * Preserves public non-user cache (such as app configuration).
 */
export async function clearUserCache(client = queryClient) {
  try {
    // 1. Cancel any active queries in flight
    await client.cancelQueries();

    // 2. Remove all user-specific queries
    client.removeQueries({
      predicate: (query) => {
        const topKey = query.queryKey?.[0];
        // Retain public metadata, clear all private/user data
        return topKey !== 'app';
      },
    });

    // 3. Reset queries state
    client.cancelQueries();
  } catch (err) {
    console.warn('[queryClient] Failed to clear user cache:', err?.message || err);
  }
}
