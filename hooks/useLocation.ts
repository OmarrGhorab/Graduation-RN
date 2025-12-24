import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LocationService, LocationData, ChildLocation, LocationHistoryParams } from '@/services/LocationService';

// ==================== Query Keys ====================

export const locationKeys = {
  all: ['location'] as const,
  me: () => [...locationKeys.all, 'me'] as const,
  myHistory: (params?: LocationHistoryParams) => [...locationKeys.all, 'history', params] as const,
  children: () => [...locationKeys.all, 'children'] as const,
  child: (childId: string) => [...locationKeys.all, 'child', childId] as const,
  childHistory: (childId: string, params?: LocationHistoryParams) => 
    [...locationKeys.all, 'child', childId, 'history', params] as const,
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
 * Get my location history
 */
export const useMyLocationHistory = (params?: LocationHistoryParams) => {
  return useQuery({
    queryKey: locationKeys.myHistory(params),
    queryFn: () => LocationService.getMyLocationHistory(params),
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
    staleTime: 1000 * 30, // 30 seconds - more frequent for tracking
    enabled: isParent, // Only fetch if user is a parent
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
 * Get specific child's location history
 */
export const useChildLocationHistory = (childId: string, params?: LocationHistoryParams) => {
  return useQuery({
    queryKey: locationKeys.childHistory(childId, params),
    queryFn: () => LocationService.getChildLocationHistory(childId, params),
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
    mutationFn: (recordHistory: boolean = false) => LocationService.updateLocation(recordHistory),
    onSuccess: () => {
      // Invalidate location queries to refetch
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
      }, 5000); // Wait 5 seconds for child's app to respond
    },
  });
};
