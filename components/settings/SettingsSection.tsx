import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface SettingsSectionProps {
    title: string;
    isDanger?: boolean;
    children: React.ReactNode;
}

export function SettingsSection({ title, isDanger, children }: SettingsSectionProps) {
    const { theme } = useTheme();

    return (
        <View style={styles.section}>
            <Text style={[
                styles.title, 
                { color: isDanger ? theme.error[500] : theme.gray[500] }
            ]}>
                {title}
            </Text>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    title: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
});
