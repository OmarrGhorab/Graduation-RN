import React, { memo } from 'react';
import { ScrollView, View, ActivityIndicator, RefreshControl, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsSection, SessionCard } from '@/components/settings';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';
import { Session } from '@/services/SecurityService';

interface SessionsSectionProps {
    t: (key: string) => string;
    isLoading: boolean;
    refreshing: boolean;
    sessions: Session[];
    loadingSessionId: string | null;
    onRefresh: () => void;
    onViewSession: (sessionId: string) => void;
    onRevokeAllSessions: () => void;
    formatRelativeTime: (dateString: string) => string;
}

export const SessionsSection = memo(function SessionsSection({
    t,
    isLoading,
    refreshing,
    sessions,
    loadingSessionId,
    onRefresh,
    onViewSession,
    onRevokeAllSessions,
    formatRelativeTime,
}: SessionsSectionProps) {
    const { theme, isDark } = useTheme();
    const activeSessions = sessions.filter(s => s.isActive);
    const otherSessions = sessions.filter(s => !s.isCurrent);

    return (
        <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
            }
        >
            {isLoading && sessions.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <>
                    <View style={styles.summaryContainer}>
                        <View style={[styles.summaryIcon, { backgroundColor: theme.csk[50] }]}>
                            <Ionicons name="shield-checkmark" size={28} color={theme.primary} />
                        </View>
                        <Text style={[styles.summaryTitle, { color: theme.text }]}>
                            {activeSessions.length} {activeSessions.length === 1 ? t('settings.session') : t('settings.sessions')} {t('settings.statusActive')}
                        </Text>
                        <Text style={[styles.summaryText, { color: theme.gray[500] }]}>
                            {t('settings.devicesLoggedIn')}
                        </Text>
                    </View>

                    <SettingsSection title={t('settings.yourDevices')}>
                        {sessions.map((session) => (
                            <SessionCard
                                key={session.id}
                                id={session.id}
                                deviceName={session.deviceName}
                                platform={session.platform}
                                location={session.location}
                                lastActivityAt={session.lastActivityAt}
                                isCurrent={session.isCurrent}
                                isActive={session.isActive}
                                isRevoked={session.isRevoked}
                                isExpired={session.isExpired}
                                isLoading={loadingSessionId === session.id}
                                onPress={() => onViewSession(session.id)}
                                formatTime={formatRelativeTime}
                            />
                        ))}
                    </SettingsSection>

                    {otherSessions.length > 0 && (
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={[styles.revokeAllButton, { backgroundColor: isDark ? theme.error[50] : '#FEE2E2' }]}
                                onPress={onRevokeAllSessions}
                                disabled={isLoading}
                            >
                                <Ionicons name="log-out-outline" size={20} color={theme.error[500]} />
                                <Text style={[styles.revokeAllText, { color: theme.error[500] }]}>
                                    {t('settings.signOutAllOther')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={[styles.tipsContainer, { backgroundColor: theme.csk[50], borderColor: theme.csk[100] }]}>
                        <View style={styles.tipsHeader}>
                            <Ionicons name="bulb-outline" size={20} color={theme.primary} />
                            <Text style={[styles.tipsTitle, { color: theme.csk[700] }]}>
                                {t('settings.securityTips')}
                            </Text>
                        </View>
                        <Text style={[styles.tipsText, { color: theme.gray[600] }]}>
                            • {t('settings.securityTip1')}{'\n'}
                            • {t('settings.securityTip2')}{'\n'}
                            • {t('settings.securityTip3')}
                        </Text>
                    </View>
                </>
            )}
        </ScrollView>
    );
});

const styles = StyleSheet.create({
    content: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    summaryContainer: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
    summaryIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    summaryTitle: { fontSize: 20, fontFamily: Fonts.bold, marginBottom: 4 },
    summaryText: { fontSize: 14, fontFamily: Fonts.regular, textAlign: 'center' },
    actionsContainer: { paddingHorizontal: 16, paddingVertical: 8 },
    revokeAllButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
    revokeAllText: { fontSize: 15, fontFamily: Fonts.semiBold },
    tipsContainer: { margin: 16, padding: 16, borderRadius: 12, borderWidth: 1 },
    tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    tipsTitle: { fontSize: 15, fontFamily: Fonts.semiBold },
    tipsText: { fontSize: 13, fontFamily: Fonts.regular, lineHeight: 20 },
});
