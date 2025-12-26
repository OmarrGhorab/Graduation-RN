import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';

interface GoalChipProps {
    label: string;
    selected: boolean;
    onPress: () => void;
    isCustom?: boolean;
    showRemoveIcon?: boolean;
}

export const GoalChip = ({ 
    label, 
    selected, 
    onPress, 
    isCustom = false,
    showRemoveIcon = false,
}: GoalChipProps) => {
    const { theme, isDark } = useTheme();
    
    const getChipStyle = () => {
        if (isCustom) {
            return {
                backgroundColor: isDark ? theme.csk[100] : theme.csk[50],
                borderColor: theme.primary,
            };
        }
        return {
            backgroundColor: selected ? theme.primary : theme.surface,
            borderColor: selected ? theme.primary : theme.border,
        };
    };

    const getTextColor = () => {
        if (isCustom) return theme.primary;
        return selected ? '#FFFFFF' : theme.text;
    };

    return (
        <TouchableOpacity
            style={[styles.chip, getChipStyle()]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.chipContent}>
                <Text style={[styles.chipText, { color: getTextColor() }]}>
                    {label}
                </Text>
                {showRemoveIcon && (
                    <Ionicons 
                        name="close" 
                        size={14} 
                        color={theme.primary} 
                        style={styles.removeIcon} 
                    />
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    chip: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginHorizontal: 6,
        marginBottom: 12,
    },
    chipContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chipText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    removeIcon: {
        marginLeft: 6,
    },
});
