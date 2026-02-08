
import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const { width, height } = Dimensions.get('window');

export default function AttendanceSuccessScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { theme, isDark } = useTheme();

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

    const handleViewProgress = () => {
        // Navigate back to course details or progress page
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(main)/course');
        }
    };

    const handleBackHome = () => {
        router.navigate('/(main)/home');
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f8fcfa' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

            {/* Background Elements */}
            <LinearGradient
                colors={[isDark ? 'rgba(18, 237, 135, 0.1)' : 'rgba(18, 237, 135, 0.1)', 'transparent']}
                style={styles.gradientBg}
            />
            <View style={[styles.blurBlob, { backgroundColor: 'rgba(18, 237, 135, 0.2)' }]} />

            {/* Main Content */}
            <View style={styles.content}>

                {/* Success Animation */}
                <View style={styles.iconContainer}>
                    <Animated.View style={[styles.pulseRing, { backgroundColor: 'rgba(18, 237, 135, 0.2)' }, animatedPulseStyle]} />
                    <View style={[styles.successIconCircle, { backgroundColor: cskColors[500] }]}>
                        <MaterialIcons name="check" size={48} color={isDark ? '#10221a' : '#fff'} />
                    </View>

                    {/* Confetti Particles (Simplified static for now, could be animated later) */}
                    <View style={[styles.confetti, { top: -10, left: '25%', backgroundColor: cskColors[500] }]} />
                    <View style={[styles.confetti, { bottom: '25%', right: 0, backgroundColor: '#fbbf24', width: 12, height: 12 }]} />
                    <View style={[styles.confetti, { top: '50%', left: -16, backgroundColor: '#60a5fa' }]} />
                </View>

                {/* Headline */}
                <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.headline}>
                    <Text style={[styles.title, { color: isDark ? '#fff' : '#0d1b15' }]}>Attendance Verified</Text>
                    <Text style={[styles.subtitle, { color: isDark ? '#9ca3af' : '#4c9a75' }]}>
                        Your attendance has been successfully recorded securely.
                    </Text>
                </Animated.View>

                {/* Result Card */}
                <Animated.View
                    entering={FadeInUp.delay(500).springify()}
                    style={[styles.card, { backgroundColor: isDark ? '#1a332a' : '#fff', borderColor: isDark ? '#1f2937' : '#f3f4f6' }]}
                >
                    {/* Status Header */}
                    <View style={[styles.cardHeader, { backgroundColor: isDark ? 'rgba(18, 237, 135, 0.05)' : 'rgba(18, 237, 135, 0.1)', borderColor: isDark ? 'rgba(18, 237, 135, 0.05)' : 'rgba(18, 237, 135, 0.1)' }]}>
                        <View style={[styles.statusBadge, { backgroundColor: 'rgba(18, 237, 135, 0.2)' }]}>
                            <MaterialIcons name="verified-user" size={18} color={isDark ? cskColors[500] : '#0fb865'} />
                            <Text style={[styles.statusText, { color: isDark ? cskColors[500] : '#0fb865' }]}>SUCCESS</Text>
                        </View>
                    </View>

                    {/* Card Content */}
                    <View style={styles.cardBody}>
                        {/* Time Row */}
                        <View style={[styles.infoRow, { borderColor: isDark ? '#374151' : '#f3f4f6' }]}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.infoIcon, { backgroundColor: isDark ? '#1f2937' : '#f9fafb' }]}>
                                    <MaterialIcons name="schedule" size={20} color={isDark ? '#9ca3af' : '#9ca3af'} />
                                </View>
                                <View>
                                    <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#4c9a75' }]}>TIME</Text>
                                    <Text style={[styles.value, { color: isDark ? '#fff' : '#0d1b15' }]}>{params.time || '10:05 AM'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Location Row */}
                        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.infoIcon, { backgroundColor: isDark ? '#1f2937' : '#f9fafb' }]}>
                                    <MaterialIcons name="location-on" size={20} color={isDark ? '#9ca3af' : '#9ca3af'} />
                                </View>
                                <View>
                                    <Text style={[styles.label, { color: isDark ? '#9ca3af' : '#4c9a75' }]}>LOCATION</Text>
                                    <Text style={[styles.value, { color: isDark ? '#fff' : '#0d1b15' }]}>{params.location || 'Hall B'}</Text>
                                </View>
                            </View>
                            {/* Mini Map Visual */}
                            <View style={[styles.miniMap, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
                                <Image
                                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsljsr8dVMgNi2NeCCt-CcZC7kYBuXw8YMNLTLlXJewEZajdwwBKKB8sDNXvypCsLEl9JSwEiDP1d8-s_zPqfhK8m1yOcKAi046nTDZg-dY9LgSR9Klznl8Z6BJWqRhkVpPz9XET_taJKQB-jTGzahbyMfW31XXlJjHV0pVBdmbEgBQP2HSmhq5dVWWbgNubRFCJ4_P8Pu_ltM2XvZXibzQ0HMmCYAMplskFapSOcjL-TWYpkbsbJ_RePHmeUqee1xSHtJBRYeAoXe' }}
                                    style={styles.mapImage}
                                />
                            </View>
                        </View>
                    </View>
                </Animated.View>

            </View>

            {/* Bottom Actions */}
            <Animated.View
                entering={FadeInDown.delay(600).springify()}
                style={[styles.footer, { backgroundColor: isDark ? 'rgba(16, 34, 26, 0.9)' : 'rgba(248, 252, 250, 0.9)', borderColor: isDark ? '#1f2937' : 'rgba(255,255,255,0.5)' }]}
            >
                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: cskColors[500], shadowColor: 'rgba(18, 237, 135, 0.2)' }]}
                    activeOpacity={0.9}
                    onPress={handleViewProgress}
                >
                    <Text style={[styles.primaryButtonText, { color: '#10221a' }]}>View Progress</Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#10221a" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: isDark ? '#374151' : '#e5e7eb' }]}
                    activeOpacity={0.9}
                    onPress={handleBackHome}
                >
                    <Text style={[styles.secondaryButtonText, { color: isDark ? '#fff' : '#0d1b15' }]}>Back to Home</Text>
                </TouchableOpacity>

                <View style={styles.verifiedFooter}>
                    <MaterialIcons name="lock" size={14} color="#4c9a75" />
                    <Text style={styles.verifiedText}>Verified by CSK Security</Text>
                </View>

                <View style={{ height: 16 }} />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 256,
        zIndex: -1,
    },
    blurBlob: {
        position: 'absolute',
        top: -96,
        right: -96,
        width: 256,
        height: 256,
        borderRadius: 128,
        opacity: 0.2, // blur-3xl equivalent handled via separate logic usually, but simple opacity helps
        zIndex: -1,
    },
    content: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 24,
        zIndex: 10,
    },
    iconContainer: {
        marginTop: 32,
        marginBottom: 32,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: 128,
        height: 128,
    },
    pulseRing: {
        position: 'absolute',
        width: 128,
        height: 128,
        borderRadius: 64,
    },
    successIconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: 'rgba(18,237,135,0.4)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 10,
    },
    confetti: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    headline: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 30,
        fontFamily: Fonts.extraBold,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 24,
    },
    card: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: 'rgba(0,0,0,0.04)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 2,
        overflow: 'hidden',
        marginBottom: 32,
    },
    cardHeader: {
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
        gap: 8,
    },
    statusText: {
        fontSize: 14,
        fontFamily: Fonts.bold,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    cardBody: {
        padding: 24,
        gap: 24,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    value: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    miniMap: {
        width: 64,
        height: 64,
        borderRadius: 8,
        overflow: 'hidden',
    },
    mapImage: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    footer: {
        width: '100%',
        paddingTop: 16,
        paddingHorizontal: 24,
        paddingBottom: 32,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        gap: 12,
    },
    primaryButton: {
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    secondaryButton: {
        height: 56,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    secondaryButtonText: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    verifiedFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 24,
        opacity: 0.6,
    },
    verifiedText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: '#4c9a75',
    },
});
