import { useRouter, Href } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    Dimensions,
    StatusBar,
    StyleSheet,
    View,
    useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { googleSignIn, configureGoogleSignIn, isAccountDeactivated } from '@/services/AuthService';
import { useToast } from '@/components/toast';
import { LoginHeader, LoginLogo, LoginButtons } from '@/components/auth';
import { syncUserPreferences } from '@/libs/preferences-sync';
import { logger } from '@/libs/logger';
import { useTranslation } from '@/hooks/useTranslation';

const { height } = Dimensions.get('window');

// ============================================================================
// Types
// ============================================================================

interface AuthResult {
    success: boolean;
    requires2FA?: boolean;
    requiresDeviceVerification?: boolean;
    deviceFingerprint?: string;
    emailOrUsername?: string;
    data?: {
        accessToken?: string;
        refreshToken?: string;
        user?: any;
        message?: string;
        tempToken?: string;
    };
}

// ============================================================================
// Main Component
// ============================================================================

export default function LoginScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const isDark = colorScheme === 'dark';
    const { showToast } = useToast();
    const { t } = useTranslation();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    useEffect(() => {
        configureGoogleSignIn();
    }, []);

    // ========================================================================
    // Navigation Handlers
    // ========================================================================

    const navigateTo2FA = (authData: AuthResult['data']) => {
        router.push({
            pathname: '/verify-2fa',
            params: {
                accessToken: authData?.accessToken,
                refreshToken: authData?.refreshToken,
                user: JSON.stringify(authData?.user),
            }
        } as any);
    };

    const navigateToReactivation = (data: AuthResult['data']) => {
        showToast('info', 'Account Deactivated', data?.message || 'Your account is deactivated');
        router.push({
            pathname: '/reactivate-account',
            params: {
                tempToken: data?.tempToken,
                message: data?.message || '',
            }
        } as any);
    };

    const navigateToDeviceVerification = (result: AuthResult) => {
        showToast('info', t('auth.newDeviceDetected'), t('auth.newDeviceDetectedMessage'));
        router.push({
            pathname: '/device-verification',
            params: {
                emailOrUsername: result.emailOrUsername || '',
                deviceFingerprint: result.deviceFingerprint,
            }
        } as any);
    };

    // ========================================================================
    // Auth Handlers
    // ========================================================================

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);

        const result = await googleSignIn({
            showAlerts: true,
            onSuccess: async (data) => {
                logger.log('Google Sign-In successful:', data);
                if (data.user?.onboardingCompleted) {
                    // Sync preferences before navigating to home
                    await syncUserPreferences();
                    router.replace('/home' as Href);
                } else {
                    router.replace('/onboarding/step1' as Href);
                }
            },
            onCancel: () => {
                logger.log('Google Sign-In cancelled');
            },
        });

        // Handle 2FA requirement
        if (result.requires2FA && result.data) {
            navigateTo2FA(result.data);
            setIsGoogleLoading(false);
            return;
        }

        // Handle deactivated account
        if (!result.success && result.data && isAccountDeactivated(result.data)) {
            navigateToReactivation(result.data);
            setIsGoogleLoading(false);
            return;
        }

        // Handle device verification requirement
        if (result.requiresDeviceVerification && result.deviceFingerprint) {
            navigateToDeviceVerification(result);
        }

        setIsGoogleLoading(false);
    };

    const handleSignUp = () => router.push('/signup');
    const handleLogIn = () => router.push('/signin');

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />

            <View style={styles.content}>
                <LoginHeader theme={theme} />
                <LoginLogo isDark={isDark} />
                <LoginButtons
                    theme={theme}
                    isDark={isDark}
                    isGoogleLoading={isGoogleLoading}
                    onGoogleSignIn={handleGoogleSignIn}
                    onSignUp={handleSignUp}
                    onLogIn={handleLogIn}
                />
            </View>
        </View>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: height * 0.15,
        alignItems: 'center',
    },
});
