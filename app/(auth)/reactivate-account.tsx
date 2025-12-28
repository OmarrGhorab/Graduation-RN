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
import { Colors, cskColors, cskDarkColors } from '@/constants/theme';
import { confirmReactivation } from '@/services/AuthService';
import { LinearGradient } from 'expo-linear-gradient';
import { useToast } from '@/components/toast';
import {
    ReactivateIcon,
    ReactivateText,
    ReactivateCards,
    ReactivateButtons,
} from '@/components/auth';
import { syncUserPreferences } from '@/libs/preferences-sync';
import { useTranslation } from '@/hooks/useTranslation';

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
    const { t } = useTranslation();
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
            error(t('common.error'), t('auth.missingAuthToken'));
            router.replace('/login' as Href);
            return;
        }

        setLoading(true);
        try {
            const result = await confirmReactivation(tempToken);
            success(t('auth.welcomeBackTitle'), t('auth.reactivationSuccess'));

            setTimeout(async () => {
                if (result.user?.onboardingCompleted) {
                    // Sync preferences before navigating to home
                    await syncUserPreferences();
                    router.replace('/home' as Href);
                } else {
                    router.replace('/onboarding/step1' as Href);
                }
            }, 500);
        } catch (err: any) {
            console.error('[Reactivate] Reactivation confirmation error:', err);
            error(t('auth.reactivationFailed'), t('auth.reactivationFailedMessage'));
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        router.replace('/login' as Href);
    };

    // ========================================================================
    // Render
    // ========================================================================

    // Enhanced gradient colors for dark mode
    const gradientColors = isDark
        ? [cskDarkColors[400], cskDarkColors[500], cskDarkColors[600]]
        : [cskColors[400], cskColors[500], cskColors[600]];

    // Background shape colors based on theme
    const shapeOpacity = isDark ? 0.15 : 0.08;

    return (
        <View style={[styles.container, { backgroundColor: isDark ? cskDarkColors[500] : theme.primary }]}>
            <StatusBar barStyle="light-content" backgroundColor={isDark ? cskDarkColors[500] : theme.primary} />

            {/* Gradient Background */}
            <LinearGradient
                colors={gradientColors as [string, string, ...string[]]}
                style={styles.gradientBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Animated Background Shapes */}
            <Animated.View 
                style={[
                    styles.bgShape1, 
                    { 
                        opacity: Animated.multiply(glowAnim, isDark ? 0.25 : 1),
                        backgroundColor: isDark ? 'rgba(79, 191, 138, 0.15)' : 'rgba(255,255,255,0.08)',
                    }
                ]} 
            />
            <Animated.View 
                style={[
                    styles.bgShape2, 
                    { 
                        opacity: Animated.multiply(glowAnim, isDark ? 0.2 : 1),
                        backgroundColor: isDark ? 'rgba(79, 191, 138, 0.12)' : 'rgba(255,255,255,0.06)',
                    }
                ]} 
            />
            <Animated.View
                style={[
                    styles.bgShape3, 
                    { 
                        opacity: Animated.multiply(glowAnim, isDark ? 0.15 : 0.5),
                        backgroundColor: isDark ? 'rgba(79, 191, 138, 0.1)' : 'rgba(255,255,255,0.04)',
                    }
                ]}
            />

            {/* Main Content */}
            <View style={styles.content}>
                <ReactivateIcon
                    theme={theme}
                    isDark={isDark}
                    fadeAnim={fadeAnim}
                    scaleAnim={scaleAnim}
                    rotation={rotation}
                />

                <ReactivateText
                    message={message}
                    fadeAnim={fadeAnim}
                    slideAnim={slideAnim}
                />

                <ReactivateCards 
                    isDark={isDark}
                    fadeAnim={fadeAnim} 
                    cardSlideAnim={cardSlideAnim} 
                />

                <ReactivateButtons
                    theme={theme}
                    isDark={isDark}
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
    },
    bgShape2: {
        position: 'absolute',
        bottom: -height * 0.1,
        left: -width * 0.25,
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: width * 0.35,
    },
    bgShape3: {
        position: 'absolute',
        top: height * 0.35,
        left: -width * 0.15,
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: width * 0.2,
    },
    content: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: Platform.OS === 'ios' ? 50 : 40,
    },
});
