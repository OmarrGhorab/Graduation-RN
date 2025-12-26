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

export const useNotificationStyles = () => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const colors = useMemo(() => ({
        csk: isDark ? cskDarkColors : cskColors,
        gray: isDark ? grayDarkColors : grayColors,
        background: isDark ? '#121212' : '#FFFFFF',
        surface: isDark ? '#1E1E1E' : '#FFFFFF',
        surfaceVariant: isDark ? '#2A2A2A' : '#F7F8F9',
        backdrop: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
        statusAcceptedBg: isDark ? '#14532D' : '#DCFCE7',
        statusAcceptedText: isDark ? '#86EFAC' : '#16A34A',
        statusDeclinedBg: isDark ? '#7F1D1D' : '#FEE2E2',
        statusDeclinedText: isDark ? '#FCA5A5' : '#DC2626',
        statusPendingBg: isDark ? '#78350F' : '#FEF3C7',
        statusPendingText: isDark ? '#FCD34D' : '#D97706',
        toastSuccess: isDark ? cskDarkColors[600] : cskColors[500],
        toastError: isDark ? '#DC2626' : '#EF4444',
    }), [isDark]);

    const styles = useMemo(() => StyleSheet.create({
        // Modal styles
        overlay: {
            flex: 1,
            justifyContent: 'flex-end',
        },
        backdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: colors.backdrop,
        },
        modalContainer: {
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '80%',
            minHeight: '50%',
        },
        handleBar: {
            width: 40,
            height: 4,
            backgroundColor: colors.gray[300],
            borderRadius: 2,
            alignSelf: 'center',
            marginTop: 8,
        },

        // Header styles
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.gray[isDark ? 200 : 100],
        },
        headerLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        headerTitle: {
            fontSize: 20,
            fontFamily: Fonts.bold,
            color: colors.gray[900],
        },
        badge: {
            backgroundColor: colors.csk[500],
            minWidth: 22,
            height: 22,
            borderRadius: 11,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 6,
        },
        badgeText: {
            fontSize: 12,
            fontFamily: Fonts.semiBold,
            color: isDark ? colors.gray[50] : '#FFFFFF',
            textAlign: 'center',
        },
        headerRight: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        markAllButton: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            backgroundColor: isDark ? colors.csk[100] : colors.csk[50],
            borderRadius: 8,
        },
        markAllText: {
            fontSize: 13,
            fontFamily: Fonts.medium,
            color: colors.csk[500],
        },
        closeButton: {
            padding: 4,
        },

        // List styles
        listContent: {
            paddingHorizontal: 16,
            paddingVertical: 8,
        },

        // Notification item styles
        notificationItem: {
            flexDirection: 'row',
            padding: 12,
            marginVertical: 4,
            borderRadius: 12,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.gray[isDark ? 200 : 100],
        },
        unreadItem: {
            backgroundColor: isDark ? colors.csk[100] : colors.csk[50],
            borderColor: isDark ? colors.csk[200] : colors.csk[100],
        },
        avatarContainer: {
            marginRight: 12,
        },
        avatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
        },
        iconContainer: {
            width: 48,
            height: 48,
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
        },
        notificationContent: {
            flex: 1,
        },
        notificationHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
        },
        notificationTitle: {
            fontSize: 15,
            fontFamily: Fonts.semiBold,
            color: colors.gray[900],
            flex: 1,
        },
        unreadDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.csk[500],
            marginLeft: 8,
        },
        notificationMessage: {
            fontSize: 14,
            fontFamily: Fonts.regular,
            color: colors.gray[isDark ? 700 : 600],
            marginBottom: 8,
            lineHeight: 20,
        },
        notificationFooter: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        footerRight: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        deleteButton: {
            padding: 4,
        },
        typeTag: {
            backgroundColor: colors.gray[isDark ? 200 : 100],
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 4,
        },
        typeText: {
            fontSize: 11,
            fontFamily: Fonts.medium,
            color: colors.gray[isDark ? 700 : 600],
            textTransform: 'capitalize',
        },
        notificationTime: {
            fontSize: 12,
            fontFamily: Fonts.regular,
            color: colors.gray[isDark ? 600 : 400],
        },

        // Status badge styles
        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: 12,
            gap: 4,
            marginTop: 4,
            marginBottom: 8,
        },
        statusAccepted: {
            backgroundColor: colors.statusAcceptedBg,
        },
        statusDeclined: {
            backgroundColor: colors.statusDeclinedBg,
        },
        statusPending: {
            backgroundColor: colors.statusPendingBg,
        },
        statusText: {
            fontSize: 12,
            fontFamily: Fonts.semiBold,
        },
        statusTextAccepted: {
            color: colors.statusAcceptedText,
        },
        statusTextDeclined: {
            color: colors.statusDeclinedText,
        },
        statusTextPending: {
            color: colors.statusPendingText,
        },

        // Loading & empty states
        loadingState: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 40,
        },
        loadingText: {
            fontSize: 14,
            fontFamily: Fonts.regular,
            color: colors.gray[500],
            marginTop: 12,
        },
        emptyState: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 40,
        },
        emptyTitle: {
            fontSize: 18,
            fontFamily: Fonts.semiBold,
            color: colors.gray[700],
            marginTop: 16,
            marginBottom: 8,
        },
        emptyMessage: {
            fontSize: 14,
            fontFamily: Fonts.regular,
            color: colors.gray[500],
            textAlign: 'center',
        },

        // Toast styles
        toast: {
            position: 'absolute',
            top: 60,
            left: 20,
            right: 20,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            gap: 8,
            zIndex: 1000,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
        },
        toastSuccess: {
            backgroundColor: colors.toastSuccess,
        },
        toastError: {
            backgroundColor: colors.toastError,
        },
        toastText: {
            flex: 1,
            fontSize: 14,
            fontFamily: Fonts.medium,
            color: '#FFFFFF',
        },

        // Footer loader
        footerLoader: {
            paddingVertical: 16,
            alignItems: 'center',
        },
    }), [isDark, colors]);

    return { styles, colors, isDark };
};
