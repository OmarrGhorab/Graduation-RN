import { Alert } from 'react-native';
import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import {
    BASE_URL,
    GOOGLE_WEB_CLIENT_ID,
} from '@/constants/config';
import { Platform } from 'react-native';
import {
    LoginResponse,
    LoginResponseSchema,
    RegisterResponse,
    RegisterResponseSchema,
    RegisterRequest,
    LoginRequest,
    LoginSuccessResponse,
    LoginErrorResponse,
    VerifyEmailOTPRequest,
    VerifyEmailOTPResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    OnboardingData,
    OnboardingResponse,
    ParentSearchResponse,
    ParentLinkRequest,
    ParentLinkResponse,
    RefreshTokenResponse,
    DeviceVerificationRequired,
    DeviceVerifyRequest,
    DeviceVerifyResponse,
    ResendDeviceVerificationOTPRequest,
    ResendDeviceVerificationOTPResponse,
    AccountDeactivatedResponse,
    ConfirmReactivationResponse,
} from '@/types/auth';
import { useAuthStore } from '@/libs/auth';
import { useThemeStore, ThemeMode } from '@/libs/theme';
import { DeviceService } from './DeviceService';

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

// Types
export interface AuthResponse {
    success: boolean;
    data?: LoginResponse | AccountDeactivatedResponse | any;
    error?: string;
    requires2FA?: boolean;
    requiresDeviceVerification?: boolean;
    deviceFingerprint?: string;
    emailOrUsername?: string;
}

export interface GoogleSignInResult {
    success: boolean;
    idToken?: string;
    user?: {
        email: string;
        name: string;
        profileImg: string | null;
    };
    error?: string;
    cancelled?: boolean;
}

// Initialize Google Sign-In configuration
let isConfigured = false;

export const configureGoogleSignIn = () => {
    if (isConfigured) return;

    GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: false,
    });
    isConfigured = true;
};

// Google Sign-In - returns idToken and user info
export const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
    try {
        // Ensure Google Sign-In is configured
        configureGoogleSignIn();

        // Check if device supports Google Play Services
        await GoogleSignin.hasPlayServices();

        // FORCE account selection dialog
        try {
            await GoogleSignin.signOut();
        } catch (e) {
            // Not signed in
        }

        // Sign in and get user info with ID token
        const response = await GoogleSignin.signIn();

        const idToken = response.data?.idToken;
        const user = response.data?.user;

        if (!idToken) {
            return {
                success: false,
                error: 'Failed to retrieve Google ID token',
            };
        }

        return {
            success: true,
            idToken,
            user: user ? {
                email: user.email,
                name: user.name || '',
                profileImg: user.photo,
            } : undefined,
        };
    } catch (error: any) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            return { success: false, cancelled: true };
        } else if (error.code === statusCodes.IN_PROGRESS) {
            return { success: false, error: 'Sign-in already in progress' };
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            return { success: false, error: 'Google Play Services is not available' };
        }

        return {
            success: false,
            error: error.message || 'Failed to sign in with Google',
        };
    }
};

