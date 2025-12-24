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
    staleTime: 1000 * 60 * 5, // 5 minutes
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
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Get all children's locations (parent only)
 */
export const useChildrenLocations = (isParent: boolean = false) => {
  return useQuery({
    queryKey: locationKeys.children(),
    queryFn: LocationService.getChildrenLocations,
    staleTime: 1000 * 30, // 30 seconds
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
    staleTime: 1000 * 30, // 30 seconds
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
    staleTime: 1000 * 60 * 2, // 2 minutes
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
    onSuccess: (_, childId) => {
      // Invalidate child location after a delay to fetch updated location
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: locationKeys.child(childId) });
        queryClient.invalidateQueries({ queryKey: locationKeys.children() });
      }, 5000);
    },
  });
};

// Re-export types for convenience
export type { LocationData, ChildLocation, ChildInfo, LocationHistoryParams };
