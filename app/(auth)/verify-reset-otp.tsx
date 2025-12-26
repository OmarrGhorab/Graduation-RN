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
import { forgotPassword } from '@/services/AuthService';
import { useToast } from '@/components/toast';
import { VerifyOTPHeader, OTPInput, OTPActions } from '@/components/auth';

// ============================================================================
// Main Component
// ============================================================================

export default function VerifyResetOTPScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const isDark = colorScheme === 'dark';
    const { email } = useLocalSearchParams<{ email: string }>();
    const { success, error } = useToast();

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
            error('Invalid Code', 'Please enter the full 6-digit code');
            return;
        }

        if (!email) {
            error('Error', 'Missing email address');
            return;
        }

        success('Code Verified', 'Please enter your new password');
        router.replace({
            pathname: '/reset-password',
            params: { email, otp: otpValue },
        } as any);
    };

    const handleResend = async () => {
        if (timer > 0 || !email) return;

        setIsLoading(true);
        try {
            const result = await forgotPassword({ email });
            success('Code Sent', result.message || 'A new code has been sent to your email');
            setTimer(60);
            setOtp(['', '', '', '', '', '']);
        } catch (err: any) {
            console.error('Resend OTP error:', err);
            error('Error', err.message || 'Failed to resend code');
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
                <VerifyOTPHeader
                    theme={theme}
                    isDark={isDark}
                    title="Verify OTP Code"
                    subtitle="Please enter the security code sent to your email to reset your password."
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