// Authenticate with backend using Google ID token
export const authenticateWithBackend = async (idToken: string): Promise<AuthResponse> => {
    try {
        const response = await fetch(`${BASE_URL}/api/v1/auth/google/mobile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
        });

        const rawData = await response.json().catch(() => ({}));

        if (!response.ok) {
            return {
                success: false,
                error: rawData.message || `Server error: ${response.status}`,
            };
        }

        // Validate response with Zod
        const result = LoginResponseSchema.safeParse(rawData);

        if (!result.success) {
            console.error('Zod Validation Error:', result.error);
            return {
                success: false,
                error: 'Invalid response from server',
            };
        }

        const data = result.data;

        // Update Zustand store if we have user and token
        if (data.user && data.accessToken) {
            useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);
        }

        return {
            success: true,
            data,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to authenticate with server',
        };
    }
};

// Helper functions for token management
const getAuthToken = () => useAuthStore.getState().accessToken;
const getRefreshToken = () => useAuthStore.getState().refreshToken;

const updateTokens = (accessToken: string, refreshToken: string) => {
    const { user } = useAuthStore.getState();
    if (user) {
        useAuthStore.getState().setAuth(user, accessToken, refreshToken);
    } else {
        useAuthStore.getState().setTokens(accessToken, refreshToken);
    }
};

const clearAuthToken = async () => useAuthStore.getState().logout();

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
 * Login user
 * @param data - Login credentials (emailOrUsername, password)
 * @returns LoginSuccessResponse if verified, throws LoginErrorResponse if not verified
 */
export async function login(data: LoginRequest): Promise<LoginSuccessResponse | LoginErrorResponse> {
    try {
        console.log('[Auth] Logging in with URL:', `${BASE_URL}/api/v1/auth/login`);

        // Get device headers
        const deviceHeaders = await DeviceService.getDeviceHeaders();
        const deviceInfo = DeviceService.getDeviceInfo();

        console.log('[Auth] Login Device Headers:', deviceHeaders);

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
                    deviceName: deviceInfo.deviceName, // Also send in body for backward compatibility
                }),
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            // Check if it's an unverified account error - return it instead of throwing
            if (response.status === 403 && responseData.requiresVerification) {
                // Return the error response so the caller can handle it
                return responseData as LoginErrorResponse;
            }

            // Other errors - throw them
            const error: any = new Error(responseData.message || responseData.error || 'Login failed');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        // Store tokens on successful login
        if (responseData.user && responseData.accessToken && responseData.refreshToken) {
            useAuthStore.getState().setAuth(responseData.user, responseData.accessToken, responseData.refreshToken);
            // Sync FCM token
            registerFCMToken().catch(err => console.log('[Auth] FCM registration warning:', err));
            
            // Sync theme preference from user profile
            if (responseData.user.preferences?.themePreference) {
                const themePreference = responseData.user.preferences.themePreference as ThemeMode;
                console.log('[Auth] Syncing theme preference on login:', themePreference);
                useThemeStore.getState().setThemeMode(themePreference);
            }
        }

        return responseData as LoginSuccessResponse;
    } catch (error: any) {
        console.error('[Auth] Login failed:', error);

        // If it's already our custom error with responseData, re-throw it
        if (error.responseData) {
            throw error;
        }

        // Provide more helpful error messages for network errors
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
        console.log('[Auth] Registering user with URL:', `${BASE_URL}/api/v1/auth/register`);

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
            // Create a custom error with the response data for better error handling
            const error: any = new Error(responseData.message || responseData.error || 'Registration failed');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        // Only set auth if we have tokens (some registrations might require verification first)
        if (responseData.user && responseData.accessToken && responseData.refreshToken) {
            useAuthStore.getState().setAuth(responseData.user, responseData.accessToken, responseData.refreshToken);
            // Sync FCM token
            registerFCMToken().catch(err => console.log('[Auth] FCM registration warning:', err));
        }

        return responseData;
    } catch (error: any) {
        console.error('[Auth] Registration failed:', error);

        // Provide more helpful error messages
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
        // Get tokens directly without validation/refresh to avoid creating new sessions
        const token = getAuthToken();
        const refreshToken = getRefreshToken();

        console.log('[Auth] ========== LOGOUT DEBUG START ==========');
        console.log('[Auth] Access Token exists:', !!token);
        console.log('[Auth] Access Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'null');
        console.log('[Auth] Refresh Token exists:', !!refreshToken);
        console.log('[Auth] Refresh Token (first 20 chars):', refreshToken ? refreshToken.substring(0, 20) + '...' : 'null');

        if (token || refreshToken) {
            // Unregister FCM token first (fire and forget)
            unregisterFCMToken().catch(err => console.log('[Auth] FCM unregister warning:', err));

            // Call backend logout API
            console.log('[Auth] Logout URL:', `${BASE_URL}/api/v1/auth/logout`);

            try {
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                };

                // Add access token to Authorization header
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                    console.log('[Auth] Added Authorization header');
                }

                // Add refresh token to x-refresh-token header (not body!)
                if (refreshToken) {
                    headers['x-refresh-token'] = refreshToken;
                    console.log('[Auth] Added x-refresh-token header');
                }

                console.log('[Auth] Request headers:', Object.keys(headers));
                console.log('[Auth] Sending logout request...');

                const response = await fetch(
                    `${BASE_URL}/api/v1/auth/logout`,
                    {
                        method: 'POST',
                        headers,
                        // No body - both tokens are in headers
                    }
                );

                console.log('[Auth] Response status:', response.status);
                console.log('[Auth] Response ok:', response.ok);

                if (!response.ok) {
                    const responseData = await response.json();
                    console.error('[Auth] Logout API ERROR response:', JSON.stringify(responseData, null, 2));
                    // Continue to clear local tokens even if API call fails
                } else {
                    const responseData = await response.json();
                    console.log('[Auth] Logout API SUCCESS response:', JSON.stringify(responseData, null, 2));
                }
            } catch (apiError: any) {
                console.error('[Auth] Logout API call EXCEPTION:', apiError);
                console.error('[Auth] Exception message:', apiError.message);
                console.error('[Auth] Exception stack:', apiError.stack);
                // Continue to clear local tokens even if API call fails
            }
        } else {
            console.log('[Auth] No tokens found, skipping API call');
        }

        // Clear local tokens
        console.log('[Auth] Clearing local tokens...');
        await clearAuthToken();

        // Sign out from Google if user was signed in with Google
        try {
            await signOutGoogle();
            console.log('[Auth] Google sign-out completed');
        } catch (googleError) {
            // Ignore Google sign-out errors (user might not have been signed in with Google)
            console.log('[Auth] Google sign-out not needed or failed (this is okay)');
        }

        console.log('[Auth] ========== LOGOUT DEBUG END ==========');
        console.log('[Auth] Logout completed successfully');
    } catch (error) {
        console.error('[Auth] Logout OUTER EXCEPTION:', error);
        // Even if logout fails, try to clear tokens
        try {
            await clearAuthToken();
        } catch (clearError) {
            console.error('[Auth] Failed to clear tokens during logout error handling:', clearError);
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
        console.log('[Auth] Resending verification OTP with URL:', `${BASE_URL}/api/v1/auth/resend-verification-otp`);

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
            // Handle different error status codes
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
        console.error('[Auth] Resend verification OTP failed:', error);

        // Provide more helpful error messages
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
        console.log('[Auth] Verifying email OTP with URL:', `${BASE_URL}/api/v1/auth/verify-email-otp`);

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
            // Handle different error status codes
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
        console.error('[Auth] Email verification failed:', error);

        // Provide more helpful error messages
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
        console.log('[Auth] Forgot password with URL:', `${BASE_URL}/api/v1/auth/forgot-password`);

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
            // Handle different error status codes
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
        console.error('[Auth] Forgot password failed:', error);

        // Provide more helpful error messages
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
        console.log('[Auth] Reset password with URL:', `${BASE_URL}/api/v1/auth/reset-password`);

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
            // Handle different error status codes
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
        console.error('[Auth] Reset password failed:', error);

        // Provide more helpful error messages
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
 * Check if login response requires device verification
 */
export function requiresDeviceVerification(response: any): response is DeviceVerificationRequired {
    return response.deviceBlocked === true && response.requiresDeviceVerification === true;
}

/**
 * Verify device with OTP
 * @param data - Email/username, device fingerprint, and OTP
 */
export async function verifyDevice(data: DeviceVerifyRequest): Promise<DeviceVerifyResponse> {
    try {
        console.log('[Auth] Verifying device with URL:', `${BASE_URL}/api/v1/auth/verify-device`);

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
            // Handle different error status codes
            if (response.status === 400) {
                throw new Error(responseData.error || responseData.message || 'Missing fields or device not found');
            }
            if (response.status === 401) {
                throw new Error(responseData.error || responseData.message || 'Invalid or expired OTP');
            }
            throw new Error(responseData.error || responseData.message || `HTTP error! status: ${response.status}`);
        }

        console.log('[Auth] Device verify response:', JSON.stringify(responseData, null, 2));

        // If device verified and we have tokens (no 2FA required), store them
        if (responseData.deviceVerified && responseData.accessToken && responseData.refreshToken && !responseData.requires2FA) {
            console.log('[Auth] Device verified, storing tokens...');
            useAuthStore.getState().setAuth(responseData.user, responseData.accessToken, responseData.refreshToken);
            
            // Wait a tick for the store to persist
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verify tokens were stored
            const storedToken = useAuthStore.getState().accessToken;
            console.log('[Auth] Token stored successfully:', !!storedToken);
            
            // Sync FCM token
            registerFCMToken().catch(err => console.log('[Auth] FCM registration warning:', err));
            
            // Sync theme preference from user profile
            if (responseData.user?.preferences?.themePreference) {
                const themePreference = responseData.user.preferences.themePreference as ThemeMode;
                console.log('[Auth] Syncing theme preference on device verification:', themePreference);
                useThemeStore.getState().setThemeMode(themePreference);
            }
        } else {
            console.log('[Auth] Tokens not stored. deviceVerified:', responseData.deviceVerified, 
                'hasAccessToken:', !!responseData.accessToken, 
                'hasRefreshToken:', !!responseData.refreshToken,
                'requires2FA:', responseData.requires2FA);
        }

        return responseData;
    } catch (error: any) {
        console.error('[Auth] Device verification failed:', error);

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
        console.log('[Auth] Resending device verification OTP with URL:', `${BASE_URL}/api/v1/auth/resend-device-verification-otp`);

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
        console.error('[Auth] Resend device verification OTP failed:', error);

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
 * Check if login response indicates account is deactivated
 */
export function isAccountDeactivated(response: any): response is AccountDeactivatedResponse {
    return response.accountDeactivated === true && response.requiresReactivation === true && !!response.tempToken;
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
            // Sync FCM token
            registerFCMToken().catch(err => console.log('[Auth] FCM registration warning:', err));
            
            // Sync theme preference from user profile
            if (responseData.user.preferences?.themePreference) {
                const themePreference = responseData.user.preferences.themePreference as ThemeMode;
                console.log('[Auth] Syncing theme preference on reactivation:', themePreference);
                useThemeStore.getState().setThemeMode(themePreference);
            }
        }

        return responseData;
    } catch (error: any) {
        console.error('[Auth] Account reactivation confirmation failed:', error);
        console.error('[Auth] Error details:', {
            message: error.message,
            stack: error.stack,
        });

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
            const error: any = new Error(responseData.message || responseData.error || 'Onboarding submission failed');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        return responseData;
    } catch (error: any) {
        console.error('[Auth] Onboarding submission failed:', error);

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
            const error: any = new Error(responseData.message || responseData.error || 'Failed to delete profile image');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        // Update local user in store
        const { user, updateUser } = useAuthStore.getState();
        if (user) {
            updateUser({ ...user, profileImg: null });
        }

        return { success: true, message: responseData.message || 'Profile image deleted' };
    } catch (error: any) {
        console.error('[Auth] Profile image deletion failed:', error);

        if (error.message === 'Network request failed') {
            throw new Error(`Cannot connect to server at ${BASE_URL}.`);
        }

        throw error;
    }
}


/**
 * Search for parents to link
 * @param query - Search query string
 * @param page - Page number (default: 1)
 * @param limit - Results per page (default: 10)
 */
export async function searchParents(query: string, page: number = 1, limit: number = 10): Promise<ParentSearchResponse> {
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const url = `${BASE_URL}/api/v1/parent-link/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
        console.log('[Auth] Searching parents with URL:', url);

        const response = await fetch(
            url,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        const responseData = await response.json();

        if (!response.ok) {
            const error: any = new Error(responseData.message || responseData.error || 'Parent search failed');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        return responseData;
    } catch (error: any) {
        console.error('[Auth] Parent search failed:', error);

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
 * Request parent link
 * @param data - Parent link request data
 */
export async function requestParentLink(data: ParentLinkRequest): Promise<ParentLinkResponse> {
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        console.log('[Auth] Requesting parent link with URL:', `${BASE_URL}/api/v1/parent-link/request`);

        const response = await fetch(
            `${BASE_URL}/api/v1/parent-link/request`,
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
        console.log('[Auth] Parent link response:', responseData);

        if (!response.ok) {
            const error: any = new Error(responseData.message || responseData.error || 'Parent link request failed');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        return responseData;
    } catch (error: any) {
        console.error('[Auth] Parent link request failed:', error);

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
 * Refresh access token using refresh token
 * @param refreshToken - Refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
        console.log('[Auth] Refreshing access token with URL:', `${BASE_URL}/api/v1/auth/refresh`);

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
            console.error('[Auth] Token refresh failed with status:', response.status, responseData);
            const error: any = new Error(responseData.message || responseData.error || 'Token refresh failed');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        console.log('[Auth] Token refresh successful');

        // Store new tokens in one go
        updateTokens(responseData.accessToken, responseData.refreshToken);

        return responseData;
    } catch (error: any) {
        console.error('[Auth] Token refresh failed:', error);

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
            // Using our atob polyfill
            const base64Url = token.split('.')[1];
            if (!base64Url) throw new Error('Invalid token format');

            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));

            const expirationTime = payload.exp * 1000; // Convert to milliseconds
            const now = Date.now();
            const timeUntilExpiry = expirationTime - now;

            // If token expires in less than 1 minute, refresh it
            if (timeUntilExpiry < 60000) {
                console.log('[Auth] Access token expired or expiring soon, refreshing...');

                // Help prevent multiple concurrent refresh requests
                if (refreshingPromise) {
                    console.log('[Auth] Refresh already in progress, waiting...');
                    return refreshingPromise;
                }

                refreshingPromise = (async () => {
                    try {
                        const refreshResponse = await refreshAccessToken(refreshToken);
                        return refreshResponse.accessToken;
                    } catch (err) {
                        console.error('[Auth] Refresh promise failed:', err);
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
            // If we can't decode the token, try to refresh it
            console.log('[Auth] Could not decode token, attempting refresh...');

            if (refreshingPromise) return refreshingPromise;

            refreshingPromise = (async () => {
                try {
                    const refreshResponse = await refreshAccessToken(refreshToken);
                    return refreshResponse.accessToken;
                } catch (err) {
                    console.error('[Auth] Refresh promise failed (decode error path):', err);
                    await clearAuthToken();
                    return null;
                } finally {
                    refreshingPromise = null;
                }
            })();

            return refreshingPromise;
        }
    } catch (error) {
        console.error('[Auth] Failed to get valid access token:', error);
        // Clear tokens if refresh fails
        await clearAuthToken();
        return null;
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

        console.log('[Auth] Fetching user profile with URL:', `${BASE_URL}/api/v1/profile`);

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

        // Update user data in store
        if (responseData.user) {
            useAuthStore.getState().updateUser(responseData.user);
            
            // Sync theme preference from user profile
            if (responseData.user.preferences?.themePreference) {
                const themePreference = responseData.user.preferences.themePreference as ThemeMode;
                console.log('[Auth] Syncing theme preference from profile:', themePreference);
                useThemeStore.getState().setThemeMode(themePreference);
            }
        }

        return responseData;
    } catch (error: any) {
        console.error('[Auth] Failed to fetch user profile:', error);

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
 * Register FCM Token
 * Endpoint: /api/v1/notifications/register-token
 */

export async function registerFCMToken(): Promise<void> {
    try {
        const token = await getValidAccessToken();
        if (!token) return;

        const pushToken = await DeviceService.getPushToken();

        // Log device info regardless of token presence for debugging
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

// Combined: Google Sign-In + Backend Authentication
export const googleSignIn = async (options?: {
    showAlerts?: boolean;
    onSuccess?: (data: LoginResponse) => void;
    onError?: (error: string) => void;
    onCancel?: () => void;
}): Promise<AuthResponse> => {
    const { showAlerts = true, onSuccess, onError, onCancel } = options || {};

    // Step 1: Sign in with Google
    const googleResult = await signInWithGoogle();

    if (!googleResult.success) {
        if (googleResult.cancelled) {
            onCancel?.();
            return { success: false, error: 'cancelled' };
        }

        const errorMsg = googleResult.error || 'Google Sign-In failed';
        if (showAlerts) {
            Alert.alert('Google Sign-In Error', errorMsg);
        }
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
    }

    // Step 2: Authenticate with backend using Google ID token
    try {
        console.log('[Auth] Authenticating Google Token with URL:', `${BASE_URL}/api/v1/auth/google/mobile`);

        // Get device headers
        const deviceHeaders = await DeviceService.getDeviceHeaders();
        const deviceInfo = DeviceService.getDeviceInfo();

        console.log('[Auth] Google Login Device Headers:', deviceHeaders);

        const response = await fetch(`${BASE_URL}/api/v1/auth/google/mobile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...deviceHeaders,
            },
            body: JSON.stringify({
                idToken: googleResult.idToken,
                deviceName: deviceInfo.deviceName, // Also send in body for backward compatibility
            }),
        });

        const responseData = await response.json();

        // Check if account is deactivated (403 status with tempToken)
        if (response.status === 403 && isAccountDeactivated(responseData)) {
            return {
                success: false,
                error: responseData.message || 'Account is deactivated',
                data: responseData, // Pass the full response including tempToken
            };
        }

        // Check if device verification is required (403 status)
        if (response.status === 403 && requiresDeviceVerification(responseData)) {
            return {
                success: false,
                requiresDeviceVerification: true,
                deviceFingerprint: responseData.deviceFingerprint,
                emailOrUsername: googleResult.user?.email,
                error: responseData.message || 'Device verification required',
            };
        }

        if (!response.ok) {
            const errorMsg = responseData.message || `Server error: ${response.status}`;
            if (showAlerts) {
                Alert.alert('Authentication Error', errorMsg);
            }
            onError?.(errorMsg);
            return { success: false, error: errorMsg };
        }

        // Validate response with Zod
        const result = LoginResponseSchema.safeParse(responseData);
        if (!result.success) {
            const errorMsg = 'Invalid response from server';
            if (showAlerts) {
                Alert.alert('Authentication Error', errorMsg);
            }
            onError?.(errorMsg);
            return { success: false, error: errorMsg };
        }

        const data = result.data;
        
        // Check if 2FA is required (twoFactorEnabled is inside user object)
        if (responseData.user?.twoFactorEnabled) {
            // Return the response data for 2FA handling by the caller
            return { 
                success: true, 
                data: responseData,
                requires2FA: true 
            };
        }
        
        if (data.user && data.accessToken) {
            useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);
            // Sync FCM token
            registerFCMToken().catch(err => console.log('[Auth] FCM registration warning:', err));
            
            // Sync theme preference from user profile (use responseData for raw response)
            if (responseData.user?.preferences?.themePreference) {
                const themePreference = responseData.user.preferences.themePreference as ThemeMode;
                console.log('[Auth] Syncing theme preference on Google login:', themePreference);
                useThemeStore.getState().setThemeMode(themePreference);
            }
        }

        // Pass responseData to onSuccess to include accountReactivated field
        onSuccess?.(responseData);
        return { success: true, data: responseData };
    } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to authenticate with server';
        if (showAlerts) {
            Alert.alert('Authentication Error', errorMsg);
        }
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
    }
};

// Sign out from Google completely to force account picker next time
export const signOutGoogle = async (): Promise<void> => {
    try {
        // Check if signed in with Google first
        const isSignedIn = await GoogleSignin.getCurrentUser();
        if (isSignedIn) {
            await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
            console.log('[Auth] Google sign-out completed');
        } else {
            console.log('[Auth] Not signed in with Google, skipping Google sign-out');
        }
    } catch (error: any) {
        // SIGN_IN_REQUIRED means user wasn't signed in with Google - this is fine
        if (error?.code === 'SIGN_IN_REQUIRED' || error?.message?.includes('SIGN_IN_REQUIRED')) {
            console.log('[Auth] Google sign-out not needed (not signed in with Google)');
        } else {
            console.log('[Auth] Google sign-out error (non-critical):', error?.message);
        }
    }
};

// Check if user is signed in with Google
export const isGoogleSignedIn = async (): Promise<boolean> => {
    try {
        const currentUser = await GoogleSignin.getCurrentUser();
        return currentUser !== null;
    } catch {
        return false;
    }
};

// Get current Google user (if signed in)
export const getCurrentGoogleUser = async () => {
    try {
        const currentUser = await GoogleSignin.getCurrentUser();
        return currentUser?.user || null;
    } catch {
        return null;
    }
};

