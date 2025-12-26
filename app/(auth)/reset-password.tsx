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

// ============================================================================
// Main Component
// ============================================================================

export default function ResetPasswordScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const isDark = colorScheme === 'dark';
    const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();
    const { success, error } = useToast();

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
            error('Required', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            error('Mismatch', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            error('Invalid', 'Password must be at least 6 characters');
            return;
        }

        if (!email || !otp) {
            error('Error', 'Missing session information. Please try again.');
            router.replace('/forgot-password');
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword({ email, otp, newPassword: password });
            success('Success', 'Your password has been reset successfully');
            router.replace('/signin');
        } catch (err: any) {
            console.error('Reset password error:', err);
            error('Reset Failed', err.message || 'Failed to reset password');
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
