import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    StatusBar,
    StyleSheet,
    View,
    useColorScheme,
} from 'react-native';
import { Colors, cskColors } from '@/constants/theme';
import { confirmReactivation } from '@/services/AuthService';
import { LinearGradient } from 'expo-linear-gradient';
import { useToast } from '@/components/toast';
import {
    ReactivateIcon,
    ReactivateText,
    ReactivateCards,
    ReactivateButtons,
} from '@/components/auth';

const { width, height } = Dimensions.get('window');

// ============================================================================
// Main Component
// ============================================================================

export default function ReactivateAccountScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const isDark = colorScheme === 'dark';
    const { tempToken, message } = useLocalSearchParams<{
        tempToken: string;
        message?: string;
    }>();
    const { success, error } = useToast();
    const [loading, setLoading] = useState(false);

    // ========================================================================
    // Animations
    // ========================================================================

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(60)).current;
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const cardSlideAnim = useRef(new Animated.Value(100)).current;
    const buttonSlideAnim = useRef(new Animated.Value(80)).current;
    const glowAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        // Staggered entrance animations
        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 60,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Card and button animations with delay
        Animated.sequence([
            Animated.delay(300),
            Animated.parallel([
                Animated.spring(cardSlideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 9,
                    useNativeDriver: true,
                }),
                Animated.spring(buttonSlideAnim, {
                    toValue: 0,
                    tension: 45,
                    friction: 9,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Subtle glow pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 0.8,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.4,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-180deg', '0deg'],
    });

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleContinue = async () => {
        if (!tempToken) {
            error('Error', 'Missing authentication token. Please try logging in again.');
            router.replace('/login' as Href);
            return;
        }

        setLoading(true);
        try {
            const result = await confirmReactivation(tempToken);
            success('Welcome Back!', result.message || 'Your account has been reactivated');

            setTimeout(() => {
                const destination = result.user?.onboardingCompleted ? '/home' : '/onboarding/step1';
                router.replace(destination as Href);
            }, 500);
        } catch (err: any) {
            console.error('[Reactivate] Reactivation confirmation error:', err);
            error('Reactivation Failed', err.message || 'Please try again');
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        router.replace('/login' as Href);
    };

    // ========================================================================
    // Render
    // ========================================================================

    // Use theme-aware gradient colors
    const gradientColors = isDark
        ? [theme.csk[400], theme.csk[500], theme.csk[600] || theme.csk[500]]
        : [cskColors[400], cskColors[500], cskColors[600]];

    return (
        <View style={[styles.container, { backgroundColor: theme.primary }]}>
            <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

            {/* Gradient Background */}
            <LinearGradient
                colors={gradientColors as [string, string, ...string[]]}
                style={styles.gradientBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Animated Background Shapes */}
            <Animated.View style={[styles.bgShape1, { opacity: glowAnim }]} />
            <Animated.View style={[styles.bgShape2, { opacity: glowAnim }]} />
            <Animated.View
                style={[styles.bgShape3, { opacity: Animated.multiply(glowAnim, 0.5) }]}
            />

            {/* Main Content */}
            <View style={styles.content}>
                <ReactivateIcon
                    theme={theme}
                    fadeAnim={fadeAnim}
                    scaleAnim={scaleAnim}
                    rotation={rotation}
                />

                <ReactivateText
                    message={message}
                    fadeAnim={fadeAnim}
                    slideAnim={slideAnim}
                />

                <ReactivateCards fadeAnim={fadeAnim} cardSlideAnim={cardSlideAnim} />

                <ReactivateButtons
                    theme={theme}
                    loading={loading}
                    fadeAnim={fadeAnim}
                    buttonSlideAnim={buttonSlideAnim}
                    onContinue={handleContinue}
                    onGoBack={handleGoBack}
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
    gradientBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    bgShape1: {
        position: 'absolute',
        top: -height * 0.15,
        right: -width * 0.3,
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    bgShape2: {
        position: 'absolute',
        bottom: -height * 0.1,
        left: -width * 0.25,
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: width * 0.35,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    bgShape3: {
        position: 'absolute',
        top: height * 0.35,
        left: -width * 0.15,
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: width * 0.2,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    content: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: Platform.OS === 'ios' ? 50 : 40,
    },
});
