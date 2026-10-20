/**
 * FitMitra — useAppConfig Hook
 *
 * Provides reactive, cached access to backend feature flags (/app/config)
 * using React Query. Fails safely by defaulting gated features to disabled
 * while loading or in case of network/server error.
 */

import { useQuery } from '@tanstack/react-query';
import { appConfigService } from '../services/appConfigService';
import { queryKeys } from '../services/queryClient';

export function useAppConfig() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.appConfig,
    queryFn: () => appConfigService.getConfig(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    gcTime: 1000 * 60 * 30, // 30 minutes in memory
    retry: 2,
  });

  return {
    config: data || null,
    // Fail-safe: only true if explicitly resolved as true from backend
    storeEnabled: Boolean(data?.storeEnabled),
    shippingEnabled: Boolean(data?.shippingEnabled),
    isLoading,
    isError,
    error,
    refetch,
  };
}
