import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Fonts } from '@/constants/theme';

interface UsernameWarningModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function UsernameWarningModal({
    visible,
    onCancel,
    onConfirm,
}: UsernameWarningModalProps) {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.content,
                        { backgroundColor: isDark ? theme.surface : '#FFFFFF' },
                    ]}
                >
                    <Ionicons name="warning" size={48} color="#F59E0B" />
                    <Text style={[styles.title, { color: isDark ? theme.text : theme.gray[900] }]}>
                        {t('profile.changeUsername')}
                    </Text>
                    <Text style={[styles.text, { color: isDark ? theme.gray[700] : theme.gray[600] }]}>
                        {t('profile.usernameWarningText')}
                    </Text>
                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[
                                styles.cancelButton,
                                { backgroundColor: isDark ? theme.surfaceVariant : theme.gray[100] },
                            ]}
                            onPress={onCancel}
                        >
                            <Text
                                style={[
                                    styles.cancelButtonText,
                                    { color: isDark ? theme.gray[800] : theme.gray[700] },
                                ]}
                            >
                                {t('common.cancel')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                            <Text style={styles.confirmButtonText}>{t('common.continue')}</Text>
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
    text: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        textAlign: 'center',
        lineHeight: 20,
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
    cancelButtonText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
});
