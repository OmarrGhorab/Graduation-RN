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
import { resendVerificationOTP, verifyEmailOTP } from '@/services/AuthService';
import { useToast } from '@/components/toast';
import { VerificationHeader, OTPInput, OTPActions } from '@/components/auth';

export default function VerificationScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = Colors[colorScheme || 'light'];
    const { email, type, source } = useLocalSearchParams<{ email: string; type?: string; source?: string }>();
    const { success, error } = useToast();

    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(60);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

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

        setLoading(true);
        try {
            const result = await verifyEmailOTP({ email, otp: otpValue });
            success('Account Verified', result.message || 'Verification successful');

            if (source === 'forgot-password') {
                router.replace({
                    pathname: '/reset-password',
                    params: { email, otp: otpValue }
                } as any);
            } else {
                router.replace('/signin' as Href);
            }
        } catch (err: any) {
            console.error('Verification error:', err);
            error('Verification failed', err.message || 'Please check the code and try again');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer === 0 && email) {
            setLoading(true);
            try {
                const result = await resendVerificationOTP(email);
                success('Code Sent', result.message || 'A new code has been sent to your email');
                setTimer(60);
                setOtp(['', '', '', '', '', '']);
            } catch (err: any) {
                console.error('Resend OTP error:', err);
                error('Error', err.message || 'Failed to resend code');
            } finally {
                setLoading(false);
            }
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
                <VerificationHeader theme={theme} isDark={isDark} onBack={handleBack} />
                
                <OTPInput
                    theme={theme}
                    isDark={isDark}
                    otp={otp}
                    onOtpChange={setOtp}
                />

                <OTPActions
                    theme={theme}
                    isDark={isDark}
                    isLoading={loading}
                    timer={timer}
                    buttonText="Continue"
                    onContinue={handleContinue}
                    onResend={handleResend}
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
