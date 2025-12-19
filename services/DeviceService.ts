import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { registerForPushNotificationsAsync } from '@/libs/notifications';

const PUSH_TOKEN_KEY = '@push_token_v2';

let cachedIpAddress: string | null = null;
let cachedPushToken: string | null = null;

export const DeviceService = {
    /**
     * Get device name (e.g., "iPhone 13", "Pixel 6")
     */
    getDeviceName: () => {
        return Device.modelName || Device.deviceName || 'Unknown Device';
    },

    /**
     * Get the platform OS (android, ios, web, etc.)
     */
    getPlatform: () => {
        return Platform.OS;
    },

    /**
     * Get the IP address of the device
     */
    getIpAddress: async () => {
        if (cachedIpAddress) return cachedIpAddress;

        try {
            // Try to get public IP first
            const response = await fetch('https://api.ipify.org?format=json');
            if (response.ok) {
                const data = await response.json();
                if (data.ip) {
                    cachedIpAddress = data.ip;
                    return data.ip;
                }
            }
        } catch (e) {
            console.log('[DeviceService] Failed to fetch public IP, falling back to local');
        }

        try {
            const ip = await Network.getIpAddressAsync();
            cachedIpAddress = ip;
            return ip;
        } catch (e) {
            console.warn('Failed to get IP address:', e);
            return '0.0.0.0';
        }
    },

    /**
     * Get the user agent string
     */
    getUserAgent: () => {
        // Construct a custom user agent or use standard format
        // Format: AppName/Version (Platform; OS Version; Device Model)
        const appName = 'GraduationApp';
        const version = '1.0.0';
        const systemName = Device.osName || Platform.OS;
        const systemVersion = Device.osVersion || Platform.Version;
        const model = Device.modelName || 'Unknown';

        return `${appName}/${version} (${systemName}; ${systemVersion}; ${model})`;
    },

    /**
     * Set the push token (call this when you get the token from FCM)
     */
    setPushToken: async (token: string) => {
        cachedPushToken = token;
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    },

    /**
     * Get the stored push token, or try to register if missing
     */
    getPushToken: async () => {
        if (cachedPushToken) return cachedPushToken;

        try {
            // Try to get from storage first
            const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
            if (storedToken) {
                cachedPushToken = storedToken;
                return storedToken;
            }

            // If not in storage, try to register and get a new one
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
     * Get all device headers
     */
    getDeviceHeaders: async () => {
        const ip = await DeviceService.getIpAddress();
        const pushToken = await DeviceService.getPushToken();

        return {
            'x-device-name': DeviceService.getDeviceName(),
            'x-platform': DeviceService.getPlatform(),
            'x-ip-address': ip,
            'x-user-agent': DeviceService.getUserAgent(), // Or use standard 'User-Agent'
            'x-push-token': pushToken || '',
        };
    }
};
