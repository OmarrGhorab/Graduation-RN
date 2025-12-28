import React, { memo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SettingsSection, InfoCard, DangerCard } from '@/components/settings';

interface DangerSectionProps {
    t: (key: string) => string;
    onDeactivate: () => void;
    onDelete: () => void;
}

export const DangerSection = memo(function DangerSection({
    t,
    onDeactivate,
    onDelete,
}: DangerSectionProps) {
    return (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <SettingsSection title="">
                <InfoCard
                    icon="warning"
                    title={t('settings.proceedWithCaution')}
                    description={t('settings.dangerDescription')}
                    variant="warning"
                />
                <DangerCard
                    title={t('settings.deactivateAccount')}
                    description={t('settings.deactivateAccountDesc')}
                    buttonText={t('settings.deactivateAccount')}
                    onPress={onDeactivate}
                />
                <DangerCard
                    title={t('settings.deleteAccountTitle')}
                    description={t('settings.deleteAccountDesc')}
                    buttonText={t('settings.deleteAccountTitle')}
                    onPress={onDelete}
                    isDelete
                />
            </SettingsSection>
        </ScrollView>
    );
});

const styles = StyleSheet.create({
    content: { flex: 1 },
});
