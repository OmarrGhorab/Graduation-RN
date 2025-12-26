import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

const { height } = Dimensions.get('window');

type Theme = typeof Colors.light | typeof Colors.dark;

interface ForgotPasswordHeaderProps {
    theme: Theme;
    onBack: () => void;
}

export const ForgotPasswordHeader: React.FC<ForgotPasswordHeaderProps> = ({ theme, onBack }) => (
    <>
        <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
        </View>
        <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.primary }]}>Forgot Password</Text>
            <Text style={[styles.subtitle, { color: theme.icon }]}>
                Enter your email address We will send an OTP code for verification in the next step.
            </Text>
        </View>
    </>
);

const styles = StyleSheet.create({
    header: {
        marginTop: height * 0.05,
        marginBottom: 30,
    },
    backButton: {
        padding: 4,
        marginLeft: -4,
    },
    titleContainer: {
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontFamily: Fonts?.bold,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 22,
        fontFamily: Fonts?.regular,
    },
});
