import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

type Theme = typeof Colors.light | typeof Colors.dark;

interface DeviceVerificationHeaderProps {
    theme: Theme;
    isDark: boolean;
    onBack: () => void;
}

export const DeviceVerificationHeader: React.FC<DeviceVerificationHeaderProps> = ({
    theme,
    isDark,
    onBack,
}) => {
    const { t } = useTranslation();
    
    return (
        <>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? theme.primaryContainer : theme.csk[100] }]}>
                    <Ionicons name="phone-portrait-outline" size={48} color={theme.primary} />
                </View>
            </View>

            <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: theme.primary }]}>{t('auth.newDeviceDetected')}</Text>
                <Text style={[styles.subtitle, { color: theme.icon }]}>
                    {t('auth.deviceVerificationSubtitle')}
                </Text>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    header: {
        marginBottom: 20,
    },
    backButton: {
        padding: 4,
        marginLeft: -4,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontFamily: Fonts?.bold,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        fontFamily: Fonts?.regular,
        lineHeight: 22,
        textAlign: 'center',
    },
});
