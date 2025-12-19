import { BASE_URL } from '@/constants/config';
import { ProfileCompletionBody, ProfileCompletionBodySchema } from '@/types/auth';
import { useAuthStore } from '@/libs/auth';

export const submitProfileCompletion = async (body: ProfileCompletionBody) => {
    try {
        const token = useAuthStore.getState().accessToken;

        // Validate body
        const validation = ProfileCompletionBodySchema.safeParse(body);
        if (!validation.success) {
            console.error('Validation Error:', validation.error);
            return { success: false, error: 'Invalid profile data' };
        }

        const response = await fetch(`${BASE_URL}/api/v1/onboarding`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return {
                success: false,
                error: data.message || `Server error: ${response.status}`,
            };
        }

        // Update store with completed status
        useAuthStore.getState().updateUser({ onboardingCompleted: true });

        return {
            success: true,
            data,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to complete profile',
        };
    }
};

export const getMyProfile = async () => {
    try {
        const token = useAuthStore.getState().accessToken;

        const response = await fetch(`${BASE_URL}/api/v1/auth/myprofile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return {
                success: false,
                error: data.message || `Server error: ${response.status}`,
            };
        }

        // Update the store with the latest user data
        if (data.user) {
            const refreshToken = useAuthStore.getState().refreshToken;
            useAuthStore.getState().setAuth(data.user, token!, refreshToken!);
        }

        return {
            success: true,
            user: data.user,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch profile',
        };
    }
};
