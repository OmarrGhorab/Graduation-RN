import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { 
  LocationService, 
  LocationData, 
  ChildLocation, 
  LocationHistoryParams,
  LocationHistoryResponse,
  ChildLocationHistoryResponse,
  ChildInfo,
} from '@/services/LocationService';
import { STALE_TIMES } from '@/constants/queryConfig';

// ==================== Query Keys ====================

export const locationKeys = {
  all: ['location'] as const,
  me: () => [...locationKeys.all, 'me'] as const,
  myHistory: () => [...locationKeys.all, 'history'] as const,
  children: () => [...locationKeys.all, 'children'] as const,
  child: (childId: string) => [...locationKeys.all, 'child', childId] as const,
  childHistory: (childId: string) => [...locationKeys.all, 'child', childId, 'history'] as const,
};

// ==================== Hooks ====================

/**
 * Get my latest location
 */
export const useMyLocation = () => {
  return useQuery({
    queryKey: locationKeys.me(),
    queryFn: LocationService.getMyLocation,
    staleTime: STALE_TIMES.REALTIME,
  });
};

/**
 * Get my location history with infinite scroll
 */
export const useMyLocationHistory = (limit: number = 10) => {
  return useInfiniteQuery({
    queryKey: locationKeys.myHistory(),
    queryFn: ({ pageParam = 1 }) => LocationService.getMyLocationHistory({ page: pageParam, limit }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: STALE_TIMES.STANDARD,
  });
};

/**
 * Get all children's locations (parent only)
 */
export const useChildrenLocations = (isParent: boolean = false) => {
  return useQuery({
    queryKey: locationKeys.children(),
    queryFn: LocationService.getChildrenLocations,
    staleTime: STALE_TIMES.REALTIME,
    enabled: isParent,
  });
};

/**
 * Get specific child's location
 */
export const useChildLocation = (childId: string) => {
  return useQuery({
    queryKey: locationKeys.child(childId),
    queryFn: () => LocationService.getChildLocation(childId),
    enabled: !!childId,
    staleTime: STALE_TIMES.REALTIME,
  });
};

/**
 * Get specific child's location history with infinite scroll
 */
export const useChildLocationHistory = (childId: string, limit: number = 10) => {
  return useInfiniteQuery({
    queryKey: locationKeys.childHistory(childId),
    queryFn: ({ pageParam = 1 }) => LocationService.getChildLocationHistory(childId, { page: pageParam, limit }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!childId,
    staleTime: STALE_TIMES.STANDARD,
  });
};

/**
 * Update location mutation
 */
export const useUpdateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => LocationService.updateLocation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.me() });
      queryClient.invalidateQueries({ queryKey: locationKeys.myHistory() });
    },
  });
};

/**
 * Request child's location (sends silent push to wake their app)
 */
export const useRequestChildLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (childId: string) => LocationService.requestChildLocation(childId),
    onSuccess: (response, childId) => {
      // Immediately invalidate to show we're waiting for update
      queryClient.invalidateQueries({ queryKey: locationKeys.child(childId) });
      
      // Poll for updated location (child app may take time to respond)
      const pollIntervals = [3000, 5000, 8000]; // 3s, 5s, 8s
      pollIntervals.forEach((delay) => {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: locationKeys.child(childId) });
          queryClient.invalidateQueries({ queryKey: locationKeys.children() });
        }, delay);
      });
    },
  });
};

// Re-export types for convenience
export type { LocationData, ChildLocation, ChildInfo, LocationHistoryParams };
