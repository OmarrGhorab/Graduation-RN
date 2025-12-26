import React from 'react';
import { 
    StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { getDeviceIcon, getPlatformDisplayName, SessionDetails } from '@/services/SecurityService';

interface SessionDetailsModalProps {
    visible: boolean;
    session: SessionDetails | null;
    isLoading: boolean;
    onClose: () => void;
    onRevoke: () => void;
    formatDate: (date: string) => string;
}

export function SessionDetailsModal({
    visible,
    session,
    isLoading,
    onClose,
    onRevoke,
    formatDate,
}: SessionDetailsModalProps) {
    const { theme } = useTheme();
    const { t } = useTranslation();

    if (!session) return null;

    const DetailRow = ({ icon, label, value, valueColor }: { 
        icon: string; 
        label: string; 
        value: string;
        valueColor?: string;
    }) => (
        <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: theme.surface }]}>
                <Ionicons name={icon as any} size={18} color={theme.gray[500]} />
            </View>
            <View style={styles.detailInfo}>
                <Text style={[styles.detailLabel, { color: theme.gray[500] }]}>{label}</Text>
                <Text style={[styles.detailValue, { color: valueColor || theme.text }]}>{value}</Text>
            </View>
        </View>
    );

    const getStatusText = () => {
        if (session.status.isActive) return t('settings.statusActive');
        if (session.status.isRevoked) return t('settings.statusRevoked');
        if (session.status.isExpired) return t('settings.statusExpired');
        return t('settings.statusInactive');
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.content, { backgroundColor: theme.background }]}>
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.title, { color: theme.text }]}>{t('settings.sessionDetails')}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.gray[600]} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                        <View style={[styles.deviceSection, { borderBottomColor: theme.border }]}>
                            <View style={[styles.deviceIcon, { backgroundColor: theme.surface }]}>
                                <Ionicons
                                    name={getDeviceIcon(session.device.platform) as any}
                                    size={40}
                                    color={session.isCurrent ? theme.primary : theme.gray[600]}
                                />
                            </View>
                            <Text style={[styles.deviceName, { color: theme.text }]}>
                                {session.device.name || t('settings.unknownDevice')}
                            </Text>
                            {session.isCurrent && (
                                <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                                    <Text style={styles.badgeText}>{t('settings.currentSession')}</Text>
                                </View>
                            )}
                            {session.device.isTrusted && (
                                <View style={[styles.trustedBadge, { backgroundColor: theme.csk[50] }]}>
                                    <Ionicons name="shield-checkmark" size={12} color={theme.csk[600]} />
                                    <Text style={[styles.trustedText, { color: theme.csk[600] }]}>
                                        {t('settings.trustedDevice')}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.detailsList}>
                            <DetailRow 
                                icon="phone-portrait-outline" 
                                label={t('settings.platform')} 
                                value={getPlatformDisplayName(session.device.platform)} 
                            />
                            {session.device.browser && (
                                <DetailRow 
                                    icon="globe-outline" 
                                    label={t('settings.browser')} 
                                    value={session.device.browser} 
                                />
                            )}
                            {session.device.os && (
                                <DetailRow 
                                    icon="laptop-outline" 
                                    label={t('settings.operatingSystem')} 
                                    value={session.device.os} 
                                />
                            )}
                            <DetailRow 
                                icon="wifi-outline" 
                                label={t('settings.ipAddress')} 
                                value={session.network.ipAddress} 
                            />
                            {session.network.location && (
                                <DetailRow 
                                    icon="location-outline" 
                                    label={t('settings.locationLabel')} 
                                    value={session.network.location} 
                                />
                            )}
                            <DetailRow 
                                icon="time-outline" 
                                label={t('settings.lastActivity')} 
                                value={session.isCurrent ? t('settings.activeNow') : formatDate(session.timestamps.lastActivityAt)} 
                            />
                            <DetailRow 
                                icon="calendar-outline" 
                                label={t('settings.signedIn')} 
                                value={formatDate(session.timestamps.createdAt)} 
                            />
                            <DetailRow 
                                icon="hourglass-outline" 
                                label={t('settings.expires')} 
                                value={formatDate(session.timestamps.expiresAt)} 
                            />
                            <DetailRow 
                                icon={session.status.isActive ? "checkmark-circle" : "close-circle"} 
                                label={t('settings.status')} 
                                value={getStatusText()}
                                valueColor={session.status.isActive ? '#10B981' : '#EF4444'}
                            />
                        </View>

                        {!session.isCurrent && session.status.isActive && (
                            <TouchableOpacity
                                style={styles.revokeButton}
                                onPress={onRevoke}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                                        <Text style={styles.revokeText}>{t('settings.signOutThisDevice')}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    body: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    deviceSection: {
        alignItems: 'center',
        paddingBottom: 20,
        borderBottomWidth: 1,
        marginBottom: 20,
    },
    deviceIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    deviceName: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        textAlign: 'center',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
    },
    badgeText: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    trustedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
    },
    trustedText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    detailsList: {
        gap: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailInfo: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 15,
        fontFamily: Fonts.medium,
    },
    revokeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 24,
        marginBottom: 20,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#EF4444',
    },
    revokeText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
});
