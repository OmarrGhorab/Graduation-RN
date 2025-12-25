import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cskColors, Colors } from '@/constants/theme';
import { confirmReactivation } from '@/services/AuthService';
import { LinearGradient } from 'expo-linear-gradient';
import { useToast } from '@/components/toast';

const { width, height } = Dimensions.get('window');

export default function ReactivateAccountScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const { tempToken, message } = useLocalSearchParams<{
        tempToken: string;
        message?: string;
    }>();
    const { success, error } = useToast();
    const [loading, setLoading] = useState(false);

    // Animations
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
            // First: Icon appears with rotation
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
            // Then: Text slides up
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

    const handleContinue = async () => {
        console.log('[Reactivate] Continue clicked, tempToken:', tempToken ? tempToken.substring(0, 20) + '...' : 'null');
        
        if (!tempToken) {
            error('Error', 'Missing authentication token. Please try logging in again.');
            router.replace('/login' as Href);
            return;
        }

        setLoading(true);
        try {
            console.log('[Reactivate] Calling confirmReactivation...');
            const result = await confirmReactivation(tempToken);
            
            console.log('[Reactivate] Reactivation successful:', result);
            success('Welcome Back!', result.message || 'Your account has been reactivated');

            // Small delay to show success message
            setTimeout(() => {
                // Navigate based on onboarding status
                if (result.user?.onboardingCompleted) {
                    router.replace('/home' as Href);
                } else {
                    router.replace('/onboarding/step1' as Href);
                }
            }, 500);
        } catch (err: any) {
            console.error('[Reactivate] Reactivation confirmation error:', err);
            error('Reactivation Failed', err.message || 'Please try again');
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        // Just go back to login - account stays deactivated since we didn't call confirmReactivation
        router.replace('/login' as Href);
    };

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-180deg', '0deg'],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={cskColors[600]} />
            
            {/* Gradient Background */}
            <LinearGradient
                colors={[cskColors[400], cskColors[500], cskColors[600]]}
                style={styles.gradientBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            {/* Animated Background Shapes */}
            <Animated.View style={[styles.bgShape1, { opacity: glowAnim }]} />
            <Animated.View style={[styles.bgShape2, { opacity: glowAnim }]} />
            <Animated.View style={[styles.bgShape3, { opacity: Animated.multiply(glowAnim, 0.5) }]} />

            {/* Main Content */}
            <View style={styles.content}>
                
                {/* Icon Section */}
                <Animated.View 
                    style={[
                        styles.iconSection,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { scale: scaleAnim },
                                { rotate: rotation },
                            ],
                        }
                    ]}
                >
                    <View style={styles.iconOuterRing}>
                        <View style={styles.iconMiddleRing}>
                            <View style={styles.iconInnerCircle}>
                                <Ionicons name="person-circle" size={52} color={cskColors[500]} />
                            </View>
                        </View>
                    </View>
                    
                    {/* Checkmark Badge */}
                    <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                </Animated.View>

                {/* Text Section */}
                <Animated.View 
                    style={[
                        styles.textSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }
                    ]}
                >
                    <Text style={styles.welcomeLabel}>WELCOME BACK</Text>
                    <Text style={styles.title}>Good to See You Again!</Text>
                    <Text style={styles.subtitle}>
                        {message || "Your account will be reactivated. We're excited to have you back!"}
                    </Text>
                </Animated.View>

                {/* Info Cards */}
                <Animated.View 
                    style={[
                        styles.cardsContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: cardSlideAnim }],
                        }
                    ]}
                >
                    <View style={styles.infoCard}>
                        <View style={[styles.cardIconWrapper, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="shield-checkmark" size={22} color="#10B981" />
                        </View>
                        <View style={styles.cardTextWrapper}>
                            <Text style={styles.cardTitle}>Account Secured</Text>
                            <Text style={styles.cardDescription}>Your data is safe and protected</Text>
                        </View>
                    </View>

                    <View style={styles.infoCard}>
                        <View style={[styles.cardIconWrapper, { backgroundColor: '#EEF2FF' }]}>
                            <Ionicons name="sync" size={22} color="#6366F1" />
                        </View>
                        <View style={styles.cardTextWrapper}>
                            <Text style={styles.cardTitle}>Everything Restored</Text>
                            <Text style={styles.cardDescription}>Settings and preferences are ready</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Bottom Section */}
                <Animated.View 
                    style={[
                        styles.bottomSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: buttonSlideAnim }],
                        }
                    ]}
                >
                    {/* Continue Button */}
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinue}
                        activeOpacity={0.9}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#FFFFFF', '#F8FAFC']}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={cskColors[600]} />
                            ) : (
                                <>
                                    <Text style={styles.continueButtonText}>Continue to App</Text>
                                    <View style={styles.arrowCircle}>
                                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                                    </View>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Logout Option */}
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleGoBack}
                        activeOpacity={0.7}
                        disabled={loading}
                    >
                        <Ionicons name="log-out-outline" size={18} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.logoutText}>Sign out instead</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
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
    iconSection: {
        alignItems: 'center',
        marginBottom: 28,
    },
    iconOuterRing: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconMiddleRing: {
        width: 115,
        height: 115,
        borderRadius: 57.5,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconInnerCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
    },
    checkBadge: {
        position: 'absolute',
        bottom: 8,
        right: width * 0.5 - 70 - 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: cskColors[500],
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    textSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    welcomeLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 3,
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: 23,
        paddingHorizontal: 12,
    },
    cardsContainer: {
        gap: 12,
        marginBottom: 32,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    cardIconWrapper: {
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    cardTextWrapper: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 3,
    },
    cardDescription: {
        fontSize: 13,
        color: '#6B7280',
    },
    bottomSection: {
        marginTop: 'auto',
    },
    continueButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: 20,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 28,
    },
    continueButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: cskColors[600],
        marginRight: 12,
    },
    arrowCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: cskColors[500],
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    logoutText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
});
