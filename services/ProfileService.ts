import { BASE_URL } from '@/constants/config';
import { getValidAccessToken } from './AuthService';

export interface UserProfile {
    id: string;
    name: string;
    username: string;
    email: string;
    profileImg?: string;
    dateOfBirth?: string;
    gender?: string;
    country?: string;
    role?: string;
    bio?: string;
    goals?: string[];
    interests?: Array<{ id: string; name: string }>;
    newsletterEnabled?: boolean;
    lastUsernameChange?: string | null;
    createdAt?: string;
    hasPassword?: boolean;
}

export interface GetProfileResponse {
    user: UserProfile;
    canChangeUsername: boolean;
    nextUsernameChangeDate: string | null;
}

export interface UpdateProfileRequest {
    name?: string;
    username?: string;
    password?: string;
    currentPassword?: string;
    bio?: string;
    goals?: string[];
    interests?: string[];
}

export interface UpdateProfileResponse {
    success: boolean;
    message: string;
    user: UserProfile;
}

export interface UploadProfileImageRequest {
    profileImg: string;
}

export interface UploadProfileImageResponse {
    success?: boolean;
    message: string;
    user: {
        id: string;
        username: string;
        name: string;
        email: string;
        profileImg: string;
    };
}

export interface UsernameCheckResponse {
    available: boolean;
    message?: string;
    username?: string;
    suggestions?: string[];
}

export interface UserPreferences {
    language: string;
    themePreference: string;
    notifications: boolean;
    newsletterEnabled: boolean;
}

export interface UpdatePreferencesRequest {
    language?: string;
    themePreference?: string;
    notifications?: boolean;
    newsletterEnabled?: boolean;
}

/**
 * Get user profile
 */
export async function getProfile(): Promise<GetProfileResponse> {
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${BASE_URL}/api/v1/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const responseData = await response.json();

        if (!response.ok) {
            const error: any = new Error(responseData.message || 'Failed to fetch profile');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        return responseData;
    } catch (error: any) {
        console.error('[Profile] Fetch failed:', error);
        throw error;
    }
}

/**
 * Update user profile
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        console.log('[Profile] Updating profile:', data);

        const response = await fetch(`${BASE_URL}/api/v1/profile`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const error: any = new Error(responseData.message || 'Failed to update profile');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        return responseData;
    } catch (error: any) {
        console.error('[Profile] Update failed:', error);
        throw error;
    }
}

/**
 * Upload profile image
 */
export async function uploadProfileImage(profileImg: string): Promise<UploadProfileImageResponse> {
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        console.log('[Profile] Uploading profile image');

        const response = await fetch(`${BASE_URL}/api/v1/profile/image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ profileImg }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            const error: any = new Error(responseData.message || 'Failed to upload profile image');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        return responseData;
    } catch (error: any) {
        console.error('[Profile] Image upload failed:', error);
        throw error;
    }
}

/**
 * Check username availability
 */
/**
 * Check username availability
 * Public endpoint - no authentication required
 */
export async function checkUsername(username: string): Promise<UsernameCheckResponse> {
    try {
        // Validate username format on client side first
        if (!username || username.length < 3) {
            return {
                available: false,
                message: 'Username must be at least 3 characters long',
                suggestions: [],
            };
        }

        if (username.length > 30) {
            return {
                available: false,
                message: 'Username must be 30 characters or less',
                suggestions: [],
            };
        }

        // Check format (alphanumeric, underscore, hyphen only)
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(username)) {
            return {
                available: false,
                message: 'Username can only contain letters, numbers, underscores, and hyphens',
                suggestions: [],
            };
        }

        const response = await fetch(`${BASE_URL}/api/v1/profile/check-username?username=${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('[Profile] Username check returned non-JSON response');
            throw new Error('Server returned invalid response. Please try again later.');
        }

        const responseData = await response.json();

        if (!response.ok) {
            const error: any = new Error(responseData.message || 'Failed to check username');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        return responseData;
    } catch (error: any) {
        console.error('[Profile] Username check failed:', error);
        
        // If it's a JSON parse error, provide a better message
        if (error.name === 'SyntaxError') {
            throw new Error('Server error. Please try again later.');
        }
        
        throw error;
    }
}

/**
 * Get user preferences from user profile
 */
export async function getPreferences(): Promise<UserPreferences> {
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Use profile endpoint which includes preferences
        const response = await fetch(`${BASE_URL}/api/v1/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }

        const responseData = await response.json();

        if (!response.ok) {
            const error: any = new Error(responseData.message || 'Failed to fetch preferences');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        // Extract preferences from user profile
        const preferences: UserPreferences = {
            language: responseData.user?.preferences?.language || 'en',
            themePreference: responseData.user?.preferences?.themePreference || 'system',
            notifications: responseData.user?.preferences?.notifications ?? true,
            newsletterEnabled: responseData.user?.newsletterEnabled ?? false,
        };

        return preferences;
    } catch (error: any) {
        console.error('[Profile] Fetch preferences failed:', error);
        throw error;
    }
}

/**
 * Update user preferences
 */
export async function updatePreferences(data: UpdatePreferencesRequest): Promise<{ message: string; preferences: UserPreferences }> {
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        console.log('[Profile] Updating preferences:', data);

        const response = await fetch(`${BASE_URL}/api/v1/profile/preferences`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('[Profile] Server returned non-JSON response, status:', response.status);
            throw new Error(`Server error (${response.status}): Endpoint may not exist`);
        }

        const responseData = await response.json();

        if (!response.ok) {
            const error: any = new Error(responseData.message || 'Failed to update preferences');
            error.status = response.status;
            error.responseData = responseData;
            throw error;
        }

        console.log('[Profile] Preferences updated successfully:', responseData);
        return responseData;
    } catch (error: any) {
        console.error('[Profile] Update preferences failed:', error);
        throw error;
    }
}
