import { Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface CustomConfirmModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    isDark: boolean;
    theme: any;
}

export default function CustomConfirmModal({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
    isDark,
    theme
}: CustomConfirmModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[
                            styles.modalContainer,
                            { backgroundColor: isDark ? '#10221a' : '#FFFFFF' }
                        ]}>
                            <View style={[
                                styles.iconContainer,
                                { backgroundColor: isDestructive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(9, 124, 70, 0.1)' }
                            ]}>
                                <Ionicons
                                    name={isDestructive ? "trash-outline" : "alert-circle-outline"}
                                    size={28}
                                    color={isDestructive ? '#EF4444' : theme.primary}
                                />
                            </View>

                            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>{title}</Text>
                            <Text style={[styles.message, { color: isDark ? '#A0AEC0' : '#4A5568' }]}>{message}</Text>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton, { backgroundColor: isDark ? '#2D3748' : '#EDF2F7' }]}
                                    onPress={onClose}
                                >
                                    <Text style={[styles.buttonText, { color: isDark ? '#FFFFFF' : '#4A5568' }]}>{cancelText}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.button,
                                        { backgroundColor: isDestructive ? '#EF4444' : theme.primary }
                                    ]}
                                    onPress={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                >
                                    <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>{confirmText}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    button: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
    },
    buttonText: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
});
