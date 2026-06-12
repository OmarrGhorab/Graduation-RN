import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { forgotPassword, verifyResetOTP } from '@/services/AuthService';
import { useToast } from '@/components/toast';
import { VerifyOTPHeader, OTPInput, OTPActions } from '@/components/auth';
import { useTranslation } from '@/hooks/useTranslation';

// ============================================================================
// Main Component
// ============================================================================

export default function VerifyResetOTPScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const isDark = colorScheme === 'dark';
    const { emailOrUsername } = useLocalSearchParams<{ emailOrUsername: string }>();
    const { success, error } = useToast();
    const { t } = useTranslation();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (timer <= 0) return;
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [timer]);

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleContinue = async () => {
        const otpValue = otp.join('');
        if (otpValue.length < 6) {
            error(t('auth.invalidCode'), t('auth.invalidCodeMessage'));
            return;
        }

        if (!emailOrUsername) {
            error(t('common.error'), t('auth.missingEmail'));
            return;
        }

        setIsLoading(true);
        try {
            // Verify OTP with backend before proceeding
            await verifyResetOTP({
                emailOrUsername,
                otp: otpValue,
            });

            success(t('auth.codeVerified'), t('auth.enterNewPassword'));
            router.replace({
                pathname: '/reset-password',
                params: { emailOrUsername, otp: otpValue },
            } as any);
        } catch (err: any) {
            console.error('Verify OTP error:', err);
            // Map API error messages to translations
            let errorMessage = t('auth.checkCodeAndTryAgain');
            
            const errMsg = err.message?.toLowerCase() || '';
            if (errMsg.includes('invalid') || errMsg.includes('expired')) {
                errorMessage = t('auth.invalidOrExpiredOTP');
            } else if (errMsg.includes('too many') || errMsg.includes('wait')) {
                errorMessage = t('auth.tooManyRequests');
            } else if (errMsg.includes('not found')) {
                errorMessage = t('auth.userNotFound');
            }
            
            error(t('auth.verificationFailed'), errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0 || !emailOrUsername) return;

        setIsLoading(true);
        try {
            await forgotPassword({ emailOrUsername });
            success(t('auth.codeSent'), t('auth.codeSentMessage'));
            setTimer(60);
            setOtp(['', '', '', '', '', '']);
        } catch (err: any) {
            console.error('Resend OTP error:', err);
            error(t('common.error'), t('auth.failedToSendCode'));
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
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
            >
                <VerifyOTPHeader
                    theme={theme}
                    isDark={isDark}
                    onBack={handleBack}
                />

                <OTPInput
                    theme={theme}
                    isDark={isDark}
                    otp={otp}
                    onOtpChange={setOtp}
                />

                <OTPActions
                    theme={theme}
                    isDark={isDark}
                    isLoading={isLoading}
                    timer={timer}
                    onContinue={handleContinue}
                    onResend={handleResend}
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
        paddingBottom: 40,
    },
});
