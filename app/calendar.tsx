import { Fonts } from '@/constants/theme';
import { useCalendar } from '@/hooks/useCalendar';
import { useMySubjects } from '@/hooks/useCourses';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/libs/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

function CalendarSkeleton({ isDark, theme }: { isDark: boolean; theme: any }) {
    const shimmer = useSharedValue(0);

    React.useEffect(() => {
        shimmer.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
    }, []);

    const shimmerStyle = useAnimatedStyle(() => ({
        opacity: 0.4 + shimmer.value * 0.4,
    }));

    const bgColor = isDark ? theme.surface : '#FFFFFF';
    const lineColor = isDark ? theme.gray[700] : '#E5E7EB';

    return (
        <>
            {[0, 1, 2, 3].map((i) => (
                <Animated.View key={i} style={[shimmerStyle, styles.lessonCard, {
                    backgroundColor: bgColor,
                    borderColor: lineColor,
                    marginBottom: 12,
                }]}>
                    {/* Header row */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            <View style={{ width: '80%', height: 16, borderRadius: 6, backgroundColor: lineColor, marginBottom: 8 }} />
                            <View style={{ width: '55%', height: 12, borderRadius: 6, backgroundColor: lineColor }} />
                        </View>
                        <View style={{ width: 70, height: 26, borderRadius: 8, backgroundColor: lineColor }} />
                    </View>
                    {/* Meta row */}
                    <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8 }}>
                        <View style={{ width: 90, height: 12, borderRadius: 6, backgroundColor: lineColor }} />
                        <View style={{ width: 60, height: 12, borderRadius: 6, backgroundColor: lineColor }} />
                    </View>
                    {/* Location badge */}
                    <View style={{ width: 100, height: 22, borderRadius: 8, backgroundColor: lineColor, marginTop: 8 }} />
                </Animated.View>
            ))}
        </>
    );
}

