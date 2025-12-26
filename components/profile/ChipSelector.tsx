import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Fonts } from '@/constants/theme';

interface ChipSelectorProps {
    label: string;
    items: string[];
    selectedItems: string[];
    onToggle: (item: string) => void;
    maxItems?: number;
    customItems?: string[];
    onRemoveCustom?: (item: string) => void;
}

export default function ChipSelector({
    label,
    items,
    selectedItems,
    onToggle,
    customItems = [],
    onRemoveCustom,
}: ChipSelectorProps) {
    const { theme, isDark } = useTheme();

    const chipBg = isDark ? theme.surfaceVariant : theme.gray[50];
    const chipBorder = isDark ? theme.border : theme.gray[200];
    const chipText = isDark ? theme.gray[800] : theme.gray[700];

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: isDark ? theme.gray[800] : theme.gray[700] }]}>
                {label}
            </Text>
            <View style={styles.chipsGrid}>
                {items.map((item) => {
                    const isSelected = selectedItems.includes(item);
                    return (
                        <TouchableOpacity
                            key={item}
                            style={[
                                styles.chip,
                                {
                                    backgroundColor: isSelected ? theme.primary : chipBg,
                                    borderColor: isSelected ? theme.primary : chipBorder,
                                },
                            ]}
                            onPress={() => onToggle(item)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    { color: isSelected ? '#FFFFFF' : chipText },
                                ]}
                            >
                                {item}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
                {customItems.map((item, index) => (
                    <TouchableOpacity
                        key={`custom-${index}`}
                        style={[
                            styles.chip,
                            styles.customChip,
                            { backgroundColor: theme.primary, borderColor: theme.primary },
                        ]}
                        onPress={() => onRemoveCustom?.(item)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.chipText, { color: '#FFFFFF' }]}>{item}</Text>
                        <Ionicons name="close" size={14} color="#FFFFFF" style={styles.removeIcon} />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        marginBottom: 8,
    },
    chipsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    chip: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginHorizontal: 6,
        marginBottom: 12,
    },
    customChip: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chipText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    removeIcon: {
        marginLeft: 4,
    },
});
