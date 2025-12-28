import { useRouter } from 'expo-router';
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
import { forgotPassword } from '@/services/AuthService';
import { useToast } from '@/components/toast';
import { ForgotPasswordHeader } from '@/components/auth/ForgotPasswordHeader';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { useTranslation } from '@/hooks/useTranslation';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = Colors[colorScheme || 'light'];
    const { success, error } = useToast();
    const { t } = useTranslation();

    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = async () => {
        if (!emailOrUsername.trim()) {
            error(t('common.required'), t('auth.emailOrUsernameRequired'));
            return;
        }

        setIsLoading(true);
        try {
            await forgotPassword({ emailOrUsername: emailOrUsername.trim() });
            success(t('auth.otpSent'), t('auth.otpSentMessage'));
            router.push({
                pathname: '/verify-reset-otp',
                params: { emailOrUsername: emailOrUsername.trim() }
            } as any);
        } catch (err: any) {
            console.error('Forgot password error:', err);
            error(t('common.error'), err.message || t('auth.failedToSendCode'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

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
                <ForgotPasswordHeader theme={theme} onBack={handleBack} />
                <ForgotPasswordForm
                    theme={theme}
                    isDark={isDark}
                    email={emailOrUsername}
                    isLoading={isLoading}
                    onEmailChange={setEmailOrUsername}
                    onContinue={handleContinue}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
});
