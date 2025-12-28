import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { resetPassword } from '@/services/AuthService';
import { useToast } from '@/components/toast';
import { ResetPasswordHeader, ResetPasswordForm } from '@/components/auth';
import { useTranslation } from '@/hooks/useTranslation';

// ============================================================================
// Main Component
// ============================================================================

export default function ResetPasswordScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const isDark = colorScheme === 'dark';
    const { emailOrUsername, otp } = useLocalSearchParams<{ emailOrUsername: string; otp: string }>();
    const { success, error } = useToast();
    const { t } = useTranslation();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleConfirm = async () => {
        if (!password || !confirmPassword) {
            error(t('common.required'), t('auth.fillAllFields'));
            return;
        }

        if (password !== confirmPassword) {
            error(t('auth.passwordMismatch'), t('auth.passwordsDoNotMatch'));
            return;
        }

        if (password.length < 6) {
            error(t('auth.invalidPassword'), t('auth.passwordTooShort'));
            return;
        }

        if (!emailOrUsername || !otp) {
            error(t('common.error'), t('auth.missingSessionInfo'));
            router.replace('/forgot-password');
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword({ emailOrUsername, otp, newPassword: password });
            router.replace('/reset-success');
        } catch (err: any) {
            console.error('Reset password error:', err);
            error(t('auth.resetFailed'), err.message || t('auth.failedToResetPassword'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => router.back();

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <ResetPasswordHeader theme={theme} isDark={isDark} onBack={handleBack} />

                <ResetPasswordForm
                    theme={theme}
                    isDark={isDark}
                    password={password}
                    confirmPassword={confirmPassword}
                    showPassword={showPassword}
                    showConfirmPassword={showConfirmPassword}
                    isLoading={isLoading}
                    onPasswordChange={setPassword}
                    onConfirmPasswordChange={setConfirmPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                    onConfirm={handleConfirm}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40,
    },
});
