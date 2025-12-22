import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '@/libs/notifications';

// Storage keys
const PUSH_TOKEN_KEY = '@push_token_v2';
const DEVICE_INFO_KEY = '@device_info_cache';
const LOCATION_CACHE_KEY = '@location_cache';
const LOCATION_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Types
export interface DeviceInfo {
    deviceName: string;
    deviceModel: string;
    osVersion: string;
    appVersion: string;
    platform: 'android' | 'ios';
    timezone: string;
}

export interface LocationInfo {
    location: string | null;
    timezone: string;
    timestamp: number;
}

export interface DeviceHeaders {
    'User-Agent': string;
    'X-Device-Name': string;
    'X-Device-Model': string;
    'X-Device-OS-Version': string;
    'X-App-Version': string;
    'X-Device-Location': string;
    'X-Device-Timezone': string;
    'X-Device-Platform': string;
    'X-Forwarded-For'?: string;
}

// Cache
let cachedDeviceInfo: DeviceInfo | null = null;
let cachedLocationInfo: LocationInfo | null = null;
let cachedPublicIpAddress: string | null = null;
let cachedLocalIpAddress: string | null = null;
let cachedPushToken: string | null = null;

export const DeviceService = {
    /**
     * Get device name (user-friendly name like "Omar's iPhone")
     */
    getDeviceName: (): string => {
        // Try to get a user-friendly device name
        const deviceName = Device.deviceName;
        const modelName = Device.modelName;
        
        if (deviceName && deviceName !== 'Unknown') {
            return deviceName;
        }
        
        if (modelName) {
            return modelName;
        }
        
        return Platform.OS === 'ios' ? 'iPhone' : 'Android Device';
    },

    /**
     * Get device model (e.g., "iPhone 15 Pro", "Samsung Galaxy S24")
     */
    getDeviceModel: (): string => {
        return Device.modelName || Device.deviceName || 'Unknown Model';
    },

    /**
     * Get OS version string (e.g., "iOS 17.2", "Android 14")
     */
    getOSVersion: (): string => {
        const osName = Device.osName || Platform.OS;
        const osVersion = Device.osVersion || String(Platform.Version);
        return `${osName} ${osVersion}`;
    },

    /**
     * Get app version
     */
    getAppVersion: (): string => {
        return Application.nativeApplicationVersion || '1.0.0';
    },

    /**
     * Get platform (android or ios)
     */
    getPlatform: (): 'android' | 'ios' => {
        return Platform.OS as 'android' | 'ios';
    },

    /**
     * Get device timezone
     */
    getTimezone: (): string => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
            return 'UTC';
        }
    },

    /**
     * Get all static device info (cached)
     */
    getDeviceInfo: (): DeviceInfo => {
        if (cachedDeviceInfo) {
            return cachedDeviceInfo;
        }

        cachedDeviceInfo = {
            deviceName: DeviceService.getDeviceName(),
            deviceModel: DeviceService.getDeviceModel(),
            osVersion: DeviceService.getOSVersion(),
            appVersion: DeviceService.getAppVersion(),
            platform: DeviceService.getPlatform(),
            timezone: DeviceService.getTimezone(),
        };

        return cachedDeviceInfo;
    },

    /**
     * Request location permission
     */
    requestLocationPermission: async (): Promise<boolean> => {
        try {
            const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
            
            if (existingStatus === 'granted') {
                return true;
            }

            const { status } = await Location.requestForegroundPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.warn('[DeviceService] Location permission error:', error);
            return false;
        }
    },

    /**
     * Get location string from coordinates using reverse geocoding
     */
    reverseGeocode: async (latitude: number, longitude: number): Promise<string | null> => {
        try {
            const results = await Location.reverseGeocodeAsync({ latitude, longitude });
            
            if (results && results.length > 0) {
                const { city, region, country } = results[0];
                
                // Build location string
                const parts: string[] = [];
                if (city) parts.push(city);
                if (country) parts.push(country);
                
                if (parts.length > 0) {
                    return parts.join(', ');
                }
                
                // Fallback to region if no city
                if (region && country) {
                    return `${region}, ${country}`;
                }
            }
            
            return null;
        } catch (error) {
            console.warn('[DeviceService] Reverse geocoding error:', error);
            return null;
        }
    },

    /**
     * Get user's location (city, country) with caching
     */
    getLocation: async (): Promise<LocationInfo> => {
        const timezone = DeviceService.getTimezone();
        
        // Check cache first
        if (cachedLocationInfo && (Date.now() - cachedLocationInfo.timestamp) < LOCATION_CACHE_DURATION) {
            return cachedLocationInfo;
        }

        // Try to load from storage
        try {
            const stored = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
            if (stored) {
                const parsed: LocationInfo = JSON.parse(stored);
                if ((Date.now() - parsed.timestamp) < LOCATION_CACHE_DURATION) {
                    cachedLocationInfo = parsed;
                    return parsed;
                }
            }
        } catch (e) {
            // Ignore storage errors
        }

        // Check permission
        const hasPermission = await DeviceService.requestLocationPermission();
        
        if (!hasPermission) {
            const fallback: LocationInfo = {
                location: null,
                timezone,
                timestamp: Date.now(),
            };
            cachedLocationInfo = fallback;
            return fallback;
        }

        try {
            // Get current position
            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Low, // Low accuracy is faster and sufficient for city-level
            });

            const { latitude, longitude } = position.coords;
            
            // Reverse geocode to get city/country
            const locationString = await DeviceService.reverseGeocode(latitude, longitude);

            const locationInfo: LocationInfo = {
                location: locationString,
                timezone,
                timestamp: Date.now(),
            };

            // Cache in memory and storage
            cachedLocationInfo = locationInfo;
            await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(locationInfo));

            return locationInfo;
        } catch (error) {
            console.warn('[DeviceService] Location fetch error:', error);
            
            const fallback: LocationInfo = {
                location: null,
                timezone,
                timestamp: Date.now(),
            };
            cachedLocationInfo = fallback;
            return fallback;
        }
    },

    /**
     * Get the public IP address of the device
     */
    getPublicIpAddress: async (): Promise<string> => {
        if (cachedPublicIpAddress) return cachedPublicIpAddress;

        // Try multiple services for reliability
        const ipServices = [
            'https://api.ipify.org?format=json',
            'https://api.my-ip.io/v2/ip.json',
            'https://ipapi.co/json/',
        ];

        for (const service of ipServices) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch(service, {
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    const ip = data.ip || data.origin;
                    if (ip && !ip.startsWith('192.168.') && !ip.startsWith('10.') && ip !== '127.0.0.1') {
                        cachedPublicIpAddress = ip;
                        console.log('[DeviceService] Public IP:', ip);
                        return ip;
                    }
                }
            } catch (e) {
                console.log(`[DeviceService] Failed to fetch from ${service}`);
            }
        }

        console.warn('[DeviceService] Could not get public IP');
        return '';
    },

    /**
     * Get the local IP address of the device
     */
    getLocalIpAddress: async (): Promise<string> => {
        if (cachedLocalIpAddress) return cachedLocalIpAddress;

        try {
            const ip = await Network.getIpAddressAsync();
            cachedLocalIpAddress = ip;
            return ip;
        } catch (e) {
            console.warn('[DeviceService] Failed to get local IP address:', e);
            return '0.0.0.0';
        }
    },

    /**
     * Get the IP address of the device (prefers public IP)
     */
    getIpAddress: async (): Promise<string> => {
        // Try public IP first
        const publicIp = await DeviceService.getPublicIpAddress();
        if (publicIp) return publicIp;

        // Fall back to local IP
        return DeviceService.getLocalIpAddress();
    },

    /**
     * Get the user agent string
     */
    getUserAgent: (): string => {
        const deviceInfo = DeviceService.getDeviceInfo();
        const appName = Application.applicationName || 'GraduationApp';
        
        // Format: AppName/Version (DeviceName; Platform; OS; Model)
        // Example: GraduationApp/1.0.0 (Omar's iPhone; ios; iOS 17.2; iPhone 15 Pro)
        return `${appName}/${deviceInfo.appVersion} (${deviceInfo.deviceName}; ${deviceInfo.platform}; ${deviceInfo.osVersion}; ${deviceInfo.deviceModel})`;
    },

    /**
     * Set the push token
     */
    setPushToken: async (token: string): Promise<void> => {
        cachedPushToken = token;
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    },

    /**
     * Get the stored push token, or try to register if missing
     */
    getPushToken: async (): Promise<string | null> => {
        if (cachedPushToken) return cachedPushToken;

        try {
            const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
            if (storedToken) {
                cachedPushToken = storedToken;
                return storedToken;
            }

            console.log('[DeviceService] Fetching new push token...');
            const newToken = await registerForPushNotificationsAsync();

            if (newToken) {
                cachedPushToken = newToken;
                await AsyncStorage.setItem(PUSH_TOKEN_KEY, newToken);
                return newToken;
            }

            return null;
        } catch (e) {
            console.warn('[DeviceService] Failed to get push token:', e);
            return null;
        }
    },

    /**
     * Get all device headers for API requests
     */
    getDeviceHeaders: async (): Promise<DeviceHeaders> => {
        const deviceInfo = DeviceService.getDeviceInfo();
        const locationInfo = await DeviceService.getLocation();
        const publicIp = await DeviceService.getPublicIpAddress();
        const userAgent = DeviceService.getUserAgent();

        return {
            'User-Agent': userAgent,
            'X-Device-Name': deviceInfo.deviceName,
            'X-Device-Model': deviceInfo.deviceModel,
            'X-Device-OS-Version': deviceInfo.osVersion,
            'X-App-Version': deviceInfo.appVersion,
            'X-Device-Location': locationInfo.location || '',
            'X-Device-Timezone': locationInfo.timezone,
            'X-Device-Platform': deviceInfo.platform,
            'X-Forwarded-For': publicIp,
        };
    },

    /**
     * Get device headers synchronously (uses cached location, may be empty)
     */
    getDeviceHeadersSync: (): Partial<DeviceHeaders> => {
        const deviceInfo = DeviceService.getDeviceInfo();
        const userAgent = DeviceService.getUserAgent();

        return {
            'User-Agent': userAgent,
            'X-Device-Name': deviceInfo.deviceName,
            'X-Device-Model': deviceInfo.deviceModel,
            'X-Device-OS-Version': deviceInfo.osVersion,
            'X-App-Version': deviceInfo.appVersion,
            'X-Device-Location': cachedLocationInfo?.location || '',
            'X-Device-Timezone': deviceInfo.timezone,
            'X-Device-Platform': deviceInfo.platform,
        };
    },

    /**
     * Initialize device service (call on app start)
     * Pre-fetches location and IP in background
     */
    initialize: async (): Promise<void> => {
        // Pre-cache device info
        const deviceInfo = DeviceService.getDeviceInfo();
        console.log('[DeviceService] Device Info:', deviceInfo);
        
        // Pre-fetch location in background (don't await)
        DeviceService.getLocation().then(loc => {
            console.log('[DeviceService] Location:', loc.location);
        }).catch(e => {
            console.warn('[DeviceService] Background location fetch failed:', e);
        });

        // Pre-fetch public IP in background
        DeviceService.getPublicIpAddress().catch(e => {
            console.warn('[DeviceService] Background IP fetch failed:', e);
        });
    },

    /**
     * Clear all cached data
     */
    clearCache: async (): Promise<void> => {
        cachedDeviceInfo = null;
        cachedLocationInfo = null;
        cachedPublicIpAddress = null;
        cachedLocalIpAddress = null;
        cachedPushToken = null;
        
        await AsyncStorage.multiRemove([DEVICE_INFO_KEY, LOCATION_CACHE_KEY, PUSH_TOKEN_KEY]);
    },

    /**
     * Force refresh location
     */
    refreshLocation: async (): Promise<LocationInfo> => {
        cachedLocationInfo = null;
        await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
        return DeviceService.getLocation();
    },
};
