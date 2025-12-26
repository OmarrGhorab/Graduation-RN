import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface SettingsMenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    subtitle?: string;
    onPress?: () => void;
    isDanger?: boolean;
    rightElement?: React.ReactNode;
}

export function SettingsMenuItem({ 
    icon, 
    label, 
    subtitle, 
    onPress, 
    isDanger,
    rightElement 
}: SettingsMenuItemProps) {
    const { theme } = useTheme();

    const content = (
        <>
            <View style={styles.iconContainer}>
                <Ionicons 
                    name={icon} 
                    size={22} 
                    color={isDanger ? theme.error[500] : theme.gray[600]} 
                />
            </View>
            <View style={styles.textContainer}>
                <Text style={[
                    styles.label, 
                    { color: isDanger ? theme.error[500] : theme.text }
                ]}>
                    {label}
                </Text>
                {subtitle && (
                    <Text style={[styles.subtitle, { color: theme.gray[500] }]}>
                        {subtitle}
                    </Text>
                )}
            </View>
            {rightElement || (
                <Ionicons name="chevron-forward" size={20} color={theme.gray[400]} />
            )}
        </>
    );

    if (onPress) {
        return (
            <TouchableOpacity 
                style={[styles.container, { borderBottomColor: theme.border }]} 
                onPress={onPress}
            >
                {content}
            </TouchableOpacity>
        );
    }

    return (
        <View style={[styles.container, { borderBottomColor: theme.border }]}>
            {content}
        </View>
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
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    label: {
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
    subtitle: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
});
