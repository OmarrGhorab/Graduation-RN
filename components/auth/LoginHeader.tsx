import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

type Theme = typeof Colors.light | typeof Colors.dark;

interface LoginHeaderProps {
    theme: Theme;
}

export const LoginHeader: React.FC<LoginHeaderProps> = ({ theme }) => (
    <>
        <Text style={[styles.welcomeText, { color: theme.primary }]}>
            WELCOME BACK
        </Text>
        <Text style={[styles.subtitle, { color: theme.primary }]}>
            Sign in to access your account and continue your journey with us.
        </Text>
    </>
);

const styles = StyleSheet.create({
    welcomeText: {
        fontSize: 32,
        fontFamily: Fonts?.bold,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: Fonts?.regular,
        textAlign: 'center',
        marginBottom: 60,
    },
});
