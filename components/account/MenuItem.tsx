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
}

export function MenuItem({ icon, label, onPress }: MenuItemProps) {
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
            <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
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
    label: {
        flex: 1,
        fontSize: 16,
        fontFamily: Fonts.medium,
        marginLeft: 14,
    },
});
