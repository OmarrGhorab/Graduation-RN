import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Href } from 'expo-router';
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
import { Colors, Fonts, primaryGradient } from '@/constants/theme';
import { isOnboardingCompleted, getCurrentOnboardingStep } from '@/services/OnboardingService';
import { useAuthStore } from '@/libs/auth';
import { getUserProfile } from '@/services/AuthService';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
    const router = useRouter();

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
                // Step 1: Check if this is first time opening the app (intro onboarding)
                const introCompleted = await isOnboardingCompleted();
                console.log('[Splash] Intro Onboarding Completed:', introCompleted);

                if (!introCompleted) {
                    // First time user - show intro onboarding screens
                    console.log('[Splash] First time user - Starting Intro Onboarding');
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
                console.log('[Splash] User Authenticated:', isAuthenticated);

                if (!isAuthenticated) {
                    // Not authenticated - go to login
                    console.log('[Splash] Not authenticated - Navigating to Login');
                    router.replace('/login');
                    return;
                }

                // Step 3: User is authenticated - refresh profile and check onboarding status
                console.log('[Splash] Authenticated user - Refreshing profile...');
                try {
                    const profileResponse = await getUserProfile();
                    const user = profileResponse.user;
                    
                    console.log('[Splash] Profile refreshed:', {
                        username: user.username,
                        onboardingCompleted: user.onboardingCompleted
                    });

                    // Check if user completed profile onboarding
                    if (user.onboardingCompleted) {
                        console.log('[Splash] Profile onboarding completed - Navigating to Home');
                        router.replace('/home' as Href);
                    } else {
                        console.log('[Splash] Profile onboarding not completed - Navigating to Profile Onboarding');
                        router.replace('/onboarding/step1' as Href);
                    }
                } catch (error) {
                    console.error('[Splash] Failed to refresh profile:', error);
                    // If profile refresh fails, logout and go to login
                    console.log('[Splash] Profile refresh failed - Logging out');
                    useAuthStore.getState().logout();
                    router.replace('/login');
                }
            } catch (error) {
                console.error('[Splash] Navigation error:', error);
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
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.dark.primary} />

            {/* Gradient Background */}
            <LinearGradient
                colors={['#0A8F51', '#097D46', '#075F36']}
                locations={[0.39, 0.67, 0.91]}
                style={styles.gradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
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
                        Pathify<Text style={styles.pathifyDot}>.</Text>
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
                    <View style={styles.spinner} />
                </Animated.View>

                {/* Tagline */}
                <Animated.View style={[styles.taglineContainer, { opacity: fadeAnim }]}>
                    <Text style={styles.taglineText}>Your Path to Easy Learning</Text>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.csk[600],
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
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    pathifyDot: {
        fontSize: 42,
        fontFamily: Fonts.bold,
        fontWeight: '700',
        color: Colors.dark.warning[500],
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
        borderTopColor: Colors.light.background,
        borderRightColor: Colors.light.background,
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
