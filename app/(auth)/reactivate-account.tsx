import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cskColors, Colors } from '@/constants/theme';
import { logout } from '@/services/AuthService';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function ReactivateAccountScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme || 'light'];
    const { onboardingCompleted, message } = useLocalSearchParams<{
        onboardingCompleted: string;
        message?: string;
    }>();

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 6,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for the icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleContinue = () => {
        if (onboardingCompleted === 'true') {
            router.replace('/home' as Href);
        } else {
            router.replace('/onboarding/step1' as Href);
        }
    };

    const handleGoBack = async () => {
        try {
            await logout();
        } catch (err) {
            console.error('Logout error:', err);
        }
        router.replace('/login' as Href);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={cskColors[500]} />
            
            {/* Gradient Background */}
            <LinearGradient
                colors={[cskColors[500], cskColors[600], cskColors[700]]}
                style={styles.gradientBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Decorative Circles */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeCircle3} />

            {/* Content */}
            <Animated.View 
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }
                ]}
            >
                {/* Animated Icon */}
                <Animated.View 
                    style={[
                        styles.iconContainer,
                        {
                            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
                        }
                    ]}
                >
                    <View style={styles.iconOuter}>
                        <View style={styles.iconInner}>
                            <Ionicons name="heart" size={48} color={cskColors[500]} />
                        </View>
                    </View>
                </Animated.View>

                {/* Celebration Icons */}
                <View style={styles.celebrationRow}>
                    <Text style={styles.emoji}>🎉</Text>
                    <Text style={styles.emoji}>✨</Text>
                    <Text style={styles.emoji}>🎉</Text>
                </View>

                {/* Welcome Text */}
                <Text style={styles.welcomeText}>Welcome Back!</Text>
                <Text style={styles.subtitle}>
                    {message || "We missed you! Your account has been successfully reactivated."}
                </Text>

                {/* Success Card */}
                <View style={styles.successCard}>
                    <View style={styles.successIconWrapper}>
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    </View>
                    <View style={styles.successTextWrapper}>
                        <Text style={styles.successTitle}>Account Restored</Text>
                        <Text style={styles.successDescription}>
                            All your data, settings, and preferences are ready for you.
                        </Text>
                    </View>
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    activeOpacity={0.9}
                >
                    <Text style={styles.continueButtonText}>Let's Go!</Text>
                    <Ionicons name="arrow-forward" size={20} color={cskColors[500]} />
                </TouchableOpacity>

                {/* Logout Link */}
                <TouchableOpacity
                    style={styles.logoutLink}
                    onPress={handleGoBack}
                    activeOpacity={0.7}
                >
                    <Text style={styles.logoutText}>
                        Changed your mind? <Text style={styles.logoutTextBold}>Log out</Text>
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: cskColors[500],
    },
    gradientBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    decorativeCircle1: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    decorativeCircle2: {
        position: 'absolute',
        bottom: -50,
        left: -80,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    decorativeCircle3: {
        position: 'absolute',
        top: height * 0.3,
        left: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingBottom: 40,
    },
    iconContainer: {
        marginBottom: 16,
    },
    iconOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconInner: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    celebrationRow: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 16,
    },
    emoji: {
        fontSize: 28,
    },
    welcomeText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    successCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    successIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    successTextWrapper: {
        flex: 1,
    },
    successTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    successDescription: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    continueButton: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingVertical: 18,
        paddingHorizontal: 48,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        gap: 10,
    },
    continueButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: cskColors[500],
    },
    logoutLink: {
        marginTop: 24,
        paddingVertical: 8,
    },
    logoutText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    logoutTextBold: {
        fontWeight: '700',
        color: '#FFFFFF',
        textDecorationLine: 'underline',
    },
});
