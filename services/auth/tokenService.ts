import { BASE_URL } from '@/constants/config';
import { RefreshTokenResponse } from '@/types/auth';
import { useAuthStore } from '@/libs/auth';
import { ApiError, NetworkError } from '@/types/errors';
import { logger } from '@/libs/logger';

// Helper functions for token management
export const getAuthToken = () => useAuthStore.getState().accessToken;
export const getRefreshToken = () => useAuthStore.getState().refreshToken;

export const updateTokens = (accessToken: string, refreshToken: string) => {
    const { user } = useAuthStore.getState();
    if (user) {
        useAuthStore.getState().setAuth(user, accessToken, refreshToken);
    } else {
        useAuthStore.getState().setTokens(accessToken, refreshToken);
    }
};

export const clearAuthToken = async () => useAuthStore.getState().logout();

// Simple atob polyfill for React Native if needed
const atob = (input: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = input.replace(/=+$/, '');
    let output = '';

    if (str.length % 4 == 1) {
        throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }

    for (let bc = 0, bs = 0, buffer, i = 0; buffer = str.charAt(i++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = chars.indexOf(buffer);
    }

    return output;
};

/**
 * Refresh access token using refresh token
 * @param refreshToken - Refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
        logger.log('[Auth] Refreshing access token with URL:', `${BASE_URL}/api/v1/auth/refresh`);

        const response = await fetch(
            `${BASE_URL}/api/v1/auth/refresh`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refreshToken: refreshToken,
                }),
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            logger.error('[Auth] Token refresh failed with status:', response.status, responseData);
            throw new ApiError(
                responseData.message || responseData.error || 'Token refresh failed',
                response.status,
                responseData
            );
        }

        logger.log('[Auth] Token refresh successful');

        // Store new tokens in one go
        updateTokens(responseData.accessToken, responseData.refreshToken);

        return responseData;
    } catch (error) {
        logger.error('[Auth] Token refresh failed:', error);

        if (error instanceof ApiError) {
            throw error;
        }

        if (error instanceof Error && error.message === 'Network request failed') {
            throw new NetworkError(
                `Cannot connect to server at ${BASE_URL}. ` +
                'Please ensure your backend server is running.'
            );
        }

        throw error;
    }
}

/**
 * Get valid access token, refreshing if necessary
 * Handles concurrent refresh requests by using a shared promise
 * @returns Valid access token or null if refresh fails
 */
let refreshingPromise: Promise<string | null> | null = null;

export async function getValidAccessToken(): Promise<string | null> {
    try {
        const token = getAuthToken();
        const refreshToken = getRefreshToken();

        if (!token || !refreshToken) {
            return null;
        }

        // Check if token is expired (simple check - decode JWT to get exp)
        try {
            const base64Url = token.split('.')[1];
            if (!base64Url) throw new Error('Invalid token format');

            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));

            const expirationTime = payload.exp * 1000;
            const now = Date.now();
            const timeUntilExpiry = expirationTime - now;

            // If token expires in less than 1 minute, refresh it
            if (timeUntilExpiry < 60000) {
                logger.log('[Auth] Access token expired or expiring soon, refreshing...');

                if (refreshingPromise) {
                    logger.log('[Auth] Refresh already in progress, waiting...');
                    return refreshingPromise;
                }

                refreshingPromise = (async () => {
                    try {
                        const refreshResponse = await refreshAccessToken(refreshToken);
                        return refreshResponse.accessToken;
                    } catch (err) {
                        logger.error('[Auth] Refresh promise failed:', err);
                        await clearAuthToken();
                        return null;
                    } finally {
                        refreshingPromise = null;
                    }
                })();

                return refreshingPromise;
            }

            return token;
        } catch (decodeError) {
            logger.log('[Auth] Could not decode token, attempting refresh...');

            if (refreshingPromise) return refreshingPromise;

            refreshingPromise = (async () => {
                try {
                    const refreshResponse = await refreshAccessToken(refreshToken);
                    return refreshResponse.accessToken;
                } catch (err) {
                    logger.error('[Auth] Refresh promise failed (decode error path):', err);
                    await clearAuthToken();
                    return null;
                } finally {
                    refreshingPromise = null;
                }
            })();

            return refreshingPromise;
        }
    } catch (error) {
        logger.error('[Auth] Failed to get valid access token:', error);
        await clearAuthToken();
        return null;
    }
}
