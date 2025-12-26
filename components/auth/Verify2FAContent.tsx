import React, { useRef } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';

type Theme = typeof Colors.light | typeof Colors.dark;

interface Verify2FAContentProps {
    theme: Theme;
    isDark: boolean;
    code: string[];
    backupCode: string;
    isBackupMode: boolean;
    isVerifying: boolean;
    onCodeChange: (text: string, index: number) => void;
    onKeyPress: (e: any, index: number) => void;
    onBackupCodeChange: (text: string) => void;
    onVerify: () => void;
    onToggleBackupMode: () => void;
    inputRefs: React.MutableRefObject<(TextInput | null)[]>;
}

export const Verify2FAContent: React.FC<Verify2FAContentProps> = ({
    theme,
    isDark,
    code,
    backupCode,
    isBackupMode,
    isVerifying,
    onCodeChange,
    onKeyPress,
    onBackupCodeChange,
    onVerify,
    onToggleBackupMode,
    inputRefs,
}) => {
    const styles = createStyles(theme, isDark);
    const codeLength = isBackupMode ? backupCode.length : code.join('').length;
    const requiredLength = isBackupMode ? 8 : 6;
    const isDisabled = isVerifying || codeLength < requiredLength;

    return (
        <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark" size={48} color={theme.primary} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Two-Factor Authentication</Text>
            <Text style={styles.subtitle}>
                {isBackupMode
                    ? 'Enter one of your backup codes to verify your identity'
                    : 'Enter the 6-digit code from your authenticator app'}
            </Text>

            {/* Code Input */}
            {isBackupMode ? (
                <TextInput
                    style={styles.backupInput}
                    value={backupCode}
                    onChangeText={onBackupCodeChange}
                    placeholder="Enter backup code"
                    placeholderTextColor={theme.icon}
                    maxLength={8}
                    autoCapitalize="characters"
                    autoFocus
                />
            ) : (
                <View style={styles.codeContainer}>
                    {code.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => {
                                inputRefs.current[index] = ref;
                            }}
                            style={[
                                styles.codeInput,
                                digit && styles.codeInputFilled,
                            ]}
                            value={digit}
                            onChangeText={(text) => onCodeChange(text, index)}
                            onKeyPress={(e) => onKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={6}
                            selectTextOnFocus
                            autoFocus={index === 0}
                        />
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
                    <Text style={styles.verifyButtonText}>Verify</Text>
                )}
            </TouchableOpacity>

            {/* Toggle Backup Mode */}
            <TouchableOpacity onPress={onToggleBackupMode} style={styles.toggleButton}>
                <Text style={styles.toggleText}>
                    {isBackupMode ? 'Use authenticator code instead' : 'Use a backup code instead'}
                </Text>
            </TouchableOpacity>

            {/* Help Text */}
            <View style={styles.helpContainer}>
                <Ionicons name="information-circle-outline" size={18} color={theme.icon} />
                <Text style={styles.helpText}>
                    {isBackupMode
                        ? 'Backup codes are 8 characters long and can only be used once'
                        : 'Open your authenticator app to view your verification code'}
                </Text>
            </View>
        </View>
    );
};

const createStyles = (theme: Theme, isDark: boolean) =>
    StyleSheet.create({
        content: {
            flex: 1,
            paddingHorizontal: 24,
            alignItems: 'center',
            paddingTop: 40,
        },
        iconContainer: {
            width: 100,
            height: 100,
            borderRadius: 50,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
            backgroundColor: theme.primaryContainer,
        },
        title: {
            fontSize: 24,
            fontFamily: Fonts?.bold,
            color: theme.text,
            marginBottom: 8,
            textAlign: 'center',
        },
        subtitle: {
            fontSize: 15,
            fontFamily: Fonts?.regular,
            color: theme.icon,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 32,
            paddingHorizontal: 20,
        },
        codeContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 32,
        },
        codeInput: {
            width: 48,
            height: 56,
            borderWidth: 2,
            borderRadius: 12,
            fontSize: 24,
            fontFamily: Fonts?.semiBold,
            textAlign: 'center',
            color: theme.text,
            borderColor: theme.border,
            backgroundColor: theme.background,
        },
        codeInputFilled: {
            borderColor: theme.primary,
            backgroundColor: theme.primaryContainer,
        },
        backupInput: {
            width: '100%',
            borderWidth: 2,
            borderRadius: 12,
            paddingVertical: 16,
            paddingHorizontal: 20,
            fontSize: 20,
            fontFamily: Fonts?.semiBold,
            textAlign: 'center',
            letterSpacing: 4,
            marginBottom: 32,
            color: theme.text,
            borderColor: theme.border,
            backgroundColor: theme.background,
        },
        verifyButton: {
            width: '100%',
            paddingVertical: 16,
            borderRadius: 12,
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
            color: theme.icon,
            flex: 1,
            lineHeight: 18,
        },
    });
