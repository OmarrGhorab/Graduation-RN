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

export interface LocationRequestResponse {
  success: boolean;
  message: string;
  requestId?: string;
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
      // Get fresh location first
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
          recordHistory,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: location.formattedAddress,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.log('[LocationService] Update location endpoint not available yet');
        return null;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update location');
      }

      return data.data || null;
    } catch (error) {
      console.error('[LocationService] Update location error:', error);
      return null; // Return null instead of throwing
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

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Endpoint not implemented yet, return null silently
        console.log('[LocationService] Location endpoint not available yet');
        return null;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get location');
      }

      return data.data || null;
    } catch (error) {
      console.error('[LocationService] Get my location error:', error);
      return null; // Return null instead of throwing to allow fallback to local location
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

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.log('[LocationService] Children non-JSON response:', text.substring(0, 200));
        return [];
      }

      const data = await response.json();
      
      if (!response.ok) {
        // Don't throw for permission errors - just return empty
        if (response.status === 403) {
          return [];
        }
        throw new Error(data.message || 'Failed to get children locations');
      }

      // Handle different response formats
      const children = data.data || data.children || [];
      
      // Map to expected format
      return children.map((item: any) => ({
        childId: item.childId || item.child?.id,
        childName: item.childName || item.child?.name || item.child?.username,
        location: item.location ? {
          latitude: item.location.latitude,
          longitude: item.location.longitude,
          accuracy: item.location.accuracy,
          address: item.location.address,
          timestamp: item.location.timestamp,
        } : null,
      }));
    } catch (error) {
      console.error('[LocationService] Get children locations error:', error);
      return [];
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

  /**
   * Request fresh location from child (sends silent push notification)
   * Parent only - triggers child's app to wake up and send location
   */
  requestChildLocation: async (childId: string): Promise<LocationRequestResponse> => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${BASE_URL}/api/v1/location/request/${childId}`, {
        method: 'POST',
        headers,
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[LocationService] Non-JSON response:', await response.text());
        throw new Error('Server error. Please try again later.');
      }

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(data.message || 'You are not linked to this child');
        }
        if (response.status === 400) {
          throw new Error(data.message || 'Child device not available');
        }
        throw new Error(data.message || 'Failed to request location');
      }

      return data;
    } catch (error: any) {
      console.error('[LocationService] Request child location error:', error);
      throw error;
    }
  },
};
