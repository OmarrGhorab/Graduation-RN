import { useRouter, useLocalSearchParams, Href } from 'expo-router';
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
import { verifyDevice, resendDeviceVerificationOTP } from '@/services/AuthService';
import { useToast } from '@/components/toast';
import { DeviceVerificationHeader, OTPInput, OTPActions } from '@/components/auth';
import { syncUserPreferences } from '@/libs/preferences-sync';
import { useTranslation } from '@/hooks/useTranslation';

// ============================================================================
// Main Component
// ============================================================================

export default function DeviceVerificationScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const isDark = colorScheme === 'dark';
    const { emailOrUsername, deviceFingerprint } = useLocalSearchParams<{
        emailOrUsername: string;
        deviceFingerprint: string;
    }>();
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

    const navigateTo2FA = (authData: any) => {
        router.push({
            pathname: '/verify-2fa',
            params: {
                accessToken: authData.accessToken || '',
                refreshToken: authData.refreshToken || '',
                user: authData.user ? JSON.stringify(authData.user) : '',
                emailOrUsername: authData.emailOrUsername || emailOrUsername,
            },
        } as any);
    };

    const handleVerify = async () => {
        const otpValue = otp.join('');
        if (otpValue.length < 6) {
            error(t('auth.invalidCode'), t('auth.invalidCodeMessage'));
            return;
        }

        if (!emailOrUsername || !deviceFingerprint) {
            error(t('common.error'), t('auth.missingVerificationData'));
            return;
        }

        setIsLoading(true);
        try {
            const result = await verifyDevice({
                emailOrUsername,
                deviceFingerprint,
                otp: otpValue,
            });

            if (result.requires2FA) {
                navigateTo2FA(result);
                return;
            }

            await new Promise((resolve) => setTimeout(resolve, 200));
            success(t('auth.deviceVerified'), t('auth.deviceVerifiedMessage'));

            if (result.user?.onboardingCompleted) {
                // Sync preferences before navigating to home
                await syncUserPreferences();
                router.replace('/home' as Href);
            } else {
                router.replace('/onboarding/step1' as Href);
            }
        } catch (err: any) {
            console.error('Device verification error:', err);
            // Map API error messages to translations
            let errorMessage = t('auth.checkCodeAndTryAgain');
            if (err.message?.toLowerCase().includes('invalid') || err.message?.toLowerCase().includes('expired')) {
                errorMessage = t('auth.invalidOrExpiredOTP');
            }
            error(t('auth.verificationFailed'), errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0 || !emailOrUsername || !deviceFingerprint) return;

        setIsLoading(true);
        try {
            await resendDeviceVerificationOTP({
                emailOrUsername,
                deviceFingerprint,
            });
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
                <DeviceVerificationHeader
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
                    buttonText={t('auth.verifyDevice')}
                    onContinue={handleVerify}
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
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40,
    },
});
