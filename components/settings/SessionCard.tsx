import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { getDeviceIcon, getPlatformDisplayName, getStatusColor } from '@/services/SecurityService';

interface SessionCardProps {
    id: string;
    deviceName: string;
    platform: string;
    location?: string;
    lastActivityAt: string;
    isCurrent: boolean;
    isActive: boolean;
    isRevoked: boolean;
    isExpired: boolean;
    isLoading: boolean;
    onPress: () => void;
    formatTime: (date: string) => string;
}

export function SessionCard({
    deviceName,
    platform,
    location,
    lastActivityAt,
    isCurrent,
    isActive,
    isRevoked,
    isExpired,
    isLoading,
    onPress,
    formatTime,
}: SessionCardProps) {
    const { theme } = useTheme();
    const { t, isRTL } = useTranslation();

    // Determine session status for color
    const getSessionStatus = () => {
        if (isRevoked) return 'revoked';
        if (isExpired) return 'expired';
        if (isActive) return 'active';
        return 'unknown';
    };
    
    const status = getSessionStatus();
    const statusColor = getStatusColor(status);

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: isCurrent ? theme.csk[50] : theme.surface },
                isCurrent && { borderWidth: 1, borderColor: theme.csk[200] }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[
                styles.icon, 
                { backgroundColor: isCurrent ? theme.csk[50] : theme.background }
            ]}>
                <Ionicons
                    name={getDeviceIcon(platform) as any}
                    size={24}
                    color={isCurrent ? theme.primary : theme.gray[600]}
                />
                {/* Status indicator dot */}
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            </View>
            <View style={[
                styles.info,
                isRTL ? styles.infoRtl : styles.infoLtr,
            ]}>
                <View style={styles.header}>
                    <Text style={[styles.device, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
                        {deviceName || t('settings.unknownDevice')}
                    </Text>
                    {isCurrent && (
                        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                            <Text style={styles.badgeText} numberOfLines={1} ellipsizeMode="tail">{t('settings.thisDevice')}</Text>
                        </View>
                    )}
                    {isRevoked && (
                        <View style={[styles.badge, { backgroundColor: statusColor }]}>
                            <Text style={styles.badgeText} numberOfLines={1} ellipsizeMode="tail">{t('settings.revoked')}</Text>
                        </View>
                    )}
                    {isExpired && !isRevoked && (
                        <View style={[styles.badge, { backgroundColor: statusColor }]}>
                            <Text style={styles.badgeText} numberOfLines={1} ellipsizeMode="tail">{t('settings.expired')}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.details}>
                    <Text style={[styles.browser, { color: theme.gray[600] }]} numberOfLines={1} ellipsizeMode="tail">
                        {getPlatformDisplayName(platform)}
                    </Text>
                    {location && (
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={12} color={theme.gray[500]} />
                            <Text style={[styles.location, { color: theme.gray[500] }]} numberOfLines={1} ellipsizeMode="tail">{location}</Text>
                        </View>
                    )}
                    <Text style={[styles.time, { color: theme.gray[500] }]} numberOfLines={1} ellipsizeMode="tail">
                        {isCurrent ? t('settings.activeNow') : formatTime(lastActivityAt)}
                    </Text>
                </View>
            </View>
            {isLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
            ) : (
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={theme.gray[400]} />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
    },
    icon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    statusDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    info: {
        flex: 1,
        minWidth: 0,
    },
    infoLtr: {
        marginLeft: 12,
    },
    infoRtl: {
        marginRight: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minWidth: 0,
    },
    device: {
        flex: 1,
        minWidth: 0,
        fontSize: 15,
        fontFamily: Fonts.semiBold,
    },
    badge: {
        flexShrink: 1,
        maxWidth: 104,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 11,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    details: {
        marginTop: 4,
    },
    browser: {
        fontSize: 13,
        fontFamily: Fonts.medium,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
        minWidth: 0,
    },
    location: {
        flex: 1,
        minWidth: 0,
        fontSize: 13,
        fontFamily: Fonts.regular,
    },
    time: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
});
