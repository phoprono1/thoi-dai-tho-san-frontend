import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api-service';
import { useUserStatusStore } from '@/stores/user-status.store';

export const useUserStatus = (userId: number) => {
  const { setUserStatusData, setLoading, setError } = useUserStatusStore();

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
};

export const useUserStats = (userId: number) => {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: () => apiService.getUserStats(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
};

export const useUserStamina = (userId: number) => {
  return useQuery({
    queryKey: ['user-stamina', userId],
    queryFn: () => apiService.getUserStamina(userId),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds for stamina
  });
};
