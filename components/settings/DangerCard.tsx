import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface DangerCardProps {
    title: string;
    description: string;
    buttonText: string;
    onPress: () => void;
    isDelete?: boolean;
}

export function DangerCard({ title, description, buttonText, onPress, isDelete }: DangerCardProps) {
    const { theme, isDark } = useTheme();

    const bgColor = isDelete 
        ? (isDark ? theme.error[50] : '#FEF2F2')
        : theme.surface;

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.description, { color: theme.gray[600] }]}>{description}</Text>
            <TouchableOpacity
                style={[
                    styles.button,
                    isDelete 
                        ? { backgroundColor: theme.error[500] }
                        : { borderWidth: 1, borderColor: '#F59E0B' }
                ]}
                onPress={onPress}
            >
                <Text style={[
                    styles.buttonText,
                    { color: isDelete ? '#FFFFFF' : '#F59E0B' }
                ]}>
                    {buttonText}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        lineHeight: 20,
        marginBottom: 16,
    },
    button: {
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
});
