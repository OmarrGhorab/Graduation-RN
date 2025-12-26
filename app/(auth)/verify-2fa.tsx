import { useRouter, useLocalSearchParams, Href } from 'expo-router';
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
import { verify2FALogin } from '@/services/SecurityService';
import { useToast } from '@/components/toast';
import { useAuthStore } from '@/libs/auth';
import { Verify2FAHeader, Verify2FAForm } from '@/components/auth';

// ============================================================================
// Main Component
// ============================================================================

export default function Verify2FAScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const isDark = colorScheme === 'dark';
    const { setAuth } = useAuthStore();
    const toast = useToast();

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [backupCode, setBackupCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isBackupMode, setIsBackupMode] = useState(false);

    // Get auth data from params
    const accessToken = params.accessToken as string;
    const refreshToken = params.refreshToken as string;
    const userData = params.user ? JSON.parse(params.user as string) : null;

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleVerify = async () => {
        const token = isBackupMode ? backupCode : code.join('');

        if (!isBackupMode && token.length !== 6) {
            toast.error('Invalid Code', 'Please enter a 6-digit code');
            return;
        }

        if (isBackupMode && token.length !== 8) {
            toast.error('Invalid Code', 'Please enter an 8-character backup code');
            return;
        }

        if (!accessToken) {
            toast.error('Error', 'Authentication data missing. Please try logging in again.');
            router.replace('/login' as Href);
            return;
        }

        setIsVerifying(true);
        try {
            const response = await verify2FALogin(token, accessToken);

            const finalAccessToken = response.accessToken || accessToken;
            const finalRefreshToken = response.refreshToken || refreshToken;
            const user = response.user || userData;

            if (user && finalAccessToken) {
                setAuth(user, finalAccessToken, finalRefreshToken);
            }

            toast.success('Success', 'Login successful');

            const destination = user?.onboardingCompleted ? '/home' : '/onboarding/step1';
            router.replace(destination as Href);
        } catch (err: any) {
            console.error('2FA verification error:', err);
            toast.error('Verification Failed', err.message || 'Invalid code. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleToggleMode = () => {
        setIsBackupMode(!isBackupMode);
        setCode(['', '', '', '', '', '']);
        setBackupCode('');
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
                <Verify2FAHeader
                    theme={theme}
                    isDark={isDark}
                    isBackupMode={isBackupMode}
                    onBack={handleBack}
                />

                <Verify2FAForm
                    theme={theme}
                    isDark={isDark}
                    isBackupMode={isBackupMode}
                    code={code}
                    backupCode={backupCode}
                    isVerifying={isVerifying}
                    onCodeChange={setCode}
                    onBackupCodeChange={setBackupCode}
                    onVerify={handleVerify}
                    onToggleMode={handleToggleMode}
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
    },
});
