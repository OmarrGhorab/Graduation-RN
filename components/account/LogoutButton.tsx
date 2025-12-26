import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface LogoutButtonProps {
    onPress: () => void;
}

export function LogoutButton({ onPress }: LogoutButtonProps) {
    const { theme, isDark } = useTheme();

    return (
        <TouchableOpacity 
            style={[
                styles.container, 
                { backgroundColor: isDark ? theme.error[50] : '#FEF2F2' }
            ]} 
            onPress={onPress} 
            activeOpacity={0.7}
        >
            <Ionicons name="log-out-outline" size={24} color={theme.error[500]} />
            <Text style={[styles.text, { color: theme.error[500] }]}>Logout</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        marginBottom: 40,
        paddingVertical: 16,
        marginHorizontal: 16,
        borderRadius: 12,
    },
    text: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        marginLeft: 8,
    },
});
