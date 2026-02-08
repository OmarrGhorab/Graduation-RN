
import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface SyllabusItemProps {
    status: 'LIVE' | 'COMPLETED' | 'SCHEDULED' | 'ABSENT';
    title: string;
    description?: string;
    time: string;
    location: string;
    date?: string;
    isLast?: boolean;
    style?: ViewStyle;
    onPress?: () => void;
    onMarkAttendance?: () => void;
    onAbsentRequest?: () => void;
}

export default memo(function SyllabusItem({
    status,
    title,
    description,
    time,
    location,
    date,
    isLast,
    style,
    onPress,
    onMarkAttendance,
    onAbsentRequest,
}: SyllabusItemProps) {
    const { theme, isDark } = useTheme();

    const isLive = status === 'LIVE';
    const isCompleted = status === 'COMPLETED';
    const isScheduled = status === 'SCHEDULED';
    const isAbsent = status === 'ABSENT';

    return (
        <Animated.View
            entering={FadeInUp.delay(200).duration(500)}
            style={[styles.container, style]}
        >
            <View style={styles.timelineColumn}>
                {!isLast && (
                    <View style={[styles.timelineLine, {
                        backgroundColor: isDark ? theme.border : theme.gray[200]
                    }]} />
                )}
                {isLive && (
                    <View style={[styles.timelineIconLive, { borderColor: theme.primary, backgroundColor: theme.primary }]}>
                        <View style={[styles.timelineIconInner, { backgroundColor: '#FFFFFF' }]} />
                    </View>
                )}
                {isCompleted && (
                    <View style={[styles.timelineIconCompleted, {
                        borderColor: isDark ? theme.border : theme.gray[300],
                        backgroundColor: isDark ? theme.surface : '#FFFFFF'
                    }]}>
                        <Ionicons name="checkmark" size={10} color={isDark ? theme.gray[400] : theme.gray[600]} />
                    </View>
                )}
                {isScheduled && (
                    <View style={[styles.timelineIconScheduled, {
                        borderColor: isDark ? theme.border : theme.gray[300],
                        backgroundColor: isDark ? theme.surface : '#FFFFFF'
                    }]} />
                )}
                {isAbsent && (
                    <View style={[styles.timelineIconCompleted, {
                        borderColor: '#ef4444',
                        backgroundColor: isDark ? theme.surface : '#FFFFFF'
                    }]}>
                        <Ionicons name="close" size={10} color="#ef4444" />
                    </View>
                )}
            </View>

            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onPress}
                style={[{
                    backgroundColor: isLive ? (isDark ? theme.surface : '#FFFFFF') : 'transparent',
                    borderRadius: 16,
                    padding: isLive ? 16 : 0,
                    marginBottom: 24,
                    borderWidth: isLive ? 1 : 0,
                    borderColor: isLive ? theme.primary : 'transparent',
                    shadowColor: isLive ? theme.primary : '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isLive ? 0.15 : 0,
                    shadowRadius: isLive ? 12 : 0,
                    elevation: isLive ? 4 : 0,
                }, isCompleted && { opacity: 0.8 }]}
            >
                {isLive && (
                    <View style={[styles.liveHeader, { marginBottom: 8 }]}>
                        <View style={[styles.liveBadge, { backgroundColor: theme.primary }]}>
                            <View style={styles.liveBadgeDot} />
                            <Text style={styles.liveBadgeText}>LIVE NOW</Text>
                        </View>
                        <Text style={[styles.timeText, { color: theme.gray[500] }]}>{time}</Text>
                    </View>
                )}

                <View style={styles.contentHeader}>
                    <Text
                        style={[
                            styles.title,
                            {
                                color: isDark ? theme.text : theme.gray[900],
                                textDecorationLine: isCompleted ? 'line-through' : 'none',
                                opacity: isCompleted ? 0.6 : 1,
                            }
                        ]}
                    >
                        {title}
                    </Text>
                    {isCompleted && (
                        <Text style={[styles.statusText, { color: theme.primary }]}>Completed</Text>
                    )}
                    {isAbsent && (
                        <Text style={[styles.statusText, { color: '#ef4444' }]}>Absent</Text>
                    )}
                    {isScheduled && (
                        <View style={[styles.statusBadge, { backgroundColor: isDark ? theme.gray[800] : theme.gray[100] }]}>
                            <Text style={[styles.statusBadgeText, { color: theme.gray[500] }]}>UPCOMING</Text>
                        </View>
                    )}
                </View>

                <View style={[styles.metaRow, { marginTop: 4 }]}>
                    {date && (
                        <>
                            <Text style={[styles.metaText, { color: theme.gray[500] }]}>{date}</Text>
                            <View style={[styles.dot, { backgroundColor: theme.gray[300] }]} />
                        </>
                    )}
                    {!isLive && <Text style={[styles.metaText, { color: theme.gray[500] }]}>{time}</Text>}
                    {(!isLive && location) && <View style={[styles.dot, { backgroundColor: theme.gray[300] }]} />}
                    <Text style={[styles.metaText, { color: theme.gray[500] }]}>{location}</Text>
                </View>

                {description && (
                    <Text style={[styles.description, { color: theme.gray[500] }]}>{description}</Text>
                )}

                {isLive && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.primary }]}
                        onPress={onMarkAttendance}
                    >
                        <Ionicons name="qr-code-outline" size={18} color="#000000" />
                        <Text style={styles.actionButtonText}>Mark Attendance</Text>
                    </TouchableOpacity>
                )}

                {isAbsent && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ef4444' }]}
                        onPress={onAbsentRequest}
                    >
                        <Ionicons name="document-text-outline" size={18} color="#ef4444" />
                        <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Submit Absence Reason</Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
    },
    timelineColumn: {
        width: 32,
        alignItems: 'center',
        marginRight: 16,
    },
    timelineLine: {
        position: 'absolute',
        top: 24,
        bottom: -24,
        width: 2,
        left: '50%',
        marginLeft: -1,
    },
    timelineIconLive: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        marginTop: 4,
        // Pulse effect simulated with shadow/ring
        shadowColor: cskColors[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 4,
    },
    timelineIconInner: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    timelineIconCompleted: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        marginTop: 4,
        backgroundColor: '#FFFFFF',
    },
    timelineIconScheduled: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        zIndex: 1,
        marginTop: 6,
        backgroundColor: '#FFFFFF',
    },
    liveHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 4,
    },
    liveBadgeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#000000',
    },
    liveBadgeText: {
        color: '#000000',
        fontSize: 10,
        fontFamily: Fonts.bold,
        letterSpacing: 0.5,
    },
    contentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        flex: 1,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusBadgeText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    metaText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        marginHorizontal: 6,
    },
    description: {
        marginTop: 8,
        fontSize: 12,
        fontFamily: Fonts.regular,
        lineHeight: 16,
    },
    actionButton: {
        marginTop: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        color: '#000000',
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    timeText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
});
