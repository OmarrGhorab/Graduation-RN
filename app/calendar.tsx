import { Fonts } from '@/constants/theme';
import { useCalendar } from '@/hooks/useCalendar';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/libs/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CalendarScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const user = useAuthStore(state => state.user);
    const isTeacher = user?.role === 'TEACHER';

    const { data, isLoading } = useCalendar();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'LIVE': return theme.primary;
            case 'COMPLETED': return theme.gray[400];
            case 'CANCELLED': return '#FF4444';
            default: return '#FFA500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'LIVE': return 'play-circle';
            case 'COMPLETED': return 'checkmark-circle';
            case 'CANCELLED': return 'close-circle';
            default: return 'time';
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    const lessons = data?.data || [];

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={isDark ? theme.text : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: isDark ? theme.text : '#000' }]}>
                    {isTeacher ? 'My Schedule' : 'My Calendar'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {lessons.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={64} color={theme.gray[300]} />
                        <Text style={[styles.emptyText, { color: theme.gray[500] }]}>
                            No upcoming lessons
                        </Text>
                    </View>
                ) : (
                    lessons.map((lesson) => {
                        const statusColor = getStatusColor(lesson.status);
                        const statusIcon = getStatusIcon(lesson.status);

                        return (
                            <TouchableOpacity
                                key={lesson.id}
                                style={[styles.lessonCard, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[100] }]}
                                onPress={() => router.push({ pathname: '/course-details', params: { id: lesson.courseId } })}
                            >
                                <View style={styles.lessonHeader}>
                                    <View style={styles.lessonInfo}>
                                        <Text style={[styles.lessonTitle, { color: isDark ? theme.text : '#000' }]}>
                                            {lesson.title}
                                        </Text>
                                        <Text style={[styles.courseTitle, { color: theme.gray[500] }]}>
                                            {lesson.course.title}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                                        <Ionicons name={statusIcon as any} size={14} color={statusColor} />
                                        <Text style={[styles.statusText, { color: statusColor }]}>
                                            {lesson.status}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.lessonMeta}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="calendar-outline" size={14} color={theme.gray[400]} />
                                        <Text style={[styles.metaText, { color: theme.gray[600] }]}>
                                            {new Date(lesson.scheduledAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="time-outline" size={14} color={theme.gray[400]} />
                                        <Text style={[styles.metaText, { color: theme.gray[600] }]}>
                                            {new Date(lesson.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="hourglass-outline" size={14} color={theme.gray[400]} />
                                        <Text style={[styles.metaText, { color: theme.gray[600] }]}>
                                            {lesson.durationMinutes} min
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.deliveryBadge}>
                                    <Ionicons
                                        name={lesson.deliveryType === 'ONLINE' ? 'videocam' : 'location'}
                                        size={12}
                                        color={theme.primary}
                                    />
                                    <Text style={[styles.deliveryText, { color: theme.primary }]}>
                                        {lesson.deliveryType}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
    },
    backBtn: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    content: {
        padding: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: Fonts.regular,
    },
    lessonCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    lessonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    lessonInfo: {
        flex: 1,
        marginRight: 12,
    },
    lessonTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        marginBottom: 4,
    },
    courseTitle: {
        fontSize: 13,
        fontFamily: Fonts.regular,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        textTransform: 'uppercase',
    },
    lessonMeta: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    deliveryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#097D4615',
        borderRadius: 8,
    },
    deliveryText: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        textTransform: 'uppercase',
    },
});
