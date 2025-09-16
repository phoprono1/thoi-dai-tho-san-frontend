import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { apiService } from '@/lib/api-service';
import { useUserStatusStore } from '@/stores/user-status.store';

export const useUserStatus = (userId: number) => {
  const { setUserStatusData, setLoading, setError } = useUserStatusStore();
  const queryClient = useQueryClient();
  const pollTimerRef = useRef<number | null>(null);
  const currentIntervalRef = useRef<number>(10000);

  return useQuery({
    queryKey: ['user-status', userId],
    queryFn: async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getUserStatusData(userId);
        setUserStatusData(data);
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Không thể tải dữ liệu nhân vật';
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  // Adaptive polling: only poll while the page is visible/active.
  useEffect(() => {
    if (!userId) return;

    // Poll all query keys that other UI parts may use so gold/level/exp change
    // will be visible without a full refresh. Note: repo contains mixed
    // queryKey naming (camelCase and kebab-case), so include both variants
    // to be safe.
    const queryKeysToPoll = [
      // Combined status used by StatusTab
      ['user-status', userId],
      // Individual keys used elsewhere in the app (note naming differences)
      ['user', userId],
      ['userStats', userId],
      ['user-stats', userId],
      ['userStamina', userId],
      ['user-stamina', userId],
      ['userItems', userId],
      ['equipped-items', userId],
      ['equipped-items', userId],
    ];

    function startPolling(intervalMs: number) {
      stopPolling();
      currentIntervalRef.current = intervalMs;
      pollTimerRef.current = window.setInterval(() => {
        // Invalidate so react-query will refetch if stale or forced
        queryKeysToPoll.forEach((k) =>
          queryClient.invalidateQueries({ queryKey: k as readonly unknown[] }),
        );
      }, intervalMs) as unknown as number;
    }

    function stopPolling() {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // active -> poll frequently
        startPolling(10000); // 10s
      } else {
        // background -> poll infrequently
        startPolling(60000); // 60s
      }
    }

    // Also adjust on window focus/blur
    function handleFocus() {
      startPolling(10000);
    }
    function handleBlur() {
      startPolling(60000);
    }

    // start with appropriate interval
    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [userId, queryClient]);
};

export const useUserStats = (userId: number) => {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: () => apiService.getUserStats(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
};

export const useUserStamina = (userId: number, options?: { refetchInterval?: number }) => {
  return useQuery({
    queryKey: ['user-stamina', userId],
    queryFn: () => apiService.getUserStamina(userId),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds for stamina by default
    // allow callers to request more frequent polling while on views like Room
    refetchInterval: options?.refetchInterval,
  });
};

export const useEquippedItems = (userId: number) => {
  return useQuery({
    queryKey: ['equipped-items', userId],
    queryFn: () => apiService.getEquippedItems(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
};
