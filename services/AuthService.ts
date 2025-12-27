import { Platform } from 'react-native';
import {
    BASE_URL,
} from '@/constants/config';
import {
    RegisterResponse,
    RegisterRequest,
    LoginRequest,
    LoginSuccessR
    LoginErrorResponse,
    VerifyEmailOTPRequest,
    VerifyEmailOTPResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    DeviceVerifyRequest,
    DeviceVerifyResponse,
    ResendDeviceVerificatt,
    ResendDeviceVerificationOTPResponse,
} from '@/types/auth';
import { useAuthStore ';
import { DeviceService } from './DeviceServe';
import { logger } from '@/libs/logger';

// Re-export from sub-modules for backward compatibility
export {
    // Google Auth
    configureGoogleSignIn,
    signInWithGoogle,
    googleSignIn,
    authenticateWithBackend,
    signOutGoogle,
    isGoogleSignedIn,
    getCurrentGoogleUser,
    type AuthResponse,
    type GoogleSignInResult,
} from './auth/googleAuth';

export {
    // Token Service
    getValidAccessToken,
    refreshAccessToken,
    getAuthToken,
    getRefreshToken,
    updateTokens,
    clearAuthToken,
} from './auth/tokenService';

export {
    // FCM Service
    registerFCMToken,
    unregisterFCMToken,
} from './auth/fcmService';

export {
    // Parent Link Service
    searchParents,
    requestParentLink,
} from './auth/parentLinkService';

export {
    // Account Service
    submitOnboarding,
    deleteProfileImage,
    confirmReactivation,
    requiresDeviceVerification,
    isAccountDeactivated,
} from './auth/accountService';

// Import for internal use
import { registerFCMToken, unregisterFCMToken } from './auth/fcmService';
import { signOutGoogle } from './auth/googleAuth';
import { getAuthToken, getRefreshToken, clearAuthToken, getValidAccessToken } from './auth/tokenService';

// Helper to get standard API headers
const getApiHeaders = async (token?: string | null) => {
    const deviceHeaders = await DeviceService.getDeviceHeaders();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...deviceHeaders,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

/**
 * Login user
 * @param data - Login credentials (emailOrUsername, password)
 * @returns LoginSuccessResponse if verified, throws LoginErrorResponse if not verified
 */
export async function login(data: LoginRequest): Promise<LoginSuccessResponse | LoginErrorResponse> {
    try {
        logger.log('[Auth] Logging in with URL:', `${BASE_URL}/api/v1/auth/login`);

        const deviceHeaders = await DeviceService.getDeviceHeaders();
        const deviceInfo = DeviceService.getDeviceInfo();

        logger.log('[Auth] Login Device Headers:', deviceHeaders);

        const response = await fetch(
            `${BASE_URL}/api/v1/auth/login`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...deviceHeaders,
                },
                body: JSON.stringify({
                    emailOrUsername: data.emailOrUsername,
                    password: data.password,
                    deviceName: deviceInfo.deviceName,
                }),
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            if (response.status === 403 && responseData.requiresVerification) {
                return responseData as LoginErrorResponse;
            }

            const error: any = new Error(responseData.message || responseData.error || 'Login failed');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        if (responseData.user && responseData.accessToken && responseData.refreshToken) {
            useAuthStore.getState().setAuth(responseData.user, responseData.accessToken, responseData.refreshToken);
            registerFCMToken().catch(err => logger.log('[Auth] FCM registration warning:', err));
        }

        return responseData as LoginSuccessResponse;
    } catch (error: any) {
        logger.error('[Auth] Login failed:', error);

        if (error.responseData) {
            throw error;
        }

        if (error.message === 'Network request failed') {
            throw new Error(
                `Cannot connect to server at ${BASE_URL}. ` +
                'Please ensure your backend server is running.'
            );
        }

        throw error;
    }
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
        logger.log('[Auth] Registering user with URL:', `${BASE_URL}/api/v1/auth/register`);

        const response = await fetch(
            `${BASE_URL}/api/v1/auth/register`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.name,
                    username: data.username,
                    email: data.email,
                    password: data.password,
                }),
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            const error: any = new Error(responseData.message || responseData.error || 'Registration failed');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        if (responseData.user && responseData.accessToken && responseData.refreshToken) {
            useAuthStore.getState().setAuth(responseData.user, responseData.accessToken, responseData.refreshToken);
            registerFCMToken().catch(err => logger.log('[Auth] FCM registration warning:', err));
        }

        return responseData;
    } catch (error: any) {
        logger.error('[Auth] Registration failed:', error);

        if (error.message === 'Network request failed') {
            throw new Error(
                `Cannot connect to server at ${BASE_URL}. ` +
                'Please ensure your backend server is running. ' +
                (Platform.OS === 'android'
                    ? 'For Android emulator, make sure you\'re using 10.0.2.2 instead of localhost.'
                    : 'For iOS simulator, make sure you\'re using localhost.')
            );
        }

        throw error;
    }
}

