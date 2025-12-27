import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPreferences, updatePreferences, UserPreferences, UpdatePreferencesRequest } from '@/services/ProfileService';
import { useThemeStore, ThemeMode } from '@/libs/theme';
import { useToast } from '@/components/toast';
import { STALE_TIMES, GC_TIMES } from '@/constants/queryConfig';

// Query key for preferences
export const PREFERENCES_QUERY_KEY = ['preferences'];

/**
 * Hook for fetching and caching user preferences
 * Note: Initial sync happens in splash screen (index.tsx) to prevent flash
 */
export function usePreferences() {
    return useQuery({
        queryKey: PREFERENCES_QUERY_KEY,
        queryFn: async () => {
            console.log('[Preferences] Fetching preferences from API...');
            const preferences = await getPreferences();
            console.log('[Preferences] Received from API:', preferences);
            // Don't auto-sync here - initial sync happens in splash screen
            // This prevents double-setting and potential flicker
            return preferences;
        },
        staleTime: STALE_TIMES.STANDARD,
        gcTime: GC_TIMES.STANDARD,
        refetchOnMount: false, // Don't refetch on mount - splash already loaded
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchOnReconnect: false, // Don't refetch on reconnect
    });
}

/**
 * Hook for updating preferences with optimistic updates
 */
export function useUpdatePreference() {
    const queryClient = useQueryClient();
    const setThemeMode = useThemeStore((state) => state.setThemeMode);
    const toast = useToast();

    return useMutation({
        mutationFn: (data: UpdatePreferencesRequest) => updatePreferences(data),
        onMutate: async (newData) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: PREFERENCES_QUERY_KEY });

            // Snapshot the previous value
            const previousPreferences = queryClient.getQueryData<UserPreferences>(PREFERENCES_QUERY_KEY);

            // Optimistically update to the new value
            queryClient.setQueryData<UserPreferences>(PREFERENCES_QUERY_KEY, (old) => {
                if (!old) return old;
                return { ...old, ...newData };
            });

            // If it's a theme change, update the theme store immediately
            if (newData.themePreference) {
                setThemeMode(newData.themePreference as ThemeMode);
            }

            // Return context with the previous value and the new data
            return { previousPreferences, newData };
        },
        onError: (err: any, newData, context) => {
            console.log('[Preferences] Mutation error, rolling back:', err.message);
            // Rollback to the previous value on error
            if (context?.previousPreferences) {
                queryClient.setQueryData(PREFERENCES_QUERY_KEY, context.previousPreferences);
                
                // Rollback theme if it was a theme change
                if (newData.themePreference && context.previousPreferences.themePreference) {
                    setThemeMode(context.previousPreferences.themePreference as ThemeMode);
                }
            }
            toast.error('Error', err.message || 'Failed to update preference');
        },
        onSuccess: (response, variables) => {
            console.log('[Preferences] Mutation success, response:', response);
            
            // Keep the optimistic update - don't overwrite with server response
            // The optimistic update in onMutate already set the correct value
            // Only update if server returns preferences in a known format
            if (response?.preferences) {
                queryClient.setQueryData<UserPreferences>(PREFERENCES_QUERY_KEY, (old) => {
                    if (!old) return response.preferences;
                    return { ...old, ...response.preferences };
                });
            }
            
            const key = Object.keys(variables)[0];
            const label = key === 'themePreference' ? 'Theme' : 
                         key === 'language' ? 'Language' : 
                         key === 'notifications' ? 'Notifications' : 'Newsletter';
            toast.success('Updated', `${label} updated`);
        },
    });
}

/**
 * Hook to prefetch preferences (call this in account tab)
 */
export function usePrefetchPreferences() {
    const queryClient = useQueryClient();

    const prefetch = () => {
        queryClient.prefetchQuery({
            queryKey: PREFERENCES_QUERY_KEY,
            queryFn: async () => {
                const preferences = await getPreferences();
                return preferences;
            },
            staleTime: STALE_TIMES.STANDARD,
        });
    };

    return { prefetch };
}
