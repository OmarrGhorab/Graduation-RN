import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@/hooks/useNotifications';
import { Fonts } from '@/constants/theme';

interface NotificationBadgeProps {
    onPress?: () => void;
    size?: number;
    color?: string;
    showBadge?: boolean;
}

/**
 * NotificationBadge component
 * 
 * A notification bell icon with an auto-updating badge that shows
 * the unread notification count from React Query.
 * 
 * Usage:
 * <NotificationBadge onPress={() => openNotifications()} />
 */
export default function NotificationBadge({
    onPress,
    size = 24,
    color = '#FFFFFF',
    showBadge = true,
}: NotificationBadgeProps) {
    const { unreadCount } = useNotifications();

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.container}
        >
            <Ionicons name="notifications-outline" size={size} color={color} />
            {showBadge && unreadCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

/**
 * Hook to get the current unread notification count
 * Use this when you need just the count without the badge component
 */
export function useUnreadNotificationCount() {
    const { unreadCount } = useNotifications();
    return unreadCount;
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#FF4444',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
    },
});
