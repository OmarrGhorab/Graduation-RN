import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useThemeStore } from '@/libs/theme';

/**
 * Custom hook that returns the effective color scheme based on user preference
 * Respects the theme mode set by the user (light, dark, or system)
 */
export function useColorScheme() {
    const systemColorScheme = useSystemColorScheme();
    const { themeMode } = useThemeStore();

    // If theme mode is system, use system color scheme
    if (themeMode === 'system') {
        return systemColorScheme;
    }

    // Otherwise, return the user's selected theme
    return themeMode;
}
