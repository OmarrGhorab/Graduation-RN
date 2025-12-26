import React from 'react';
import { 
    StyleSheet, View, Text, TouchableOpacity, Modal, TextInput, 
    Image, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';

type TwoFAStep = 'info' | 'qr' | 'verify' | 'backup';

interface TwoFAModalProps {
    visible: boolean;
    step: TwoFAStep;
    isLoading: boolean;
    qrCode?: string;
    secret?: string;
    verificationCode: string;
    backupCodes: string[];
    onClose: () => void;
    onGetStarted: () => void;
    onContinue: () => void;
    onVerify: () => void;
    onDone: () => void;
    onCodeChange: (code: string) => void;
    onCopySecret: () => void;
    onCopyCode: (code: string) => void;
    onCopyAllCodes: () => void;
}

export function TwoFAModal({
    visible,
    step,
    isLoading,
    qrCode,
    secret,
    verificationCode,
    backupCodes,
    onClose,
    onGetStarted,
    onContinue,
    onVerify,
    onDone,
    onCodeChange,
    onCopySecret,
    onCopyCode,
    onCopyAllCodes,
}: TwoFAModalProps) {
    const { theme } = useTheme();
    const { t, textAlign } = useTranslation();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.content, { backgroundColor: theme.background }]}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color={theme.gray[600]} />
                    </TouchableOpacity>

                    {step === 'info' && (
                        <>
                            <Ionicons name="shield-checkmark" size={60} color={theme.primary} />
                            <Text style={[styles.title, { color: theme.text }]}>
                                {t('settings.enable2FATitle')}
                            </Text>
                            <Text style={[styles.description, { color: theme.gray[600] }]}>
                                {t('settings.enable2FADescription')}
                            </Text>
                            <TouchableOpacity
                                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                                onPress={onGetStarted}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>{t('settings.getStarted')}</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                    {step === 'qr' && qrCode && (
                        <>
                            <Text style={[styles.title, { color: theme.text }]}>{t('settings.scanQRCode')}</Text>
                            <Text style={[styles.description, { color: theme.gray[600] }]}>
                                {t('settings.scanQRCodeDescription')}
                            </Text>
                            <Image source={{ uri: qrCode }} style={styles.qrCode} resizeMode="contain" />
                            <TouchableOpacity
                                style={[styles.secretContainer, { backgroundColor: theme.surface }]}
                                onPress={onCopySecret}
                            >
                                <Text style={[styles.secretLabel, { color: theme.gray[500] }]}>
                                    {t('settings.manualEntryCode')}
                                </Text>
                                <View style={styles.secretRow}>
                                    <Text style={[styles.secretText, { color: theme.text }]}>{secret}</Text>
                                    <Ionicons name="copy-outline" size={18} color={theme.primary} />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                                onPress={onContinue}
                            >
                                <Text style={styles.primaryButtonText}>{t('common.continue')}</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {step === 'verify' && (
                        <>
                            <Text style={[styles.title, { color: theme.text }]}>{t('settings.verifySetup')}</Text>
                            <Text style={[styles.description, { color: theme.gray[600] }]}>
                                {t('settings.verifySetupDescription')}
                            </Text>
                            <TextInput
                                style={[styles.codeInput, { 
                                    borderColor: theme.border, 
                                    color: theme.text,
                                    backgroundColor: theme.surface,
                                    textAlign: 'center',
                                }]}
                                value={verificationCode}
                                onChangeText={onCodeChange}
                                placeholder="000000"
                                placeholderTextColor={theme.gray[400]}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.primaryButton, 
                                    { backgroundColor: theme.primary },
                                    verificationCode.length !== 6 && styles.disabled
                                ]}
                                onPress={onVerify}
                                disabled={isLoading || verificationCode.length !== 6}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>{t('auth.verify')}</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                    {step === 'backup' && (
                        <>
                            <Ionicons name="checkmark-circle" size={60} color={theme.primary} />
                            <Text style={[styles.title, { color: theme.text }]}>{t('settings.saveBackupCodes')}</Text>
                            <Text style={[styles.description, { color: theme.gray[600] }]}>
                                {t('settings.saveBackupCodesDescription')}
                            </Text>
                            <View style={styles.backupCodesContainer}>
                                {backupCodes.map((code, index) => (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={[styles.backupCodeItem, { backgroundColor: theme.surface }]}
                                        onPress={() => onCopyCode(code)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.backupCode, { color: theme.text }]}>{code}</Text>
                                        <Ionicons name="copy-outline" size={14} color={theme.gray[400]} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity
                                style={[styles.copyAllButton, { backgroundColor: theme.primary }]}
                                onPress={onCopyAllCodes}
                                activeOpacity={0.8}
                            >
                                <View style={styles.copyAllContent}>
                                    <Ionicons name="documents-outline" size={22} color="#FFFFFF" />
                                    <Text style={styles.copyAllText}>{t('settings.copyAllCodes')}</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                                onPress={onDone}
                            >
                                <Text style={styles.primaryButtonText}>{t('common.done')}</Text>
                            </TouchableOpacity>
                        </>
                    )}
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
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
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
    qrCode: {
        width: 200,
        height: 200,
        marginVertical: 16,
    },
    secretContainer: {
        borderRadius: 12,
        padding: 12,
        width: '100%',
        marginBottom: 20,
    },
    secretLabel: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        marginBottom: 4,
    },
    secretRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    secretText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        letterSpacing: 1,
    },
    codeInput: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
        fontSize: 24,
        fontFamily: Fonts.semiBold,
        letterSpacing: 8,
        marginBottom: 20,
    },
    backupCodesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    backupCodeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
    },
    backupCode: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        letterSpacing: 1,
    },
    copyAllButton: {
        width: '100%',
        borderRadius: 12,
        paddingVertical: 14,
        marginBottom: 8,
    },
    copyAllContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    copyAllText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    primaryButton: {
        width: '100%',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
    },
    disabled: {
        opacity: 0.5,
    },
});
