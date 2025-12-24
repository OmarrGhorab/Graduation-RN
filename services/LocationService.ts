import { BASE_URL } from '@/constants/config';
import { getValidAccessToken } from './AuthService';
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

// ==================== Helper ====================

const getAuthHeaders = async () => {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Not authenticated');
  
  const deviceHeaders = await DeviceService.getDeviceHeaders();
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...deviceHeaders,
  };
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
        console.log('[LocationService] No location available to update');
        return null;
      }

      const headers = await getAuthHeaders();
      
      const response = await fetch(`${BASE_URL}/api/v1/location/update`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: location.formattedAddress,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.log('[LocationService] Update location endpoint error');
        return null;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update location');
      }

      return data.location || null;
    } catch (error) {
      console.error('[LocationService] Update location error:', error);
      return null;
    }
  },

  /**
   * Get my latest location from server
   */
  getMyLocation: async (): Promise<LocationData | null> => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${BASE_URL}/api/v1/location/me`, {
        method: 'GET',
        headers,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return null;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get location');
      }

      return data.location || null;
    } catch (error) {
      console.error('[LocationService] Get my location error:', error);
      return null;
    }
  },

  /**
   * Get my location history with pagination
   */
  getMyLocationHistory: async (params?: LocationHistoryParams): Promise<LocationHistoryResponse> => {
    try {
      const headers = await getAuthHeaders();
      
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.from) queryParams.append('from', params.from);
      if (params?.to) queryParams.append('to', params.to);
      
      const url = `${BASE_URL}/api/v1/location/history${queryParams.toString() ? `?${queryParams}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrevious: false } };
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get location history');
      }

      return {
        data: data.data || [],
        pagination: data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
      };
    } catch (error) {
      console.error('[LocationService] Get location history error:', error);
      return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrevious: false } };
    }
  },

  /**
   * Get all linked children's locations (parent only)
   */
  getChildrenLocations: async (): Promise<ChildLocation[]> => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${BASE_URL}/api/v1/location/children`, {
        method: 'GET',
        headers,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return [];
      }

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 403) return [];
        throw new Error(data.message || 'Failed to get children locations');
      }

      return data.children || [];
    } catch (error) {
      console.error('[LocationService] Get children locations error:', error);
      return [];
    }
  },

  /**
   * Get specific child's latest location
   */
  getChildLocation: async (childId: string): Promise<{ child: ChildInfo; location: LocationData | null } | null> => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${BASE_URL}/api/v1/location/child/${childId}`, {
        method: 'GET',
        headers,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return null;
      }

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You are not linked to this child');
        }
        throw new Error(data.message || 'Failed to get child location');
      }

      return {
        child: data.child,
        location: data.location || null,
      };
    } catch (error) {
      console.error('[LocationService] Get child location error:', error);
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
      const headers = await getAuthHeaders();
      
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.from) queryParams.append('from', params.from);
      if (params?.to) queryParams.append('to', params.to);
      
      const url = `${BASE_URL}/api/v1/location/child/${childId}/history${queryParams.toString() ? `?${queryParams}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error');
      }

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You are not linked to this child');
        }
        throw new Error(data.message || 'Failed to get child location history');
      }

      return {
        child: data.child,
        data: data.data || [],
        pagination: data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
      };
    } catch (error) {
      console.error('[LocationService] Get child location history error:', error);
      throw error;
    }
  },

  /**
   * Request fresh location from child (sends silent push notification)
   */
  requestChildLocation: async (childId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${BASE_URL}/api/v1/location/request/${childId}`, {
        method: 'POST',
        headers,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error. Please try again later.');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to request location');
      }

      return data;
    } catch (error: any) {
      console.error('[LocationService] Request child location error:', error);
      throw error;
    }
  },
};
