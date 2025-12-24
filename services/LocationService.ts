import { BASE_URL } from '@/constants/config';
import { getValidAccessToken } from './AuthService';
import { DeviceService } from './DeviceService';

// ==================== Types ====================

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  address: string | null;
  timestamp: string;
}

export interface ChildLocation {
  childId: string;
  childName: string;
  location: LocationData | null;
}

export interface LocationHistoryParams {
  limit?: number;
  since?: string; // ISO date string
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
   * Update current location on server and optionally record to history
   */
  updateLocation: async (recordHistory: boolean = false): Promise<LocationData | null> => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${BASE_URL}/api/v1/location/update`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ recordHistory }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update location');
      }

      return data.data || null;
    } catch (error) {
      console.error('[LocationService] Update location error:', error);
      throw error;
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

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get location');
      }

      return data.data || null;
    } catch (error) {
      console.error('[LocationService] Get my location error:', error);
      throw error;
    }
  },

  /**
   * Get my location history
   */
  getMyLocationHistory: async (params?: LocationHistoryParams): Promise<LocationData[]> => {
    try {
      const headers = await getAuthHeaders();
      
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.since) queryParams.append('since', params.since);
      
      const url = `${BASE_URL}/api/v1/location/history${queryParams.toString() ? `?${queryParams}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get location history');
      }

      return data.data || [];
    } catch (error) {
      console.error('[LocationService] Get location history error:', error);
      throw error;
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

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get children locations');
      }

      return data.data || [];
    } catch (error) {
      console.error('[LocationService] Get children locations error:', error);
      throw error;
    }
  },

  /**
   * Get specific child's latest location
   */
  getChildLocation: async (childId: string): Promise<LocationData | null> => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${BASE_URL}/api/v1/location/child/${childId}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You are not linked to this child');
        }
        throw new Error(data.message || 'Failed to get child location');
      }

      return data.data || null;
    } catch (error) {
      console.error('[LocationService] Get child location error:', error);
      throw error;
    }
  },

  /**
   * Get specific child's location history
   */
  getChildLocationHistory: async (
    childId: string,
    params?: LocationHistoryParams
  ): Promise<LocationData[]> => {
    try {
      const headers = await getAuthHeaders();
      
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.since) queryParams.append('since', params.since);
      
      const url = `${BASE_URL}/api/v1/location/child/${childId}/history${queryParams.toString() ? `?${queryParams}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You are not linked to this child');
        }
        throw new Error(data.message || 'Failed to get child location history');
      }

      return data.data || [];
    } catch (error) {
      console.error('[LocationService] Get child location history error:', error);
      throw error;
    }
  },
};
