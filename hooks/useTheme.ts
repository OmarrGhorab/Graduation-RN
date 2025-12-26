import { useColorScheme } from './use-color-scheme';
import { useThemeStore } from '@/libs/theme';
import { Colors } from '@/constants/theme';

/**
 * Custom hook that provides the current theme based on:
 * 1. User preference from backend (stored in themeStore)
 * 2. System preference (if user chose 'system')
 * 
 * Usage:
 * const { theme, isDark } = useTheme();
 * 
 * Returns:
 * - theme: The Colors object (Colors.light or Colors.dark)
 * - isDark: Boolean indicating if dark mode is active
 */
export function useTheme() {
    const systemColorScheme = useColorScheme();
    const themeMode = useThemeStore((state) => state.themeMode);
    const getEffectiveTheme = useThemeStore((state) => state.getEffectiveTheme);

    // Get the effective theme (respects user preference or system)
    const effectiveTheme = getEffectiveTheme(systemColorScheme);
    const isDark = effectiveTheme === 'dark';
    const theme = isDark ? Colors.dark : Colors.light;

    return {
        theme,
        isDark,
        themeMode,
    };
}
