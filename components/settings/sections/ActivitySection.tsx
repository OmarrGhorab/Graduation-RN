import React, { memo } from 'react';
import { ScrollView, View, ActivityIndicator, RefreshControl, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsSection } from '@/components/settings';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';
import { getDeviceIcon, getPlatformDisplayName, ActivityResponse } from '@/services/SecurityService';

interface ActivitySectionProps {
    t: (key: string, params?: Record<string, string>) => string;
    isLoading: boolean;
    refreshing: boolean;
    activityData: ActivityResponse | null;
    onRefresh: () => void;
    formatDate: (dateString: string) => string;
    formatRelativeTime: (dateString: string) => string;
}

export const ActivitySection = memo(function ActivitySection({
    t,
    isLoading,
    refreshing,
    activityData,
    onRefresh,
    formatDate,
    formatRelativeTime,
}: ActivitySectionProps) {
    const { theme } = useTheme();

    const deviceInfoRows = activityData ? [
        [t('settings.model'), activityData.currentDevice.deviceModel],
        [t('settings.platform'), getPlatformDisplayName(activityData.currentDevice.platform)],
        [t('settings.os'), activityData.currentDevice.os],
        [t('settings.appVersion'), activityData.currentDevice.appVersion],
        [t('settings.ipAddress'), activityData.currentDevice.ipAddress],
        [t('settings.timezone'), activityData.currentDevice.timezone],
    ] : [];

    return (
        <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
            }
        >
            {isLoading && !activityData ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : activityData ? (
                <>
                    <View style={styles.summaryContainer}>
                        <Ionicons name="person-circle" size={48} color={theme.primary} />
                        <Text style={[styles.summaryTitle, { color: theme.text }]}>
                            {t('settings.accountOverview')}
                        </Text>
                        <Text style={[styles.summaryText, { color: theme.gray[500] }]}>
                            {t('settings.memberSince', { date: formatDate(activityData.account.accountCreatedAt) })}
                        </Text>
                    </View>

                    <SettingsSection title={t('settings.currentDevice')}>
                        <View style={[styles.activityCard, { backgroundColor: theme.surface }]}>
                            <View style={[styles.activityCardHeader, { borderBottomColor: theme.border }]}>
                                <Ionicons
                                    name={getDeviceIcon(activityData.currentDevice.platform) as any}
                                    size={24}
                                    color={theme.primary}
                                />
                                <Text style={[styles.activityCardTitle, { color: theme.text }]}>
                                    {activityData.currentDevice.deviceName}
                                </Text>
                            </View>
                            <View style={styles.activityCardContent}>
                                {deviceInfoRows.map(([label, value]) => (
                                    <View key={label} style={styles.activityRow}>
                                        <Text style={[styles.activityLabel, { color: theme.gray[500] }]}>{label}</Text>
                                        <Text style={[styles.activityValue, { color: theme.text }]}>{value}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </SettingsSection>

                    <SettingsSection title={t('settings.sessionsOverview')}>
                        <View style={styles.statsRow}>
                            <View style={[styles.statCard, { backgroundColor: theme.csk[50] }]}>
                                <Text style={[styles.statNumber, { color: theme.csk[600] }]}>
                                    {activityData.sessions.totalActive}
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.gray[600] }]}>
                                    {t('settings.activeSessions')}
                                </Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: theme.csk[50] }]}>
                                <Text style={[styles.statNumber, { color: theme.csk[600] }]}>
                                    {activityData.devices.total}
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.gray[600] }]}>
                                    {t('settings.totalDevices')}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.statsRow}>
                            <View style={[styles.statCard, { backgroundColor: theme.csk[50] }]}>
                                <Text style={[styles.statNumber, { color: theme.csk[600] }]}>
                                    {activityData.devices.trusted}
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.gray[600] }]}>
                                    {t('settings.trustedDevices')}
                                </Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: theme.csk[50] }]}>
                                <Text style={[styles.statNumber, { color: theme.csk[600] }]}>
                                    {activityData.sessions.mostRecentActivity
                                        ? formatRelativeTime(activityData.sessions.mostRecentActivity)
                                        : 'N/A'}
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.gray[600] }]}>
                                    {t('settings.lastActivity')}
                                </Text>
                            </View>
                        </View>
                    </SettingsSection>

                    <SettingsSection title={t('settings.sessionsByPlatform')}>
                        <View style={[styles.activityCard, { backgroundColor: theme.surface }]}>
                            <View style={styles.activityCardContent}>
                                {activityData.sessions.byPlatform.IOS !== undefined && (
                                    <View style={styles.activityRow}>
                                        <View style={styles.platformRow}>
                                            <Ionicons name="phone-portrait-outline" size={18} color={theme.gray[500]} />
                                            <Text style={[styles.activityLabel, { color: theme.gray[500] }]}>iOS</Text>
                                        </View>
                                        <Text style={[styles.activityValue, { color: theme.text }]}>
                                            {activityData.sessions.byPlatform.IOS}{' '}
                                            {activityData.sessions.byPlatform.IOS === 1 ? t('settings.session') : t('settings.sessions')}
                                        </Text>
                                    </View>
                                )}
                                {activityData.sessions.byPlatform.ANDROID !== undefined && (
                                    <View style={styles.activityRow}>
                                        <View style={styles.platformRow}>
                                            <Ionicons name="phone-portrait-outline" size={18} color={theme.gray[500]} />
                                            <Text style={[styles.activityLabel, { color: theme.gray[500] }]}>Android</Text>
                                        </View>
                                        <Text style={[styles.activityValue, { color: theme.text }]}>
                                            {activityData.sessions.byPlatform.ANDROID}{' '}
                                            {activityData.sessions.byPlatform.ANDROID === 1 ? t('settings.session') : t('settings.sessions')}
                                        </Text>
                                    </View>
                                )}
                                {activityData.sessions.byPlatform.WEB !== undefined && (
                                    <View style={styles.activityRow}>
                                        <View style={styles.platformRow}>
                                            <Ionicons name="desktop-outline" size={18} color={theme.gray[500]} />
                                            <Text style={[styles.activityLabel, { color: theme.gray[500] }]}>Web</Text>
                                        </View>
                                        <Text style={[styles.activityValue, { color: theme.text }]}>
                                            {activityData.sessions.byPlatform.WEB}{' '}
                                            {activityData.sessions.byPlatform.WEB === 1 ? t('settings.session') : t('settings.sessions')}
                                        </Text>
                                    </View>
                                )}
                                {!activityData.sessions.byPlatform.IOS &&
                                    !activityData.sessions.byPlatform.ANDROID &&
                                    !activityData.sessions.byPlatform.WEB && (
                                        <Text style={[styles.activityLabel, { color: theme.gray[500], textAlign: 'center' }]}>
                                            {t('settings.noPlatformData')}
                                        </Text>
                                    )}
                            </View>
                        </View>
                    </SettingsSection>

                    {activityData.devices.list && activityData.devices.list.length > 0 && (
                        <SettingsSection title={t('settings.trustedDevices')}>
                            <View style={[styles.activityCard, { backgroundColor: theme.surface }]}>
                                <View style={styles.activityCardContent}>
                                    {activityData.devices.list.filter(d => d.isTrusted).length > 0 ? (
                                        activityData.devices.list.filter(d => d.isTrusted).map((device) => (
                                            <View key={device.id} style={[styles.activityRow, { paddingVertical: 8 }]}>
                                                <View style={styles.deviceInfoRow}>
                                                    <View style={[styles.trustedDeviceIcon, { backgroundColor: theme.csk[50] }]}>
                                                        <Ionicons
                                                            name={getDeviceIcon(device.platform) as any}
                                                            size={18}
                                                            color={theme.primary}
                                                        />
                                                    </View>
                                                    <View>
                                                        <Text style={[styles.activityValue, { color: theme.text }]}>
                                                            {device.name}
                                                        </Text>
                                                        <Text style={[styles.activityLabel, { color: theme.gray[500], fontSize: 12 }]}>
                                                            {getPlatformDisplayName(device.platform)}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={styles.trustedBadgeContainer}>
                                                    <View style={styles.trustedBadge}>
                                                        <Ionicons name="shield-checkmark" size={14} color={theme.csk[600]} />
                                                        <Text style={[styles.activityLabel, { color: theme.csk[600], fontSize: 12 }]}>
                                                            {t('settings.trusted')}
                                                        </Text>
                                                    </View>
                                                    <Text style={[styles.activityLabel, { color: theme.gray[400], fontSize: 11 }]}>
                                                        {formatRelativeTime(device.lastLoginAt)}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={[styles.activityLabel, { color: theme.gray[500], textAlign: 'center' }]}>
                                            {t('settings.noTrustedDevices')}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </SettingsSection>
                    )}

                    {activityData.recentActivity && activityData.recentActivity.length > 0 && (
                        <SettingsSection title={t('settings.recentActivity')}>
                            <View style={[styles.activityCard, { backgroundColor: theme.surface }]}>
                                <View style={styles.activityCardContent}>
                                    {activityData.recentActivity.slice(0, 5).map((activity) => (
                                        <View key={activity.sessionId} style={[styles.activityRow, { paddingVertical: 8 }]}>
                                            <View style={styles.recentActivityInfo}>
                                                <View
                                                    style={[
                                                        styles.trustedDeviceIcon,
                                                        {
                                                            backgroundColor:
                                                                activity.status === 'active' ? theme.csk[50] : theme.gray[100],
                                                        },
                                                    ]}
                                                >
                                                    <Ionicons
                                                        name={getDeviceIcon(activity.platform) as any}
                                                        size={18}
                                                        color={activity.status === 'active' ? theme.primary : theme.gray[400]}
                                                    />
                                                </View>
                                                <View style={styles.recentActivityText}>
                                                    <Text style={[styles.activityValue, { color: theme.text }]} numberOfLines={1}>
                                                        {activity.deviceName}
                                                    </Text>
                                                    <Text
                                                        style={[styles.activityLabel, { color: theme.gray[500], fontSize: 12 }]}
                                                        numberOfLines={1}
                                                    >
                                                        {activity.location || activity.ipAddress}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.recentActivityStatus}>
                                                <View
                                                    style={[
                                                        styles.statusBadge,
                                                        {
                                                            backgroundColor:
                                                                activity.status === 'active'
                                                                    ? theme.csk[50]
                                                                    : activity.status === 'expired'
                                                                    ? '#FEF3C7'
                                                                    : '#FEE2E2',
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.statusText,
                                                            {
                                                                color:
                                                                    activity.status === 'active'
                                                                        ? theme.csk[600]
                                                                        : activity.status === 'expired'
                                                                        ? '#D97706'
                                                                        : '#DC2626',
                                                            },
                                                        ]}
                                                    >
                                                        {activity.status}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.activityLabel, { color: theme.gray[400], fontSize: 11, marginTop: 4 }]}>
                                                    {formatRelativeTime(activity.lastActivityAt)}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </SettingsSection>
                    )}
                </>
            ) : null}
        </ScrollView>
    );
});

const styles = StyleSheet.create({
    content: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    summaryContainer: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
    summaryTitle: { fontSize: 20, fontFamily: Fonts.bold, marginBottom: 4 },
    summaryText: { fontSize: 14, fontFamily: Fonts.regular, textAlign: 'center' },
    activityCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
    activityCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1 },
    activityCardTitle: { fontSize: 16, fontFamily: Fonts.semiBold },
    activityCardContent: { gap: 12 },
    activityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    activityLabel: { fontSize: 14, fontFamily: Fonts.regular },
    activityValue: { fontSize: 14, fontFamily: Fonts.medium },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    statCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
    statNumber: { fontSize: 18, fontFamily: Fonts.bold, marginBottom: 4 },
    statLabel: { fontSize: 12, fontFamily: Fonts.regular, textAlign: 'center' },
    platformRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    deviceInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    trustedDeviceIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    trustedBadgeContainer: { alignItems: 'flex-end' },
    trustedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    recentActivityInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    recentActivityText: { flex: 1 },
    recentActivityStatus: { alignItems: 'flex-end', marginLeft: 8 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    statusText: { fontSize: 11, fontFamily: Fonts.medium, textTransform: 'capitalize' },
});
