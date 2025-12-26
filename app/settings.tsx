import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, RefreshControl, Switch, BackHandler, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Updates from 'expo-updates';
import { useAuthStore } from '@/libs/auth';
import { Fonts } from '@/constants/theme';
import { useToast } from '@/components/toast';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
    get2FAStatus, enable2FA, verify2FASetup, disable2FA, regenerateBackupCodes,
    getSessions, getSessionDetails, revokeSession, revokeAllSessions,
    getActivityLog, deactivateAccount, deleteAccount,
    getDeviceIcon, getPlatformDisplayName, getStatusColor,
    TwoFactorStatus, TwoFactorEnableResponse, Session, SessionDetails, ActivityResponse,
} from '@/services/SecurityService';
import {
    searchParents, sendLinkRequest, getLinkRequests, respondToLinkRequest,
    getLinkedAccounts, sendUnlinkRequest, getUnlinkRequests, respondToUnlinkRequest,
    ParentUser, LinkRequest, LinkedAccount,
} from '@/services/ParentLinkService';
import { usePreferences, useUpdatePreference } from '@/hooks/usePreferences';
import { logout } from '@/services/AuthService';
import {
    SettingsHeader, SettingsMenuItem, SettingsSection, InfoCard,
    SessionCard, DangerCard, PickerModal, ConfirmModal, TwoFAModal,
    SessionDetailsModal, ParentLinkCard, SearchParentModal,
} from '@/components/settings';

type SettingsSection_Type = 'main' | 'security' | 'sessions' | 'activity' | 'danger' | 'parentLink';

