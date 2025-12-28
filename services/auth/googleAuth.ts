import { Alert } from 'react-native';
import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import {
    BASE_URL,
    googleWebClientId,
} from '@/constants/config';
import {
    LoginResponse,
    LoginResponseSchema,
} from '@/types/auth';
import { useAuthStore } from '@/libs/auth';
import { DeviceService } from '../DeviceService';
import { registerFCMToken } from './fcmService';
import { requiresDeviceVerification, isAccountDeactivated } from './accountService';
import { NetworkError, getErrorMessage } from '@/types/errors';
import { logger } from '@/libs/logger';

// Types
export interface AuthResponse {
    success: boolean;
    data?: LoginResponse | any;
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
        webClientId: googleWebClientId,
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
    } catch (error) {
        // Google Sign-In SDK errors have a 'code' property
        const googleError = error as { code?: string; message?: string };
        if (googleError.code === statusCodes.SIGN_IN_CANCELLED) {
            return { success: false, cancelled: true };
        } else if (googleError.code === statusCodes.IN_PROGRESS) {
            return { success: false, error: 'Sign-in already in progress' };
        } else if (googleError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            return { success: false, error: 'Google Play Services is not available' };
        }

        return {
            success: false,
            error: getErrorMessage(error),
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
            logger.error('Zod Validation Error:', result.error);
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
        logger.log('[Auth] Authenticating Google Token with URL:', `${BASE_URL}/api/v1/auth/google/mobile`);

        // Get device headers
        const deviceHeaders = await DeviceService.getDeviceHeaders();
        const deviceInfo = DeviceService.getDeviceInfo();

        logger.log('[Auth] Google Login Device Headers:', deviceHeaders);

        const response = await fetch(`${BASE_URL}/api/v1/auth/google/mobile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...deviceHeaders,
            },
            body: JSON.stringify({
                idToken: googleResult.idToken,
                deviceName: deviceInfo.deviceName,
            }),
        });

        const responseData = await response.json();

        // Check if account is deactivated (403 status with tempToken)
        if (response.status === 403 && isAccountDeactivated(responseData)) {
            return {
                success: false,
                error: responseData.message || 'Account is deactivated',
                data: responseData,
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
        
        // Check if 2FA is required
        if (responseData.user?.twoFactorEnabled) {
            return { 
                success: true, 
                data: responseData,
                requires2FA: true 
            };
        }
        
        if (data.user && data.accessToken) {
            useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);
            registerFCMToken().catch((err: unknown) => logger.log('[Auth] FCM registration warning:', err));
        }

        onSuccess?.(responseData);
        return { success: true, data: responseData };
    } catch (error) {
        const errorMsg = getErrorMessage(error);
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
        const isSignedIn = await GoogleSignin.getCurrentUser();
        if (isSignedIn) {
            await GoogleSignin.revokeAccess();
            await GoogleSignin.signOut();
            logger.log('[Auth] Google sign-out completed');
        } else {
            logger.log('[Auth] Not signed in with Google, skipping Google sign-out');
        }
    } catch (error) {
        const googleError = error as { code?: string; message?: string };
        if (googleError?.code === 'SIGN_IN_REQUIRED' || googleError?.message?.includes('SIGN_IN_REQUIRED')) {
            logger.log('[Auth] Google sign-out not needed (not signed in with Google)');
        } else {
            logger.log('[Auth] Google sign-out error (non-critical):', googleError?.message);
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
