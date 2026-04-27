
import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { useTranslation } from '@/hooks/useTranslation';

const { width, height } = Dimensions.get('window');

export default function PaymentStatusScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    
    const status = params.status as 'success' | 'fail';
    const isSuccess = status === 'success';
    const courseId = params.courseId as string;

    // Animations
    const pulseScale = useSharedValue(1);
    const pulseOpacity = useSharedValue(0.4);

    useEffect(() => {
        pulseScale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
        pulseOpacity.value = withRepeat(
            withSequence(
                withTiming(0.2, { duration: 1000 }),
                withTiming(0.4, { duration: 1000 })
            ),
            -1,
            true
        );
    }, []);

    const animatedPulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: pulseOpacity.value,
    }));

    const handlePrimaryAction = () => {
        if (isSuccess) {
            if (courseId) {
                router.replace({ pathname: '/course-details', params: { id: courseId } });
            } else {
                router.replace('/(main)/home');
            }
        } else {
            router.back();
        }
    };

    const handleSecondaryAction = () => {
        router.replace('/(main)/home');
    };

    const statusColor = isSuccess ? cskColors[500] : '#FF4B55';

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F8FAFB' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

            {/* Background Decorations */}
            <LinearGradient
                colors={[isSuccess ? 'rgba(18, 237, 135, 0.15)' : 'rgba(255, 75, 85, 0.15)', 'transparent']}
                style={styles.gradientBg}
            />
            
            <View style={styles.content}>
                {/* Status Animated Icon */}
                <View style={styles.iconContainer}>
                    <Animated.View 
                        style={[
                            styles.pulseRing, 
                            { backgroundColor: isSuccess ? 'rgba(18, 237, 135, 0.2)' : 'rgba(255, 75, 85, 0.2)' }, 
                            animatedPulseStyle
                        ]} 
                    />
                    <View style={[styles.iconCircle, { backgroundColor: statusColor }]}>
                        <MaterialIcons 
                            name={isSuccess ? "check" : "close"} 
                            size={48} 
                            color="#FFF" 
                        />
                    </View>
                </View>

                {/* Text Content */}
                <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.headline}>
                    <Text style={[styles.title, { color: isDark ? theme.text : '#0D1B15' }]}>
                        {isSuccess ? t('checkout.paymentSuccess') : t('checkout.paymentFailed')}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.gray[500] }]}>
                        {isSuccess 
                            ? t('checkout.paymentSuccessMessage') || 'Your enrollment has been successfully processed.' 
                            : t('checkout.paymentFailedMessage') || 'There was an issue processing your transaction.'}
                    </Text>
                </Animated.View>

                {/* Details Card */}
                <Animated.View
                    entering={FadeInUp.delay(500).springify()}
                    style={[
                        styles.card, 
                        { 
                            backgroundColor: isDark ? theme.surface : '#FFF', 
                            borderColor: isDark ? theme.border : '#E5E7EB' 
                        }
                    ]}
                >
                    <View style={styles.cardBody}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconWrap}>
                                <Ionicons name="receipt-outline" size={20} color={theme.primary} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.label, { color: theme.gray[500] }]}>{t('checkout.transactionId') || 'TRANSACTION ID'}</Text>
                                <Text style={[styles.value, { color: isDark ? theme.text : '#0D1B15' }]}>
                                    #{Math.random().toString(36).substr(2, 9).toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                            <View style={styles.infoIconWrap}>
                                <Ionicons name="time-outline" size={20} color={theme.primary} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.label, { color: theme.gray[500] }]}>{t('checkout.date') || 'DATE'}</Text>
                                <Text style={[styles.value, { color: isDark ? theme.text : '#0D1B15' }]}>
                                    {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </View>

            {/* Actions */}
            <Animated.View
                entering={FadeInDown.delay(600).springify()}
                style={[
                    styles.footer, 
                    { 
                        backgroundColor: isDark ? theme.surface : '#FFF',
                        borderTopColor: isDark ? theme.border : '#E5E7EB'
                    }
                ]}
            >
                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: isSuccess ? theme.primary : '#FF4B55' }]}
                    activeOpacity={0.8}
                    onPress={handlePrimaryAction}
                >
                    <Text style={styles.primaryButtonText}>
                        {isSuccess ? t('courseDetails.startLearning') || 'Start Learning' : t('common.tryAgain') || 'Try Again'}
                    </Text>
                    <MaterialIcons name={isSuccess ? "arrow-forward" : "refresh"} size={20} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: theme.border }]}
                    activeOpacity={0.8}
                    onPress={handleSecondaryAction}
                >
                    <Text style={[styles.secondaryButtonText, { color: isDark ? theme.text : '#0D1B15' }]}>
                        {t('common.backToHome') || 'Back to Home'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.securitySeal}>
                    <Ionicons name="shield-checkmark" size={14} color={theme.primary} />
                    <Text style={[styles.securityText, { color: theme.primary }]}>SECURE TRANSACTION</Text>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.4,
        zIndex: -1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 80,
    },
    iconContainer: {
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    pulseRing: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    headline: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontFamily: Fonts.bold,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    card: {
        width: '100%',
        borderRadius: 20,
        borderWidth: 1,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    cardBody: {
        gap: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        paddingBottom: 20,
    },
    infoIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },
    footer: {
        padding: 24,
        paddingBottom: 48,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderTopWidth: 1,
        gap: 12,
    },
    primaryButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    primaryButtonText: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        color: '#FFF',
    },
    secondaryButton: {
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    securitySeal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 16,
        opacity: 0.8,
    },
    securityText: {
        fontSize: 11,
        fontFamily: Fonts.bold,
        letterSpacing: 1,
    },
});
