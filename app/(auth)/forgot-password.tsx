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

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = Colors[colorScheme || 'light'];
    const { success, error } = useToast();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = async () => {
        if (!email) {
            error('Required', 'Please enter your email address');
            return;
        }

        setIsLoading(true);
        try {
            await forgotPassword({ email });
            success('OTP Sent', 'An OTP has been sent to your email');
            router.push({
                pathname: '/verify-reset-otp',
                params: { email }
            } as any);
        } catch (err: any) {
            console.error('Forgot password error:', err);
            error('Error', err.message || 'Failed to send reset code');
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
                    email={email}
                    isLoading={isLoading}
                    onEmailChange={setEmail}
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
