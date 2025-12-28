import React, { memo } from 'react';
import { ScrollView, View, ActivityIndicator, RefreshControl, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsSection, ParentLinkCard } from '@/components/settings';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';
import { LinkRequest, LinkedAccount } from '@/services/ParentLinkService';

interface ParentLinkSectionProps {
    t: (key: string, params?: Record<string, string>) => string;
    isParent: boolean;
    isLoading: boolean;
    refreshing: boolean;
    linkedAccounts: LinkedAccount[];
    pendingRequests: LinkRequest[];
    pendingUnlinkRequests: LinkRequest[];
    processingRequestId: string | null;
    onRefresh: () => void;
    onOpenSearchModal: () => void;
    onOpenUnlinkModal: (id: string, name: string) => void;
    onRespondToRequest: (requestId: string, action: 'accept' | 'decline') => void;
    onRespondToUnlinkRequest: (requestId: string, action: 'accept' | 'decline') => void;
    formatRelativeTime: (dateString: string) => string;
}

export const ParentLinkSection = memo(function ParentLinkSection({
    t,
    isParent,
    isLoading,
    refreshing,
    linkedAccounts,
    pendingRequests,
    pendingUnlinkRequests,
    processingRequestId,
    onRefresh,
    onOpenSearchModal,
    onOpenUnlinkModal,
    onRespondToRequest,
    onRespondToUnlinkRequest,
    formatRelativeTime,
}: ParentLinkSectionProps) {
    const { theme } = useTheme();

    return (
        <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
            }
        >
            {isLoading && linkedAccounts.length === 0 && pendingRequests.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <>
                    <View style={styles.summaryContainer}>
                        <View style={[styles.summaryIcon, { backgroundColor: theme.csk[50] }]}>
                            <Ionicons name="people" size={32} color={theme.primary} />
                        </View>
                        <Text style={[styles.summaryTitle, { color: theme.text }]}>
                            {isParent ? t('settings.linkedChildren') : t('settings.linkedParents')}
                        </Text>
                        <Text style={[styles.summaryText, { color: theme.gray[500] }]}>
                            {isParent ? t('settings.manageLinkedChildren') : t('settings.connectWithParent')}
                        </Text>
                    </View>

                    {linkedAccounts.length > 0 && (
                        <SettingsSection title={isParent ? t('settings.yourChildren') : t('settings.yourParents')}>
                            {linkedAccounts.map((link) => {
                                const account = isParent ? link.child : link.parent;
                                return (
                                    <ParentLinkCard
                                        key={link.id}
                                        name={account?.name || ''}
                                        username={account?.username || ''}
                                        profileImg={account?.profileImg ?? undefined}
                                        showUnlink={!isParent}
                                        isProcessing={processingRequestId === account?.id}
                                        onUnlink={() => onOpenUnlinkModal(account?.id || '', account?.name || '')}
                                    />
                                );
                            })}
                        </SettingsSection>
                    )}

                    {pendingRequests.length > 0 && (
                        <SettingsSection title={isParent ? t('settings.incomingRequests') : t('settings.sentRequests')}>
                            {pendingRequests.map((request) => {
                                const account = isParent
                                    ? (request.child || request.parent)
                                    : (request.parent || request.child);
                                return (
                                    <ParentLinkCard
                                        key={request.id}
                                        name={account?.name || ''}
                                        username={account?.username || ''}
                                        profileImg={account?.profileImg ?? undefined}
                                        isPending
                                        pendingTime={formatRelativeTime(request.createdAt)}
                                        showActions={isParent}
                                        isProcessing={processingRequestId === request.id}
                                        onAccept={() => onRespondToRequest(request.id, 'accept')}
                                        onDecline={() => onRespondToRequest(request.id, 'decline')}
                                    />
                                );
                            })}
                        </SettingsSection>
                    )}

                    {isParent && pendingUnlinkRequests.length > 0 && (
                        <SettingsSection title={t('settings.unlinkRequests')}>
                            {pendingUnlinkRequests.map((request) => (
                                <ParentLinkCard
                                    key={request.id}
                                    name={request.child?.name || ''}
                                    username={t('settings.wantsToUnlink')}
                                    profileImg={request.child?.profileImg ?? undefined}
                                    showActions
                                    isProcessing={processingRequestId === request.id}
                                    onAccept={() => onRespondToUnlinkRequest(request.id, 'accept')}
                                    onDecline={() => onRespondToUnlinkRequest(request.id, 'decline')}
                                />
                            ))}
                        </SettingsSection>
                    )}

                    {linkedAccounts.length === 0 && pendingRequests.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={48} color={theme.gray[300]} />
                            <Text style={[styles.emptyText, { color: theme.gray[500] }]}>
                                {isParent ? t('settings.noLinkedChildrenYet') : t('settings.noLinkedParentsYet')}
                            </Text>
                        </View>
                    )}

                    {!isParent && (
                        <SettingsSection title="">
                            <TouchableOpacity
                                style={[styles.addButton, { borderColor: theme.primary }]}
                                onPress={onOpenSearchModal}
                            >
                                <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
                                <Text style={[styles.addButtonText, { color: theme.primary }]}>
                                    {t('settings.linkWithParentBtn')}
                                </Text>
                            </TouchableOpacity>
                        </SettingsSection>
                    )}
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
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 15, fontFamily: Fonts.regular, marginTop: 12 },
    addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
    addButtonText: { fontSize: 15, fontFamily: Fonts.semiBold },
});
