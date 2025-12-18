import { Alert } from 'react-native';
import {
    GoogleSignin,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import {
    BASE_URL,
    GOOGLE_WEB_CLIENT_ID,
} from '@/constants/config';

// Types
export interface AuthResponse {
    success: boolean;
    data?: any;
    error?: string;
}

export interface GoogleSignInResult {
    success: boolean;
    idToken?: string;
    user?: {
        email: string;
        name: string;
        photo: string | null;
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
                photo: user.photo,
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

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.message || `Server error: ${response.status}`,
            };
        }

        const data = await response.json();
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
// Use this for one-click Google authentication
export const googleSignIn = async (options?: {
    showAlerts?: boolean;
    onSuccess?: (data: any) => void;
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
    
    // Step 2: Authenticate with backend
    const backendResult = await authenticateWithBackend(googleResult.idToken!);
    
    if (!backendResult.success) {
        const errorMsg = backendResult.error || 'Authentication failed';
        if (showAlerts) {
            Alert.alert('Authentication Error', errorMsg);
        }
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
    }
    
    onSuccess?.(backendResult.data);
    return { success: true, data: backendResult.data };
};

// Sign out from Google
export const signOutGoogle = async (): Promise<void> => {
    try {
        await GoogleSignin.signOut();
    } catch (error) {
        console.error('Google Sign-Out error:', error);
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