export async function logout(): Promise<void> {
    try {
        const token = getAuthToken();
        const refreshToken = getRefreshToken();

        logger.log('[Auth] ========== LOGOUT DEBUG START ==========');
        logger.log('[Auth] Access Token exists:', !!token);
        logger.log('[Auth] Access Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'null');
        logger.log('[Auth] Refresh Token exists:', !!refreshToken);
        logger.log('[Auth] Refresh Token (first 20 chars):', refreshToken ? refreshToken.substring(0, 20) + '...' : 'null');

        if (token || refreshToken) {
            unregisterFCMToken().catch(err => logger.log('[Auth] FCM unregister warning:', err));

            logger.log('[Auth] Logout URL:', `${BASE_URL}/api/v1/auth/logout`);

            try {
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                };

                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                    logger.log('[Auth] Added Authorization header');
                }

                if (refreshToken) {
                    headers['x-refresh-token'] = refreshToken;
                    logger.log('[Auth] Added x-refresh-token header');
                }

                logger.log('[Auth] Request headers:', Object.keys(headers));
                logger.log('[Auth] Sending logout request...');

                const response = await fetch(
                    `${BASE_URL}/api/v1/auth/logout`,
                    {
                        method: 'POST',
                        headers,
                    }
                );

                logger.log('[Auth] Response status:', response.status);
                logger.log('[Auth] Response ok:', response.ok);

                if (!response.ok) {
                    const responseData = await response.json();
                    logger.error('[Auth] Logout API ERROR response:', JSON.stringify(responseData, null, 2));
                } else {
                    const responseData = await response.json();
                    logger.log('[Auth] Logout API SUCCESS response:', JSON.stringify(responseData, null, 2));
                }
            } catch (apiError: any) {
                logger.error('[Auth] Logout API call EXCEPTION:', apiError);
                logger.error('[Auth] Exception message:', apiError.message);
                logger.error('[Auth] Exception stack:', apiError.stack);
            }
        } else {
            logger.log('[Auth] No tokens found, skipping API call');
        }

        logger.log('[Auth] Clearing local tokens...');
        await clearAuthToken();

        try {
            await signOutGoogle();
            logger.log('[Auth] Google sign-out completed');
        } catch (googleError) {
            logger.log('[Auth] Google sign-out not needed or failed (this is okay)');
        }

        logger.log('[Auth] ========== LOGOUT DEBUG END ==========');
        logger.log('[Auth] Logout completed successfully');
    } catch (error) {
        logger.error('[Auth] Logout OUTER EXCEPTION:', error);
        try {
            await clearAuthToken();
        } catch (clearError) {
            logger.error('[Auth] Failed to clear tokens during logout error handling:', clearError);
        }
        throw error;
    }
}

/**
 * Resend verification OTP
 * @param email - Email address to resend OTP to
 */
export async function resendVerificationOTP(email: string): Promise<{ message: string }> {
    try {
        logger.log('[Auth] Resending verification OTP with URL:', `${BASE_URL}/api/v1/auth/resend-verification-otp`);

        const response = await fetch(
            `${BASE_URL}/api/v1/auth/resend-verification-otp`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                }),
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            if (response.status === 400) {
                throw new Error(responseData.message || 'Invalid email address');
            }
            if (response.status === 404) {
                throw new Error(responseData.message || 'User not found');
            }
            throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        }

        return responseData;
    } catch (error: any) {
        logger.error('[Auth] Resend verification OTP failed:', error);

        if (error.message === 'Network request failed') {
            throw new Error(
                `Cannot connect to server at ${BASE_URL}. ` +
                'Please ensure your backend server is running.'
            );
        }

        throw error;
    }
}

/**
 * Verify email OTP
 * @param data - Email and OTP for verification
 */
export async function verifyEmailOTP(data: VerifyEmailOTPRequest): Promise<VerifyEmailOTPResponse> {
    try {
        logger.log('[Auth] Verifying email OTP with URL:', `${BASE_URL}/api/v1/auth/verify-email-otp`);

        const response = await fetch(
            `${BASE_URL}/api/v1/auth/verify-email-otp`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    otp: data.otp,
                }),
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            if (response.status === 400) {
                throw new Error(responseData.message || 'Invalid OTP or email');
            }
            if (response.status === 404) {
                throw new Error(responseData.message || 'User not found');
            }
            throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        }

        return responseData;
    } catch (error: any) {
        logger.error('[Auth] Email verification failed:', error);

        if (error.message === 'Network request failed') {
            throw new Error(
                `Cannot connect to server at ${BASE_URL}. ` +
                'Please ensure your backend server is running.'
            );
        }

        throw error;
    }
}

/**
 * Forgot password - Send OTP to email
 * @param data - Email address
 */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    try {
        logger.log('[Auth] Forgot password with URL:', `${BASE_URL}/api/v1/auth/forgot-password`);

        const response = await fetch(
            `${BASE_URL}/api/v1/auth/forgot-password`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                }),
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            if (response.status === 400) {
                throw new Error(responseData.message || 'Invalid email address');
            }
            if (response.status === 404) {
                throw new Error(responseData.message || 'User not found');
            }
            throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        }

        return responseData;
    } catch (error: any) {
        logger.error('[Auth] Forgot password failed:', error);

        if (error.message === 'Network request failed') {
            throw new Error(
                `Cannot connect to server at ${BASE_URL}. ` +
                'Please ensure your backend server is running.'
            );
        }

        throw error;
    }
}

