import React, { useRef, useEffect } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';

type Theme = typeof Colors.light | typeof Colors.dark;

interface Verify2FAFormProps {
    theme: Theme;
    isDark: boolean;
    isBackupMode: boolean;
    code: string[];
    backupCode: string;
    isVerifying: boolean;
    onCodeChange: (code: string[]) => void;
    onBackupCodeChange: (code: string) => void;
    onVerify: () => void;
    onToggleMode: () => void;
}

export const Verify2FAForm: React.FC<Verify2FAFormProps> = ({
    theme,
    isDark,
    isBackupMode,
    code,
    backupCode,
    isVerifying,
    onCodeChange,
    onBackupCodeChange,
    onVerify,
    onToggleMode,
}) => {
    const { t, textAlign } = useTranslation();
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const styles = createStyles(theme, isDark);

    const fullCode = isBackupMode ? backupCode : code.join('');
    const isDisabled = isVerifying || fullCode.length < (isBackupMode ? 8 : 6);

    // Auto-focus first input on mount
    useEffect(() => {
        if (!isBackupMode) {
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        }
    }, [isBackupMode]);

    const focusInput = (index: number) => {
        if (index >= 0 && index < 6) {
            inputRefs.current[index]?.focus();
        }
    };

    const handleCodeChange = (text: string, index: number) => {
        const digit = text.replace(/[^0-9]/g, '');

        // Handle paste
        if (digit.length > 1) {
            const digits = digit.split('').slice(0, 6);
            const newCode = [...code];
            digits.forEach((d, i) => {
                if (index + i < 6) {
                    newCode[index + i] = d;
                }
            });
            onCodeChange(newCode);
            focusInput(Math.min(index + digits.length, 5));
            return;
        }

        const newCode = [...code];
        newCode[index] = digit;
        onCodeChange(newCode);

        if (digit && index < 5) {
            focusInput(index + 1);
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace') {
            if (code[index]) {
                const newCode = [...code];
                newCode[index] = '';
                onCodeChange(newCode);
            } else if (index > 0) {
                const newCode = [...code];
                newCode[index - 1] = '';
                onCodeChange(newCode);
                focusInput(index - 1);
            }
        }
    };

    const handleFocus = (index: number) => {
        const firstEmptyIndex = code.findIndex((d) => !d);
        if (firstEmptyIndex !== -1 && firstEmptyIndex < index) {
            focusInput(firstEmptyIndex);
        }
    };

    return (
        <View style={styles.container}>
            {/* Code Input */}
            {isBackupMode ? (
                <TextInput
                    style={[styles.backupInput, { textAlign }]}
                    value={backupCode}
                    onChangeText={onBackupCodeChange}
                    placeholder={t('auth.backupCodeTitle')}
                    placeholderTextColor={theme.icon}
                    maxLength={8}
                    autoCapitalize="characters"
                    autoFocus
                />
            ) : (
                <View style={styles.codeContainer}>
                    {code.map((digit, index) => (
                        <Pressable key={index} onPress={() => focusInput(index)}>
                            <TextInput
                                ref={(ref) => {
                                    inputRefs.current[index] = ref;
                                }}
                                style={[
                                    styles.codeInput,
                                    digit ? styles.codeInputFilled : styles.codeInputEmpty,
                                ]}
                                value={digit}
                                onChangeText={(text) => handleCodeChange(text, index)}
                                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                                onFocus={() => handleFocus(index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                                caretHidden
                            />
                        </Pressable>
                    ))}
                </View>
            )}

            {/* Verify Button */}
            <TouchableOpacity
                style={[styles.verifyButton, isDisabled && styles.verifyButtonDisabled]}
                onPress={onVerify}
                disabled={isDisabled}
            >
                {isVerifying ? (
                    <ActivityIndicator color={theme.onPrimary} />
                ) : (
                    <Text style={styles.verifyButtonText}>{t('auth.verify')}</Text>
                )}
            </TouchableOpacity>

            {/* Toggle Backup Mode */}
            <TouchableOpacity onPress={onToggleMode} style={styles.toggleButton}>
                <Text style={styles.toggleText}>
                    {isBackupMode ? t('auth.useAuthenticator') : t('auth.useBackupCode')}
                </Text>
            </TouchableOpacity>

            {/* Help Text */}
            <View style={styles.helpContainer}>
                <Ionicons name="information-circle-outline" size={18} color={theme.icon} />
                <Text style={styles.helpText}>
                    {isBackupMode ? t('auth.backupCodeSubtitle') : t('auth.twoFactorSubtitle')}
                </Text>
            </View>
        </View>
    );
};

const createStyles = (theme: Theme, isDark: boolean) =>
    StyleSheet.create({
        container: {
            paddingHorizontal: 24,
            alignItems: 'center',
        },
        codeContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 32,
        },
        codeInput: {
            width: 48,
            height: 48,
            borderWidth: 1.5,
            borderRadius: 8,
            fontSize: 18,
            fontFamily: Fonts?.semiBold,
            textAlign: 'center',
            backgroundColor: isDark ? theme.surface : '#FFFFFF',
            color: theme.text,
        },
        codeInputEmpty: {
            borderColor: theme.border,
        },
        codeInputFilled: {
            borderColor: theme.primary,
            backgroundColor: isDark ? theme.surfaceVariant : theme.csk[50],
        },
        backupInput: {
            width: '100%',
            borderWidth: 1.5,
            borderColor: theme.border,
            borderRadius: 8,
            paddingVertical: 16,
            paddingHorizontal: 20,
            fontSize: 18,
            fontFamily: Fonts?.semiBold,
            textAlign: 'center',
            letterSpacing: 4,
            marginBottom: 32,
            backgroundColor: isDark ? theme.surface : '#FFFFFF',
            color: theme.text,
        },
        verifyButton: {
            width: '100%',
            paddingVertical: 16,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 16,
            backgroundColor: theme.primary,
        },
        verifyButtonDisabled: {
            opacity: 0.5,
        },
        verifyButtonText: {
            fontSize: 16,
            fontFamily: Fonts?.semiBold,
            color: theme.onPrimary,
        },
        toggleButton: {
            paddingVertical: 12,
        },
        toggleText: {
            fontSize: 14,
            fontFamily: Fonts?.semiBold,
            color: theme.primary,
        },
        helpContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 24,
            paddingHorizontal: 20,
            gap: 8,
        },
        helpText: {
            fontSize: 13,
            fontFamily: Fonts?.regular,
            flex: 1,
            lineHeight: 18,
            color: theme.icon,
        },
    });
