import { Fonts, primaryGradient, primaryGradientDark } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/libs/auth';
import { t } from '@/libs/i18n';
import { logger } from '@/libs/logger';
import { syncUserPreferences } from '@/libs/preferences-sync';
import { getUserProfile } from '@/services/AuthService';
import { getCurrentOnboardingStep, isOnboardingCompleted } from '@/services/OnboardingService';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const gradient = isDark ? primaryGradientDark : primaryGradient;

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Spinning animation for loader
        const spinAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(spinValue, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                })
            ])
        );
        spinAnimation.start();

        // Main navigation logic
        const handleNavigation = async () => {
            try {
                // Step 0: Ensure auth store is hydrated
                const { hasHydrated } = useAuthStore.getState();
                if (!hasHydrated) {
                    logger.log('[Splash] Auth store not hydrated yet, waiting...');
                    // Check again in 500ms
                    setTimeout(handleNavigation, 500);
                    return;
                }

                // Step 1: Check if this is first time opening the app (intro onboarding)
                const introCompleted = await isOnboardingCompleted();
                logger.log('[Splash] Intro Onboarding Completed:', introCompleted);

                if (!introCompleted) {
                    // First time user - show intro onboarding screens
                    logger.log('[Splash] First time user - Starting Intro Onboarding');
                    const currentStep = await getCurrentOnboardingStep();
                    if (currentStep === 2) {
                        router.replace('/onboarding2');
                    } else if (currentStep === 3) {
                        router.replace('/onboarding3');
                    } else {
                        router.replace('/onboarding');
                    }
                    return;
                }

                // Step 2: Check if user is authenticated
                const { isAuthenticated } = useAuthStore.getState();
                logger.log('[Splash] User Authenticated:', isAuthenticated);

                if (!isAuthenticated) {
                    // Not authenticated - go to login
                    logger.log('[Splash] Not authenticated - Navigating to Login');
                    router.replace('/login');
                    return;
                }

                // Step 3: User is authenticated - refresh profile and check onboarding status
                logger.log('[Splash] Authenticated user - Refreshing profile...');
                try {
                    const profileResponse = await getUserProfile();
                    const user = profileResponse.user;

                    logger.log('[Splash] Profile refreshed:', {
                        username: user.username,
                        onboardingCompleted: user.onboardingCompleted
                    });

                    // Check if user completed profile onboarding
                    if (user.onboardingCompleted) {
                        // Fetch and apply preferences BEFORE navigating to home
                        // This prevents the flash from system defaults to user preferences
                        await syncUserPreferences();

                        logger.log('[Splash] Profile onboarding completed - Navigating to Home');
                        router.replace('/home' as Href);
                    } else {
                        logger.log('[Splash] Profile onboarding not completed - Navigating to Profile Onboarding');
                        router.replace('/onboarding/step1' as Href);
                    }
                } catch (error) {
                    logger.error('[Splash] Failed to refresh profile:', error);
                    // If profile refresh fails, logout and go to login
                    logger.log('[Splash] Profile refresh failed - Logging out');
                    useAuthStore.getState().logout();
                    router.replace('/login');
                }
            } catch (error) {
                logger.error('[Splash] Navigation error:', error);
                // Fallback to login on any error
                router.replace('/login');
            }
        };

        // Wait for splash screen duration (3 seconds) then navigate
        const timer = setTimeout(() => {
            handleNavigation();
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.primary }]}>
            <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

            {/* Gradient Background */}
            <LinearGradient
                colors={gradient.colors as any}
                locations={gradient.locations as any}
                style={styles.gradient}
                start={gradient.start}
                end={gradient.end}
            />

            {/* Content */}
            <View style={styles.content}>
                {/* Header Text */}
                <Animated.View
                    style={[
                        styles.headerContainer,
                        { opacity: fadeAnim }
                    ]}
                >
                    <Text style={styles.pathifyText}>
                        {t('splash.appName')}<Text style={[styles.pathifyDot, { color: theme.warning[500] }]}>.</Text>
                    </Text>
                </Animated.View>

                {/* Logo */}
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    <Image
                        source={require('@/assets/images/logo-white.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* Loading Spinner */}
                <Animated.View
                    style={[
                        styles.loaderContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ rotate: spin }]
                        }
                    ]}
                >
                    <View style={[styles.spinner, { borderTopColor: '#FFFFFF', borderRightColor: '#FFFFFF' }]} />
                </Animated.View>

                {/* Tagline */}
                <Animated.View style={[styles.taglineContainer, { opacity: fadeAnim }]}>
                    <Text style={styles.taglineText}>{t('splash.tagline')}</Text>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: height * 0.12,
        paddingHorizontal: 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    pathifyText: {
        fontSize: 42,
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
        textAlign: 'center',
    },
    pathifyDot: {
        fontSize: 42,
        fontFamily: Fonts.bold,
    },
    logoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: width * 0.5,
        height: width * 0.5,
        maxWidth: 280,
        maxHeight: 280,
    },
    loaderContainer: {
        marginBottom: 40,
    },
    spinner: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    taglineContainer: {
        marginBottom: 40,
    },
    taglineText: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: '#FFFFFF',
        textAlign: 'center',
        opacity: 0.9,
    },
});
