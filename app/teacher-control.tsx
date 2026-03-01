import { Fonts, cskColors, errorColors } from '@/constants/theme';
import { useLessonAttendance, useLessonControl, useLessonDetails, useLessonQR } from '@/hooks/useLessons';
import { useTheme } from '@/hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function TeacherControlPanel() {
    const router = useRouter();
    const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
    const { theme, isDark } = useTheme();

    const { data: lessonResponse, isLoading: isLoadingDetails } = useLessonDetails(lessonId!);
    const lesson = lessonResponse?.data;

    const isLive = lesson?.status === 'LIVE';
    const isCompleted = lesson?.status === 'COMPLETED';

    const { data: qrResponse, refetch: refetchQR } = useLessonQR(lessonId!, isLive);
    const { data: attendanceResponse } = useLessonAttendance(lessonId!, isLive);
    const { startLesson, endLesson } = useLessonControl(lessonId!);

    const [timer, setTimer] = useState('00:00:00');
    const [qrCountdown, setQrCountdown] = useState(30);

    // Scan line animation
    const translateY = useSharedValue(0);

    useEffect(() => {
        translateY.value = withRepeat(
            withSequence(
                withTiming(250, { duration: 2000, easing: Easing.linear }),
                withTiming(0, { duration: 0 })
            ),
            -1,
            false
        );
    }, []);

    // Timer logic
    useEffect(() => {
        if (!isLive || !lesson?.startsAt) return;

        const interval = setInterval(() => {
            const start = new Date(lesson.startsAt).getTime();
            const now = new Date().getTime();
            const diff = Math.max(0, now - start);

            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            setTimer(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [isLive, lesson?.startsAt]);

    // QR Countdown Timer (30s validity with ±30s tolerance = 60s total)
    useEffect(() => {
        if (!isLive || !qrData?.expiresAt) return;

        const interval = setInterval(() => {
            const expiresAt = new Date(qrData.expiresAt).getTime();
            const now = new Date().getTime();
            const diff = Math.max(0, expiresAt - now);
            const secondsLeft = Math.ceil(diff / 1000);
            
            setQrCountdown(secondsLeft);

            // Auto-refresh when expired (backend will generate new one)
            if (secondsLeft <= 0) {
                refetchQR();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isLive, qrData?.expiresAt, refetchQR]);

    const animatedScanStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const handleStartLesson = async () => {
        try {
            await startLesson.mutateAsync();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to start lesson');
        }
    };

    const handleEndLesson = () => {
        Alert.alert(
            'End Lesson',
            'Are you sure you want to end this lesson and finalize attendance?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Lesson',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await endLesson.mutateAsync();
                            router.replace({ pathname: '/attendance-list', params: { lessonId: lessonId } });
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to end lesson');
                        }
                    }
                }
            ]
        );
    };

    const qrData = qrResponse?.data;
    const qrString = qrData ? JSON.stringify({ data: { payload: qrData.payload, signature: qrData.signature } }) : '';
    const qrImageUrl = qrString ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}` : null;

    const studentsPresent = attendanceResponse?.data?.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length || 0;
    const totalStudents = lesson?.enrolledStudents || 50; // Use enrolled students if available
    const attendancePercentage = (studentsPresent / totalStudents) * 100;

    if (isLoadingDetails) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f6f8f7', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={cskColors[500]} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f6f8f7' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#183327' : '#ffffff'} />

            {/* Header Section */}
            <View style={[styles.header, { backgroundColor: isDark ? '#183327' : '#ffffff', borderColor: isDark ? '#2a4d3d' : '#cfe7dc' }]}>
                {/* Top Bar */}
                <View style={[styles.topBar]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.backButton, { backgroundColor: isDark ? '#1f3b2e' : '#e7f3ee' }]}
                    >
                        <MaterialIcons name="arrow-back" size={24} color={isDark ? '#12ed87' : '#0d1b15'} />
                    </TouchableOpacity>
                    <Text style={[styles.headerLabel, { color: isDark ? '#e0e7e4' : '#0d1b15' }]}>Lesson Control</Text>
                    <View style={[styles.liveBadge, { backgroundColor: isLive ? 'rgba(18, 237, 135, 0.2)' : 'rgba(100, 116, 139, 0.1)' }]}>
                        <View style={styles.pingContainer}>
                            <View style={[styles.pingDot, { backgroundColor: isLive ? cskColors[500] : '#64748b' }]} />
                            {isLive && <View style={[styles.pingAnimate, { backgroundColor: cskColors[500] }]} />}
                        </View>
                        <Text style={[styles.liveText, { color: isLive ? cskColors[500] : '#64748b' }]}>{isLive ? 'LIVE' : lesson?.status || 'SCHEDULED'}</Text>
                    </View>
                </View>

                {/* Lesson Title & Timer */}
                <View style={styles.titleContainer}>
                    <Text style={[styles.lessonTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>{lesson?.title || 'Unknown Lesson'}</Text>
                    <View style={styles.timerContainer}>
                        <MaterialIcons name="timer" size={24} color={isLive ? '#12ed87' : '#64748b'} style={{ opacity: 0.75 }} />
                        <Text style={[styles.timerText, { color: isLive ? '#12ed87' : '#64748b' }]}>{isLive ? timer : '--:--:--'}</Text>
                    </View>
                </View>
            </View>

            {/* Content Area */}
            <View style={styles.content}>

                {!isLive ? (
                    <View style={styles.startSection}>
                        <Text style={[styles.startPrompt, { color: isDark ? '#ffffff' : '#0d1b15' }]}>Ready to start the lesson?</Text>
                        <TouchableOpacity
                            style={[styles.startButton, { backgroundColor: theme.primary }]}
                            onPress={handleStartLesson}
                            disabled={startLesson.isPending}
                        >
                            {startLesson.isPending ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <MaterialIcons name="play-arrow" size={32} color="#fff" />
                                    <Text style={styles.startButtonText}>Start Now</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* QR Code Card */}
                        <View style={styles.qrSection}>
                            <View style={[styles.qrCard, {
                                backgroundColor: '#ffffff',
                                borderColor: isDark ? 'rgba(18, 237, 135, 0.1)' : 'rgba(18, 237, 135, 0.2)',
                                shadowColor: '#000',
                            }]}>
                                <View style={styles.qrImageContainer}>
                                    {qrImageUrl ? (
                                        <Image
                                            source={{ uri: qrImageUrl }}
                                            style={styles.qrImage}
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        <ActivityIndicator size="large" color={theme.primary} />
                                    )}
                                    <Animated.View style={[styles.scanLine, { backgroundColor: cskColors[500] }, animatedScanStyle]} />
                                </View>

                                {/* QR Countdown Timer */}
                                <View style={[styles.qrCountdownContainer, { 
                                    backgroundColor: qrCountdown <= 10 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(18, 237, 135, 0.1)',
                                    borderColor: qrCountdown <= 10 ? '#ef4444' : cskColors[500]
                                }]}>
                                    <MaterialIcons 
                                        name="timer" 
                                        size={16} 
                                        color={qrCountdown <= 10 ? '#ef4444' : cskColors[500]} 
                                    />
                                    <Text style={[styles.qrCountdownText, { 
                                        color: qrCountdown <= 10 ? '#ef4444' : cskColors[500] 
                                    }]}>
                                        {qrCountdown}s {qrCountdown <= 10 ? '(Rotating soon...)' : 'valid'}
                                    </Text>
                                </View>

                                <View style={[styles.securityBadge, { backgroundColor: isDark ? '#183327' : '#ffffff', borderColor: 'rgba(18, 237, 135, 0.2)' }]}>
                                    <MaterialIcons name="security" size={14} color={cskColors[500]} />
                                    <Text style={[styles.securityText, { color: isDark ? '#e0e7e4' : '#0d1b15' }]}>CSK Secure</Text>
                                </View>
                            </View>

                            <View style={styles.refreshContainer}>
                                <Text style={[styles.refreshText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                    Rolling QR tokens active
                                </Text>
                                <TouchableOpacity style={styles.refreshButton} onPress={() => refetchQR()}>
                                    <MaterialIcons name="refresh" size={16} color={cskColors[500]} />
                                    <Text style={[styles.refreshButtonText, { color: cskColors[500] }]}>Rotate Token</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Attendance Stats */}
                        <View style={[styles.statsCard, { backgroundColor: isDark ? '#183327' : '#ffffff', borderColor: isDark ? '#2a4d3d' : '#cfe7dc' }]}>
                            <View>
                                <Text style={[styles.statsLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Students Present</Text>
                                <View style={styles.statsValueContainer}>
                                    <Text style={[styles.statsValue, { color: isDark ? '#ffffff' : '#0d1b15' }]}>{studentsPresent}</Text>
                                    <Text style={[styles.statsTotal, { color: '#94a3b8' }]}>/ {totalStudents}</Text>
                                </View>
                            </View>
                            <View style={[styles.progressCircleContainer, { backgroundColor: isDark ? '#1f3b2e' : '#e7f3ee' }]}>
                                <Svg width="48" height="48" viewBox="0 0 36 36" style={styles.svg}>
                                    <Circle cx="18" cy="18" r="15.9155" fill="none" stroke={cskColors[500]} strokeWidth="3" strokeOpacity="0.2" />
                                    <Circle
                                        cx="18"
                                        cy="18"
                                        r="15.9155"
                                        fill="none"
                                        stroke={cskColors[500]}
                                        strokeWidth="3"
                                        strokeDasharray={`${attendancePercentage}, 100`}
                                        strokeLinecap="round"
                                        rotation="-90"
                                        origin="18, 18"
                                    />
                                </Svg>
                                <View style={styles.progressIcon}>
                                    <MaterialIcons name="groups" size={24} color={cskColors[500]} />
                                </View>
                            </View>
                        </View>
                    </>
                )}

                {/* Manual Entry */}
                <TouchableOpacity
                    style={[styles.manualButton, { borderColor: isDark ? '#475569' : '#cbd5e1', backgroundColor: 'transparent' }]}
                    onPress={() => router.push({ pathname: '/attendance-list', params: { lessonId } })}
                >
                    <MaterialIcons name="list" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
                    <Text style={[styles.manualButtonText, { color: isDark ? '#94a3b8' : '#64748b' }]}>View Attendance List</Text>
                </TouchableOpacity>

            </View>

            {/* Footer */}
            {isLive && !isCompleted && (
                <View style={[styles.footer, { backgroundColor: isDark ? '#183327' : '#ffffff', borderColor: isDark ? '#2a4d3d' : '#cfe7dc' }]}>
                    <TouchableOpacity
                        style={[styles.endButton, { backgroundColor: errorColors[500], shadowColor: 'rgba(239, 68, 68, 0.4)' }]}
                        onPress={handleEndLesson}
                        disabled={endLesson.isPending}
                        activeOpacity={0.9}
                    >
                        {endLesson.isPending ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <>
                                <MaterialIcons name="stop" size={24} color="#ffffff" />
                                <Text style={styles.endButtonText}>End Lesson</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Show completed message */}
            {isCompleted && (
                <View style={[styles.footer, { backgroundColor: isDark ? '#183327' : '#ffffff', borderColor: isDark ? '#2a4d3d' : '#cfe7dc' }]}>
                    <View style={[styles.completedBanner, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e' }]}>
                        <MaterialIcons name="check-circle" size={24} color="#22c55e" />
                        <Text style={[styles.completedText, { color: '#22c55e' }]}>Lesson Completed</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerLabel: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        opacity: 0.7,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    pingContainer: {
        width: 10,
        height: 10,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    pingAnimate: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        opacity: 0.75,
        transform: [{ scale: 1.5 }],
    },
    liveText: {
        fontSize: 14,
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    titleContainer: {
        alignItems: 'center',
        gap: 8,
    },
    lessonTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        textAlign: 'center',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timerText: {
        fontSize: 30,
        fontFamily: Fonts.bold, // Monospace font preferred if available
        letterSpacing: -1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        padding: 24,
        gap: 32,
    },
    startSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
    },
    startPrompt: {
        fontSize: 18,
        fontFamily: Fonts.medium,
        textAlign: 'center',
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        gap: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    startButtonText: {
        color: '#ffffff',
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    qrSection: {
        width: '100%',
        alignItems: 'center',
        gap: 24,
    },
    qrCard: {
        width: width * 0.8,
        maxWidth: 320,
        aspectRatio: 1,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        position: 'relative',
    },
    qrImageContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    qrImage: {
        width: '100%',
        height: '100%',
        opacity: 0.9,
    },
    scanLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 2, // Slight bar
        // Need a gradient here really, using solid color for now or linear gradient if possible
        opacity: 0.5,
        shadowColor: cskColors[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    securityBadge: {
        position: 'absolute',
        bottom: -12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    securityText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
    },
    qrCountdownContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginTop: 12,
    },
    qrCountdownText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    refreshContainer: {
        alignItems: 'center',
        gap: 4,
    },
    refreshText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 4,
    },
    refreshButtonText: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
    },
    statsCard: {
        width: width * 0.8,
        maxWidth: 320,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
    },
    statsLabel: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    statsValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    statsValue: {
        fontSize: 30,
        fontFamily: Fonts.bold,
    },
    statsTotal: {
        fontSize: 18,
        fontFamily: Fonts.medium,
    },
    progressCircleContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    svg: {
        position: 'absolute',
    },
    progressIcon: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    manualButton: {
        width: width * 0.8,
        maxWidth: 320,
        height: 50,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    manualButtonText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
    endButton: {
        width: '100%',
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
    endButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    completedBanner: {
        width: '100%',
        height: 56,
        borderRadius: 12,
        borderWidth: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    completedText: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
});
