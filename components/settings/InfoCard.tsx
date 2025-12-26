import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface InfoCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    variant?: 'primary' | 'warning';
}

export function InfoCard({ icon, title, description, variant = 'primary' }: InfoCardProps) {
    const { theme, isDark } = useTheme();

    const bgColor = variant === 'warning' 
        ? (isDark ? '#3D2A11' : '#FEF3C7')
        : theme.csk[50];
    
    const iconColor = variant === 'warning' 
        ? '#F59E0B' 
        : theme.primary;
    
    const titleColor = variant === 'warning'
        ? (isDark ? '#FCD34D' : '#92400E')
        : theme.text;
    
    const textColor = variant === 'warning'
        ? (isDark ? '#FCD34D' : '#92400E')
        : theme.gray[600];

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <Ionicons name={icon} size={40} color={iconColor} />
            <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
            <Text style={[styles.description, { color: textColor }]}>{description}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        marginTop: 12,
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        textAlign: 'center',
        lineHeight: 20,
    },
});
