import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function AttendanceSuccessScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ time?: string; location?: string; lessonTitle?: string; status?: string }>();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const status = (params.status || 'PRESENT').toUpperCase();
    const isLate = status === 'LATE';

    const statusColor = isLate ? '#f59e0b' : cskColors[500];
    const statusLabel = isLate ? 'LATE' : 'PRESENT';
    const statusIcon = isLate ? 'schedule' : 'verified-user';

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
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(main)/courses');
        }
    };

    const handleBackHome = () => {
        router.navigate('/(main)/home');
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f8fcfa' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

            <LinearGradient
                colors={[isDark ? `${statusColor}18` : `${statusColor}12`, 'transparent']}
                style={styles.gradientBg}
            />

            <View style={[styles.content, { paddingTop: insets.top + 32 }]}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <Animated.View style={[styles.pulseRing, { backgroundColor: `${statusColor}25` }, animatedPulseStyle]} />
                    <View style={[styles.successIconCircle, { backgroundColor: statusColor }]}>
                        <MaterialIcons name="check" size={48} color={isDark ? '#10221a' : '#fff'} />
                    </View>
                    <View style={[styles.confetti, { top: -10, left: '25%', backgroundColor: statusColor }]} />
                    <View style={[styles.confetti, { bottom: '25%', right: 0, backgroundColor: '#fbbf24', width: 12, height: 12 }]} />
                    <View style={[styles.confetti, { top: '50%', left: -16, backgroundColor: '#60a5fa' }]} />
                </View>

                {/* Headline */}
                <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.headline}>
                    <Text style={[styles.title, { color: isDark ? '#fff' : '#0d1b15' }]}>Attendance Verified</Text>
                    {params.lessonTitle ? (
                        <Text style={[styles.lessonTitleText, { color: isDark ? '#9ca3af' : '#4c9a75' }]} numberOfLines={2}>
                            {params.lessonTitle}
                        </Text>
                    ) : null}
                    <Text style={[styles.subtitle, { color: isDark ? '#9ca3af' : '#4c9a75' }]}>
                        Your attendance has been successfully recorded.
                    </Text>
                </Animated.View>

                {/* Result Card */}
                <Animated.View
                    entering={FadeInUp.delay(500).springify()}
                    style={[styles.card, { backgroundColor: isDark ? '#1a332a' : '#fff', borderColor: isDark ? '#1f2937' : '#f3f4f6' }]}
                >
                    {/* Status Header */}
                    <View style={[styles.cardHeader, { backgroundColor: `${statusColor}12`, borderColor: `${statusColor}20` }]}>
                        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}25` }]}>
                            <MaterialIcons name={statusIcon as any} size={18} color={statusColor} />
                            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                        </View>
                    </View>

                    <View style={styles.cardBody}>
                        {/* Time Row */}
                        <View style={[styles.infoRow, { borderColor: isDark ? '#374151' : '#f3f4f6' }]}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.infoIcon, { backgroundColor: isDark ? '#1f2937' : '#f9fafb' }]}>
                                    <MaterialIcons name="schedule" size={20} color="#9ca3af" />
                                </View>
                                <View>
                                    <Text style={[styles.rowLabel, { color: isDark ? '#9ca3af' : '#4c9a75' }]}>TIME</Text>
                                    <Text style={[styles.rowValue, { color: isDark ? '#fff' : '#0d1b15' }]}>
                                        {params.time || new Date().toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo' })}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Location Row */}
                        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                            <View style={styles.rowLeft}>
                                <View style={[styles.infoIcon, { backgroundColor: isDark ? '#1f2937' : '#f9fafb' }]}>
                                    <MaterialIcons name="location-on" size={20} color="#9ca3af" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.rowLabel, { color: isDark ? '#9ca3af' : '#4c9a75' }]}>LOCATION</Text>
                                    <Text style={[styles.rowValue, { color: isDark ? '#fff' : '#0d1b15' }]} numberOfLines={2}>
                                        {params.location || 'Classroom'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </View>

            {/* Bottom Actions */}
            <Animated.View
                entering={FadeInDown.delay(600).springify()}
                style={[styles.footer, {
                    backgroundColor: isDark ? 'rgba(16, 34, 26, 0.9)' : 'rgba(248, 252, 250, 0.9)',
                    borderColor: isDark ? '#1f2937' : 'rgba(255,255,255,0.5)',
                    paddingBottom: insets.bottom + 16,
                }]}
            >
                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: statusColor }]}
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
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
    gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 256, zIndex: -1 },
    content: { flex: 1, width: '100%', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24, zIndex: 10 },
    iconContainer: {
        marginTop: 16, marginBottom: 28, alignItems: 'center', justifyContent: 'center',
        position: 'relative', width: 128, height: 128,
    },
    pulseRing: { position: 'absolute', width: 128, height: 128, borderRadius: 64 },
    successIconCircle: {
        width: 96, height: 96, borderRadius: 48,
        alignItems: 'center', justifyContent: 'center',
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 20, elevation: 10,
    },
    confetti: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
    headline: { marginBottom: 28, alignItems: 'center', width: '100%' },
    title: { fontSize: 28, fontFamily: Fonts.extraBold, marginBottom: 6, textAlign: 'center' },
    lessonTitleText: { fontSize: 15, fontFamily: Fonts.semiBold, textAlign: 'center', marginBottom: 6, paddingHorizontal: 16 },
    subtitle: { fontSize: 14, fontFamily: Fonts.medium, textAlign: 'center', maxWidth: 280, lineHeight: 20 },
    card: {
        width: '100%', borderRadius: 16, borderWidth: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 16, elevation: 2, overflow: 'hidden',
    },
    cardHeader: { padding: 14, alignItems: 'center', borderBottomWidth: 1 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, gap: 8 },
    statusText: { fontSize: 14, fontFamily: Fonts.bold, letterSpacing: 0.5 },
    cardBody: { padding: 20, gap: 16 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1 },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    infoIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { fontSize: 11, fontFamily: Fonts.semiBold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    rowValue: { fontSize: 17, fontFamily: Fonts.bold },
    footer: {
        width: '100%', paddingTop: 16, paddingHorizontal: 24,
        borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, gap: 12,
    },
    primaryButton: {
        height: 56, borderRadius: 12, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    },
    primaryButtonText: { fontSize: 18, fontFamily: Fonts.bold },
    secondaryButton: { height: 52, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
    secondaryButtonText: { fontSize: 16, fontFamily: Fonts.bold },
    verifiedFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4, opacity: 0.6 },
    verifiedText: { fontSize: 12, fontFamily: Fonts.medium, color: '#4c9a75' },
});
