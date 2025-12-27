import { BASE_URL } from '@/constants/config';
import { DeviceService } from '../DeviceService';
import { getValidAccessToken } from './tokenService';

/**
 * Register FCM Token
 * Endpoint: /api/v1/notifications/register-token
 */
export async function registerFCMToken(): Promise<void> {
    try {
        const token = await getValidAccessToken();
        if (!token) return;

        const pushToken = await DeviceService.getPushToken();

        const platform = DeviceService.getPlatform();
        const userAgent = DeviceService.getUserAgent();
        const deviceName = DeviceService.getDeviceName();

        console.log('[Auth] Device Info Detected:', {
            platform,
            deviceName,
            userAgent,
            hasPushToken: !!pushToken
        });

        if (!pushToken) {
            console.log('[Auth] No FCM token available to register');
            return;
        }

        console.log('[Auth] Registering FCM token...');

        console.log('[Auth] FCM Registration Body:', {
            token: pushToken,
            platform,
            deviceId: deviceName
        });

        const response = await fetch(
            `${BASE_URL}/api/v1/notifications/register-token`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': userAgent
                },
                body: JSON.stringify({
                    token: pushToken,
                    platform: platform,
                    deviceId: deviceName
                })
            }
        );

        if (response.ok) {
            console.log('[Auth] FCM token registered successfully');
        } else {
            if (response.status !== 404) {
                console.warn('[Auth] Failed to register FCM token, status:', response.status);
            }
        }
    } catch (error) {
        console.warn('[Auth] Error registering FCM token:', error);
    }
}

/**
 * Unregister FCM Token
 * Endpoint: /api/v1/notifications/unregister-token
 */
export async function unregisterFCMToken(): Promise<void> {
    try {
        const token = await getValidAccessToken();
        const pushToken = await DeviceService.getPushToken();

        if (!token || !pushToken) return;

        console.log('[Auth] Unregistering FCM token...');

        const response = await fetch(
            `${BASE_URL}/api/v1/notifications/unregister-token`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    token: pushToken
                })
            }
        );

        if (response.ok) {
            console.log('[Auth] FCM token unregistered successfully');
        } else {
            console.warn('[Auth] Failed to unregister FCM token, status:', response.status);
        }
    } catch (error) {
        console.warn('[Auth] Error unregistering FCM token:', error);
    }
}
