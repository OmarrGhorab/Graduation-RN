import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    useColorScheme,
    Modal,
    View,
    Text,
    TouchableOpacity,
    Image,
} from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
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
    const { error } = useToast();
    const { t } = useTranslation();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

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
            setShowSuccessModal(true);
        } catch (err: any) {
            console.error('Reset password error:', err);
            error(t('auth.resetFailed'), err.message || t('auth.failedToResetPassword'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoToLogin = () => {
        setShowSuccessModal(false);
        router.replace('/signin');
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

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
                onRequestClose={handleGoToLogin}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
                        {/* Success Icon */}
                        <View style={styles.iconContainer}>
                            <Image
                                source={require('@/assets/images/reset-successful.png')}
                                style={styles.successIcon}
                                resizeMode="contain"
                            />
                        </View>

                        {/* Title */}
                        <Text style={[styles.modalTitle, { color: theme.primary }]}>
                            {t('auth.resetSuccessTitle')}
                        </Text>

                        {/* Subtitle */}
                        <Text style={[styles.modalSubtitle, { color: theme.icon }]}>
                            {t('auth.resetSuccessSubtitle')}
                        </Text>

                        {/* Go To Login Button */}
                        <TouchableOpacity
                            style={[styles.loginButton, { backgroundColor: theme.primary }]}
                            onPress={handleGoToLogin}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.loginButtonText, { color: theme.onPrimary }]}>
                                {t('auth.goToLogin')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        width: '100%',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    iconContainer: {
        marginBottom: 24,
    },
    successIcon: {
        width: 80,
        height: 80,
    },
    modalTitle: {
        fontSize: 24,
        fontFamily: Fonts?.bold,
        marginBottom: 12,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        fontFamily: Fonts?.regular,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    loginButton: {
        width: '100%',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    loginButtonText: {
        fontSize: 16,
        fontFamily: Fonts?.bold,
    },
});
