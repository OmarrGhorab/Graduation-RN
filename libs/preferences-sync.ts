import { getPreferences } from '@/services/ProfileService';
import { useThemeStore } from '@/libs/theme';
import { useLanguageStore } from '@/libs/language';
import { logger } from '@/libs/logger';

/**
 * Fetch and apply user preferences from API
 * Call this after successful login or when app starts with authenticated user
 * This ensures theme and language are applied before showing the main UI
 */
export async function syncUserPreferences(): Promise<boolean> {
    try {
        logger.log('[PreferencesSync] Fetching user preferences...');
        const preferences = await getPreferences();
        logger.log('[PreferencesSync] Preferences loaded:', preferences);

        // Apply theme preference
        if (preferences.themePreference) {
            useThemeStore.getState().setThemeMode(preferences.themePreference as 'light' | 'dark' | 'system');
        }

        // Apply language preference
        if (preferences.language) {
            await useLanguageStore.getState().setLocale(preferences.language);
        }

        logger.log('[PreferencesSync] Preferences applied successfully');
        return true;
    } catch (error) {
        logger.log('[PreferencesSync] Failed to sync preferences:', error);
        // Return false but don't throw - app should continue with defaults
        return false;
    }
}
