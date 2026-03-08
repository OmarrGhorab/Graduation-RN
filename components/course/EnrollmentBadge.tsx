import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface EnrollmentBadgeProps {
    count: number;
    variant?: 'default' | 'compact';
}

export function EnrollmentBadge({ count, variant = 'default' }: EnrollmentBadgeProps) {
    const { theme, isDark } = useTheme();

    if (variant === 'compact') {
        return (
            <View style={[styles.compactBadge, { backgroundColor: `${theme.primary}15` }]}>
                <Ionicons name="people" size={14} color={theme.primary} />
                <Text style={[styles.compactText, { color: theme.primary }]}>
                    {count}
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.badge, { backgroundColor: isDark ? theme.surface : '#F6F8F7' }]}>
            <Ionicons name="people" size={18} color={theme.primary} />
            <Text style={[styles.badgeText, { color: isDark ? theme.text : '#000' }]}>
                {count} {count === 1 ? 'student' : 'students'} enrolled
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    badgeText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    compactBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    compactText: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
    },
});
