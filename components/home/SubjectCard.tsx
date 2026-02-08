
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SubjectCardProps {
    id: string;
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
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
                    // shadow for light mode
                    shadowColor: isDark ? 'transparent' : '#000',
                    shadowOpacity: isDark ? 0 : 0.05,
                },
            ]}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View style={[
                styles.iconContainer,
                { backgroundColor: isDark ? theme.surfaceVariant : theme.primaryContainer }
            ]}>
                <Ionicons
                    name={icon as any}
                    size={28}
                    color={theme.primary}
                />
            </View>
            <Text
                numberOfLines={1}
                style={[styles.name, { color: isDark ? theme.text : theme.gray[900] }]}
            >
                {name}
            </Text>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        width: 100,
        height: 120,
        borderRadius: 16,
        padding: 12,
        marginRight: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    name: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        textAlign: 'center',
    },
});
