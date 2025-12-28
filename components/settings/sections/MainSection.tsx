import React, { memo } from 'react';
import { ScrollView, Switch, StyleSheet } from 'react-native';
import { SettingsMenuItem, SettingsSection } from '@/components/settings';
import { useTheme } from '@/hooks/useTheme';

interface MainSectionProps {
    t: (key: string) => string;
    isParent: boolean;
    preferences: {
        themePreference?: string;
        notifications?: boolean;
        newsletterEnabled?: boolean;
    } | undefined;
    languagePreference: string;
    onNavigateToSecurity: () => void;
    onNavigateToSessions: () => void;
    onNavigateToActivity: () => void;
    onNavigateToParentLink: () => void;
    onNavigateToDanger: () => void;
    onShowThemeModal: () => void;
    onShowLanguageModal: () => void;
    onUpdatePreference: (key: string, value: any) => void;
}

export const MainSection = memo(function MainSection({
    t,
    isParent,
    preferences,
    languagePreference,
    onNavigateToSecurity,
    onNavigateToSessions,
    onNavigateToActivity,
    onNavigateToParentLink,
    onNavigateToDanger,
    onShowThemeModal,
    onShowLanguageModal,
    onUpdatePreference,
}: MainSectionProps) {
    const { theme } = useTheme();

    const getThemeSubtitle = () => {
        if (preferences?.themePreference === 'dark') return t('settings.themeDark');
        if (preferences?.themePreference === 'light') return t('settings.themeLight');
        return t('settings.themeSystem');
    };

    const getLanguageSubtitle = () => {
        if (languagePreference === 'system') return t('languages.system');
        if (languagePreference === 'ar') return 'العربية';
        return 'English';
    };

    return (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <SettingsSection title={t('settings.security')}>
                <SettingsMenuItem
                    icon="shield-checkmark-outline"
                    label={t('settings.twoFactorAuth')}
                    subtitle={t('settings.twoFactorAuthSubtitle')}
                    onPress={onNavigateToSecurity}
                />
                <SettingsMenuItem
                    icon="phone-portrait-outline"
                    label={t('settings.activeSessions')}
                    subtitle={t('settings.activeSessionsSubtitle')}
                    onPress={onNavigateToSessions}
                />
            </SettingsSection>

            <SettingsSection title={t('settings.activity')}>
                <SettingsMenuItem
                    icon="time-outline"
                    label={t('settings.activityLog')}
                    subtitle={t('settings.activityLogSubtitle')}
                    onPress={onNavigateToActivity}
                />
            </SettingsSection>

            <SettingsSection title={t('settings.family')}>
                <SettingsMenuItem
                    icon="people-outline"
                    label={isParent ? t('settings.myChildren') : t('settings.parentLink')}
                    subtitle={isParent ? t('settings.viewManageChildren') : t('settings.linkWithParent')}
                    onPress={onNavigateToParentLink}
                />
            </SettingsSection>

            <SettingsSection title={t('settings.preferences')}>
                <SettingsMenuItem
                    icon="color-palette-outline"
                    label={t('settings.theme')}
                    subtitle={getThemeSubtitle()}
                    onPress={onShowThemeModal}
                />
                <SettingsMenuItem
                    icon="language-outline"
                    label={t('settings.language')}
                    subtitle={getLanguageSubtitle()}
                    onPress={onShowLanguageModal}
                />
                <SettingsMenuItem
                    icon="notifications-outline"
                    label={t('settings.notifications')}
                    subtitle={t('settings.notificationsSubtitle')}
                    rightElement={
                        <Switch
                            value={preferences?.notifications ?? true}
                            onValueChange={(v) => onUpdatePreference('notifications', v)}
                            trackColor={{ false: theme.gray[200], true: theme.csk[400] }}
                            thumbColor={preferences?.notifications ? theme.primary : theme.gray[50]}
                        />
                    }
                />
                <SettingsMenuItem
                    icon="mail-outline"
                    label={t('settings.newsletter')}
                    subtitle={t('settings.newsletterSubtitle')}
                    rightElement={
                        <Switch
                            value={preferences?.newsletterEnabled ?? false}
                            onValueChange={(v) => onUpdatePreference('newsletterEnabled', v)}
                            trackColor={{ false: theme.gray[200], true: theme.csk[400] }}
                            thumbColor={preferences?.newsletterEnabled ? theme.primary : theme.gray[50]}
                        />
                    }
                />
            </SettingsSection>

            <SettingsSection title={t('settings.dangerZone')} isDanger>
                <SettingsMenuItem
                    icon="warning-outline"
                    label={t('settings.accountManagement')}
                    subtitle={t('settings.accountManagementSubtitle')}
                    onPress={onNavigateToDanger}
                    isDanger
                />
            </SettingsSection>
        </ScrollView>
    );
});

const styles = StyleSheet.create({
    content: { flex: 1 },
});