export default function CalendarScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const user = useAuthStore(state => state.user);
    const [rangePreset, setRangePreset] = React.useState<'upcoming_7' | 'upcoming_30' | 'prev_7' | 'all'>('upcoming_30');
    const [statusFilter, setStatusFilter] = React.useState<'upcoming' | 'finished' | 'CANCELED' | 'all'>('all');
    const [selectedSubject, setSelectedSubject] = React.useState<string | null>(null);

    const { data: subjectsData } = useMySubjects();
    const subjects = subjectsData?.data || [];

    const { data, isLoading, isFetching } = useCalendar({
        range: rangePreset === 'all' ? undefined : rangePreset,
        status: statusFilter === 'all' ? undefined : statusFilter as any,
        subject: selectedSubject || undefined
    });

    const getStatusColor = (status: string) => {
        const s = (status || '').toUpperCase();
        switch (s) {
            case 'LIVE': return theme.primary;
            case 'COMPLETED': return theme.gray[400];
            case 'CANCELED':
            case 'CANCELLED': return '#FF4444';
            case 'SCHEDULED': return theme.primary;
            default: return theme.gray[400];
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

    const lessons = data?.data || [];

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={isDark ? theme.text : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: isDark ? theme.text : '#000' }]}>
                    {t('home.yourSchedule')}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.filtersContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        <TouchableOpacity
                            style={[styles.filterChip, rangePreset === 'all' && styles.filterChipActive]}
                            onPress={() => setRangePreset('all')}
                        >
                            <Text style={[styles.filterText, rangePreset === 'all' && styles.filterTextActive]}>{t('courses.all')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterChip, rangePreset === 'upcoming_7' && styles.filterChipActive]}
                            onPress={() => setRangePreset('upcoming_7')}
                        >
                            <Text style={[styles.filterText, rangePreset === 'upcoming_7' && styles.filterTextActive]}>{t('home.next7Days')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterChip, rangePreset === 'upcoming_30' && styles.filterChipActive]}
                            onPress={() => setRangePreset('upcoming_30')}
                        >
                            <Text style={[styles.filterText, rangePreset === 'upcoming_30' && styles.filterTextActive]}>{t('home.next30Days')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterChip, rangePreset === 'prev_7' && styles.filterChipActive]}
                            onPress={() => setRangePreset('prev_7')}
                        >
                            <Text style={[styles.filterText, rangePreset === 'prev_7' && styles.filterTextActive]}>{t('home.pastWeek')}</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        <TouchableOpacity
                            style={[styles.statusChip, statusFilter === 'all' && styles.statusChipActive]}
                            onPress={() => setStatusFilter('all')}
                        >
                            <Text style={[styles.statusTabText, statusFilter === 'all' && styles.statusTabTextActive]}>{t('home.allStatuses')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.statusChip, statusFilter === 'upcoming' && styles.statusChipActive]}
                            onPress={() => setStatusFilter('upcoming')}
                        >
                            <Text style={[styles.statusTabText, statusFilter === 'upcoming' && styles.statusTabTextActive]}>{t('home.upcomingFilter')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.statusChip, statusFilter === 'finished' && styles.statusChipActive]}
                            onPress={() => setStatusFilter('finished')}
                        >
                            <Text style={[styles.statusTabText, statusFilter === 'finished' && styles.statusTabTextActive]}>{t('home.finishedFilter')}</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Subject Filter */}
                    {subjects.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                            <TouchableOpacity
                                style={[styles.subjectChip, !selectedSubject && styles.subjectChipActive]}
                                onPress={() => setSelectedSubject(null)}
                            >
                                <Text style={[styles.subjectText, !selectedSubject && styles.subjectTextActive]}>{t('courses.all')}</Text>
                            </TouchableOpacity>
                            {subjects.map((subject: any) => (
                                <TouchableOpacity
                                    key={subject.id}
                                    style={[styles.subjectChip, selectedSubject === subject.id && styles.subjectChipActive]}
                                    onPress={() => setSelectedSubject(subject.id)}
                                >
                                    <Text style={[styles.subjectText, selectedSubject === subject.id && styles.subjectTextActive]}>{subject.name || subject.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {(isLoading || isFetching) ? (
                    <CalendarSkeleton isDark={isDark} theme={theme} />
                ) : lessons.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={64} color={theme.gray[300]} />
                        <Text style={[styles.emptyText, { color: theme.gray[500] }]}>
                            {t('home.noLessons')}
                        </Text>
                    </View>
                ) : (
                    lessons.map((lesson: any) => {
                        const statusColor = getStatusColor(lesson.status);
                        const statusIcon = getStatusIcon(lesson.status);

                        return (
                            <TouchableOpacity
                                key={lesson.id}
                                style={[styles.lessonCard, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[100] }]}
                                onPress={() => {
                                    if (user?.role === 'TEACHER') {
                                        const statusUpper = (lesson.status || '').toUpperCase();
                                        if (statusUpper === 'COMPLETED' || statusUpper === 'FINISHED') {
                                            router.push({ pathname: '/lesson-analytics', params: { lessonId: lesson.id, courseId: lesson.courseId } });
                                            return;
                                        }
                                        router.push({ pathname: '/teacher-control', params: { lessonId: lesson.id } });
                                    } else {
                                        router.push({ pathname: '/course-details', params: { id: lesson.courseId } });
                                    }
                                }}
                            >
                                <View style={styles.lessonHeader}>
                                    <View style={styles.lessonInfo}>
                                        <Text style={[styles.lessonTitle, { color: isDark ? theme.text : '#000' }]} numberOfLines={1}>
                                            {lesson.title}
                                        </Text>
                                        <Text style={[styles.courseTitle, { color: theme.gray[500] }]} numberOfLines={1}>
                                            {lesson.courseTitle}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                                        <Ionicons name={statusIcon as any} size={14} color={statusColor} />
                                        <Text style={[styles.statusText, { color: statusColor }]}>
                                            {t(`home.${(lesson.status || '').toLowerCase()}`)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.lessonMeta}>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="calendar-outline" size={14} color={theme.gray[400]} />
                                        <Text style={[styles.metaText, { color: theme.gray[600] }]}>
                                            {new Date(lesson.scheduledAt || lesson.startTime).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <Ionicons name="time-outline" size={14} color={theme.gray[400]} />
                                        <Text style={[styles.metaText, { color: theme.gray[600] }]}>
                                            {new Date(lesson.scheduledAt || lesson.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                </View>

                                {lesson.location && (
                                    <View style={[styles.deliveryBadge, { marginTop: 8 }]}>
                                        <Ionicons
                                            name="location"
                                            size={12}
                                            color={theme.primary}
                                        />
                                        <Text style={[styles.deliveryText, { color: theme.primary }]}>
                                            {lesson.location}
                                        </Text>
                                    </View>
                                )}
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
    filtersContainer: {
        marginBottom: 20,
        gap: 12,
    },
    filterScroll: {
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    filterChipActive: {
        backgroundColor: '#097D46',
        borderColor: '#097D46',
    },
    filterText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: '#666',
    },
    filterTextActive: {
        color: '#fff',
    },
    statusChip: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    statusChipActive: {
        backgroundColor: '#f1f5f9',
        borderColor: '#cbd5e1',
    },
    statusTabText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: '#64748b',
    },
    statusTabTextActive: {
        color: '#0f172a',
    },
    subjectChip: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#f1f1f1',
        borderWidth: 1,
        borderColor: '#e8e8e8',
    },
    subjectChipActive: {
        backgroundColor: '#e6f3ed',
        borderColor: '#097D46',
    },
    subjectText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: '#666',
    },
    subjectTextActive: {
        color: '#097D46',
    },
});
