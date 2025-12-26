import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';

interface PreferenceToggleProps {
    title: string;
    description: string;
    value: boolean;
    onToggle: () => void;
}

export const PreferenceToggle = ({ 
    title, 
    description, 
    value, 
    onToggle 
}: PreferenceToggleProps) => {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <View style={styles.info}>
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                <Text style={[styles.description, { color: theme.gray[500] }]}>
                    {description}
                </Text>
            </View>
            <TouchableOpacity
                style={[
                    styles.toggle,
                    { backgroundColor: value ? theme.primary : theme.border },
                ]}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <View 
                    style={[
                        styles.toggleCircle,
                        value && styles.toggleCircleActive,
                    ]} 
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
    },
    info: {
        flex: 1,
        marginRight: 16,
    },
    title: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        marginBottom: 2,
    },
    description: {
        fontSize: 14,
        fontFamily: Fonts.regular,
    },
    toggle: {
        width: 48,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    toggleCircle: {
        width: 24,
        height: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleCircleActive: {
        alignSelf: 'flex-end',
    },
});
