import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { 
    Fonts, 
    cskColors, 
    cskDarkColors, 
    grayColors, 
    grayDarkColors 
} from '@/constants/theme';
import { ToastConfig, ToastType } from './types';

export const useToastStyles = () => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const colors = useMemo(() => ({
        text: isDark ? grayDarkColors[900] : grayColors[900],
        textSecondary: isDark ? grayDarkColors[700] : grayColors[600],
        shadow: isDark ? '#000' : '#000',
    }), [isDark]);

    const toastConfig = useMemo((): Record<ToastType, ToastConfig> => ({
        success: {
            icon: 'checkmark-circle',
            backgroundColor: isDark ? '#14532D' : '#E7F5EC',
            borderColor: isDark ? cskDarkColors[500] : cskColors[500],
            iconColor: isDark ? cskDarkColors[500] : cskColors[500],
            titleColor: isDark ? cskDarkColors[500] : cskColors[500],
        },
        error: {
            icon: 'close-circle',
            backgroundColor: isDark ? '#7F1D1D' : '#FEE7E7',
            borderColor: isDark ? '#F87171' : '#DC3545',
            iconColor: isDark ? '#F87171' : '#DC3545',
            titleColor: isDark ? '#F87171' : '#DC3545',
        },
        info: {
            icon: 'information-circle',
            backgroundColor: isDark ? '#1E3A5F' : '#E7F0FE',
            borderColor: isDark ? '#60A5FA' : '#007AFF',
            iconColor: isDark ? '#60A5FA' : '#007AFF',
            titleColor: isDark ? '#60A5FA' : '#007AFF',
        },
        warning: {
            icon: 'warning',
            backgroundColor: isDark ? '#78350F' : '#FFF8E7',
            borderColor: isDark ? '#FBBF24' : '#FFC107',
            iconColor: isDark ? '#FBBF24' : '#FFC107',
            titleColor: isDark ? '#FCD34D' : '#856404',
        },
    }), [isDark]);

    const styles = useMemo(() => StyleSheet.create({
        toastWrapper: {
            position: 'absolute',
            left: 16,
            right: 16,
            zIndex: 9999,
        },
        toastContainer: {
            borderRadius: 12,
            borderLeftWidth: 4,
            marginBottom: 10,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.15,
            shadowRadius: 8,
            elevation: 5,
        },
        toastContent: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 14,
        },
        toastIcon: {
            marginRight: 12,
        },
        toastTextContainer: {
            flex: 1,
        },
        toastTitle: {
            fontSize: 15,
            fontFamily: Fonts.semiBold,
            marginBottom: 2,
        },
        toastMessage: {
            fontSize: 13,
            fontFamily: Fonts.regular,
            color: colors.textSecondary,
            lineHeight: 18,
        },
        closeButton: {
            padding: 4,
            marginLeft: 8,
        },
    }), [isDark, colors]);

    return { styles, colors, toastConfig, isDark };
};
