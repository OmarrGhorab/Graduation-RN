import { StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';

export function useTabBarStyles() {
    const { theme, isDark } = useTheme();

    const tabBarStyle = {
        backgroundColor: isDark ? theme.surface : '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: isDark ? theme.border : theme.gray[100],
        height: 80,
        paddingBottom: 20,
        paddingTop: 10,
        shadowColor: isDark ? '#000' : '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 4,
        elevation: 8,
    };

    const tabBarLabelStyle = {
        fontSize: 12,
        fontFamily: Fonts.medium,
    };

    return {
        theme,
        isDark,
        tabBarStyle,
        tabBarLabelStyle,
        activeTintColor: theme.primary,
        inactiveTintColor: isDark ? theme.gray[500] : theme.gray[500],
    };
}
