import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

interface MenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
    badge?: string | number;
}

export function MenuItem({ icon, label, onPress, badge }: MenuItemProps) {
    const { theme } = useTheme();
    const { isRTL } = useTranslation();

    return (
        <TouchableOpacity 
            style={[styles.container, { borderBottomColor: theme.border }]} 
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={22} color={theme.gray[600]} />
            </View>
            <View style={styles.labelContainer}>
                <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
                {badge !== undefined && (
                    <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                )}
            </View>
            <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={theme.gray[400]} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    labelContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 14,
    },
    label: {
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
    badge: {
        marginLeft: 8,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontFamily: Fonts.bold,
    },
});
