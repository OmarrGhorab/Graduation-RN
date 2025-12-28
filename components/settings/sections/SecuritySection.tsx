import React, { memo } from 'react';
import { ScrollView, View, ActivityIndicator, Switch, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsSection, InfoCard } from '@/components/settings';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';
import { TwoFactorStatus } from '@/services/SecurityService';

interface SecuritySectionProps {
    t: (key: string) => string;
    isLoading: boolean;
    twoFAStatus: TwoFactorStatus | null;
    onToggle2FA: (enabled: boolean) => void;
    onRegenerateBackupCodes: () => void;
}

export const SecuritySection = memo(function SecuritySection({
    t,
    isLoading,
    twoFAStatus,
    onToggle2FA,
    onRegenerateBackupCodes,
}: SecuritySectionProps) {
    const { theme } = useTheme();

    return (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {isLoading && !twoFAStatus ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <SettingsSection title={t('settings.twoFactorAuthentication')}>
                    <InfoCard
                        icon="shield-checkmark"
                        title={twoFAStatus?.enabled ? t('settings.twoFAEnabled') : t('settings.protectYourAccount')}
                        description={twoFAStatus?.enabled ? t('settings.twoFAEnabledDesc') : t('settings.protectYourAccountDesc')}
                    />
                    <View style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.toggleLabel, { color: theme.text }]}>
                            {t('settings.twoFactorAuthentication')}
                        </Text>
                        <Switch
                            value={twoFAStatus?.enabled || false}
                            onValueChange={onToggle2FA}
                            trackColor={{ false: theme.gray[200], true: theme.csk[400] }}
                            thumbColor={twoFAStatus?.enabled ? theme.primary : theme.gray[50]}
                        />
                    </View>
                    {twoFAStatus?.enabled && (
                        <TouchableOpacity
                            style={[styles.secondaryButton, { borderColor: theme.primary }]}
                            onPress={onRegenerateBackupCodes}
                            disabled={isLoading}
                        >
                            <Ionicons name="refresh-outline" size={20} color={theme.primary} />
                            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
                                {t('settings.regenerateBackupCodes')}
                            </Text>
                        </TouchableOpacity>
                    )}
                </SettingsSection>
            )}
        </ScrollView>
    );
});

const styles = StyleSheet.create({
    content: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
    toggleLabel: { fontSize: 16, fontFamily: Fonts.medium },
    secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, marginTop: 16, gap: 8 },
    secondaryButtonText: { fontSize: 15, fontFamily: Fonts.semiBold },
});
