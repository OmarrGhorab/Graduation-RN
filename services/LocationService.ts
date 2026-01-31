import { logger } from '@/libs/logger';
import { ApiError, isApiError } from '@/types/errors';
import { apiClient } from './apiClient';
import { DeviceService } from './DeviceService';

// ==================== Types ====================

export interface LocationData {
  id?: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  address: string | null;
  timestamp: string;
}

export interface ChildInfo {
  id: string;
  name: string;
  username: string;
  profileImg: string | null;
}

export interface ChildLocation {
  child: ChildInfo;
  location: LocationData | null;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface LocationHistoryParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

export interface LocationHistoryResponse {
  data: LocationData[];
  pagination: PaginationInfo;
}

export interface ChildLocationHistoryResponse {
  child: ChildInfo;
  data: LocationData[];
  pagination: PaginationInfo;
}

// Default empty pagination for error cases
const emptyPagination: PaginationInfo = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

// ==================== Location Service ====================

export const LocationService = {
  /**
   * Update current location on server
   */
  updateLocation: async (): Promise<LocationData | null> => {
    try {
      const location = await DeviceService.getPreciseLocation({ accuracy: 'high' });

      if (!location) {
        logger.log('[LocationService] No location available to update');
        return null;
      }

      const data = await apiClient.post<{ location?: LocationData }>('/api/v1/location', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.formattedAddress,
      });

      return data.location || null;
    } catch (error) {
      logger.error('[LocationService] Update location error:', error);
      return null;
    }
  },

  /**
   * Get my latest location from server
   */
  getMyLocation: async (): Promise<LocationData | null> => {
    try {
      const data = await apiClient.get<{ location?: LocationData }>('/api/v1/location/me');
      return data.location || null;
    } catch (error) {
      logger.error('[LocationService] Get my location error:', error);
      return null;
    }
  },

  /**
   * Get my location history with pagination
   */
  getMyLocationHistory: async (params?: LocationHistoryParams): Promise<LocationHistoryResponse> => {
    try {
      const data = await apiClient.get<{ data?: LocationData[]; pagination?: PaginationInfo }>('/api/v1/location/history', {
        params: {
          page: params?.page,
          limit: params?.limit,
          from: params?.from,
          to: params?.to,
        },
      });

      return {
        data: data.data || [],
        pagination: data.pagination || emptyPagination,
      };
    } catch (error) {
      logger.error('[LocationService] Get location history error:', error);
      return { data: [], pagination: emptyPagination };
    }
  },

  /**
   * Get all linked children's locations (parent only)
   */
  getChildrenLocations: async (): Promise<ChildLocation[]> => {
    try {
      const data = await apiClient.get<{ children?: ChildLocation[] }>('/api/v1/location/children');
      return data.children || [];
    } catch (error) {
      // 403 means user is not a parent - return empty array
      if (isApiError(error) && error.status === 403) return [];
      logger.error('[LocationService] Get children locations error:', error);
      return [];
    }
  },

  /**
   * Get specific child's latest location
   */
  getChildLocation: async (childId: string): Promise<{ child: ChildInfo; location: LocationData | null } | null> => {
    try {
      const data = await apiClient.get<{ child: ChildInfo; location?: LocationData }>(`/api/v1/location/child/${childId}`);
      return {
        child: data.child,
        location: data.location || null,
      };
    } catch (error) {
      if (isApiError(error) && error.status === 403) {
        throw new ApiError('You are not linked to this child', 403);
      }
      logger.error('[LocationService] Get child location error:', error);
      throw error;
    }
  },

  /**
   * Get specific child's location history with pagination
   */
  getChildLocationHistory: async (
    childId: string,
    params?: LocationHistoryParams
  ): Promise<ChildLocationHistoryResponse> => {
    try {
      const data = await apiClient.get<{ child: ChildInfo; data?: LocationData[]; pagination?: PaginationInfo }>(
        `/api/v1/location/child/${childId}/history`,
        {
          params: {
            page: params?.page,
            limit: params?.limit,
            from: params?.from,
            to: params?.to,
          },
        }
      );

      return {
        child: data.child,
        data: data.data || [],
        pagination: data.pagination || emptyPagination,
      };
    } catch (error) {
      if (isApiError(error) && error.status === 403) {
        throw new ApiError('You are not linked to this child', 403);
      }
      logger.error('[LocationService] Get child location history error:', error);
      throw error;
    }
  },

  /**
   * Request fresh location from child (sends silent push notification)
   */
  requestChildLocation: async (childId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/api/v1/location/request/${childId}`);
  },
};
