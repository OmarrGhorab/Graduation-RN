import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '@/libs/notifications';
import { logger } from '@/libs/logger';

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

export interface PreciseLocation {
    latitude: number;
    longitude: number;
    accuracy: number | null; // meters
    altitude: number | null; // meters
    altitudeAccuracy: number | null; // meters
    heading: number | null; // degrees (0-360)
    speed: number | null; // m/s
    timestamp: number;
    // Reverse geocoded info
    city: string | null;
    region: string | null;
    country: string | null;
    postalCode: string | null;
    street: string | null;
    formattedAddress: string | null;
}

export type LocationAccuracyLevel = 'lowest' | 'low' | 'balanced' | 'high' | 'highest';

export interface DeviceHeaders {
    'User-Agent': string;
    'X-Device-Name': string;
    'X-Device-Model': string;
    'X-Device-OS-Version': string;
    'X-App-Version': string;
    'X-Device-Location': string;
    'X-Device-Timezone': string;
    'X-Device-Platform': string;
    'X-Device-Latitude'?: string;
    'X-Device-Longitude'?: string;
    'X-Device-Location-Accuracy'?: string;
    'X-Forwarded-For'?: string;
}

// Cache
let cachedDeviceInfo: DeviceInfo | null = null;
let cachedLocationInfo: LocationInfo | null = null;
let cachedPreciseLocation: PreciseLocation | null = null;
let cachedPublicIpAddress: string | null = null;
let cachedLocalIpAddress: string | null = null;
let cachedPushToken: string | null = null;

