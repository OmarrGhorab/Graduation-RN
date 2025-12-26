import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

interface ConfirmModalProps {
    visible: boolean;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    title: string;
    description: string;
    confirmText: string;
    confirmColor?: string;
    isLoading?: boolean;
    isDisabled?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    passwordInput?: {
        value: string;
        onChange: (text: string) => void;
        placeholder: string;
    };
    textConfirmInput?: {
        value: string;
        onChange: (text: string) => void;
        keyword: string;
    };
}

export function ConfirmModal({
    visible,
    icon,
    iconColor,
    title,
    description,
    confirmText,
    confirmColor = '#F59E0B',
    isLoading,
    isDisabled,
    onConfirm,
    onCancel,
    passwordInput,
    textConfirmInput,
}: ConfirmModalProps) {
    const { theme } = useTheme();
    const { t, textAlign } = useTranslation();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={[styles.content, { backgroundColor: theme.background }]}>
                    <Ionicons name={icon} size={48} color={iconColor} />
                    <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                    <Text style={[styles.description, { color: theme.gray[600] }]}>
                        {description}
                    </Text>

                    {textConfirmInput && (
                        <Text style={[styles.confirmInstructions, { color: theme.gray[600] }]}>
                            {t('settings.typeToConfirm')} <Text style={[styles.keyword, { color: theme.error[500] }]}>
                                {textConfirmInput.keyword}
                            </Text> {t('settings.toConfirm')}
                        </Text>
                    )}

                    {passwordInput && (
                        <TextInput
                            style={[styles.input, { 
                                borderColor: theme.border, 
                                color: theme.text,
                                backgroundColor: theme.surface,
                                textAlign,
                            }]}
                            value={passwordInput.value}
                            onChangeText={passwordInput.onChange}
                            placeholder={passwordInput.placeholder}
                            placeholderTextColor={theme.gray[400]}
                            secureTextEntry
                        />
                    )}

                    {textConfirmInput && (
                        <TextInput
                            style={[styles.input, { 
                                borderColor: theme.border, 
                                color: theme.text,
                                backgroundColor: theme.surface,
                                textAlign,
                            }]}
                            value={textConfirmInput.value}
                            onChangeText={textConfirmInput.onChange}
                            placeholder={`${t('settings.typeToConfirm')} ${textConfirmInput.keyword}`}
                            placeholderTextColor={theme.gray[400]}
                            autoCapitalize="characters"
                        />
                    )}

                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { backgroundColor: theme.surface }]}
                            onPress={onCancel}
                        >
                            <Text style={[styles.cancelText, { color: theme.gray[700] }]}>
                                {t('common.cancel')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.confirmButton, 
                                { backgroundColor: confirmColor },
                                isDisabled && styles.disabled
                            ]}
                            onPress={onConfirm}
                            disabled={isLoading || isDisabled}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.confirmButtonText}>{confirmText}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    confirmInstructions: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        marginBottom: 12,
        textAlign: 'center',
    },
    keyword: {
        fontFamily: Fonts.bold,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: Fonts.regular,
        marginBottom: 20,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    disabled: {
        opacity: 0.5,
    },
});
