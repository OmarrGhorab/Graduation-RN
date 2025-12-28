import { apiClient } from './apiClient';
import { logger } from '@/libs/logger';

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
    return apiClient.get<GetProfileResponse>('/api/v1/profile');
}

/**
 * Update user profile
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    logger.log('[Profile] Updating profile:', data);
    return apiClient.patch<UpdateProfileResponse>('/api/v1/profile', data);
}

/**
 * Upload profile image
 */
export async function uploadProfileImage(profileImg: string): Promise<UploadProfileImageResponse> {
    logger.log('[Profile] Uploading profile image');
    return apiClient.post<UploadProfileImageResponse>('/api/v1/profile/image', { profileImg });
}

/**
 * Check username availability
 * Public endpoint - no authentication required
 */
export async function checkUsername(username: string): Promise<UsernameCheckResponse> {
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

    // Public endpoint - skip auth and device headers
    return apiClient.get<UsernameCheckResponse>('/api/v1/profile/check-username', {
        params: { username },
        skipAuth: true,
        skipDeviceHeaders: true,
    });
}

/**
 * Get user preferences from user profile
 */
export async function getPreferences(): Promise<UserPreferences> {
    const response = await apiClient.get<{ user?: { preferences?: any; newsletterEnabled?: boolean } }>('/api/v1/profile');

    // Extract preferences from user profile
    return {
        language: response.user?.preferences?.language || 'en',
        themePreference: response.user?.preferences?.themePreference || 'system',
        notifications: response.user?.preferences?.notifications ?? true,
        newsletterEnabled: response.user?.newsletterEnabled ?? false,
    };
}

/**
 * Update user preferences
 */
export async function updatePreferences(data: UpdatePreferencesRequest): Promise<{ message: string; preferences: UserPreferences }> {
    logger.log('[Profile] Updating preferences:', data);
    return apiClient.patch<{ message: string; preferences: UserPreferences }>('/api/v1/profile/preferences', data);
}
