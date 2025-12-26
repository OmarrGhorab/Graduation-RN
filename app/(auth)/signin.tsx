import { useRouter, Href } from 'expo-router';
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
import {
    googleSignIn,
    configureGoogleSignIn,
    login,
    requiresDeviceVerification,
    isAccountDeactivated,
} from '@/services/AuthService';
import { useToast } from '@/components/toast';
import { LoginSuccessResponse } from '@/types/auth';
import { SignInHeader, SignInForm, SignInFooter } from '@/components/auth';

// ============================================================================
// Types
// ============================================================================

interface AuthData {
    accessToken?: string;
    refreshToken?: string;
    user?: any;
    message?: string;
    tempToken?: string;
    deviceFingerprint?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function SignInScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const isDark = colorScheme === 'dark';
    const { showToast, error } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        configureGoogleSignIn();
    }, []);

    // ========================================================================
    // Navigation Handlers
    // ========================================================================

    const navigateTo2FA = (authData: AuthData) => {
        router.push({
            pathname: '/verify-2fa',
            params: {
                accessToken: authData.accessToken,
                refreshToken: authData.refreshToken,
                user: JSON.stringify(authData.user),
            },
        } as any);
    };

    const navigateToReactivation = (data: AuthData) => {
        showToast('info', 'Account Deactivated', data.message || 'Your account is deactivated');
        router.push({
            pathname: '/reactivate-account',
            params: {
                tempToken: data.tempToken,
                message: data.message || '',
            },
        } as any);
    };

    const navigateToDeviceVerification = (emailOrUsername: string, deviceFingerprint: string) => {
        showToast('info', 'New Device Detected', 'Please verify this device using the code sent to your email.');
        router.push({
            pathname: '/device-verification',
            params: { emailOrUsername, deviceFingerprint },
        } as any);
    };

    // ========================================================================
    // Auth Handlers
    // ========================================================================

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);

        const result = await googleSignIn({
            showAlerts: true,
            onSuccess: (data) => {
                console.log('Backend auth successful:', data);
                const destination = data.user?.onboardingCompleted ? '/home' : '/onboarding/step1';
                router.replace(destination as Href);
            },
            onCancel: () => console.log('Google Sign-In cancelled'),
        });

        if (result.requires2FA && result.data) {
            navigateTo2FA(result.data);
            setIsGoogleLoading(false);
            return;
        }

        if (!result.success && result.data && isAccountDeactivated(result.data)) {
            navigateToReactivation(result.data);
            setIsGoogleLoading(false);
            return;
        }

        if (result.requiresDeviceVerification && result.deviceFingerprint) {
            navigateToDeviceVerification(result.emailOrUsername || '', result.deviceFingerprint);
        }

        setIsGoogleLoading(false);
    };

    const handleLogin = async () => {
        if (!email || !password) {
            error('Missing fields', 'Email and password are required');
            return;
        }

        setIsLoading(true);
        try {
            const result = await login({ emailOrUsername: email, password });

            if ('requiresVerification' in result && result.requiresVerification) {
                router.push({ pathname: '/verification', params: { email } } as any);
                return;
            }

            if ('user' in result && (result.user as any)?.twoFactorEnabled) {
                navigateTo2FA(result as AuthData);
                return;
            }

            const successData = result as LoginSuccessResponse;
            const destination = successData.user.onboardingCompleted ? '/home' : '/onboarding/step1';
            router.replace(destination as Href);
        } catch (err: any) {
            console.error('Login error:', err);
            const responseData = err.responseData;

            if (responseData && isAccountDeactivated(responseData)) {
                navigateToReactivation(responseData);
                return;
            }

            if (responseData?.user?.twoFactorEnabled) {
                navigateTo2FA(responseData);
                return;
            }

            if (responseData && requiresDeviceVerification(responseData)) {
                navigateToDeviceVerification(email, responseData.deviceFingerprint);
                return;
            }

            error('Login failed', err.message || 'Check your credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = () => router.push('/signup');
    const handleForgotPassword = () => router.push('/forgot-password');

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
                <SignInHeader theme={theme} isDark={isDark} />

                <SignInForm
                    theme={theme}
                    isDark={isDark}
                    email={email}
                    password={password}
                    showPassword={showPassword}
                    isLoading={isLoading}
                    onEmailChange={setEmail}
                    onPasswordChange={setPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    onForgotPassword={handleForgotPassword}
                    onLogin={handleLogin}
                />

                <SignInFooter
                    theme={theme}
                    isDark={isDark}
                    isGoogleLoading={isGoogleLoading}
                    onGoogleSignIn={handleGoogleSignIn}
                    onSignUp={handleSignUp}
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
