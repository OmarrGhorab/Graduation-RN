import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Switch,
    Modal,
    TextInput,
    Image,
    BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '@/libs/auth';
import { cskColors, grayColors, Fonts } from '@/constants/theme';
import { useToast } from '@/components/toast';
import {
    get2FAStatus,
    enable2FA,
    verify2FASetup,
    disable2FA,
    regenerateBackupCodes,
    getSessions,
    getSessionDetails,
    revokeSession,
    revokeAllSessions,
    getActivityLog,
    deactivateAccount,
    deleteAccount,
    getDeviceIcon,
    getPlatformDisplayName,
    getStatusColor,
    TwoFactorStatus,
    TwoFactorEnableResponse,
    Session,
    SessionDetails,
    ActivityResponse,
    RecentActivityItem,
} from '@/services/SecurityService';

type SettingsSection = 'main' | 'security' | 'sessions' | 'activity' | 'danger';

export default function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const toast = useToast();
    const { logout } = useAuthStore();

    const [currentSection, setCurrentSection] = useState<SettingsSection>('main');
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
    const [disablePassword, setDisablePassword] = useState('');

    useEffect(() => {
        if (currentSection === 'security') {
            fetch2FAStatus();
        } else if (currentSection === 'sessions') {
            fetchSessions();
        } else if (currentSection === 'activity') {
            fetchActivity();
        }
    }, [currentSection]);

    // Handle hardware back button
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (currentSection !== 'main') {
                setCurrentSection('main');
                return true; // Prevent default behavior
            }
            return false; // Let default behavior happen (go back)
        });

        return () => backHandler.remove();
    }, [currentSection]);

    const fetch2FAStatus = async () => {
        try {
            setIsLoading(true);
            const status = await get2FAStatus();
            console.log('[2FA] Status response:', status);
            // Handle different response formats
            const enabled = status.enabled ?? status.twoFactorEnabled ?? false;
            setTwoFAStatus({ enabled, enabledAt: status.enabledAt });
        } catch (error: any) {
            console.error('[2FA] Status error:', error);
            toast.error('Error', error.message || 'Failed to fetch 2FA status');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSessions = async () => {
        try {
            setIsLoading(true);
            const response = await getSessions();
            setSessions(response.sessions || []);
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to fetch sessions');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchActivity = async () => {
        try {
            setIsLoading(true);
            const response = await getActivityLog();
            setActivityData(response);
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to fetch activity');
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (currentSection === 'sessions') {
            await fetchSessions();
        } else if (currentSection === 'activity') {
            await fetchActivity();
        }
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
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        if (verificationCode.length !== 6) {
            toast.error('Invalid Code', 'Please enter a 6-digit code');
            return;
        }

        try {
            setIsLoading(true);
            const response = await verify2FASetup(verificationCode);
            if (response.backupCodes) {
                setBackupCodes(response.backupCodes);
            } else if (twoFASetupData?.backupCodes) {
                setBackupCodes(twoFASetupData.backupCodes);
            }
            setTwoFAStep('backup');
            setTwoFAStatus({ enabled: true, enabledAt: new Date().toISOString() });
            toast.success('Success', '2FA has been enabled');
        } catch (error: any) {
            toast.error('Error', error.message || 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        if (!disablePassword) {
            toast.error('Error', 'Password is required');
            return;
        }

        try {
            setIsLoading(true);
            await disable2FA(disablePassword);
            setTwoFAStatus({ enabled: false });
            setShowDisable2FAModal(false);
            setDisablePassword('');
            toast.success('Success', '2FA has been disabled');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to disable 2FA');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerateBackupCodes = async () => {
        try {
            setIsLoading(true);
            const response = await regenerateBackupCodes();
            setBackupCodes(response.backupCodes);
            setTwoFAStep('backup');
            setShow2FAModal(true);
            toast.success('Success', 'New backup codes generated');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to regenerate codes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            setLoadingSessionId(sessionId);
            await revokeSession(sessionId);
            setSessions(sessions.filter(s => s.id !== sessionId));
            setShowSessionModal(false);
            setSelectedSession(null);
            toast.success('Success', 'Session revoked');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to revoke session');
        } finally {
            setLoadingSessionId(null);
        }
    };

    const handleViewSessionDetails = async (sessionId: string) => {
        try {
            setLoadingSessionId(sessionId);
            const details = await getSessionDetails(sessionId);
            setSelectedSession(details);
            setShowSessionModal(true);
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to load session details');
        } finally {
            setLoadingSessionId(null);
        }
    };

    const handleRevokeAllSessions = async () => {
        try {
            setIsLoading(true);
            await revokeAllSessions();
            setSessions(sessions.filter(s => s.isCurrent));
            toast.success('Success', 'All other sessions revoked');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to revoke sessions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeactivateAccount = async () => {
        try {
            setIsLoading(true);
            await deactivateAccount();
            setShowDeactivateModal(false);
            toast.success('Account Deactivated', 'Your account has been deactivated');
            logout();
            router.replace('/login');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to deactivate account');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            toast.error('Error', 'Password is required');
            return;
        }

        try {
            setIsLoading(true);
            await deleteAccount(deletePassword);
            setShowDeleteModal(false);
            toast.success('Account Deleted', 'Your account has been permanently deleted');
            logout();
            router.replace('/login');
        } catch (error: any) {
            toast.error('Error', error.message || 'Failed to delete account');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        toast.success('Copied', 'Copied to clipboard');
    };

    const getActivityIcon = (status: string) => {
        switch (status) {
            case 'active': return 'checkmark-circle-outline';
            case 'expired': return 'time-outline';
            case 'revoked': return 'close-circle-outline';
            default: return 'ellipse-outline';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={() => currentSection === 'main' ? router.back() : setCurrentSection('main')}
                style={styles.backButton}
            >
                <Ionicons name="arrow-back" size={24} color={grayColors[900]} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
                {currentSection === 'main' && 'Settings'}
                {currentSection === 'security' && 'Security'}
                {currentSection === 'sessions' && 'Active Sessions'}
                {currentSection === 'activity' && 'Activity Log'}
                {currentSection === 'danger' && 'Account'}
            </Text>
            <View style={styles.placeholder} />
        </View>
    );


    const renderMainSection = () => (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Security Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Security</Text>
                
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setCurrentSection('security')}
                >
                    <View style={styles.menuIconContainer}>
                        <Ionicons name="shield-checkmark-outline" size={22} color={grayColors[600]} />
                    </View>
                    <View style={styles.menuTextContainer}>
                        <Text style={styles.menuText}>Two-Factor Authentication</Text>
                        <Text style={styles.menuSubtext}>Add extra security to your account</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={grayColors[400]} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setCurrentSection('sessions')}
                >
                    <View style={styles.menuIconContainer}>
                        <Ionicons name="phone-portrait-outline" size={22} color={grayColors[600]} />
                    </View>
                    <View style={styles.menuTextContainer}>
                        <Text style={styles.menuText}>Active Sessions</Text>
                        <Text style={styles.menuSubtext}>Manage your logged-in devices</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={grayColors[400]} />
                </TouchableOpacity>
            </View>

            {/* Activity Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Activity</Text>
                
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setCurrentSection('activity')}
                >
                    <View style={styles.menuIconContainer}>
                        <Ionicons name="time-outline" size={22} color={grayColors[600]} />
                    </View>
                    <View style={styles.menuTextContainer}>
                        <Text style={styles.menuText}>Activity Log</Text>
                        <Text style={styles.menuSubtext}>View your recent account activity</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={grayColors[400]} />
                </TouchableOpacity>
            </View>

            {/* Preferences Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                
                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuIconContainer}>
                        <Ionicons name="notifications-outline" size={22} color={grayColors[600]} />
                    </View>
                    <View style={styles.menuTextContainer}>
                        <Text style={styles.menuText}>Notifications</Text>
                        <Text style={styles.menuSubtext}>Manage notification preferences</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={grayColors[400]} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <View style={styles.menuIconContainer}>
                        <Ionicons name="language-outline" size={22} color={grayColors[600]} />
                    </View>
                    <View style={styles.menuTextContainer}>
                        <Text style={styles.menuText}>Language</Text>
                        <Text style={styles.menuSubtext}>English</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={grayColors[400]} />
                </TouchableOpacity>
            </View>

            {/* Danger Zone */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
                
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setCurrentSection('danger')}
                >
                    <View style={styles.menuIconContainer}>
                        <Ionicons name="warning-outline" size={22} color="#EF4444" />
                    </View>
                    <View style={styles.menuTextContainer}>
                        <Text style={[styles.menuText, styles.dangerText]}>Account Management</Text>
                        <Text style={styles.menuSubtext}>Deactivate or delete account</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={grayColors[400]} />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderSecuritySection = () => (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {isLoading && !twoFAStatus ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={cskColors[500]} />
                </View>
            ) : (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>
                    
                    <View style={styles.infoCard}>
                        <Ionicons name="shield-checkmark" size={40} color={cskColors[500]} />
                        <Text style={styles.infoTitle}>
                            {twoFAStatus?.enabled ? '2FA is Enabled' : 'Protect Your Account'}
                        </Text>
                        <Text style={styles.infoText}>
                            {twoFAStatus?.enabled
                                ? 'Your account is protected with two-factor authentication.'
                                : 'Add an extra layer of security by requiring a verification code when signing in.'}
                        </Text>
                    </View>

                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Two-Factor Authentication</Text>
                        <Switch
                            value={twoFAStatus?.enabled || false}
                            onValueChange={(value) => {
                                if (value) {
                                    setTwoFAStep('info');
                                    setShow2FAModal(true);
                                } else {
                                    setShowDisable2FAModal(true);
                                }
                            }}
                            trackColor={{ false: grayColors[200], true: cskColors[400] }}
                            thumbColor={twoFAStatus?.enabled ? cskColors[500] : grayColors[50]}
                        />
                    </View>

                    {twoFAStatus?.enabled && (
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={handleRegenerateBackupCodes}
                            disabled={isLoading}
                        >
                            <Ionicons name="refresh-outline" size={20} color={cskColors[500]} />
                            <Text style={styles.secondaryButtonText}>Regenerate Backup Codes</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </ScrollView>
    );

    const renderSessionsSection = () => (
        <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[cskColors[500]]} />
            }
        >
            {isLoading && sessions.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={cskColors[500]} />
                </View>
            ) : (
                <>
                    {/* Sessions Summary */}
                    <View style={styles.sessionsSummary}>
                        <View style={styles.sessionsSummaryIcon}>
                            <Ionicons name="shield-checkmark" size={28} color={cskColors[500]} />
                        </View>
                        <Text style={styles.sessionsSummaryTitle}>
                            {sessions.filter(s => s.isActive).length} Active {sessions.filter(s => s.isActive).length === 1 ? 'Session' : 'Sessions'}
                        </Text>
                        <Text style={styles.sessionsSummaryText}>
                            These devices are currently logged into your account
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Devices</Text>
                        
                        {sessions.map((session) => (
                            <TouchableOpacity
                                key={session.id}
                                style={[styles.sessionCard, session.isCurrent && styles.currentSession]}
                                onPress={() => handleViewSessionDetails(session.id)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.sessionIcon, session.isCurrent && styles.sessionIconCurrent]}>
                                    <Ionicons
                                        name={getDeviceIcon(session.platform) as any}
                                        size={24}
                                        color={session.isCurrent ? cskColors[500] : grayColors[600]}
                                    />
                                </View>
                                <View style={styles.sessionInfo}>
                                    <View style={styles.sessionHeader}>
                                        <Text style={styles.sessionDevice} numberOfLines={1}>
                                            {session.deviceName || 'Unknown Device'}
                                        </Text>
                                        {session.isCurrent && (
                                            <View style={styles.currentBadge}>
                                                <Text style={styles.currentBadgeText}>This device</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.sessionDetails}>
                                        <Text style={styles.sessionBrowser}>
                                            {getPlatformDisplayName(session.platform)}
                                        </Text>
                                        {session.location && (
                                            <View style={styles.sessionLocationRow}>
                                                <Ionicons name="location-outline" size={12} color={grayColors[500]} />
                                                <Text style={styles.sessionLocation}>{session.location}</Text>
                                            </View>
                                        )}
                                        <Text style={styles.sessionTime}>
                                            {session.isCurrent ? 'Active now' : formatRelativeTime(session.lastActivityAt)}
                                        </Text>
                                    </View>
                                </View>
                                {loadingSessionId === session.id ? (
                                    <ActivityIndicator size="small" color={cskColors[500]} />
                                ) : (
                                    <Ionicons name="chevron-forward" size={20} color={grayColors[400]} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {sessions.filter(s => !s.isCurrent).length > 0 && (
                        <View style={styles.sessionsActions}>
                            <TouchableOpacity
                                style={styles.revokeAllButton}
                                onPress={handleRevokeAllSessions}
                                disabled={isLoading}
                            >
                                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                                <Text style={styles.revokeAllButtonText}>Sign out all other devices</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Security Tips */}
                    <View style={styles.securityTips}>
                        <View style={styles.securityTipHeader}>
                            <Ionicons name="bulb-outline" size={20} color={cskColors[500]} />
                            <Text style={styles.securityTipTitle}>Security Tips</Text>
                        </View>
                        <Text style={styles.securityTipText}>
                            • Sign out of devices you don't recognize{'\n'}
                            • Enable two-factor authentication for extra security{'\n'}
                            • Use unique passwords for each account
                        </Text>
                    </View>
                </>
            )}

            {/* Session Details Modal */}
            <Modal
                visible={showSessionModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    setShowSessionModal(false);
                    setSelectedSession(null);
                }}
            >
                <View style={styles.sessionModalOverlay}>
                    <View style={styles.sessionModalContent}>
                        <View style={styles.sessionModalHeader}>
                            <Text style={styles.sessionModalTitle}>Session Details</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowSessionModal(false);
                                    setSelectedSession(null);
                                }}
                            >
                                <Ionicons name="close" size={24} color={grayColors[600]} />
                            </TouchableOpacity>
                        </View>

                        {selectedSession && (
                            <ScrollView 
                                style={styles.sessionModalBody}
                                showsVerticalScrollIndicator={false}
                            >
                                {/* Device Info */}
                                <View style={styles.sessionModalSection}>
                                    <View style={styles.sessionModalIconLarge}>
                                        <Ionicons
                                            name={getDeviceIcon(selectedSession.device.platform) as any}
                                            size={40}
                                            color={selectedSession.isCurrent ? cskColors[500] : grayColors[600]}
                                        />
                                    </View>
                                    <Text style={styles.sessionModalDeviceName}>
                                        {selectedSession.device.name || 'Unknown Device'}
                                    </Text>
                                    {selectedSession.isCurrent && (
                                        <View style={[styles.currentBadge, { marginTop: 8 }]}>
                                            <Text style={styles.currentBadgeText}>Current Session</Text>
                                        </View>
                                    )}
                                    {selectedSession.device.isTrusted && (
                                        <View style={[styles.trustedBadge, { marginTop: 8 }]}>
                                            <Ionicons name="shield-checkmark" size={12} color={cskColors[600]} />
                                            <Text style={styles.trustedBadgeText}>Trusted Device</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Details List */}
                                <View style={styles.sessionDetailsList}>
                                    <View style={styles.sessionDetailRow}>
                                        <View style={styles.sessionDetailIcon}>
                                            <Ionicons name="phone-portrait-outline" size={18} color={grayColors[500]} />
                                        </View>
                                        <View style={styles.sessionDetailInfo}>
                                            <Text style={styles.sessionDetailLabel}>Platform</Text>
                                            <Text style={styles.sessionDetailValue}>
                                                {getPlatformDisplayName(selectedSession.device.platform)}
                                            </Text>
                                        </View>
                                    </View>

                                    {selectedSession.device.browser && (
                                        <View style={styles.sessionDetailRow}>
                                            <View style={styles.sessionDetailIcon}>
                                                <Ionicons name="globe-outline" size={18} color={grayColors[500]} />
                                            </View>
                                            <View style={styles.sessionDetailInfo}>
                                                <Text style={styles.sessionDetailLabel}>Browser</Text>
                                                <Text style={styles.sessionDetailValue}>{selectedSession.device.browser}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {selectedSession.device.os && (
                                        <View style={styles.sessionDetailRow}>
                                            <View style={styles.sessionDetailIcon}>
                                                <Ionicons name="laptop-outline" size={18} color={grayColors[500]} />
                                            </View>
                                            <View style={styles.sessionDetailInfo}>
                                                <Text style={styles.sessionDetailLabel}>Operating System</Text>
                                                <Text style={styles.sessionDetailValue}>{selectedSession.device.os}</Text>
                                            </View>
                                        </View>
                                    )}

                                    <View style={styles.sessionDetailRow}>
                                        <View style={styles.sessionDetailIcon}>
                                            <Ionicons name="wifi-outline" size={18} color={grayColors[500]} />
                                        </View>
                                        <View style={styles.sessionDetailInfo}>
                                            <Text style={styles.sessionDetailLabel}>IP Address</Text>
                                            <Text style={styles.sessionDetailValue}>{selectedSession.network.ipAddress}</Text>
                                        </View>
                                    </View>

                                    {selectedSession.network.location && (
                                        <View style={styles.sessionDetailRow}>
                                            <View style={styles.sessionDetailIcon}>
                                                <Ionicons name="location-outline" size={18} color={grayColors[500]} />
                                            </View>
                                            <View style={styles.sessionDetailInfo}>
                                                <Text style={styles.sessionDetailLabel}>Location</Text>
                                                <Text style={styles.sessionDetailValue}>{selectedSession.network.location}</Text>
                                            </View>
                                        </View>
                                    )}

                                    <View style={styles.sessionDetailRow}>
                                        <View style={styles.sessionDetailIcon}>
                                            <Ionicons name="time-outline" size={18} color={grayColors[500]} />
                                        </View>
                                        <View style={styles.sessionDetailInfo}>
                                            <Text style={styles.sessionDetailLabel}>Last Activity</Text>
                                            <Text style={styles.sessionDetailValue}>
                                                {selectedSession.isCurrent ? 'Active now' : formatDate(selectedSession.timestamps.lastActivityAt)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.sessionDetailRow}>
                                        <View style={styles.sessionDetailIcon}>
                                            <Ionicons name="calendar-outline" size={18} color={grayColors[500]} />
                                        </View>
                                        <View style={styles.sessionDetailInfo}>
                                            <Text style={styles.sessionDetailLabel}>Signed In</Text>
                                            <Text style={styles.sessionDetailValue}>{formatDate(selectedSession.timestamps.createdAt)}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.sessionDetailRow}>
                                        <View style={styles.sessionDetailIcon}>
                                            <Ionicons name="hourglass-outline" size={18} color={grayColors[500]} />
                                        </View>
                                        <View style={styles.sessionDetailInfo}>
                                            <Text style={styles.sessionDetailLabel}>Expires</Text>
                                            <Text style={styles.sessionDetailValue}>{formatDate(selectedSession.timestamps.expiresAt)}</Text>
                                        </View>
                                    </View>

                                    {/* Status */}
                                    <View style={styles.sessionDetailRow}>
                                        <View style={styles.sessionDetailIcon}>
                                            <Ionicons 
                                                name={selectedSession.status.isActive ? "checkmark-circle" : "close-circle"} 
                                                size={18} 
                                                color={selectedSession.status.isActive ? '#10B981' : '#EF4444'} 
                                            />
                                        </View>
                                        <View style={styles.sessionDetailInfo}>
                                            <Text style={styles.sessionDetailLabel}>Status</Text>
                                            <Text style={[
                                                styles.sessionDetailValue,
                                                { color: selectedSession.status.isActive ? '#10B981' : '#EF4444' }
                                            ]}>
                                                {selectedSession.status.isActive ? 'Active' : 
                                                 selectedSession.status.isRevoked ? 'Revoked' : 
                                                 selectedSession.status.isExpired ? 'Expired' : 'Inactive'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Revoke Button */}
                                {!selectedSession.isCurrent && selectedSession.status.isActive && (
                                    <TouchableOpacity
                                        style={styles.revokeSessionButton}
                                        onPress={() => handleRevokeSession(selectedSession.id)}
                                        disabled={loadingSessionId === selectedSession.id}
                                    >
                                        {loadingSessionId === selectedSession.id ? (
                                            <ActivityIndicator color="#FFFFFF" />
                                        ) : (
                                            <>
                                                <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                                                <Text style={styles.revokeSessionButtonText}>Sign out this device</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );


    const renderActivitySection = () => (
        <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[cskColors[500]]} />
            }
        >
            {isLoading && !activityData ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={cskColors[500]} />
                </View>
            ) : activityData ? (
                <>
                    {/* Account Info */}
                    <View style={styles.activitySummary}>
                        <View style={styles.activitySummaryIcon}>
                            <Ionicons name="person-circle" size={48} color={cskColors[500]} />
                        </View>
                        <Text style={styles.activitySummaryTitle}>Account Overview</Text>
                        <Text style={styles.activitySummaryText}>
                            Member since {formatDate(activityData.account.accountCreatedAt)}
                        </Text>
                    </View>

                    {/* Current Device Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Current Device</Text>
                        <View style={styles.activityCard}>
                            <View style={styles.activityCardHeader}>
                                <Ionicons 
                                    name={getDeviceIcon(activityData.currentDevice.platform) as any} 
                                    size={24} 
                                    color={cskColors[500]} 
                                />
                                <Text style={styles.activityCardTitle}>
                                    {activityData.currentDevice.deviceName}
                                </Text>
                            </View>
                            <View style={styles.activityCardContent}>
                                <View style={styles.activityRow}>
                                    <Text style={styles.activityLabel}>Model</Text>
                                    <Text style={styles.activityValue}>{activityData.currentDevice.deviceModel}</Text>
                                </View>
                                <View style={styles.activityRow}>
                                    <Text style={styles.activityLabel}>Platform</Text>
                                    <Text style={styles.activityValue}>
                                        {getPlatformDisplayName(activityData.currentDevice.platform)}
                                    </Text>
                                </View>
                                <View style={styles.activityRow}>
                                    <Text style={styles.activityLabel}>OS</Text>
                                    <Text style={styles.activityValue}>{activityData.currentDevice.os}</Text>
                                </View>
                                <View style={styles.activityRow}>
                                    <Text style={styles.activityLabel}>App Version</Text>
                                    <Text style={styles.activityValue}>{activityData.currentDevice.appVersion}</Text>
                                </View>
                                <View style={styles.activityRow}>
                                    <Text style={styles.activityLabel}>IP Address</Text>
                                    <Text style={styles.activityValue}>{activityData.currentDevice.ipAddress}</Text>
                                </View>
                                {activityData.currentDevice.location && (
                                    <View style={styles.activityRow}>
                                        <Text style={styles.activityLabel}>Location</Text>
                                        <Text style={styles.activityValue}>{activityData.currentDevice.location}</Text>
                                    </View>
                                )}
                                <View style={styles.activityRow}>
                                    <Text style={styles.activityLabel}>Timezone</Text>
                                    <Text style={styles.activityValue}>{activityData.currentDevice.timezone}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Session Stats */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sessions Overview</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <Text style={styles.statNumber}>{activityData.sessions.totalActive}</Text>
                                <Text style={styles.statLabel}>Active Sessions</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statNumber}>{activityData.devices.total}</Text>
                                <Text style={styles.statLabel}>Total Devices</Text>
                            </View>
                        </View>
                        <View style={[styles.statsRow, { marginTop: 12 }]}>
                            <View style={styles.statCard}>
                                <Text style={styles.statNumber}>{activityData.devices.trusted}</Text>
                                <Text style={styles.statLabel}>Trusted Devices</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statNumber}>
                                    {formatRelativeTime(activityData.sessions.mostRecentActivity)}
                                </Text>
                                <Text style={styles.statLabel}>Last Activity</Text>
                            </View>
                        </View>
                    </View>

                    {/* Platform Breakdown */}
                    {activityData.sessions.byPlatform && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Sessions by Platform</Text>
                            <View style={styles.platformBreakdown}>
                                {activityData.sessions.byPlatform.IOS && (
                                    <View style={styles.platformItem}>
                                        <Ionicons name="logo-apple" size={20} color={grayColors[600]} />
                                        <Text style={styles.platformCount}>{activityData.sessions.byPlatform.IOS}</Text>
                                        <Text style={styles.platformLabel}>iOS</Text>
                                    </View>
                                )}
                                {activityData.sessions.byPlatform.ANDROID && (
                                    <View style={styles.platformItem}>
                                        <Ionicons name="logo-android" size={20} color="#3DDC84" />
                                        <Text style={styles.platformCount}>{activityData.sessions.byPlatform.ANDROID}</Text>
                                        <Text style={styles.platformLabel}>Android</Text>
                                    </View>
                                )}
                                {activityData.sessions.byPlatform.WEB && (
                                    <View style={styles.platformItem}>
                                        <Ionicons name="globe-outline" size={20} color="#4285F4" />
                                        <Text style={styles.platformCount}>{activityData.sessions.byPlatform.WEB}</Text>
                                        <Text style={styles.platformLabel}>Web</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Recent Activity */}
                    {activityData.recentActivity && activityData.recentActivity.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Recent Activity</Text>
                            {activityData.recentActivity.map((activity) => (
                                <View key={activity.sessionId} style={styles.recentActivityItem}>
                                    <View style={[
                                        styles.activityStatusDot,
                                        { backgroundColor: getStatusColor(activity.status) }
                                    ]} />
                                    <View style={styles.recentActivityInfo}>
                                        <Text style={styles.recentActivityDevice}>{activity.deviceName}</Text>
                                        <View style={styles.recentActivityMeta}>
                                            <Text style={styles.recentActivityPlatform}>
                                                {getPlatformDisplayName(activity.platform)}
                                            </Text>
                                            {activity.location && (
                                                <>
                                                    <Text style={styles.recentActivityDot}>•</Text>
                                                    <Text style={styles.recentActivityLocation}>{activity.location}</Text>
                                                </>
                                            )}
                                        </View>
                                        <Text style={styles.recentActivityTime}>
                                            {formatRelativeTime(activity.lastActivityAt)}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.activityStatusBadge,
                                        { backgroundColor: getStatusColor(activity.status) + '20' }
                                    ]}>
                                        <Text style={[
                                            styles.activityStatusText,
                                            { color: getStatusColor(activity.status) }
                                        ]}>
                                            {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Trusted Devices */}
                    {activityData.devices.list && activityData.devices.list.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Your Devices</Text>
                            {activityData.devices.list.map((device) => (
                                <View key={device.id} style={styles.deviceItem}>
                                    <View style={styles.deviceIconContainer}>
                                        <Ionicons 
                                            name={getDeviceIcon(device.platform) as any} 
                                            size={22} 
                                            color={device.isTrusted ? cskColors[500] : grayColors[500]} 
                                        />
                                    </View>
                                    <View style={styles.deviceInfo}>
                                        <Text style={styles.deviceName}>{device.name}</Text>
                                        <Text style={styles.deviceMeta}>
                                            {getPlatformDisplayName(device.platform)} • Last login {formatRelativeTime(device.lastLoginAt)}
                                        </Text>
                                    </View>
                                    {device.isTrusted && (
                                        <View style={styles.trustedBadgeSmall}>
                                            <Ionicons name="shield-checkmark" size={14} color={cskColors[500]} />
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </>
            ) : null}
        </ScrollView>
    );

    const renderDangerSection = () => (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <View style={styles.warningCard}>
                    <Ionicons name="warning" size={32} color="#F59E0B" />
                    <Text style={styles.warningTitle}>Proceed with Caution</Text>
                    <Text style={styles.warningText}>
                        Actions in this section can have permanent effects on your account.
                    </Text>
                </View>

                {/* Deactivate Account */}
                <View style={styles.dangerCard}>
                    <Text style={styles.dangerCardTitle}>Deactivate Account</Text>
                    <Text style={styles.dangerCardText}>
                        Temporarily disable your account. You can reactivate it by logging in again.
                    </Text>
                    <TouchableOpacity
                        style={styles.dangerOutlineButton}
                        onPress={() => setShowDeactivateModal(true)}
                    >
                        <Text style={styles.dangerOutlineButtonText}>Deactivate Account</Text>
                    </TouchableOpacity>
                </View>

                {/* Delete Account */}
                <View style={[styles.dangerCard, styles.deleteCard]}>
                    <Text style={styles.dangerCardTitle}>Delete Account</Text>
                    <Text style={styles.dangerCardText}>
                        Permanently delete your account and all associated data. This action cannot be undone.
                    </Text>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => setShowDeleteModal(true)}
                    >
                        <Text style={styles.deleteButtonText}>Delete Account</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );

    const render2FAModal = () => (
        <Modal
            visible={show2FAModal}
            transparent
            animationType="slide"
            onRequestClose={() => {
                setShow2FAModal(false);
                setTwoFAStep('info');
                setVerificationCode('');
            }}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <TouchableOpacity
                        style={styles.modalClose}
                        onPress={() => {
                            setShow2FAModal(false);
                            setTwoFAStep('info');
                            setVerificationCode('');
                        }}
                    >
                        <Ionicons name="close" size={24} color={grayColors[600]} />
                    </TouchableOpacity>

                    {twoFAStep === 'info' && (
                        <>
                            <Ionicons name="shield-checkmark" size={60} color={cskColors[500]} />
                            <Text style={styles.modalTitle}>Enable Two-Factor Authentication</Text>
                            <Text style={styles.modalText}>
                                Two-factor authentication adds an extra layer of security to your account.
                                You'll need to enter a code from your authenticator app each time you sign in.
                            </Text>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleEnable2FA}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Get Started</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                    {twoFAStep === 'qr' && twoFASetupData && (
                        <>
                            <Text style={styles.modalTitle}>Scan QR Code</Text>
                            <Text style={styles.modalText}>
                                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                            </Text>
                            <Image
                                source={{ uri: twoFASetupData.qrCode }}
                                style={styles.qrCode}
                                resizeMode="contain"
                            />
                            <TouchableOpacity
                                style={styles.secretContainer}
                                onPress={() => copyToClipboard(twoFASetupData.secret)}
                            >
                                <Text style={styles.secretLabel}>Manual entry code:</Text>
                                <View style={styles.secretRow}>
                                    <Text style={styles.secretText}>{twoFASetupData.secret}</Text>
                                    <Ionicons name="copy-outline" size={18} color={cskColors[500]} />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => setTwoFAStep('verify')}
                            >
                                <Text style={styles.primaryButtonText}>Continue</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {twoFAStep === 'verify' && (
                        <>
                            <Text style={styles.modalTitle}>Verify Setup</Text>
                            <Text style={styles.modalText}>
                                Enter the 6-digit code from your authenticator app to complete setup.
                            </Text>
                            <TextInput
                                style={styles.codeInput}
                                value={verificationCode}
                                onChangeText={setVerificationCode}
                                placeholder="000000"
                                placeholderTextColor={grayColors[400]}
                                keyboardType="number-pad"
                                maxLength={6}
                                textAlign="center"
                            />
                            <TouchableOpacity
                                style={[styles.primaryButton, verificationCode.length !== 6 && styles.buttonDisabled]}
                                onPress={handleVerify2FA}
                                disabled={isLoading || verificationCode.length !== 6}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Verify</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                    {twoFAStep === 'backup' && (
                        <>
                            <Ionicons name="checkmark-circle" size={60} color={cskColors[500]} />
                            <Text style={styles.modalTitle}>Save Backup Codes</Text>
                            <Text style={styles.modalText}>
                                Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator.
                            </Text>
                            <View style={styles.backupCodesContainer}>
                                {backupCodes.map((code, index) => (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={styles.backupCodeItem}
                                        onPress={() => copyToClipboard(code)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.backupCode}>{code}</Text>
                                        <Ionicons name="copy-outline" size={14} color={grayColors[400]} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity
                                style={styles.copyAllButton}
                                onPress={() => copyToClipboard(backupCodes.join('\n'))}
                                activeOpacity={0.8}
                            >
                                <View style={styles.copyAllContent}>
                                    <Ionicons name="documents-outline" size={22} color="#FFFFFF" />
                                    <Text style={styles.copyAllText}>Copy All Codes</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => {
                                    setShow2FAModal(false);
                                    setTwoFAStep('info');
                                    setVerificationCode('');
                                    // Refetch 2FA status to ensure UI is in sync
                                    fetch2FAStatus();
                                }}
                            >
                                <Text style={styles.primaryButtonText}>Done</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );


    const renderDisable2FAModal = () => (
        <Modal
            visible={showDisable2FAModal}
            transparent
            animationType="fade"
            onRequestClose={() => {
                setShowDisable2FAModal(false);
                setDisablePassword('');
            }}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Ionicons name="shield-outline" size={48} color="#F59E0B" />
                    <Text style={styles.modalTitle}>Disable 2FA?</Text>
                    <Text style={styles.modalText}>
                        This will remove the extra security from your account. Enter your password to confirm.
                    </Text>
                    <TextInput
                        style={styles.passwordInput}
                        value={disablePassword}
                        onChangeText={setDisablePassword}
                        placeholder="Enter your password"
                        placeholderTextColor={grayColors[400]}
                        secureTextEntry
                    />
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                setShowDisable2FAModal(false);
                                setDisablePassword('');
                            }}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmButton, !disablePassword && styles.buttonDisabled]}
                            onPress={handleDisable2FA}
                            disabled={isLoading || !disablePassword}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.confirmButtonText}>Disable</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderDeactivateModal = () => (
        <Modal
            visible={showDeactivateModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDeactivateModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Ionicons name="pause-circle" size={48} color="#F59E0B" />
                    <Text style={styles.modalTitle}>Deactivate Account?</Text>
                    <Text style={styles.modalText}>
                        Your account will be temporarily disabled. You can reactivate it anytime by logging in again.
                    </Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowDeactivateModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={handleDeactivateAccount}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.confirmButtonText}>Deactivate</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderDeleteModal = () => (
        <Modal
            visible={showDeleteModal}
            transparent
            animationType="fade"
            onRequestClose={() => {
                setShowDeleteModal(false);
                setDeletePassword('');
            }}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Ionicons name="trash" size={48} color="#EF4444" />
                    <Text style={styles.modalTitle}>Delete Account?</Text>
                    <Text style={styles.modalText}>
                        This action is permanent and cannot be undone. All your data will be permanently deleted.
                    </Text>
                    <TextInput
                        style={styles.passwordInput}
                        value={deletePassword}
                        onChangeText={setDeletePassword}
                        placeholder="Enter your password to confirm"
                        placeholderTextColor={grayColors[400]}
                        secureTextEntry
                    />
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                setShowDeleteModal(false);
                                setDeletePassword('');
                            }}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.deleteConfirmButton, !deletePassword && styles.buttonDisabled]}
                            onPress={handleDeleteAccount}
                            disabled={isLoading || !deletePassword}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.confirmButtonText}>Delete</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {renderHeader()}
            
            {currentSection === 'main' && renderMainSection()}
            {currentSection === 'security' && renderSecuritySection()}
            {currentSection === 'sessions' && renderSessionsSection()}
            {currentSection === 'activity' && renderActivitySection()}
            {currentSection === 'danger' && renderDangerSection()}

            {render2FAModal()}
            {renderDisable2FAModal()}
            {renderDeactivateModal()}
            {renderDeleteModal()}
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: grayColors[100],
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        color: grayColors[900],
    },
    placeholder: {
        width: 32,
    },
    content: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: grayColors[500],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    dangerTitle: {
        color: '#EF4444',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: grayColors[100],
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    menuText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: grayColors[900],
    },
    menuSubtext: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginTop: 2,
    },
    dangerText: {
        color: '#EF4444',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    infoCard: {
        backgroundColor: cskColors[50],
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    infoTitle: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        color: grayColors[900],
        marginTop: 12,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[600],
        textAlign: 'center',
        lineHeight: 20,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: grayColors[100],
    },
    toggleLabel: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: grayColors[900],
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: cskColors[500],
        marginTop: 16,
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: cskColors[500],
    },
    sessionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: grayColors[50],
        borderRadius: 12,
        marginBottom: 12,
    },
    currentSession: {
        backgroundColor: cskColors[50],
        borderWidth: 1,
        borderColor: cskColors[200],
    },
    sessionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sessionInfo: {
        flex: 1,
        marginLeft: 12,
    },
    sessionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sessionDevice: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: grayColors[900],
    },
    currentBadge: {
        backgroundColor: cskColors[500],
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    currentBadgeText: {
        fontSize: 11,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    sessionLocation: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: grayColors[600],
        marginTop: 2,
    },
    sessionTime: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginTop: 2,
    },
    revokeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#FEE2E2',
    },
    revokeButtonText: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        color: '#EF4444',
    },
    dangerButton: {
        marginHorizontal: 16,
        marginVertical: 20,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
    },
    dangerButtonText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#EF4444',
    },
    activityItem: {
        flexDirection: 'row',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: grayColors[100],
    },
    activityIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: grayColors[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityInfo: {
        flex: 1,
        marginLeft: 12,
    },
    activityDescription: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: grayColors[900],
    },
    activityMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 8,
    },
    activityLocation: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: grayColors[500],
    },
    activityTime: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: grayColors[400],
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 15,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginTop: 12,
    },
    warningCard: {
        backgroundColor: '#FEF3C7',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 24,
    },
    warningTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#92400E',
        marginTop: 8,
    },
    warningText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: '#92400E',
        textAlign: 'center',
        marginTop: 4,
    },
    dangerCard: {
        backgroundColor: grayColors[50],
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    deleteCard: {
        backgroundColor: '#FEF2F2',
    },
    dangerCardTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: grayColors[900],
        marginBottom: 8,
    },
    dangerCardText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[600],
        lineHeight: 20,
        marginBottom: 16,
    },
    dangerOutlineButton: {
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#F59E0B',
        alignItems: 'center',
    },
    dangerOutlineButtonText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#F59E0B',
    },
    deleteButton: {
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#EF4444',
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
    },
    modalClose: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: grayColors[900],
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[600],
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    qrCode: {
        width: 200,
        height: 200,
        marginVertical: 16,
    },
    secretContainer: {
        backgroundColor: grayColors[50],
        borderRadius: 12,
        padding: 12,
        width: '100%',
        marginBottom: 20,
    },
    secretLabel: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginBottom: 4,
    },
    secretRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    secretText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: grayColors[900],
        letterSpacing: 1,
    },
    codeInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: grayColors[200],
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
        fontSize: 24,
        fontFamily: Fonts.semiBold,
        color: grayColors[900],
        letterSpacing: 8,
        marginBottom: 20,
    },
    backupCodesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    backupCodeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: grayColors[100],
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
    },
    backupCode: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: grayColors[900],
        letterSpacing: 1,
    },
    copyAllButton: {
        width: '100%',
        backgroundColor: cskColors[500],
        borderRadius: 12,
        paddingVertical: 14,
        marginBottom: 8,
    },
    copyAllContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    copyAllText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    primaryButton: {
        width: '100%',
        backgroundColor: cskColors[500],
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    passwordInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: grayColors[200],
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: grayColors[900],
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: grayColors[100],
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: grayColors[700],
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    deleteConfirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#EF4444',
        alignItems: 'center',
    },
    activityCard: {
        backgroundColor: grayColors[50],
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    activityCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: grayColors[200],
    },
    activityCardTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: grayColors[900],
    },
    activityCardContent: {
        gap: 12,
    },
    activityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activityLabel: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[500],
    },
    activityValue: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: grayColors[900],
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: cskColors[50],
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        color: cskColors[600],
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: grayColors[600],
        textAlign: 'center',
    },
    // Improved Sessions Styles
    sessionsSummary: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    sessionsSummaryIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: cskColors[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    sessionsSummaryTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: grayColors[900],
        marginBottom: 4,
    },
    sessionsSummaryText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        textAlign: 'center',
    },
    sessionIconCurrent: {
        backgroundColor: cskColors[50],
    },
    sessionDetails: {
        marginTop: 4,
    },
    sessionBrowser: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: grayColors[600],
    },
    sessionLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    sessionsActions: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    revokeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#FEE2E2',
    },
    revokeAllButtonText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#EF4444',
    },
    securityTips: {
        margin: 16,
        padding: 16,
        backgroundColor: cskColors[50],
        borderRadius: 12,
        borderWidth: 1,
        borderColor: cskColors[100],
    },
    securityTipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    securityTipTitle: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: cskColors[700],
    },
    securityTipText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: grayColors[600],
        lineHeight: 20,
    },
    // Session Modal Styles
    sessionModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    sessionModalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    sessionModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: grayColors[100],
    },
    sessionModalTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        color: grayColors[900],
    },
    sessionModalBody: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sessionModalSection: {
        alignItems: 'center',
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: grayColors[100],
        marginBottom: 20,
    },
    sessionModalIconLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: grayColors[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    sessionModalDeviceName: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        color: grayColors[900],
        textAlign: 'center',
    },
    sessionDetailsList: {
        gap: 16,
    },
    sessionDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sessionDetailIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: grayColors[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sessionDetailInfo: {
        flex: 1,
    },
    sessionDetailLabel: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginBottom: 2,
    },
    sessionDetailValue: {
        fontSize: 15,
        fontFamily: Fonts.medium,
        color: grayColors[900],
    },
    revokeSessionButton: {
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
    revokeSessionButtonText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    // Trusted Badge
    trustedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: cskColors[50],
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    trustedBadgeText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: cskColors[600],
    },
    trustedBadgeSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: cskColors[50],
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Activity Section Styles
    activitySummary: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    activitySummaryIcon: {
        marginBottom: 12,
    },
    activitySummaryTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: grayColors[900],
        marginBottom: 4,
    },
    activitySummaryText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[500],
    },
    platformBreakdown: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: grayColors[50],
        borderRadius: 12,
        padding: 16,
    },
    platformItem: {
        alignItems: 'center',
        gap: 4,
    },
    platformCount: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: grayColors[900],
    },
    platformLabel: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: grayColors[500],
    },
    recentActivityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: grayColors[50],
        borderRadius: 12,
        marginBottom: 8,
    },
    activityStatusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },
    recentActivityInfo: {
        flex: 1,
    },
    recentActivityDevice: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: grayColors[900],
    },
    recentActivityMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    recentActivityPlatform: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: grayColors[600],
    },
    recentActivityDot: {
        fontSize: 13,
        color: grayColors[400],
        marginHorizontal: 6,
    },
    recentActivityLocation: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: grayColors[600],
    },
    recentActivityTime: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginTop: 2,
    },
    activityStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    activityStatusText: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: grayColors[50],
        borderRadius: 12,
        marginBottom: 8,
    },
    deviceIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: grayColors[900],
    },
    deviceMeta: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginTop: 2,
    },
});
