import { useRouter, Href } from 'expo-router';
import React, { useState, useEffect, useMemo } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import { googleSignIn, configureGoogleSignIn, isAccountDeactivated } from '@/services/AuthService';
import { useToast } from '@/components/toast';

const { width, height } = Dimensions.get('window');

// ============================================================================
// Types
// ============================================================================

type Theme = typeof Colors.light | typeof Colors.dark;

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
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

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
        showToast('info', 'New Device Detected', 'Please verify this device using the code sent to your email.');
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
            onSuccess: (data) => {
                console.log('Google Sign-In successful:', data);
                const destination = data.user?.onboardingCompleted ? '/home' : '/onboarding/step1';
                router.replace(destination as Href);
            },
            onCancel: () => {
                console.log('Google Sign-In cancelled');
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
        <View style={styles.container}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />

            <View style={styles.content}>
                <HeaderSection theme={theme} />
                <LogoSection isDark={isDark} />
                <ButtonsSection
                    theme={theme}
                    isDark={isDark}
                    styles={styles}
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
// Sub-Components
// ============================================================================

interface HeaderSectionProps {
    theme: Theme;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({ theme }) => (
    <>
        <Text style={[headerStyles.welcomeText, { color: theme.primary }]}>
            WELCOME BACK
        </Text>
        <Text style={[headerStyles.subtitle, { color: theme.primary }]}>
            Sign in to access your account and continue your journey with us.
        </Text>
    </>
);

interface LogoSectionProps {
    isDark: boolean;
}

const LogoSection: React.FC<LogoSectionProps> = ({ isDark }) => (
    <Image
        source={
            isDark
                ? require('@/assets/images/logo-white.png')
                : require('@/assets/images/logo-green.png')
        }
        style={logoStyles.logo}
        resizeMode="contain"
    />
);

interface ButtonsSectionProps {
    theme: Theme;
    isDark: boolean;
    styles: ReturnType<typeof createStyles>;
    isGoogleLoading: boolean;
    onGoogleSignIn: () => void;
    onSignUp: () => void;
    onLogIn: () => void;
}

const ButtonsSection: React.FC<ButtonsSectionProps> = ({
    theme,
    isDark,
    styles,
    isGoogleLoading,
    onGoogleSignIn,
    onSignUp,
    onLogIn,
}) => (
    <>
        {/* Google Sign In Button */}
        <TouchableOpacity
            style={[styles.googleButton, isGoogleLoading && styles.googleButtonDisabled]}
            onPress={onGoogleSignIn}
            activeOpacity={0.8}
            disabled={isGoogleLoading}
        >
            {isGoogleLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
            ) : (
                <>
                    <Image
                        source={require('@/assets/images/google-icon.png')}
                        style={styles.googleIcon}
                        resizeMode="contain"
                    />
                    <Text style={styles.googleButtonText}>Continue With Google</Text>
                </>
            )}
        </TouchableOpacity>

        {/* Sign Up Button */}
        <TouchableOpacity
            style={styles.signUpButton}
            onPress={onSignUp}
            activeOpacity={0.8}
        >
            <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Log In Button */}
        <TouchableOpacity
            style={styles.logInButton}
            onPress={onLogIn}
            activeOpacity={0.8}
        >
            <Text style={styles.logInButtonText}>Log In</Text>
        </TouchableOpacity>
    </>
);

// ============================================================================
// Styles
// ============================================================================

const headerStyles = StyleSheet.create({
    welcomeText: {
        fontSize: 32,
        fontFamily: Fonts?.bold,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: Fonts?.regular,
        textAlign: 'center',
        marginBottom: 60,
    },
});

const logoStyles = StyleSheet.create({
    logo: {
        width: width * 0.4,
        height: height * 0.2,
        maxWidth: 200,
        maxHeight: 200,
        marginBottom: 40,
    },
});

const createStyles = (theme: Theme, isDark: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        content: {
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: height * 0.15,
            alignItems: 'center',
        },
        // Google Button
        googleButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? theme.surface : '#FFFFFF',
            borderWidth: 1,
            borderColor: theme.border,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            width: width * 0.85,
            maxWidth: 350,
            marginBottom: 16,
            minHeight: 56,
            shadowColor: isDark ? '#000' : '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.3 : 0.05,
            shadowRadius: 2,
            elevation: 2,
        },
        googleButtonDisabled: {
            opacity: 0.7,
        },
        googleIcon: {
            width: 24,
            height: 24,
            marginRight: 12,
        },
        googleButtonText: {
            fontSize: 16,
            fontFamily: Fonts?.semiBold,
            color: theme.text,
            flex: 1,
            textAlign: 'center',
        },
        // Sign Up Button
        signUpButton: {
            backgroundColor: theme.primary,
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 12,
            width: width * 0.85,
            maxWidth: 350,
            marginBottom: 16,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        signUpButtonText: {
            fontSize: 16,
            fontFamily: Fonts?.semiBold,
            color: theme.onPrimary,
        },
        // Log In Button
        logInButton: {
            borderWidth: 2,
            borderColor: theme.primary,
            backgroundColor: 'transparent',
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 12,
            width: width * 0.85,
            maxWidth: 350,
            alignItems: 'center',
        },
        logInButtonText: {
            fontSize: 16,
            fontFamily: Fonts?.semiBold,
            color: theme.primary,
        },
    });
