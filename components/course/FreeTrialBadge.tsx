import { Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface FreeTrialBadgeProps {
    variant?: 'default' | 'compact';
}

export function FreeTrialBadge({ variant = 'default' }: FreeTrialBadgeProps) {
    if (variant === 'compact') {
        return (
            <View style={[styles.compactBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.compactText}>FREE</Text>
            </View>
        );
    }

    return (
        <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
            <Ionicons name="gift" size={16} color="#FFFFFF" />
            <Text style={styles.badgeText}>Free Trial</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    badgeText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    compactBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    compactText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
