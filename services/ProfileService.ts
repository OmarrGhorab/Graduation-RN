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
    newsletterEnabled?: boolean;
    lastUsernameChange?: string | null;
    createdAt?: string;
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
    suggestions?: string[];
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
export async function checkUsername(username: string): Promise<UsernameCheckResponse> {
    try {
        const token = await getValidAccessToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${BASE_URL}/api/v1/profile/check-username?username=${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

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
        throw error;
    }
}
