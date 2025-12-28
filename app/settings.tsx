import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, BackHandler, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Updates from 'expo-updates';
import { useAuthStore } from '@/libs/auth';
import { Fonts } from '@/constants/theme';
import { useToast } from '@/components/toast';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useProfile } from '@/hooks/useProfile';
import {
    getActivityLog, deactivateAccount, deleteAccount,
    ActivityResponse,
} from '@/services/SecurityService';
import { usePreferences, useUpdatePreference } from '@/hooks/usePreferences';
import { logout } from '@/services/AuthService';
import {
    SettingsHeader, PickerModal, ConfirmModal, TwoFAModal,
    SessionDetailsModal, SearchParentModal,
} from '@/components/settings';
import {
    MainSection, SecuritySection, SessionsSection,
    ActivitySection, DangerSection, ParentLinkSection,
} from '@/components/settings/sections';
import { use2FAState, useSessionsState, useParentLinkState } from '@/hooks/settings';

type SettingsSection_Type = 'main' | 'security' | 'sessions' | 'activity' | 'danger' | 'parentLink';

export default function SettingsScreen() {
    const router = useRouter();
    const { section: initialSection } = useLocalSearchParams<{ section?: string }>();
    const insets = useSafeAreaInsets();
    const toast = useToast();
    const { user, updateUser } = useAuthStore();
    const { theme } = useTheme();
    const { t, locale, preference, setLanguage } = useTranslation();
    const { data: preferences } = usePreferences();
    const updatePreferenceMutation = useUpdatePreference();
    
    // Fetch fresh profile data to ensure role is up to date
    const { data: profileData } = useProfile();
    
    // Sync profile role to auth store if different
    useEffect(() => {
        if (profileData?.user?.role && user?.role !== profileData.user.role) {
            console.log('[Settings] Syncing role from profile:', profileData.user.role);
            updateUser({ role: profileData.user.role });
        }
    }, [profileData?.user?.role, user?.role, updateUser]);

    const [currentSection, setCurrentSection] = useState<SettingsSection_Type>(() => {
        if (initialSection && ['main', 'security', 'sessions', 'activity', 'danger', 'parentLink'].includes(initialSection)) {
            return initialSection as SettingsSection_Type;
        }
        return 'main';
    });
    const [refreshing, setRefreshing] = useState(false);

    // Custom hooks for grouped state
    const twoFAState = use2FAState();
    const sessionsState = useSessionsState();
    const parentLinkState = useParentLinkState();

    // Activity State
    const [activityData, setActivityData] = useState<ActivityResponse | null>(null);
    const [activityLoading, setActivityLoading] = useState(false);

    // Danger Zone State
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [dangerLoading, setDangerLoading] = useState(false);

    // Modal State
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [isChangingLanguage, setIsChangingLanguage] = useState(false);

    // Use profile role as source of truth, fallback to auth store
    const isParent = (profileData?.user?.role || user?.role) === 'PARENT';

    const fetchActivity = useCallback(async () => {
        try {
            setActivityLoading(true);
            const response = await getActivityLog();
            setActivityData(response);
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to fetch activity');
        } finally {
            setActivityLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (currentSection === 'security') twoFAState.fetch2FAStatus();
        else if (currentSection === 'sessions') sessionsState.fetchSessions();
        else if (currentSection === 'activity') fetchActivity();
        else if (currentSection === 'parentLink') parentLinkState.fetchParentLinkData();
    }, [currentSection]);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (currentSection !== 'main') {
                setCurrentSection('main');
                return true;
            }
            return false;
        });
        return () => backHandler.remove();
    }, [currentSection]);

    const handleUpdatePreference = useCallback((key: string, value: any) => {
        updatePreferenceMutation.mutate({ [key]: value });
    }, [updatePreferenceMutation]);

    const handleLanguageChange = useCallback(async (languageCode: string) => {
        setShowLanguageModal(false);
        updatePreferenceMutation.mutate({ language: languageCode });
        const needsRestart = await setLanguage(languageCode);
        
        if (needsRestart) {
            setIsChangingLanguage(true);
            setTimeout(async () => {
                try {
                    if (!__DEV__) {
                        await Updates.reloadAsync();
                    } else {
                        setIsChangingLanguage(false);
                        toast.info(
                            languageCode === 'ar' ? 'وضع التطوير' : 'Development Mode',
                            languageCode === 'ar' 
                                ? 'يرجى إعادة تشغيل التطبيق يدوياً لرؤية تغييرات RTL'
                                : 'Please manually restart the app to see RTL changes'
                        );
                    }
                } catch (e) {
                    setIsChangingLanguage(false);
                    toast.info(
                        languageCode === 'ar' ? 'إعادة التشغيل مطلوبة' : 'Restart Required',
                        languageCode === 'ar' 
                            ? 'يرجى إعادة تشغيل التطبيق يدوياً'
                            : 'Please manually restart the app'
                    );
                }
            }, 500);
        }
    }, [setLanguage, updatePreferenceMutation, toast]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (currentSection === 'sessions') await sessionsState.fetchSessions();
        else if (currentSection === 'activity') await fetchActivity();
        else if (currentSection === 'parentLink') await parentLinkState.fetchParentLinkData();
        setRefreshing(false);
    }, [currentSection, sessionsState, fetchActivity, parentLinkState]);

    const handleDeactivateAccount = useCallback(async () => {
        try {
            setDangerLoading(true);
            await deactivateAccount();
            setShowDeactivateModal(false);
            toast.success('Account Deactivated', 'Your account has been deactivated');
            await logout();
            router.replace('/login');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to deactivate account');
        } finally {
            setDangerLoading(false);
        }
    }, [toast, router]);

    const handleDeleteAccount = useCallback(async () => {
        const hasPassword = user?.hasPassword ?? true;
        if (hasPassword && !deletePassword) {
            toast.error('Error', 'Password is required');
            return;
        }
        if (!hasPassword && deleteConfirmText !== 'DELETE') {
            toast.error('Error', 'Please type DELETE to confirm');
            return;
        }
        try {
            setDangerLoading(true);
            await deleteAccount(hasPassword ? deletePassword : undefined);
            setShowDeleteModal(false);
            toast.success('Account Deleted', 'Your account has been permanently deleted');
            await logout();
            router.replace('/login');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to delete account');
        } finally {
            setDangerLoading(false);
        }
    }, [user?.hasPassword, deletePassword, deleteConfirmText, toast, router]);

    const copyToClipboard = useCallback(async (text: string) => {
        await Clipboard.setStringAsync(text);
        toast.success('Copied', 'Copied to clipboard');
    }, [toast]);

    const formatDate = useCallback((dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }, []);

    const formatRelativeTime = useCallback((dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return formatDate(dateString);
    }, [formatDate]);

    const getHeaderTitle = useCallback(() => {
        switch (currentSection) {
            case 'security': return t('settings.headerSecurity');
            case 'sessions': return t('settings.headerActiveSessions');
            case 'activity': return t('settings.headerActivityLog');
            case 'danger': return t('settings.headerAccount');
            case 'parentLink': return isParent ? t('settings.myChildren') : t('settings.parentLink');
            default: return t('settings.title');
        }
    }, [currentSection, t, isParent]);

    // Navigation callbacks
    const handleNavigateToSecurity = useCallback(() => setCurrentSection('security'), []);
    const handleNavigateToSessions = useCallback(() => setCurrentSection('sessions'), []);
    const handleNavigateToActivity = useCallback(() => setCurrentSection('activity'), []);
    const handleNavigateToParentLink = useCallback(() => setCurrentSection('parentLink'), []);
    const handleNavigateToDanger = useCallback(() => setCurrentSection('danger'), []);
    const handleShowThemeModal = useCallback(() => setShowThemeModal(true), []);
    const handleShowLanguageModal = useCallback(() => setShowLanguageModal(true), []);
    const handleShowDeactivateModal = useCallback(() => setShowDeactivateModal(true), []);
    const handleShowDeleteModal = useCallback(() => setShowDeleteModal(true), []);
    const handleCloseLanguageModal = useCallback(() => setShowLanguageModal(false), []);
    const handleCloseThemeModal = useCallback(() => setShowThemeModal(false), []);

    // 2FA callbacks
    const handleToggle2FA = useCallback((enabled: boolean) => {
        if (enabled) {
            twoFAState.openEnable2FAModal();
        } else {
            twoFAState.setShowDisable2FAModal(true);
        }
    }, [twoFAState]);

    const handle2FAModalClose = useCallback(() => {
        twoFAState.reset2FAModal();
    }, [twoFAState]);

    const handle2FAModalDone = useCallback(() => {
        twoFAState.reset2FAModal();
        twoFAState.fetch2FAStatus();
    }, [twoFAState]);

    const handleDisable2FACancel = useCallback(() => {
        twoFAState.setShowDisable2FAModal(false);
        twoFAState.setDisablePassword('');
    }, [twoFAState]);

    const handleCopySecret = useCallback(() => {
        if (twoFAState.twoFASetupData?.secret) {
            copyToClipboard(twoFAState.twoFASetupData.secret);
        }
    }, [twoFAState.twoFASetupData?.secret, copyToClipboard]);

    const handleCopyAllCodes = useCallback(() => {
        copyToClipboard(twoFAState.backupCodes.join('\n'));
    }, [twoFAState.backupCodes, copyToClipboard]);

    // Delete modal callbacks
    const handleDeleteModalCancel = useCallback(() => {
        setShowDeleteModal(false);
        setDeletePassword('');
        setDeleteConfirmText('');
    }, []);

    // Theme selection callback
    const handleThemeSelect = useCallback((v: string) => {
        handleUpdatePreference('themePreference', v);
    }, [handleUpdatePreference]);

    const languages = [
        { code: 'system', name: t('languages.system') },
        { code: 'en', name: 'English' },
        { code: 'ar', name: 'العربية' },
    ];

    const themes = [
        { code: 'system', name: t('settings.themeSystem'), icon: 'phone-portrait-outline' },
        { code: 'light', name: t('settings.themeLight'), icon: 'sunny-outline' },
        { code: 'dark', name: t('settings.themeDark'), icon: 'moon-outline' },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
            <SettingsHeader
                title={getHeaderTitle()}
                onBack={() => currentSection === 'main' ? router.back() : setCurrentSection('main')}
            />
            
            {currentSection === 'main' && (
                <MainSection
                    t={t}
                    isParent={isParent}
                    preferences={preferences}
                    languagePreference={preference}
                    onNavigateToSecurity={handleNavigateToSecurity}
                    onNavigateToSessions={handleNavigateToSessions}
                    onNavigateToActivity={handleNavigateToActivity}
                    onNavigateToParentLink={handleNavigateToParentLink}
                    onNavigateToDanger={handleNavigateToDanger}
                    onShowThemeModal={handleShowThemeModal}
                    onShowLanguageModal={handleShowLanguageModal}
                    onUpdatePreference={handleUpdatePreference}
                />
            )}
            {currentSection === 'security' && (
                <SecuritySection
                    t={t}
                    isLoading={twoFAState.isLoading}
                    twoFAStatus={twoFAState.twoFAStatus}
                    onToggle2FA={handleToggle2FA}
                    onRegenerateBackupCodes={twoFAState.handleRegenerateBackupCodes}
                />
            )}
            {currentSection === 'sessions' && (
                <SessionsSection
                    t={t}
                    isLoading={sessionsState.isLoading}
                    refreshing={refreshing}
                    sessions={sessionsState.sessions}
                    loadingSessionId={sessionsState.loadingSessionId}
                    onRefresh={onRefresh}
                    onViewSession={sessionsState.handleViewSessionDetails}
                    onRevokeAllSessions={sessionsState.handleRevokeAllSessions}
                    formatRelativeTime={formatRelativeTime}
                />
            )}
            {currentSection === 'activity' && (
                <ActivitySection
                    t={t}
                    isLoading={activityLoading}
                    refreshing={refreshing}
                    activityData={activityData}
                    onRefresh={onRefresh}
                    formatDate={formatDate}
                    formatRelativeTime={formatRelativeTime}
                />
            )}
            {currentSection === 'danger' && (
                <DangerSection
                    t={t}
                    onDeactivate={handleShowDeactivateModal}
                    onDelete={handleShowDeleteModal}
                />
            )}
            {currentSection === 'parentLink' && (
                <ParentLinkSection
                    t={t}
                    isParent={isParent}
                    isLoading={parentLinkState.isLoading}
                    refreshing={refreshing}
                    linkedAccounts={parentLinkState.linkedAccounts}
                    pendingRequests={parentLinkState.pendingRequests}
                    pendingUnlinkRequests={parentLinkState.pendingUnlinkRequests}
                    processingRequestId={parentLinkState.processingRequestId}
                    onRefresh={onRefresh}
                    onOpenSearchModal={() => parentLinkState.setShowSearchModal(true)}
                    onOpenUnlinkModal={parentLinkState.openUnlinkModal}
                    onRespondToRequest={parentLinkState.handleRespondToRequest}
                    onRespondToUnlinkRequest={parentLinkState.handleRespondToUnlinkRequest}
                    formatRelativeTime={formatRelativeTime}
                />
            )}

            <TwoFAModal
                visible={twoFAState.show2FAModal}
                step={twoFAState.twoFAStep}
                isLoading={twoFAState.isLoading}
                qrCode={twoFAState.twoFASetupData?.qrCode}
                secret={twoFAState.twoFASetupData?.secret}
                verificationCode={twoFAState.verificationCode}
                backupCodes={twoFAState.backupCodes}
                onClose={handle2FAModalClose}
                onGetStarted={twoFAState.handleEnable2FA}
                onContinue={() => twoFAState.setTwoFAStep('verify')}
                onVerify={twoFAState.handleVerify2FA}
                onDone={handle2FAModalDone}
                onCodeChange={twoFAState.setVerificationCode}
                onCopySecret={handleCopySecret}
                onCopyCode={copyToClipboard}
                onCopyAllCodes={handleCopyAllCodes}
            />

            <ConfirmModal
                visible={twoFAState.showDisable2FAModal}
                icon="shield-outline"
                iconColor="#F59E0B"
                title={t('settings.disable2FATitle')}
                description={t('settings.disable2FADesc')}
                confirmText={t('settings.disable')}
                isLoading={twoFAState.isLoading}
                isDisabled={!twoFAState.disablePassword}
                onConfirm={twoFAState.handleDisable2FA}
                onCancel={handleDisable2FACancel}
                passwordInput={{
                    value: twoFAState.disablePassword,
                    onChange: twoFAState.setDisablePassword,
                    placeholder: t('settings.enterPasswordToConfirm'),
                }}
            />

            <ConfirmModal
                visible={showDeactivateModal}
                icon="pause-circle"
                iconColor="#F59E0B"
                title={t('settings.deactivateAccountTitle')}
                description={t('settings.deactivateAccountConfirmDesc')}
                confirmText={t('settings.deactivate')}
                isLoading={dangerLoading}
                onConfirm={handleDeactivateAccount}
                onCancel={() => setShowDeactivateModal(false)}
            />

            <ConfirmModal
                visible={showDeleteModal}
                icon="trash"
                iconColor="#EF4444"
                title={t('settings.deleteAccountConfirmTitle')}
                description={t('settings.deleteAccountConfirmDesc')}
                confirmText={t('common.delete')}
                confirmColor="#EF4444"
                isLoading={dangerLoading}
                isDisabled={user?.hasPassword !== false ? !deletePassword : deleteConfirmText !== 'DELETE'}
                onConfirm={handleDeleteAccount}
                onCancel={handleDeleteModalCancel}
                passwordInput={user?.hasPassword !== false ? {
                    value: deletePassword,
                    onChange: setDeletePassword,
                    placeholder: t('settings.enterPasswordToConfirm'),
                } : undefined}
                textConfirmInput={user?.hasPassword === false ? {
                    value: deleteConfirmText,
                    onChange: setDeleteConfirmText,
                    keyword: 'DELETE',
                } : undefined}
            />

            <ConfirmModal
                visible={parentLinkState.showUnlinkModal}
                icon="unlink"
                iconColor="#EF4444"
                title={t('settings.confirmUnlink')}
                description={t('settings.confirmUnlinkDesc', { name: parentLinkState.unlinkTargetParent?.name })}
                confirmText={t('settings.sendRequest')}
                confirmColor="#EF4444"
                isLoading={parentLinkState.processingRequestId === parentLinkState.unlinkTargetParent?.id}
                onConfirm={parentLinkState.handleConfirmUnlink}
                onCancel={parentLinkState.closeUnlinkModal}
            />

            <SessionDetailsModal
                visible={sessionsState.showSessionModal}
                session={sessionsState.selectedSession}
                isLoading={sessionsState.loadingSessionId === sessionsState.selectedSession?.id}
                onClose={sessionsState.closeSessionModal}
                onRevoke={() => sessionsState.selectedSession && sessionsState.handleRevokeSession(sessionsState.selectedSession.id)}
                formatDate={formatDate}
            />

            <SearchParentModal
                visible={parentLinkState.showSearchModal}
                searchQuery={parentLinkState.searchQuery}
                searchResults={parentLinkState.searchResults}
                isSearching={parentLinkState.isSearching}
                processingId={parentLinkState.processingRequestId}
                onClose={parentLinkState.closeSearchModal}
                onSearchChange={parentLinkState.setSearchQuery}
                onSendRequest={parentLinkState.handleSendLinkRequest}
            />

            <PickerModal
                visible={showLanguageModal}
                title={t('settings.selectLanguage')}
                options={languages}
                selectedValue={preference}
                onSelect={handleLanguageChange}
                onClose={handleCloseLanguageModal}
            />

            <PickerModal
                visible={showThemeModal}
                title={t('settings.selectTheme')}
                options={themes}
                selectedValue={preferences?.themePreference}
                onSelect={handleThemeSelect}
                onClose={handleCloseThemeModal}
            />

            {isChangingLanguage && (
                <View style={styles.languageOverlay}>
                    <View style={[styles.languageOverlayContent, { backgroundColor: theme.surface }]}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.languageOverlayText, { color: theme.text }]}>
                            {locale === 'ar' ? 'جاري تغيير اللغة...' : 'Changing language...'}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    languageOverlay: { 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        justifyContent: 'center', 
        alignItems: 'center',
        zIndex: 9999,
    },
    languageOverlayContent: { 
        padding: 32, 
        borderRadius: 16, 
        alignItems: 'center',
        gap: 16,
    },
    languageOverlayText: { 
        fontSize: 16, 
        fontFamily: Fonts.medium,
    },
});
