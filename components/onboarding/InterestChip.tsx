import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { translateInterest } from '@/libs/i18n/options';
import { Fonts } from '@/constants/theme';

interface InterestChipProps {
    label: string; // This is the English key
    selected: boolean;
    onPress: () => void;
}

export const InterestChip = ({ label, selected, onPress }: InterestChipProps) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    
    // Translate the label for display
    const displayLabel = translateInterest(label, t);
    
    return (
        <TouchableOpacity
            style={[
                styles.chip,
                { 
                    backgroundColor: selected ? theme.primary : theme.surface,
                    borderColor: selected ? theme.primary : theme.border,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={[
                styles.chipText,
                { 
                    color: selected ? '#FFFFFF' : theme.text,
                    fontFamily: Fonts.medium,
                },
            ]}>
                {displayLabel}
            </Text>
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
    chipText: {
        fontSize: 14,
    },
});
