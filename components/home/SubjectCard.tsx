import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';

interface SubjectCardProps {
    id: string;
    name: string;
    icon: string;
    onPress?: () => void;
}

export default memo(function SubjectCard({ name, icon, onPress }: SubjectCardProps) {
    const { theme, isDark } = useTheme();

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: isDark ? theme.surface : '#FFFFFF',
                    borderColor: isDark ? theme.border : theme.gray[200],
                },
            ]}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <Text style={styles.icon}>{icon}</Text>
            <Text style={[styles.name, { color: isDark ? theme.text : theme.gray[900] }]}>
                {name}
            </Text>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        borderWidth: 1,
        minWidth: 140,
    },
    icon: {
        fontSize: 20,
        marginRight: 8,
    },
    name: {
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
});