export default function SettingsScreen() {
    const router = useRouter();
    const { section: initialSection } = useLocalSearchParams<{ section?: string }>();
    const insets = useSafeAreaInsets();
    const toast = useToast();
    const { user } = useAuthStore();
    const { theme, isDark } = useTheme();
    const { t, locale, setLanguage } = useTranslation();
    const { data: preferences } = usePreferences();
    const updatePreferenceMutation = useUpdatePreference();

    const [currentSection, setCurrentSection] = useState<SettingsSection_Type>(() => {
        if (initialSection && ['main', 'security', 'sessions', 'activity', 'danger', 'parentLink'].includes(initialSection)) {
            return initialSection as SettingsSection_Type;
        }
        return 'main';
    });
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // 2FA State
    const [twoFAStatus, setTwoFAStatus] = useState<TwoFactorStatus | null>(null);
    const [twoFASetupData, setTwoFASetupData] = useState<TwoFactorEnableResponse | null>(null);
    const [twoFAStep, setTwoFAStep] = useState<'info' | 'qr' | 'verify' | 'backup'>('info');
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
    const [disablePassword, setDisablePassword] = useState('');

    // Sessions State
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<SessionDetails | null>(null);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);

    // Activity State
    const [activityData, setActivityData] = useState<ActivityResponse | null>(null);

    // Danger Zone State
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // Modal State
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [showThemeModal, setShowThemeModal] = useState(false);

    // Parent Link State
    const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
    const [pendingRequests, setPendingRequests] = useState<LinkRequest[]>([]);
    const [pendingUnlinkRequests, setPendingUnlinkRequests] = useState<LinkRequest[]>([]);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ParentUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const [showUnlinkModal, setShowUnlinkModal] = useState(false);
    const [unlinkTargetParent, setUnlinkTargetParent] = useState<{ id: string; name: string } | null>(null);

    const isParent = user?.role === 'PARENT';
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (currentSection === 'security') fetch2FAStatus();
        else if (currentSection === 'sessions') fetchSessions();
        else if (currentSection === 'activity') fetchActivity();
        else if (currentSection === 'parentLink') fetchParentLinkData();
    }, [currentSection]);

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (currentSection !== 'main') { setCurrentSection('main'); return true; }
            return false;
        });
        return () => backHandler.remove();
    }, [currentSection]);

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (!searchQuery.trim()) { setSearchResults([]); setIsSearching(false); return; }
        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(() => handleSearchParents(searchQuery), 300);
        return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
    }, [searchQuery]);

    const fetch2FAStatus = async () => {
        try {
            setIsLoading(true);
            const status = await get2FAStatus();
            const enabled = status.enabled ?? status.twoFactorEnabled ?? false;
            setTwoFAStatus({ enabled, enabledAt: status.enabledAt });
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to fetch 2FA status');
        } finally { setIsLoading(false); }
    };

    const fetchSessions = async () => {
        try {
            setIsLoading(true);
            const response = await getSessions();
            setSessions(response.sessions || []);
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to fetch sessions');
        } finally { setIsLoading(false); }
    };

    const fetchActivity = async () => {
        try {
            setIsLoading(true);
            const response = await getActivityLog();
            setActivityData(response);
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to fetch activity');
        } finally { setIsLoading(false); }
    };

    const fetchParentLinkData = async () => {
        try {
            setIsLoading(true);
            const [linkedRes, requestsRes, unlinkRes] = await Promise.allSettled([
                getLinkedAccounts(), getLinkRequests(), getUnlinkRequests(),
            ]);
            setLinkedAccounts(linkedRes.status === 'fulfilled' ? linkedRes.value.data || [] : []);
            setPendingRequests(requestsRes.status === 'fulfilled' ? requestsRes.value.data || [] : []);
            setPendingUnlinkRequests(unlinkRes.status === 'fulfilled' ? unlinkRes.value.data || [] : []);
        } catch (error: any) {
            console.error('[ParentLink] Error:', error);
        } finally { setIsLoading(false); }
    };

    const handleSearchParents = useCallback(async (query: string) => {
        if (!query.trim()) { setSearchResults([]); return; }
        try {
            setIsSearching(true);
            const response = await searchParents(query.trim());
            setSearchResults(response.data || []);
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to search');
            setSearchResults([]);
        } finally { setIsSearching(false); }
    }, []);

    const handleSendLinkRequest = async (parentId: string) => {
        try {
            setProcessingRequestId(parentId);
            await sendLinkRequest(parentId);
            toast.success('Success', 'Link request sent');
            setShowSearchModal(false); setSearchQuery(''); setSearchResults([]);
            fetchParentLinkData();
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to send request');
        } finally { setProcessingRequestId(null); }
    };

    const handleRespondToRequest = async (requestId: string, action: 'accept' | 'decline') => {
        try {
            setProcessingRequestId(requestId);
            await respondToLinkRequest(requestId, action);
            toast.success('Success', `Request ${action}ed`);
            fetchParentLinkData();
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to respond');
        } finally { setProcessingRequestId(null); }
    };

    const handleConfirmUnlink = async () => {
        if (!unlinkTargetParent) return;
        try {
            setProcessingRequestId(unlinkTargetParent.id);
            await sendUnlinkRequest(unlinkTargetParent.id);
            toast.success('Success', 'Unlink request sent');
            setShowUnlinkModal(false); setUnlinkTargetParent(null);
            fetchParentLinkData();
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to send unlink request');
        } finally { setProcessingRequestId(null); }
    };

    const handleRespondToUnlinkRequest = async (requestId: string, action: 'accept' | 'decline') => {
        try {
            setProcessingRequestId(requestId);
            await respondToUnlinkRequest(requestId, action);
            toast.success('Success', `Unlink request ${action}ed`);
            fetchParentLinkData();
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to respond');
        } finally { setProcessingRequestId(null); }
    };

    const handleUpdatePreference = (key: string, value: any) => updatePreferenceMutation.mutate({ [key]: value });

    const handleLanguageChange = async (languageCode: string) => {
        // Update preference in backend
        updatePreferenceMutation.mutate({ language: languageCode });
        
        // Update i18n locale
        const needsRestart = await setLanguage(languageCode);
        
        if (needsRestart) {
            // RTL change requires app restart
            Alert.alert(
                languageCode === 'ar' ? 'إعادة تشغيل مطلوبة' : 'Restart Required',
                languageCode === 'ar' 
                    ? 'يجب إعادة تشغيل التطبيق لتطبيق تغييرات اللغة'
                    : 'The app needs to restart to apply language changes',
                [
                    {
                        text: languageCode === 'ar' ? 'إعادة التشغيل الآن' : 'Restart Now',
                        onPress: async () => {
                            try {
                                if (!__DEV__) {
                                    await Updates.reloadAsync();
                                } else {
                                    toast.info('Development Mode', 'Please manually restart the app to see RTL changes');
                                }
                            } catch (e) {
                                toast.info('Restart Required', 'Please manually restart the app');
                            }
                        }
                    },
                    {
                        text: languageCode === 'ar' ? 'لاحقاً' : 'Later',
                        style: 'cancel'
                    }
                ]
            );
        }
        
        setShowLanguageModal(false);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (currentSection === 'sessions') await fetchSessions();
        else if (currentSection === 'activity') await fetchActivity();
        else if (currentSection === 'parentLink') await fetchParentLinkData();
        setRefreshing(false);
    }, [currentSection]);

    const handleEnable2FA = async () => {
        try {
            setIsLoading(true);
            const data = await enable2FA();
            setTwoFASetupData(data);
            setTwoFAStep('qr');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to enable 2FA');
        } finally { setIsLoading(false); }
    };

    const handleVerify2FA = async () => {
        if (verificationCode.length !== 6) { toast.error('Invalid Code', 'Please enter a 6-digit code'); return; }
        try {
            setIsLoading(true);
            const response = await verify2FASetup(verificationCode);
            setBackupCodes(response.backupCodes || twoFASetupData?.backupCodes || []);
            setTwoFAStep('backup');
            setTwoFAStatus({ enabled: true, enabledAt: new Date().toISOString() });
            toast.success('Success', '2FA has been enabled');
        } catch (error: any) {
            toast.error('Error', error.message || 'Invalid verification code');
        } finally { setIsLoading(false); }
    };

    const handleDisable2FA = async () => {
        if (!disablePassword) { toast.error('Error', 'Password is required'); return; }
        try {
            setIsLoading(true);
            await disable2FA(disablePassword);
            setTwoFAStatus({ enabled: false });
            setShowDisable2FAModal(false); setDisablePassword('');
            toast.success('Success', '2FA has been disabled');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to disable 2FA');
        } finally { setIsLoading(false); }
    };

    const handleRegenerateBackupCodes = async () => {
        try {
            setIsLoading(true);
            const response = await regenerateBackupCodes();
            setBackupCodes(response.backupCodes);
            setTwoFAStep('backup'); setShow2FAModal(true);
            toast.success('Success', 'New backup codes generated');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to regenerate codes');
        } finally { setIsLoading(false); }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            setLoadingSessionId(sessionId);
            await revokeSession(sessionId);
            setSessions(sessions.filter(s => s.id !== sessionId));
            setShowSessionModal(false); setSelectedSession(null);
            toast.success('Success', 'Session revoked');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to revoke session');
        } finally { setLoadingSessionId(null); }
    };

    const handleViewSessionDetails = async (sessionId: string) => {
        try {
            setLoadingSessionId(sessionId);
            const details = await getSessionDetails(sessionId);
            setSelectedSession(details);
            setShowSessionModal(true);
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to load session details');
        } finally { setLoadingSessionId(null); }
    };

    const handleRevokeAllSessions = async () => {
        try {
            setIsLoading(true);
            await revokeAllSessions();
            setSessions(sessions.filter(s => s.isCurrent));
            toast.success('Success', 'All other sessions revoked');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to revoke sessions');
        } finally { setIsLoading(false); }
    };

    const handleDeactivateAccount = async () => {
        try {
            setIsLoading(true);
            await deactivateAccount();
            setShowDeactivateModal(false);
            toast.success('Account Deactivated', 'Your account has been deactivated');
            await logout();
            router.replace('/login');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to deactivate account');
        } finally { setIsLoading(false); }
    };

    const handleDeleteAccount = async () => {
        const hasPassword = user?.hasPassword ?? true;
        if (hasPassword && !deletePassword) { toast.error('Error', 'Password is required'); return; }
        if (!hasPassword && deleteConfirmText !== 'DELETE') { toast.error('Error', 'Please type DELETE to confirm'); return; }
        try {
            setIsLoading(true);
            await deleteAccount(hasPassword ? deletePassword : undefined);
            setShowDeleteModal(false);
            toast.success('Account Deleted', 'Your account has been permanently deleted');
            await logout();
            router.replace('/login');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to delete account');
        } finally { setIsLoading(false); }
    };

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        toast.success('Copied', 'Copied to clipboard');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatRelativeTime = (dateString: string) => {
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
    };

    const getHeaderTitle = () => {
        switch (currentSection) {
            case 'security': return t('settings.headerSecurity');
            case 'sessions': return t('settings.headerActiveSessions');
            case 'activity': return t('settings.headerActivityLog');
            case 'danger': return t('settings.headerAccount');
            case 'parentLink': return isParent ? t('settings.myChildren') : t('settings.parentLink');
            default: return t('settings.title');
        }
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'ar', name: 'العربية' },
    ];

    const themes = [
        { code: 'light', name: 'Light', icon: 'sunny-outline' },
        { code: 'dark', name: 'Dark', icon: 'moon-outline' },
        { code: 'system', name: 'System', icon: 'phone-portrait-outline' },
    ];

    const renderMainSection = () => (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <SettingsSection title={t('settings.security')}>
                <SettingsMenuItem icon="shield-checkmark-outline" label={t('settings.twoFactorAuth')} subtitle={t('settings.twoFactorAuthSubtitle')} onPress={() => setCurrentSection('security')} />
                <SettingsMenuItem icon="phone-portrait-outline" label={t('settings.activeSessions')} subtitle={t('settings.activeSessionsSubtitle')} onPress={() => setCurrentSection('sessions')} />
            </SettingsSection>

            <SettingsSection title={t('settings.activity')}>
                <SettingsMenuItem icon="time-outline" label={t('settings.activityLog')} subtitle={t('settings.activityLogSubtitle')} onPress={() => setCurrentSection('activity')} />
            </SettingsSection>

            <SettingsSection title={t('settings.family')}>
                <SettingsMenuItem icon="people-outline" label={isParent ? t('settings.myChildren') : t('settings.parentLink')} subtitle={isParent ? t('settings.viewManageChildren') : t('settings.linkWithParent')} onPress={() => setCurrentSection('parentLink')} />
            </SettingsSection>

            <SettingsSection title={t('settings.preferences')}>
                <SettingsMenuItem icon="color-palette-outline" label={t('settings.theme')} subtitle={preferences?.themePreference === 'dark' ? t('settings.themeDark') : preferences?.themePreference === 'light' ? t('settings.themeLight') : t('settings.themeSystem')} onPress={() => setShowThemeModal(true)} />
                <SettingsMenuItem icon="language-outline" label={t('settings.language')} subtitle={locale === 'ar' ? 'العربية' : 'English'} onPress={() => setShowLanguageModal(true)} />
                <SettingsMenuItem icon="notifications-outline" label={t('settings.notifications')} subtitle={t('settings.notificationsSubtitle')} rightElement={
                    <Switch value={preferences?.notifications ?? true} onValueChange={(v) => handleUpdatePreference('notifications', v)} trackColor={{ false: theme.gray[200], true: theme.csk[400] }} thumbColor={preferences?.notifications ? theme.primary : theme.gray[50]} />
                } />
                <SettingsMenuItem icon="mail-outline" label={t('settings.newsletter')} subtitle={t('settings.newsletterSubtitle')} rightElement={
                    <Switch value={preferences?.newsletterEnabled ?? false} onValueChange={(v) => handleUpdatePreference('newsletterEnabled', v)} trackColor={{ false: theme.gray[200], true: theme.csk[400] }} thumbColor={preferences?.newsletterEnabled ? theme.primary : theme.gray[50]} />
                } />
            </SettingsSection>

            <SettingsSection title={t('settings.dangerZone')} isDanger>
                <SettingsMenuItem icon="warning-outline" label={t('settings.accountManagement')} subtitle={t('settings.accountManagementSubtitle')} onPress={() => setCurrentSection('danger')} isDanger />
            </SettingsSection>
        </ScrollView>
    );

    const renderSecuritySection = () => (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {isLoading && !twoFAStatus ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
            ) : (
                <SettingsSection title={t('settings.twoFactorAuthentication')}>
                    <InfoCard icon="shield-checkmark" title={twoFAStatus?.enabled ? t('settings.twoFAEnabled') : t('settings.protectYourAccount')} description={twoFAStatus?.enabled ? t('settings.twoFAEnabledDesc') : t('settings.protectYourAccountDesc')} />
                    <View style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.toggleLabel, { color: theme.text }]}>{t('settings.twoFactorAuthentication')}</Text>
                        <Switch value={twoFAStatus?.enabled || false} onValueChange={(v) => v ? (setTwoFAStep('info'), setShow2FAModal(true)) : setShowDisable2FAModal(true)} trackColor={{ false: theme.gray[200], true: theme.csk[400] }} thumbColor={twoFAStatus?.enabled ? theme.primary : theme.gray[50]} />
                    </View>
                    {twoFAStatus?.enabled && (
                        <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.primary }]} onPress={handleRegenerateBackupCodes} disabled={isLoading}>
                            <Ionicons name="refresh-outline" size={20} color={theme.primary} />
                            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>{t('settings.regenerateBackupCodes')}</Text>
                        </TouchableOpacity>
                    )}
                </SettingsSection>
            )}
        </ScrollView>
    );

    const renderSessionsSection = () => (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}>
            {isLoading && sessions.length === 0 ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
            ) : (
                <>
                    <View style={styles.summaryContainer}>
                        <View style={[styles.summaryIcon, { backgroundColor: theme.csk[50] }]}>
                            <Ionicons name="shield-checkmark" size={28} color={theme.primary} />
                        </View>
                        <Text style={[styles.summaryTitle, { color: theme.text }]}>{sessions.filter(s => s.isActive).length} {sessions.filter(s => s.isActive).length === 1 ? t('settings.session') : t('settings.sessions')} {t('settings.statusActive')}</Text>
                        <Text style={[styles.summaryText, { color: theme.gray[500] }]}>{t('settings.devicesLoggedIn')}</Text>
                    </View>
                    <SettingsSection title={t('settings.yourDevices')}>
                        {sessions.map((session) => (
                            <SessionCard key={session.id} id={session.id} deviceName={session.deviceName} platform={session.platform} location={session.location} lastActivityAt={session.lastActivityAt} isCurrent={session.isCurrent} isLoading={loadingSessionId === session.id} onPress={() => handleViewSessionDetails(session.id)} formatTime={formatRelativeTime} />
                        ))}
                    </SettingsSection>
                    {sessions.filter(s => !s.isCurrent).length > 0 && (
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity style={[styles.revokeAllButton, { backgroundColor: isDark ? theme.error[50] : '#FEE2E2' }]} onPress={handleRevokeAllSessions} disabled={isLoading}>
                                <Ionicons name="log-out-outline" size={20} color={theme.error[500]} />
                                <Text style={[styles.revokeAllText, { color: theme.error[500] }]}>{t('settings.signOutAllOther')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={[styles.tipsContainer, { backgroundColor: theme.csk[50], borderColor: theme.csk[100] }]}>
                        <View style={styles.tipsHeader}>
                            <Ionicons name="bulb-outline" size={20} color={theme.primary} />
                            <Text style={[styles.tipsTitle, { color: theme.csk[700] }]}>{t('settings.securityTips')}</Text>
                        </View>
                        <Text style={[styles.tipsText, { color: theme.gray[600] }]}>• {t('settings.securityTip1')}{'\n'}• {t('settings.securityTip2')}{'\n'}• {t('settings.securityTip3')}</Text>
                    </View>
                </>
            )}
        </ScrollView>
    );

    const renderActivitySection = () => (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}>
            {isLoading && !activityData ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
            ) : activityData ? (
                <>
                    <View style={styles.summaryContainer}>
                        <Ionicons name="person-circle" size={48} color={theme.primary} />
                        <Text style={[styles.summaryTitle, { color: theme.text }]}>{t('settings.accountOverview')}</Text>
                        <Text style={[styles.summaryText, { color: theme.gray[500] }]}>{t('settings.memberSince', { date: formatDate(activityData.account.accountCreatedAt) })}</Text>
                    </View>
                    <SettingsSection title={t('settings.currentDevice')}>
                        <View style={[styles.activityCard, { backgroundColor: theme.surface }]}>
                            <View style={[styles.activityCardHeader, { borderBottomColor: theme.border }]}>
                                <Ionicons name={getDeviceIcon(activityData.currentDevice.platform) as any} size={24} color={theme.primary} />
                                <Text style={[styles.activityCardTitle, { color: theme.text }]}>{activityData.currentDevice.deviceName}</Text>
                            </View>
                            <View style={styles.activityCardContent}>
                                {[[t('settings.model'), activityData.currentDevice.deviceModel], [t('settings.platform'), getPlatformDisplayName(activityData.currentDevice.platform)], [t('settings.os'), activityData.currentDevice.os], [t('settings.appVersion'), activityData.currentDevice.appVersion], [t('settings.ipAddress'), activityData.currentDevice.ipAddress], [t('settings.timezone'), activityData.currentDevice.timezone]].map(([label, value]) => (
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
                                <Text style={[styles.statNumber, { color: theme.csk[600] }]}>{activityData.sessions.totalActive}</Text>
                                <Text style={[styles.statLabel, { color: theme.gray[600] }]}>{t('settings.activeSessions')}</Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: theme.csk[50] }]}>
                                <Text style={[styles.statNumber, { color: theme.csk[600] }]}>{activityData.devices.total}</Text>
                                <Text style={[styles.statLabel, { color: theme.gray[600] }]}>{t('settings.totalDevices')}</Text>
                            </View>
                        </View>
                        <View style={styles.statsRow}>
                            <View style={[styles.statCard, { backgroundColor: theme.csk[50] }]}>
                                <Text style={[styles.statNumber, { color: theme.csk[600] }]}>{activityData.devices.trusted}</Text>
                                <Text style={[styles.statLabel, { color: theme.gray[600] }]}>{t('settings.trustedDevices')}</Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: theme.csk[50] }]}>
                                <Text style={[styles.statNumber, { color: theme.csk[600] }]}>{activityData.sessions.mostRecentActivity ? formatRelativeTime(activityData.sessions.mostRecentActivity) : 'N/A'}</Text>
                                <Text style={[styles.statLabel, { color: theme.gray[600] }]}>{t('settings.lastActivity')}</Text>
                            </View>
                        </View>
                    </SettingsSection>
                    <SettingsSection title={t('settings.sessionsByPlatform')}>
                        <View style={[styles.activityCard, { backgroundColor: theme.surface }]}>
                            <View style={styles.activityCardContent}>
                                {activityData.sessions.byPlatform.IOS !== undefined && (
                                    <View style={styles.activityRow}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Ionicons name="phone-portrait-outline" size={18} color={theme.gray[500]} />
                                            <Text style={[styles.activityLabel, { color: theme.gray[500] }]}>iOS</Text>
                                        </View>
                                        <Text style={[styles.activityValue, { color: theme.text }]}>{activityData.sessions.byPlatform.IOS} {activityData.sessions.byPlatform.IOS === 1 ? t('settings.session') : t('settings.sessions')}</Text>
                                    </View>
                                )}
                                {activityData.sessions.byPlatform.ANDROID !== undefined && (
                                    <View style={styles.activityRow}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Ionicons name="phone-portrait-outline" size={18} color={theme.gray[500]} />
                                            <Text style={[styles.activityLabel, { color: theme.gray[500] }]}>Android</Text>
                                        </View>
                                        <Text style={[styles.activityValue, { color: theme.text }]}>{activityData.sessions.byPlatform.ANDROID} {activityData.sessions.byPlatform.ANDROID === 1 ? t('settings.session') : t('settings.sessions')}</Text>
                                    </View>
                                )}
                                {activityData.sessions.byPlatform.WEB !== undefined && (
                                    <View style={styles.activityRow}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Ionicons name="desktop-outline" size={18} color={theme.gray[500]} />
                                            <Text style={[styles.activityLabel, { color: theme.gray[500] }]}>Web</Text>
                                        </View>
                                        <Text style={[styles.activityValue, { color: theme.text }]}>{activityData.sessions.byPlatform.WEB} {activityData.sessions.byPlatform.WEB === 1 ? t('settings.session') : t('settings.sessions')}</Text>
                                    </View>
                                )}
                                {!activityData.sessions.byPlatform.IOS && !activityData.sessions.byPlatform.ANDROID && !activityData.sessions.byPlatform.WEB && (
                                    <Text style={[styles.activityLabel, { color: theme.gray[500], textAlign: 'center' }]}>{t('settings.noPlatformData')}</Text>
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
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                    <View style={[styles.trustedDeviceIcon, { backgroundColor: theme.csk[50] }]}>
                                                        <Ionicons name={getDeviceIcon(device.platform) as any} size={18} color={theme.primary} />
                                                    </View>
                                                    <View>
                                                        <Text style={[styles.activityValue, { color: theme.text }]}>{device.name}</Text>
                                                        <Text style={[styles.activityLabel, { color: theme.gray[500], fontSize: 12 }]}>{getPlatformDisplayName(device.platform)}</Text>
                                                    </View>
                                                </View>
                                                <View style={{ alignItems: 'flex-end' }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                        <Ionicons name="shield-checkmark" size={14} color={theme.csk[600]} />
                                                        <Text style={[styles.activityLabel, { color: theme.csk[600], fontSize: 12 }]}>{t('settings.trusted')}</Text>
                                                    </View>
                                                    <Text style={[styles.activityLabel, { color: theme.gray[400], fontSize: 11 }]}>{formatRelativeTime(device.lastLoginAt)}</Text>
                                                </View>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={[styles.activityLabel, { color: theme.gray[500], textAlign: 'center' }]}>{t('settings.noTrustedDevices')}</Text>
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
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                                                <View style={[styles.trustedDeviceIcon, { backgroundColor: activity.status === 'active' ? theme.csk[50] : theme.gray[100] }]}>
                                                    <Ionicons name={getDeviceIcon(activity.platform) as any} size={18} color={activity.status === 'active' ? theme.primary : theme.gray[400]} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.activityValue, { color: theme.text }]} numberOfLines={1}>{activity.deviceName}</Text>
                                                    <Text style={[styles.activityLabel, { color: theme.gray[500], fontSize: 12 }]} numberOfLines={1}>{activity.location || activity.ipAddress}</Text>
                                                </View>
                                            </View>
                                            <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                                                <View style={[styles.statusBadge, { backgroundColor: activity.status === 'active' ? theme.csk[50] : activity.status === 'expired' ? '#FEF3C7' : '#FEE2E2' }]}>
                                                    <Text style={[styles.statusText, { color: activity.status === 'active' ? theme.csk[600] : activity.status === 'expired' ? '#D97706' : '#DC2626' }]}>{activity.status}</Text>
                                                </View>
                                                <Text style={[styles.activityLabel, { color: theme.gray[400], fontSize: 11, marginTop: 4 }]}>{formatRelativeTime(activity.lastActivityAt)}</Text>
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

    const renderParentLinkSection = () => (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}>
            {isLoading && linkedAccounts.length === 0 && pendingRequests.length === 0 ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
            ) : (
                <>
                    <View style={styles.summaryContainer}>
                        <View style={[styles.summaryIcon, { backgroundColor: theme.csk[50] }]}>
                            <Ionicons name="people" size={32} color={theme.primary} />
                        </View>
                        <Text style={[styles.summaryTitle, { color: theme.text }]}>{isParent ? t('settings.linkedChildren') : t('settings.linkedParents')}</Text>
                        <Text style={[styles.summaryText, { color: theme.gray[500] }]}>{isParent ? t('settings.manageLinkedChildren') : t('settings.connectWithParent')}</Text>
                    </View>

                    {linkedAccounts.length > 0 && (
                        <SettingsSection title={isParent ? t('settings.yourChildren') : t('settings.yourParents')}>
                            {linkedAccounts.map((link) => {
                                const account = isParent ? link.child : link.parent;
                                return <ParentLinkCard key={link.id} name={account?.name || ''} username={account?.username || ''} profileImg={account?.profileImg ?? undefined} showUnlink={!isParent} isProcessing={processingRequestId === account?.id} onUnlink={() => { setUnlinkTargetParent({ id: account?.id || '', name: account?.name || '' }); setShowUnlinkModal(true); }} />;
                            })}
                        </SettingsSection>
                    )}

                    {pendingRequests.length > 0 && (
                        <SettingsSection title={isParent ? t('settings.incomingRequests') : t('settings.sentRequests')}>
                            {pendingRequests.map((request) => {
                                const account = isParent ? request.child : request.parent;
                                return <ParentLinkCard key={request.id} name={account?.name || ''} username={account?.username || ''} profileImg={account?.profileImg ?? undefined} isPending pendingTime={formatRelativeTime(request.createdAt)} showActions={isParent} isProcessing={processingRequestId === request.id} onAccept={() => handleRespondToRequest(request.id, 'accept')} onDecline={() => handleRespondToRequest(request.id, 'decline')} />;
                            })}
                        </SettingsSection>
                    )}

                    {isParent && pendingUnlinkRequests.length > 0 && (
                        <SettingsSection title={t('settings.unlinkRequests')}>
                            {pendingUnlinkRequests.map((request) => (
                                <ParentLinkCard key={request.id} name={request.child?.name || ''} username={t('settings.wantsToUnlink')} profileImg={request.child?.profileImg ?? undefined} showActions isProcessing={processingRequestId === request.id} onAccept={() => handleRespondToUnlinkRequest(request.id, 'accept')} onDecline={() => handleRespondToUnlinkRequest(request.id, 'decline')} />
                            ))}
                        </SettingsSection>
                    )}

                    {linkedAccounts.length === 0 && pendingRequests.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={48} color={theme.gray[300]} />
                            <Text style={[styles.emptyText, { color: theme.gray[500] }]}>{isParent ? t('settings.noLinkedChildrenYet') : t('settings.noLinkedParentsYet')}</Text>
                        </View>
                    )}

                    {!isParent && (
                        <SettingsSection title="">
                            <TouchableOpacity style={[styles.addButton, { borderColor: theme.primary }]} onPress={() => setShowSearchModal(true)}>
                                <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
                                <Text style={[styles.addButtonText, { color: theme.primary }]}>{t('settings.linkWithParentBtn')}</Text>
                            </TouchableOpacity>
                        </SettingsSection>
                    )}
                </>
            )}
        </ScrollView>
    );

    const renderDangerSection = () => (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <SettingsSection title="">
                <InfoCard icon="warning" title={t('settings.proceedWithCaution')} description={t('settings.dangerDescription')} variant="warning" />
                <DangerCard title={t('settings.deactivateAccount')} description={t('settings.deactivateAccountDesc')} buttonText={t('settings.deactivateAccount')} onPress={() => setShowDeactivateModal(true)} />
                <DangerCard title={t('settings.deleteAccountTitle')} description={t('settings.deleteAccountDesc')} buttonText={t('settings.deleteAccountTitle')} onPress={() => setShowDeleteModal(true)} isDelete />
            </SettingsSection>
        </ScrollView>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
            <SettingsHeader title={getHeaderTitle()} onBack={() => currentSection === 'main' ? router.back() : setCurrentSection('main')} />
            
            {currentSection === 'main' && renderMainSection()}
            {currentSection === 'security' && renderSecuritySection()}
            {currentSection === 'sessions' && renderSessionsSection()}
            {currentSection === 'activity' && renderActivitySection()}
            {currentSection === 'danger' && renderDangerSection()}
            {currentSection === 'parentLink' && renderParentLinkSection()}

            <TwoFAModal visible={show2FAModal} step={twoFAStep} isLoading={isLoading} qrCode={twoFASetupData?.qrCode} secret={twoFASetupData?.secret} verificationCode={verificationCode} backupCodes={backupCodes} onClose={() => { setShow2FAModal(false); setTwoFAStep('info'); setVerificationCode(''); }} onGetStarted={handleEnable2FA} onContinue={() => setTwoFAStep('verify')} onVerify={handleVerify2FA} onDone={() => { setShow2FAModal(false); setTwoFAStep('info'); setVerificationCode(''); fetch2FAStatus(); }} onCodeChange={setVerificationCode} onCopySecret={() => twoFASetupData?.secret && copyToClipboard(twoFASetupData.secret)} onCopyCode={copyToClipboard} onCopyAllCodes={() => copyToClipboard(backupCodes.join('\n'))} />

            <ConfirmModal visible={showDisable2FAModal} icon="shield-outline" iconColor="#F59E0B" title={t('settings.disable2FATitle')} description={t('settings.disable2FADesc')} confirmText={t('settings.disable')} isLoading={isLoading} isDisabled={!disablePassword} onConfirm={handleDisable2FA} onCancel={() => { setShowDisable2FAModal(false); setDisablePassword(''); }} passwordInput={{ value: disablePassword, onChange: setDisablePassword, placeholder: t('settings.enterPasswordToConfirm') }} />

            <ConfirmModal visible={showDeactivateModal} icon="pause-circle" iconColor="#F59E0B" title={t('settings.deactivateAccountTitle')} description={t('settings.deactivateAccountConfirmDesc')} confirmText={t('settings.deactivate')} isLoading={isLoading} onConfirm={handleDeactivateAccount} onCancel={() => setShowDeactivateModal(false)} />

            <ConfirmModal visible={showDeleteModal} icon="trash" iconColor="#EF4444" title={t('settings.deleteAccountConfirmTitle')} description={t('settings.deleteAccountConfirmDesc')} confirmText={t('common.delete')} confirmColor="#EF4444" isLoading={isLoading} isDisabled={user?.hasPassword !== false ? !deletePassword : deleteConfirmText !== 'DELETE'} onConfirm={handleDeleteAccount} onCancel={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteConfirmText(''); }} passwordInput={user?.hasPassword !== false ? { value: deletePassword, onChange: setDeletePassword, placeholder: t('settings.enterPasswordToConfirm') } : undefined} textConfirmInput={user?.hasPassword === false ? { value: deleteConfirmText, onChange: setDeleteConfirmText, keyword: 'DELETE' } : undefined} />

            <ConfirmModal visible={showUnlinkModal} icon="unlink" iconColor="#EF4444" title={t('settings.confirmUnlink')} description={t('settings.confirmUnlinkDesc', { name: unlinkTargetParent?.name })} confirmText={t('settings.sendRequest')} confirmColor="#EF4444" isLoading={processingRequestId === unlinkTargetParent?.id} onConfirm={handleConfirmUnlink} onCancel={() => { setShowUnlinkModal(false); setUnlinkTargetParent(null); }} />

            <SessionDetailsModal visible={showSessionModal} session={selectedSession} isLoading={loadingSessionId === selectedSession?.id} onClose={() => { setShowSessionModal(false); setSelectedSession(null); }} onRevoke={() => selectedSession && handleRevokeSession(selectedSession.id)} formatDate={formatDate} />

            <SearchParentModal visible={showSearchModal} searchQuery={searchQuery} searchResults={searchResults} isSearching={isSearching} processingId={processingRequestId} onClose={() => { setShowSearchModal(false); setSearchQuery(''); setSearchResults([]); }} onSearchChange={setSearchQuery} onSendRequest={handleSendLinkRequest} />

            <PickerModal visible={showLanguageModal} title={t('settings.selectLanguage')} options={languages} selectedValue={locale} onSelect={handleLanguageChange} onClose={() => setShowLanguageModal(false)} />

            <PickerModal visible={showThemeModal} title={t('settings.selectTheme')} options={themes} selectedValue={preferences?.themePreference} onSelect={(v: string) => handleUpdatePreference('themePreference', v)} onClose={() => setShowThemeModal(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
    toggleLabel: { fontSize: 16, fontFamily: Fonts.medium },
    secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, marginTop: 16, gap: 8 },
    secondaryButtonText: { fontSize: 15, fontFamily: Fonts.semiBold },
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
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 15, fontFamily: Fonts.regular, marginTop: 12 },
    addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
    addButtonText: { fontSize: 15, fontFamily: Fonts.semiBold },
    trustedDeviceIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    statusText: { fontSize: 11, fontFamily: Fonts.medium, textTransform: 'capitalize' },
});
