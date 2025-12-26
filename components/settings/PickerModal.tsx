import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface PickerOption {
    code: string;
    name: string;
    icon?: string;
}

interface PickerModalProps {
    visible: boolean;
    title: string;
    options: PickerOption[];
    selectedValue?: string;
    onSelect: (value: string) => void;
    onClose: () => void;
}

export function PickerModal({ 
    visible, 
    title, 
    options, 
    selectedValue, 
    onSelect, 
    onClose 
}: PickerModalProps) {
    const { theme } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.content, { backgroundColor: theme.background }]}>
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.gray[600]} />
                        </TouchableOpacity>
                    </View>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option.code}
                            style={[styles.option, { borderBottomColor: theme.border }]}
                            onPress={() => {
                                onSelect(option.code);
                                onClose();
                            }}
                        >
                            <View style={styles.optionLeft}>
                                {option.icon && (
                                    <Ionicons 
                                        name={option.icon as any} 
                                        size={20} 
                                        color={theme.gray[600]} 
                                    />
                                )}
                                <Text style={[styles.optionText, { color: theme.text }]}>
                                    {option.name}
                                </Text>
                            </View>
                            {selectedValue === option.code && (
                                <Ionicons name="checkmark" size={20} color={theme.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    optionText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
});
