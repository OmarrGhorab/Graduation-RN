import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Fonts } from '@/constants/theme';

interface ReactivateTextProps {
    message?: string;
    fadeAnim: Animated.Value;
    slideAnim: Animated.Value;
}

export const ReactivateText: React.FC<ReactivateTextProps> = ({
    message,
    fadeAnim,
    slideAnim,
}) => (
    <Animated.View
        style={[
            styles.textSection,
            {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            },
        ]}
    >
        <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
        <Text style={styles.title}>Good to See You Again!</Text>
        <Text style={styles.subtitle}>
            {message || "Your account will be reactivated. We're excited to have you back!"}
        </Text>
    </Animated.View>
);

const styles = StyleSheet.create({
    textSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    welcomeLabel: {
        fontSize: 13,
        fontFamily: Fonts?.bold,
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 3,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontFamily: Fonts?.extraBold,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 15,
        fontFamily: Fonts?.regular,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: 23,
        paddingHorizontal: 12,
    },
});
