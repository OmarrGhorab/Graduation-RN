import React from 'react';
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
import { useTranslation } from '@/hooks/useTranslation';

type Theme = typeof Colors.light | typeof Colors.dark;

interface ResetPasswordFormProps {
    theme: Theme;
    isDark: boolean;
    password: string;
    confirmPassword: string;
    showPassword: boolean;
    showConfirmPassword: boolean;
    isLoading: boolean;
    onPasswordChange: (text: string) => void;
    onConfirmPasswordChange: (text: string) => void;
    onTogglePassword: () => void;
    onToggleConfirmPassword: () => void;
    onConfirm: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
    theme,
    isDark,
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    isLoading,
    onPasswordChange,
    onConfirmPasswordChange,
    onTogglePassword,
    onToggleConfirmPassword,
    onConfirm,
}) => {
    const { t, textAlign } = useTranslation();
    const styles = createStyles(theme, isDark);

    return (
        <View style={styles.form}>
            {/* Password Input */}
            <View style={styles.inputWrapper}>
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>{t('auth.password')}</Text>
                </View>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[styles.passwordInput, { textAlign }]}
                        placeholder={t('auth.passwordPlaceholder')}
                        placeholderTextColor={theme.icon}
                        value={password}
                        onChangeText={onPasswordChange}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={onTogglePassword} style={styles.eyeIcon}>
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={theme.icon}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
                </View>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[styles.passwordInput, { textAlign }]}
                        placeholder={t('auth.passwordPlaceholder')}
                        placeholderTextColor={theme.icon}
                        value={confirmPassword}
                        onChangeText={onConfirmPasswordChange}
                        secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity onPress={onToggleConfirmPassword} style={styles.eyeIcon}>
                        <Ionicons
                            name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={theme.icon}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.spacer} />

            {/* Confirm Button */}
            <TouchableOpacity
                style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
                onPress={onConfirm}
                activeOpacity={0.8}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color={theme.onPrimary} />
                ) : (
                    <Text style={styles.confirmButtonText}>{t('auth.confirm')}</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const createStyles = (theme: Theme, isDark: boolean) =>
    StyleSheet.create({
        form: {
            width: '100%',
        },
        inputWrapper: {
            marginBottom: 24,
            position: 'relative',
            paddingTop: 8,
        },
        labelContainer: {
            position: 'absolute',
            top: 0,
            left: 12,
            zIndex: 1,
            paddingHorizontal: 4,
            backgroundColor: theme.background,
        },
        label: {
            fontSize: 12,
            fontFamily: Fonts?.medium,
            textTransform: 'uppercase',
            color: theme.icon,
        },
        passwordContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            height: 50,
            paddingHorizontal: 16,
            backgroundColor: theme.background,
        },
        passwordInput: {
            flex: 1,
            fontSize: 16,
            fontFamily: Fonts?.regular,
            height: '100%',
            color: theme.text,
        },
        eyeIcon: {
            padding: 4,
        },
        spacer: {
            height: 20,
        },
        confirmButton: {
            backgroundColor: theme.primary,
            borderRadius: 8,
            paddingVertical: 16,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: 3,
            marginBottom: 24,
        },
        confirmButtonText: {
            color: theme.onPrimary,
            fontSize: 16,
            fontFamily: Fonts?.bold,
        },
        confirmButtonDisabled: {
            opacity: 0.7,
        },
    });
