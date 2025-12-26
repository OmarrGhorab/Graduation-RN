import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

type Theme = typeof Colors.light | typeof Colors.dark;

interface Verify2FAHeaderProps {
    theme: Theme;
    isDark: boolean;
    isBackupMode: boolean;
    onBack: () => void;
}

export const Verify2FAHeader: React.FC<Verify2FAHeaderProps> = ({
    theme,
    isDark,
    isBackupMode,
    onBack,
}) => (
    <>
        <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
        </View>

        <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? theme.primaryContainer : theme.csk[50] }]}>
                <Ionicons name="shield-checkmark" size={48} color={theme.primary} />
            </View>

            <Text style={[styles.title, { color: theme.text }]}>
                Two-Factor Authentication
            </Text>
            <Text style={[styles.subtitle, { color: theme.icon }]}>
                {isBackupMode
                    ? 'Enter one of your backup codes to verify your identity'
                    : 'Enter the 6-digit code from your authenticator app'}
            </Text>
        </View>
    </>
);

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 24,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontFamily: Fonts?.bold,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        fontFamily: Fonts?.regular,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        paddingHorizontal: 20,
    },
});