/**
 * Reset password - Reset password with OTP
 * @param data - Email, OTP, and new password
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
        logger.log('[Auth] Reset password with URL:', `${BASE_URL}/api/v1/auth/reset-password`);

        const response = await fetch(
            `${BASE_URL}/api/v1/auth/reset-password`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    otp: data.otp,
                    newPassword: data.newPassword,
                }),
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            if (response.status === 400) {
                throw new Error(responseData.message || 'Invalid OTP or password');
            }
            if (response.status === 404) {
                throw new Error(responseData.message || 'User not found');
            }
            throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
        }

        return responseData;
    } catch (error: any) {
        logger.error('[Auth] Reset password failed:', error);

        if (error.message === 'Network request failed') {
            throw new Error(
                `Cannot connect to server at ${BASE_URL}. ` +
                'Please ensure your backend server is running.'
            );
        }

        throw error;
    }
}

/**
 * Verify device with OTP
 * @param data - Email/username, device fingerprint, and OTP
 */
export async function verifyDevice(data: DeviceVerifyRequest): Promise<DeviceVerifyResponse> {
    try {
        logger.log('[Auth] Verifying device with URL:', `${BASE_URL}/api/v1/auth/verify-device`);

        const response = await fetch(
            `${BASE_URL}/api/v1/auth/verify-device`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailOrUsername: data.emailOrUsername,
                    deviceFingerprint: data.deviceFingerprint,
                    otp: data.otp,
                }),
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            if (response.status === 400) {
                throw new Error(responseData.error || responseData.message || 'Missing fields or device not found');
            }
            if (response.status === 401) {
                throw new Error(responseData.error || responseData.message || 'Invalid or expired OTP');
            }
            throw new Error(responseData.error || responseData.message || `HTTP error! status: ${response.status}`);
        }

        logger.log('[Auth] Device verify response:', JSON.stringify(responseData, null, 2));

        if (responseData.deviceVerified && responseData.accessToken && responseData.refreshToken && !responseData.requires2FA) {
            logger.log('[Auth] Device verified, storing tokens...');
            useAuthStore.getState().setAuth(responseData.user, responseData.accessToken, responseData.refreshToken);
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const storedToken = useAuthStore.getState().accessToken;
            logger.log('[Auth] Token stored successfully:', !!storedToken);
            
            registerFCMToken().catch(err => logger.log('[Auth] FCM registration warning:', err));
        } else {
            logger.log('[Auth] Tokens not stored. deviceVerified:', responseData.deviceVerified, 
                'hasAccessToken:', !!responseData.accessToken, 
                'hasRefreshToken:', !!responseData.refreshToken,
                'requires2FA:', responseData.requires2FA);
        }

        return responseData;
    } catch (error: any) {
        logger.error('[Auth] Device verification failed:', error);

        if (error.message === 'Network request failed') {
            throw new Error(
                `Cannot connect to server at ${BASE_URL}. ` +
                'Please ensure your backend server is running.'
            );
        }

        throw error;
    }
}

/**
 * Resend device verification OTP
 * @param data - Email/username and device fingerprint
 */
export async function resendDeviceVerificationOTP(data: ResendDeviceVerificationOTPRequest): Promise<ResendDeviceVerificationOTPResponse> {
    try {
        logger.log('[Auth] Resending device verification OTP with URL:', `${BASE_URL}/api/v1/auth/resend-device-verification-otp`);

        const response = await fetch(
            `${BASE_URL}/api/v1/auth/resend-device-verification-otp`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailOrUsername: data.emailOrUsername,
                    deviceFingerprint: data.deviceFingerprint,
                }),
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.error || responseData.message || 'Failed to resend OTP');
        }

        return responseData;
    } catch (error: any) {
        logger.error('[Auth] Resend device verification OTP failed:', error);

        if (error.message === 'Network request failed') {
            throw new Error(
                `Cannot connect to server at ${BASE_URL}. ` +
                'Please ensure your backend server is running.'
            );
        }

        throw error;
    }
}

/**
 * Get user profile
 * @returns User profile data
 */
export async function getUserProfile(): Promise<any> {
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        logger.log('[Auth] Fetching user profile with URL:', `${BASE_URL}/api/v1/profile`);

        const response = await fetch(
            `${BASE_URL}/api/v1/profile`,
            {
                method: 'GET',
                headers: await getApiHeaders(token),
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            const error: any = new Error(responseData.message || responseData.error || 'Failed to fetch user profile');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        if (responseData.user) {
            useAuthStore.getState().updateUser(responseData.user);
        }

        return responseData;
    } catch (error: any) {
        logger.error('[Auth] Failed to fetch user profile:', error);

        if (error.message === 'Network request failed') {
            throw new Error(
                `Cannot connect to server at ${BASE_URL}. ` +
                'Please ensure your backend server is running.'
            );
        }

        throw error;
    }
}
