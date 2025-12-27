import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProfile,
    updateProfile,
    uploadProfileImage,
    GetProfileResponse,
    UpdateProfileRequest,
    UpdateProfileResponse,
    UploadProfileImageResponse,
} from '@/services/ProfileService';
import { useAuthStore } from '@/libs/auth';
import { STALE_TIMES, GC_TIMES } from '@/constants/queryConfig';

export const PROFILE_QUERY_KEY = ['profile'];

export function useProfileQuery() {
    return useQuery({
        queryKey: PROFILE_QUERY_KEY,
        queryFn: getProfile,
        staleTime: STALE_TIMES.STANDARD,
        gcTime: GC_TIMES.STANDARD,
    });
}

export function useUpdateProfileMutation() {
    const queryClient = useQueryClient();
    const { updateUser } = useAuthStore();

    return useMutation({
        mutationFn: (data: UpdateProfileRequest) => updateProfile(data),
        onSuccess: (response: UpdateProfileResponse) => {
            // Update the cache with new data
            queryClient.setQueryData(PROFILE_QUERY_KEY, (old: GetProfileResponse | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    user: response.user,
                    // Update canChangeUsername if username was changed
                    canChangeUsername: response.user.username !== old.user.username ? false : old.canChangeUsername,
                };
            });
            // Update auth store
            updateUser(response.user);
        },
    });
}

export function useUploadProfileImageMutation() {
    const queryClient = useQueryClient();
    const { updateUser } = useAuthStore();

    return useMutation({
        mutationFn: (profileImg: string) => uploadProfileImage(profileImg),
        onSuccess: (response: UploadProfileImageResponse) => {
            // Update the cache with new profile image
            queryClient.setQueryData(PROFILE_QUERY_KEY, (old: GetProfileResponse | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    user: {
                        ...old.user,
                        profileImg: response.user.profileImg,
                    },
                };
            });
            // Update auth store
            updateUser({ profileImg: response.user.profileImg });
        },
    });
}

// Helper to invalidate profile cache (call when needed)
export function useInvalidateProfile() {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    };
}

// Helper hook that provides profile data with loading states
export function useProfile() {
    const query = useProfileQuery();

    return {
        ...query,
        profile: query.data?.user,
        canChangeUsername: query.data?.canChangeUsername ?? true,
        nextUsernameChangeDate: query.data?.nextUsernameChangeDate ?? null,
    };
}
