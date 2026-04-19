import { errorColors, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

export type LessonStatus = 'LIVE' | 'SCHEDULED' | 'COMPLETED' | 'CANCELED';

interface ScheduleCardProps {
    id: string;
    title: string;
    time: string;
    teacherName: string;
    status: LessonStatus;
    location?: string;
    isLast?: boolean; // New prop to handle timeline connecting line
    attendanceStatus?: 'PRESENT' | 'LATE' | 'ABSENT' | null;
    isTeacher?: boolean;
    canMarkAttendance?: boolean;
    onPress?: () => void;
    onScanPress?: () => void;
}

export default function ScheduleCard({
    title,
    time,
    teacherName,
    status,
    location,
    isLast = false,
    attendanceStatus,
    isTeacher,
    canMarkAttendance,
    onPress,
    onScanPress,
}: ScheduleCardProps) {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();

    // Pulse animation for LIVE status
    const pulseAnim = useSharedValue(1);

    useEffect(() => {
        if (status === 'LIVE') {
            pulseAnim.value = withRepeat(
                withSequence(
                    withTiming(1.2, { duration: 1000 }),
                    withTiming(1, { duration: 1000 })
                ),
                -1,
                true
            );
        } else {
            pulseAnim.value = 1;
        }
    }, [status]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseAnim.value }],
        opacity: status === 'LIVE' ? withSequence(withTiming(0.6, { duration: 1000 }), withTiming(1, { duration: 1000 })) : 1,
    }));

    const statusUpper = (status || '').toUpperCase();
    const isLive = statusUpper === 'LIVE';
    const isCompleted = statusUpper === 'COMPLETED';
    const isCanceled = statusUpper === 'CANCELED';
    const isFuture = statusUpper === 'SCHEDULED';
    const hasAttended = attendanceStatus === 'PRESENT' || attendanceStatus === 'LATE';
    const canScan = (isLive || canMarkAttendance === true) && !hasAttended && !isTeacher;

    // Timeline Icon Logic
    const renderTimelineIcon = () => {
        if (isLive) {
            return (
                <View style={[styles.timelineIconContainerLive, { borderColor: theme.primary, backgroundColor: isDark ? theme.background : '#FFFFFF' }]}>
                    <Animated.View style={[styles.livePulseBg, { backgroundColor: theme.primary }, pulseStyle]} />
                    <Ionicons name="play" size={18} color={theme.primary} style={{ marginLeft: 2 }} />
                </View>
            );
        } else if (isCompleted || hasAttended) {
            return (
                <View style={[styles.timelineIconContainer, { backgroundColor: isDark ? theme.gray[800] : theme.gray[100], borderColor: isDark ? theme.gray[700] : theme.gray[200] }]}>
                    <Ionicons name="checkmark" size={16} color={theme.primary} />
                </View>
            );
        } else {
            // Future / Canceled
            return (
                <View style={[styles.timelineIconContainer, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.gray[700] : theme.gray[200] }]}>
                    <Ionicons name={isCanceled ? "close" : "time"} size={16} color={isCanceled ? errorColors[500] : theme.primary} />
                </View>
            );
        }
    };

    // Card Styles
    const cardBg = isLive
        ? isDark ? theme.surface : '#FFFFFF' // The snippet usually keeps card white/surface but adds effects
        : isDark ? theme.surface : '#FFFFFF';

    const cardBorderColor = isLive
        ? 'rgba(9, 125, 70, 0.2)' // Primary with opacity
        : 'transparent';

    const cardShadowStyle = isLive
        ? styles.shadowGlow
        : styles.shadowSoft;

    return (
        <View style={styles.row}>
            {/* Timeline Column */}
            <View style={styles.timelineColumn}>
                {/* Connecting Line */}
                {!isLast && (
                    <View style={[styles.timelineLine, { backgroundColor: isDark ? theme.gray[700] : theme.gray[200] }]} />
                )}
                {renderTimelineIcon()}
            </View>

            {/* Content Column */}
            <TouchableOpacity
                style={[
                    styles.cardContainer,
                    cardShadowStyle,
                    {
                        backgroundColor: cardBg,
                        borderColor: cardBorderColor,
                        borderWidth: isLive ? 1 : 0, // Only live has visible border in this design usually
                        opacity: isCompleted && !isLive ? 0.6 : 1, // Fade out past items
                    }
                ]}
                activeOpacity={0.8}
                onPress={onPress}
            >
                {isLive && <View style={[styles.activeStrip, { backgroundColor: theme.primary }]} />}

                {/* Header: Time & Status */}
                <View style={styles.cardHeader}>
                    <Text style={[styles.timeText, { color: isLive ? theme.primary : (isDark ? theme.gray[400] : theme.gray[500]) }]}>
                        {time}
                    </Text>
                    {canScan && (
                        <TouchableOpacity onPress={onScanPress} style={[styles.liveBadge, { backgroundColor: 'rgba(9, 125, 70, 0.1)', borderColor: 'rgba(9, 125, 70, 0.2)' }]}>
                            <View style={[styles.liveDot, { backgroundColor: theme.primary }]} />
                            <Text style={[styles.liveText, { color: theme.primary }]}>{t('courseDetails.markAttendance').toUpperCase()}</Text>
                        </TouchableOpacity>
                    )}
                    {(isLive && isTeacher) && (
                        <View style={[styles.liveBadge, { backgroundColor: 'rgba(18, 237, 135, 0.1)', borderColor: 'rgba(18, 237, 135, 0.2)' }]}>
                            <View style={[styles.liveDot, { backgroundColor: '#12ed87' }]} />
                            <Text style={[styles.liveText, { color: '#12ed87' }]}>{t('home.liveManage').toUpperCase()}</Text>
                        </View>
                    )}
                    {isCompleted && isTeacher && (
                        <View style={[styles.liveBadge, { backgroundColor: 'rgba(100, 116, 139, 0.1)', borderColor: 'rgba(100, 116, 139, 0.2)' }]}>
                            <Ionicons name="checkmark-done-circle" size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                            <Text style={[styles.liveText, { color: isDark ? '#94a3b8' : '#64748b', marginLeft: 4 }]}>{t('home.completed').toUpperCase()}</Text>
                        </View>
                    )}
                    {isCanceled && (
                        <View style={[styles.liveBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                            <Ionicons name="close-circle" size={12} color="#ef4444" />
                            <Text style={[styles.liveText, { color: '#ef4444', marginLeft: 4 }]}>{t('home.canceled').toUpperCase()}</Text>
                        </View>
                    )}
                </View>

                {/* Title */}
                <Text style={[styles.title, { color: isDark ? theme.text : '#0d1b15' }]} numberOfLines={1}>
                    {title}
                </Text>

                {/* Location & Teacher/Avatar */}
                <View style={styles.cardFooter}>
                    <View style={styles.locationContainer}>
                        <Ionicons name="location-sharp" size={14} color={isDark ? theme.gray[400] : '#4c9a75'} />
                        <Text style={[styles.locationText, { color: isDark ? theme.gray[400] : '#4c9a75' }]}>
                            {location || t('home.classroom')}
                        </Text>
                    </View>

                    <Text style={[styles.teacherText, { color: theme.gray[500] }]}>{teacherName}</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        paddingBottom: 24, // Space between items
    },
    timelineColumn: {
        width: 40,
        alignItems: 'center',
        marginRight: 12,
    },
    timelineLine: {
        position: 'absolute',
        top: 20, // Start below the icon center
        bottom: -24, // Extend to next item
        width: 2,
        left: '50%',
        marginLeft: -1,
        zIndex: 0,
    },
    timelineIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    timelineIconContainerLive: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        // Shadow for live bubble
        shadowColor: '#12ed87', // Primary approximate
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    livePulseBg: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 20,
        opacity: 0.2,
    },
    cardContainer: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        justifyContent: 'center',
        overflow: 'hidden', // For the left strip
    },
    shadowSoft: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    shadowGlow: {
        shadowColor: '#12ed87',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    activeStrip: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    timeText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    liveText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        marginBottom: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        marginLeft: 4,
    },
    teacherText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
});