// Helper to map accuracy level to expo-location accuracy
const getLocationAccuracy = (level: LocationAccuracyLevel): Location.Accuracy => {
    switch (level) {
        case 'lowest': return Location.Accuracy.Lowest;
        case 'low': return Location.Accuracy.Low;
        case 'balanced': return Location.Accuracy.Balanced;
        case 'high': return Location.Accuracy.High;
        case 'highest': return Location.Accuracy.Highest;
        default: return Location.Accuracy.Balanced;
    }
};

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
     * Request location permission (precise only)
     * On Android 12+, if user selects "approximate", we prompt them to enable precise
     */
    requestLocationPermission: async (): Promise<boolean> => {
        try {
            const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
            
            if (existingStatus === 'granted') {
                // Check if we have precise location access (Android 12+)
                const accuracy = await Location.getProviderStatusAsync();
                if (accuracy.locationServicesEnabled) {
                    return true;
                }
            }

            // Request foreground permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                logger.warn('[DeviceService] Location permission denied');
                return false;
            }

            return true;
        } catch (error) {
            logger.warn('[DeviceService] Location permission error:', error);
            return false;
        }
    },

    /**
     * Check if precise location is available (not approximate)
     * Returns true if we can get high-accuracy location
     */
    hasPreciseLocationAccess: async (): Promise<boolean> => {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status !== 'granted') return false;

            // Try to get a location with high accuracy - if it fails or returns low accuracy, 
            // the user likely selected "approximate"
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            // If accuracy is worse than 100m, likely using approximate location
            const accuracy = location.coords.accuracy;
            return accuracy !== null && accuracy < 100;
        } catch {
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
            logger.warn('[DeviceService] Reverse geocoding error:', error);
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
            logger.warn('[DeviceService] Location fetch error:', error);
            
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
     * Get precise location with latitude, longitude, and full geocoded details
     * @param accuracy - Accuracy level: 'lowest', 'low', 'balanced', 'high', 'highest'
     * @param includeGeocoding - Whether to include reverse geocoding (city, country, etc.)
     * @param forceRefresh - Force a new location fetch, ignoring cache
     * @param timeout - Timeout in milliseconds (default: 15000)
     */
    getPreciseLocation: async (options?: {
        accuracy?: LocationAccuracyLevel;
        includeGeocoding?: boolean;
        forceRefresh?: boolean;
        timeout?: number;
    }): Promise<PreciseLocation | null> => {
        const {
            accuracy = 'high',
            includeGeocoding = true,
            forceRefresh = false,
            timeout = 15000,
        } = options || {};

        // Check cache if not forcing refresh (cache for 5 minutes for precise location)
        const PRECISE_CACHE_DURATION = 5 * 60 * 1000;
        if (!forceRefresh && cachedPreciseLocation && 
            (Date.now() - cachedPreciseLocation.timestamp) < PRECISE_CACHE_DURATION) {
            logger.log('[DeviceService] Returning cached precise location');
            return cachedPreciseLocation;
        }

        // Check permission
        const hasPermission = await DeviceService.requestLocationPermission();
        
        if (!hasPermission) {
            logger.warn('[DeviceService] Location permission denied');
            return null;
        }

        try {
            logger.log(`[DeviceService] Getting precise location with ${accuracy} accuracy...`);
            
            // Get current position with specified accuracy
            const position = await Location.getCurrentPositionAsync({
                accuracy: getLocationAccuracy(accuracy),
                timeInterval: 1000, // Update interval in ms
                distanceInterval: 1, // Update distance in meters
            });

            const { latitude, longitude, accuracy: posAccuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;
            
            logger.log(`[DeviceService] Got coordinates: ${latitude}, ${longitude} (accuracy: ${posAccuracy}m)`);

            let geocodeData: {
                city: string | null;
                region: string | null;
                country: string | null;
                postalCode: string | null;
                street: string | null;
                formattedAddress: string | null;
            } = {
                city: null,
                region: null,
                country: null,
                postalCode: null,
                street: null,
                formattedAddress: null,
            };

            // Reverse geocode if requested
            if (includeGeocoding) {
                try {
                    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
                    
                    if (results && results.length > 0) {
                        const result = results[0];
                        geocodeData = {
                            city: result.city || null,
                            region: result.region || null,
                            country: result.country || null,
                            postalCode: result.postalCode || null,
                            street: result.street ? `${result.streetNumber || ''} ${result.street}`.trim() : null,
                            formattedAddress: [
                                result.streetNumber,
                                result.street,
                                result.city,
                                result.region,
                                result.postalCode,
                                result.country,
                            ].filter(Boolean).join(', ') || null,
                        };
                        logger.log('[DeviceService] Geocoded address:', geocodeData.formattedAddress);
                    }
                } catch (geocodeError) {
                    logger.warn('[DeviceService] Reverse geocoding failed:', geocodeError);
                }
            }

            const preciseLocation: PreciseLocation = {
                latitude,
                longitude,
                accuracy: posAccuracy ?? null,
                altitude: altitude ?? null,
                altitudeAccuracy: altitudeAccuracy ?? null,
                heading: heading ?? null,
                speed: speed ?? null,
                timestamp: Date.now(),
                ...geocodeData,
            };

            // Cache the result
            cachedPreciseLocation = preciseLocation;

            return preciseLocation;
        } catch (error) {
            logger.warn('[DeviceService] Precise location fetch error:', error);
            return null;
        }
    },

    /**
     * Watch location changes in real-time
     * @param callback - Function called with each location update
     * @param options - Accuracy level and update intervals
     * @returns Subscription object with remove() method to stop watching
     */
    watchLocation: async (
        callback: (location: PreciseLocation) => void,
        options?: {
            accuracy?: LocationAccuracyLevel;
            timeInterval?: number; // ms between updates
            distanceInterval?: number; // meters between updates
            includeGeocoding?: boolean;
        }
    ): Promise<Location.LocationSubscription | null> => {
        const {
            accuracy = 'high',
            timeInterval = 5000,
            distanceInterval = 10,
            includeGeocoding = false,
        } = options || {};

        const hasPermission = await DeviceService.requestLocationPermission();
        
        if (!hasPermission) {
            logger.warn('[DeviceService] Location permission denied for watch');
            return null;
        }

        try {
            logger.log('[DeviceService] Starting location watch...');
            
            const subscription = await Location.watchPositionAsync(
                {
                    accuracy: getLocationAccuracy(accuracy),
                    timeInterval,
                    distanceInterval,
                },
                async (position) => {
                    const { latitude, longitude, accuracy: posAccuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;
                    
                    let geocodeData = {
                        city: null as string | null,
                        region: null as string | null,
                        country: null as string | null,
                        postalCode: null as string | null,
                        street: null as string | null,
                        formattedAddress: null as string | null,
                    };

                    if (includeGeocoding) {
                        try {
                            const results = await Location.reverseGeocodeAsync({ latitude, longitude });
                            if (results && results.length > 0) {
                                const result = results[0];
                                geocodeData = {
                                    city: result.city || null,
                                    region: result.region || null,
                                    country: result.country || null,
                                    postalCode: result.postalCode || null,
                                    street: result.street ? `${result.streetNumber || ''} ${result.street}`.trim() : null,
                                    formattedAddress: [
                                        result.streetNumber,
                                        result.street,
                                        result.city,
                                        result.region,
                                        result.postalCode,
                                        result.country,
                                    ].filter(Boolean).join(', ') || null,
                                };
                            }
                        } catch (e) {
                            // Ignore geocoding errors in watch mode
                        }
                    }

                    const preciseLocation: PreciseLocation = {
                        latitude,
                        longitude,
                        accuracy: posAccuracy ?? null,
                        altitude: altitude ?? null,
                        altitudeAccuracy: altitudeAccuracy ?? null,
                        heading: heading ?? null,
                        speed: speed ?? null,
                        timestamp: Date.now(),
                        ...geocodeData,
                    };

                    // Update cache
                    cachedPreciseLocation = preciseLocation;
                    
                    callback(preciseLocation);
                }
            );

            return subscription;
        } catch (error) {
            logger.warn('[DeviceService] Watch location error:', error);
            return null;
        }
    },

    /**
     * Get last known location (faster, may be stale)
     */
    getLastKnownLocation: async (): Promise<PreciseLocation | null> => {
        // Return cached if available
        if (cachedPreciseLocation) {
            return cachedPreciseLocation;
        }

        const hasPermission = await DeviceService.requestLocationPermission();
        if (!hasPermission) return null;

        try {
            const position = await Location.getLastKnownPositionAsync();
            
            if (!position) return null;

            const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;

            return {
                latitude,
                longitude,
                accuracy: accuracy ?? null,
                altitude: altitude ?? null,
                altitudeAccuracy: altitudeAccuracy ?? null,
                heading: heading ?? null,
                speed: speed ?? null,
                timestamp: position.timestamp,
                city: null,
                region: null,
                country: null,
                postalCode: null,
                street: null,
                formattedAddress: null,
            };
        } catch (error) {
            logger.warn('[DeviceService] Get last known location error:', error);
            return null;
        }
    },

    /**
     * Check if location services are enabled on the device
     */
    isLocationServicesEnabled: async (): Promise<boolean> => {
        try {
            return await Location.hasServicesEnabledAsync();
        } catch {
            return false;
        }
    },

    /**
     * Get current location permission status
     */
    getLocationPermissionStatus: async (): Promise<'granted' | 'denied' | 'undetermined'> => {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            return status as 'granted' | 'denied' | 'undetermined';
        } catch {
            return 'undetermined';
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
                        logger.log('[DeviceService] Public IP:', ip);
                        return ip;
                    }
                }
            } catch (e) {
                logger.log(`[DeviceService] Failed to fetch from ${service}`);
            }
        }

        logger.warn('[DeviceService] Could not get public IP');
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
            logger.warn('[DeviceService] Failed to get local IP address:', e);
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

            logger.log('[DeviceService] Fetching new push token...');
            const newToken = await registerForPushNotificationsAsync();

            if (newToken) {
                cachedPushToken = newToken;
                await AsyncStorage.setItem(PUSH_TOKEN_KEY, newToken);
                return newToken;
            }

            return null;
        } catch (e) {
            logger.warn('[DeviceService] Failed to get push token:', e);
            return null;
        }
    },

    /**
     * Get all device headers for API requests
     */
    getDeviceHeaders: async (): Promise<DeviceHeaders> => {
        const deviceInfo = DeviceService.getDeviceInfo();
        // Use cached location if available, otherwise fetch
        const preciseLocation = cachedPreciseLocation || await DeviceService.getPreciseLocation({ accuracy: 'highest' });
        const publicIp = await DeviceService.getPublicIpAddress();
        const userAgent = DeviceService.getUserAgent();

        const headers: DeviceHeaders = {
            'User-Agent': userAgent,
            'X-Device-Name': deviceInfo.deviceName,
            'X-Device-Model': deviceInfo.deviceModel,
            'X-Device-OS-Version': deviceInfo.osVersion,
            'X-App-Version': deviceInfo.appVersion,
            'X-Device-Location': preciseLocation?.formattedAddress || '',
            'X-Device-Timezone': deviceInfo.timezone,
            'X-Device-Platform': deviceInfo.platform,
            'X-Forwarded-For': publicIp,
        };

        // Add precise coordinates if available
        if (preciseLocation) {
            headers['X-Device-Latitude'] = preciseLocation.latitude.toString();
            headers['X-Device-Longitude'] = preciseLocation.longitude.toString();
            if (preciseLocation.accuracy) {
                headers['X-Device-Location-Accuracy'] = preciseLocation.accuracy.toString();
            }
        }

        return headers;
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
        logger.log('[DeviceService] Device Info:', deviceInfo);
        
        // Pre-fetch precise location in background
        DeviceService.getPreciseLocation({ accuracy: 'highest' }).then(loc => {
            if (loc) {
                logger.log('[DeviceService] Precise Location:', {
                    lat: loc.latitude,
                    lng: loc.longitude,
                    accuracy: `${loc.accuracy}m`,
                    address: loc.formattedAddress || `${loc.city}, ${loc.country}`,
                });
            } else {
                logger.log('[DeviceService] Location: Permission denied or unavailable');
            }
        }).catch(e => {
            logger.warn('[DeviceService] Background location fetch failed:', e);
        });

        // Pre-fetch public IP in background
        DeviceService.getPublicIpAddress().catch(e => {
            logger.warn('[DeviceService] Background IP fetch failed:', e);
        });
    },

    /**
     * Clear all cached data
     */
    clearCache: async (): Promise<void> => {
        cachedDeviceInfo = null;
        cachedLocationInfo = null;
        cachedPreciseLocation = null;
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

    /**
     * Force refresh precise location
     */
    refreshPreciseLocation: async (accuracy: LocationAccuracyLevel = 'high'): Promise<PreciseLocation | null> => {
        cachedPreciseLocation = null;
        return DeviceService.getPreciseLocation({ accuracy, forceRefresh: true });
    },

    /**
     * Get cached precise location (synchronous, may be null)
     */
    getCachedPreciseLocation: (): PreciseLocation | null => {
        return cachedPreciseLocation;
    },
};
