import { BASE_URL } from '@/constants/config';
import {
    OnboardingData,
    OnboardingResponse,
    DeviceVerificationRequired,
    AccountDeactivatedResponse,
    ConfirmReactivationResponse,
} from '@/types/auth';
import { useAuthStore } from '@/libs/auth';
import { getValidAccessToken } from './tokenService';
import { registerFCMToken } from './fcmService';
import { ApiError, NetworkError } from '@/types/errors';

/**
 * Check if login response requires device verification
 */
export function requiresDeviceVerification(response: unknown): response is DeviceVerificationRequired {
    const r = response as Record<string, unknown>;
    return r.deviceBlocked === true && r.requiresDeviceVerification === true;
}

/**
 * Check if login response indicates account is deactivated
 */
export function isAccountDeactivated(response: unknown): response is AccountDeactivatedResponse {
    const r = response as Record<string, unknown>;
    return r.accountDeactivated === true && r.requiresReactivation === true && !!r.tempToken;
}

/**
 * Submit onboarding data
 * @param data - Onboarding data collected from all steps
 */
export async function submitOnboarding(data: OnboardingData): Promise<OnboardingResponse> {
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        console.log('[Auth] Submitting onboarding data with URL:', `${BASE_URL}/api/v1/onboarding`);

        const response = await fetch(
            `${BASE_URL}/api/v1/onboarding`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            throw new ApiError(
                responseData.message || responseData.error || 'Onboarding submission failed',
                response.status,
                responseData
            );
        }

        return responseData;
    } catch (error) {
        console.error('[Auth] Onboarding submission failed:', error);

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
 * Delete profile image
 */
export async function deleteProfileImage(): Promise<{ success: boolean; message: string }> {
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        console.log('[Auth] Deleting profile image with URL:', `${BASE_URL}/api/v1/auth/account/profile-image`);

        const response = await fetch(
            `${BASE_URL}/api/v1/auth/account/profile-image`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            throw new ApiError(
                responseData.message || responseData.error || 'Failed to delete profile image',
                response.status,
                responseData
            );
        }

        // Update local user in store
        const { user, updateUser } = useAuthStore.getState();
        if (user) {
            updateUser({ ...user, profileImg: null });
        }

        return { success: true, message: responseData.message || 'Profile image deleted' };
    } catch (error) {
        console.error('[Auth] Profile image deletion failed:', error);

        if (error instanceof ApiError) {
            throw error;
        }

        if (error instanceof Error && error.message === 'Network request failed') {
            throw new NetworkError(`Cannot connect to server at ${BASE_URL}.`);
        }

        throw error;
    }
}

/**
 * Confirm account reactivation using temp token
 * @param tempToken - Temporary token received when deactivated user logged in
 */
export async function confirmReactivation(tempToken: string): Promise<ConfirmReactivationResponse> {
    try {
        console.log('[Auth] Confirming account reactivation with URL:', `${BASE_URL}/api/v1/auth/account/confirm-reactivation`);
        console.log('[Auth] Using temp token (first 20 chars):', tempToken ? tempToken.substring(0, 20) + '...' : 'null');

        const response = await fetch(
            `${BASE_URL}/api/v1/auth/account/confirm-reactivation`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tempToken}`,
                },
            }
        );

        console.log('[Auth] Confirm reactivation response status:', response.status);
        const responseData = await response.json();
        console.log('[Auth] Confirm reactivation response data:', JSON.stringify(responseData, null, 2));

        if (!response.ok) {
            console.error('[Auth] Confirm reactivation failed with status:', response.status);
            console.error('[Auth] Error response:', responseData);
            throw new Error(responseData.error || responseData.message || 'Failed to confirm reactivation');
        }

        // Store tokens on successful reactivation
        if (responseData.user && responseData.accessToken && responseData.refreshToken) {
            console.log('[Auth] Storing tokens after reactivation...');
            useAuthStore.getState().setAuth(responseData.user, responseData.accessToken, responseData.refreshToken);
            registerFCMToken().catch(err => console.log('[Auth] FCM registration warning:', err));
        }

        return responseData;
    } catch (error) {
        console.error('[Auth] Account reactivation confirmation failed:', error);
        console.error('[Auth] Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });

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
