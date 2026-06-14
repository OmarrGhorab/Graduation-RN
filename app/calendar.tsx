import { cskColors, Fonts } from '@/constants/theme';
import { useCalendar } from '@/hooks/useCalendar';
import { useMySubjects } from '@/hooks/useCourses';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/libs/auth';
import { ApiSchedule } from '@/services/CalendarService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Skeleton ───────────────────────────────────────────────────────────────
function CalendarSkeleton({ isDark, theme }: { isDark: boolean; theme: any }) {
    const shimmer = useSharedValue(0);
    React.useEffect(() => {
        shimmer.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
    }, []);
    const shimmerStyle = useAnimatedStyle(() => ({ opacity: 0.4 + shimmer.value * 0.4 }));
    const bg = isDark ? theme.surface : '#FFFFFF';
    const line = isDark ? theme.gray[700] : '#E5E7EB';

    return (
        <>
            {[0, 1, 2, 3].map((i) => (
                <Animated.View key={i} style={[shimmerStyle, {
                    backgroundColor: bg, borderRadius: 16, padding: 16,
                    marginBottom: 12, borderWidth: 1, borderColor: line,
                }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            <View style={{ width: '75%', height: 16, borderRadius: 6, backgroundColor: line, marginBottom: 8 }} />
                            <View style={{ width: '50%', height: 12, borderRadius: 6, backgroundColor: line }} />
                        </View>
                        <View style={{ width: 72, height: 28, borderRadius: 10, backgroundColor: line }} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 16, marginBottom: 10 }}>
                        <View style={{ width: 90, height: 12, borderRadius: 6, backgroundColor: line }} />
                        <View style={{ width: 60, height: 12, borderRadius: 6, backgroundColor: line }} />
                    </View>
                    <View style={{ width: 110, height: 24, borderRadius: 8, backgroundColor: line }} />
                </Animated.View>
            ))}
        </>
    );
}

// ─── Status config ───────────────────────────────────────────────────────────
type LessonStatus = 'LIVE' | 'SCHEDULED' | 'COMPLETED' | 'CANCELED';

function statusConfig(status: LessonStatus, primary: string) {
    switch (status) {
        case 'LIVE':       return { color: '#22c55e', bg: '#22c55e18', icon: 'play-circle' as const, label: 'LIVE' };
        case 'COMPLETED':  return { color: '#64748b', bg: '#64748b15', icon: 'checkmark-circle' as const, label: 'DONE' };
        case 'CANCELED':   return { color: '#ef4444', bg: '#ef444415', icon: 'close-circle' as const, label: 'CANCELED' };
        default:           return { color: primary,   bg: `${primary}15`, icon: 'time' as const, label: 'UPCOMING' };
    }
}

function attendanceBadge(status: string) {
    switch (status) {
        case 'PRESENT': return { color: '#22c55e', bg: '#22c55e18', icon: 'checkmark-circle' as const, label: 'PRESENT' };
        case 'LATE':    return { color: '#f59e0b', bg: '#f59e0b18', icon: 'time-outline' as const,      label: 'LATE'    };
        case 'ABSENT':  return { color: '#ef4444', bg: '#ef444418', icon: 'close-circle' as const,      label: 'ABSENT'  };
        default:        return null;
    }
}

// ─── Live pulse dot ──────────────────────────────────────────────────────────
function LiveDot() {
    const scale = useSharedValue(1);
    React.useEffect(() => {
        scale.value = withRepeat(withSequence(withTiming(1.4, { duration: 700 }), withTiming(1, { duration: 700 })), -1, false);
    }, []);
    const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: 1.8 - scale.value }));
    return (
        <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[{ position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' }, style]} />
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' }} />
        </View>
    );
}

// ─── Chip ────────────────────────────────────────────────────────────────────
function Chip({ label, active, onPress, isDark }: { label: string; active: boolean; onPress: () => void; isDark: boolean }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.chip, active && { backgroundColor: cskColors[500], borderColor: cskColors[500] },
                !active && { backgroundColor: isDark ? '#1e3329' : '#f1f5f9', borderColor: isDark ? '#2a4a38' : '#e2e8f0' }]}
        >
            <Text style={[styles.chipText, { color: active ? '#fff' : (isDark ? '#94a3b8' : '#64748b') }]}>{label}</Text>
        </TouchableOpacity>
    );
}

// ─── Lesson Card ─────────────────────────────────────────────────────────────
function LessonCard({ lesson, onPress, isDark, theme, isParent, isTeacher }: {
    lesson: ApiSchedule; onPress: () => void; isDark: boolean; theme: any; isParent: boolean; isTeacher: boolean;
}) {
    const { t, locale } = useTranslation();
    const status = (lesson.status || 'SCHEDULED') as LessonStatus;
    const isLive = status === 'LIVE';
    const isCanceled = status === 'CANCELED';
    const cfg = statusConfig(status, theme.primary);
    const attendBadge = lesson.attendanceStatus ? attendanceBadge(lesson.attendanceStatus) : null;

    const startDate = new Date(lesson.startTime);
    const endDate = new Date(lesson.endTime);
    const dateStr = startDate.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = `${startDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} – ${endDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.82}
            style={[styles.card, {
                backgroundColor: isDark ? theme.surface : '#FFFFFF',
                borderColor: isLive ? `${cfg.color}40` : (isDark ? theme.gray[800] : theme.gray[100]),
                borderWidth: isLive ? 1.5 : 1,
                shadowColor: isLive ? cfg.color : '#000',
                shadowOpacity: isLive ? 0.18 : 0.05,
            }]}
        >
            {isLive && <View style={[styles.liveStrip, { backgroundColor: cfg.color }]} />}

            {/* Header row */}
            <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={[styles.cardTitle, { color: isDark ? '#f1f5f9' : '#0f172a' }]} numberOfLines={1}>
                        {lesson.title}
                    </Text>
                    <Text style={[styles.cardCourse, { color: theme.gray[500] }]} numberOfLines={1}>
                        {lesson.courseTitle}
                    </Text>
                </View>

                {/* Status badge */}
                <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                    {isLive ? <LiveDot /> : <Ionicons name={cfg.icon} size={13} color={cfg.color} />}
                    <Text style={[styles.badgeText, { color: cfg.color, marginLeft: isLive ? 5 : 4 }]}>
                        {cfg.label === 'LIVE' ? t('home.live') : 
                         cfg.label === 'DONE' ? t('home.completed') : 
                         cfg.label === 'CANCELED' ? t('home.canceled') : 
                         t('home.scheduled')}
                    </Text>
                </View>
            </View>

            {/* Date + time */}
            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color={theme.gray[400]} />
                    <Text style={[styles.metaText, { color: isDark ? theme.gray[300] : theme.gray[600] }]}>{dateStr}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color={theme.gray[400]} />
                    <Text style={[styles.metaText, { color: isDark ? theme.gray[300] : theme.gray[600] }]}>{timeStr}</Text>
                </View>
            </View>

            {/* Bottom row: location + badges */}
            <View style={[styles.metaRow, { marginTop: 8, flexWrap: 'wrap', gap: 6 }]}>
                {lesson.location ? (
                    <View style={[styles.tagBadge, { backgroundColor: `${theme.primary}15` }]}>
                        <Ionicons name="location-outline" size={11} color={theme.primary} />
                        <Text style={[styles.tagText, { color: theme.primary }]}>{lesson.location}</Text>
                    </View>
                ) : null}

                {/* Attendance badge for student/parent */}
                {!isTeacher && attendBadge && (
                    <View style={[styles.tagBadge, { backgroundColor: attendBadge.bg }]}>
                        <Ionicons name={attendBadge.icon} size={11} color={attendBadge.color} />
                        <Text style={[styles.tagText, { color: attendBadge.color }]}>
                            {attendBadge.label === 'PRESENT' ? t('home.attendancePresent') : 
                             attendBadge.label === 'LATE' ? t('home.attendanceLate') : 
                             t('home.attendanceAbsent')}
                        </Text>
                    </View>
                )}

                {/* Can mark attendance */}
                {!isTeacher && !lesson.attendanceStatus && lesson.canMarkAttendance && (
                    <View style={[styles.tagBadge, { backgroundColor: `${theme.primary}15`, borderWidth: 1, borderColor: `${theme.primary}40` }]}>
                        <Ionicons name="qr-code-outline" size={11} color={theme.primary} />
                        <Text style={[styles.tagText, { color: theme.primary }]}>{t('home.scanQR')}</Text>
                    </View>
                )}

                {/* Parent child label */}
                {isParent && lesson.childName && (
                    <View style={[styles.tagBadge, { backgroundColor: '#8b5cf615' }]}>
                        <Ionicons name="person-outline" size={11} color="#8b5cf6" />
                        <Text style={[styles.tagText, { color: '#8b5cf6' }]}>{lesson.childName}</Text>
                    </View>
                )}

                {isCanceled && (
                    <View style={[styles.tagBadge, { backgroundColor: '#ef444415' }]}>
                        <Ionicons name="ban-outline" size={11} color="#ef4444" />
                        <Text style={[styles.tagText, { color: '#ef4444' }]}>{t('home.lessonCanceled')}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function CalendarScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const user = useAuthStore(state => state.user);
    const isTeacher = user?.role === 'TEACHER';
    const isParent = user?.role === 'PARENT';

    const [rangePreset, setRangePreset] = React.useState<'upcoming_7' | 'upcoming_30' | 'prev_7' | 'all'>('upcoming_30');
    const [statusFilter, setStatusFilter] = React.useState<'upcoming' | 'finished' | 'CANCELED' | 'all'>('all');
    const [selectedSubject, setSelectedSubject] = React.useState<string | null>(null);

    const { data: subjectsData } = useMySubjects();
    const subjects = subjectsData?.data || [];

    const filters = {
        range: rangePreset === 'all' ? undefined : rangePreset,
        status: statusFilter === 'all' ? undefined : statusFilter as any,
        subject: selectedSubject || undefined,
    };

    const { data, isLoading, isFetching, refetch } = useCalendar(filters);

    const lessons: ApiSchedule[] = data?.data || [];
    // Show skeleton only on the very first load (no data yet)
    const showSkeleton = isLoading && lessons.length === 0;

    const handleLessonPress = (lesson: ApiSchedule) => {
        const s = (lesson.status || '').toUpperCase();
        if (isTeacher) {
            if (s === 'LIVE') {
                router.push({ pathname: '/teacher-control', params: { lessonId: lesson.id } });
            } else if (s === 'COMPLETED') {
                router.push({ pathname: '/lesson-analytics', params: { lessonId: lesson.id, courseId: lesson.courseId } });
            } else if (s === 'SCHEDULED') {
                router.push({ pathname: '/edit-lesson', params: { lessonId: lesson.id, courseId: lesson.courseId } });
            }
            // CANCELED → no action
        } else {
            router.push({ pathname: '/course-details', params: { id: lesson.courseId } });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#F6F8F7' }]}>
            {/* Header */}
            <View style={[styles.header, {
                backgroundColor: isDark ? '#183327' : '#FFFFFF',
                paddingTop: insets.top + 12,
                borderBottomColor: isDark ? '#1f3b2e' : '#f1f5f9',
            }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={isDark ? '#f1f5f9' : '#0f172a'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#f1f5f9' : '#0f172a' }]}>
                    {isParent ? t('home.childrenSchedule') : t('home.yourSchedule')}
                </Text>
                {isFetching && !isLoading ? (
                    <Ionicons name="sync-outline" size={18} color={theme.primary} style={{ marginRight: 4 }} />
                ) : (
                    <View style={{ width: 24 }} />
                )}
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={cskColors[500]} colors={[cskColors[500]]} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Filters */}
                <View style={styles.filtersBlock}>
                    {/* Range */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
                        {([
                            { label: t('courses.all'), value: 'all' },
                            { label: t('home.next7Days'),  value: 'upcoming_7' },
                            { label: t('home.next30Days'), value: 'upcoming_30' },
                            { label: t('home.pastWeek'),   value: 'prev_7' },
                        ] as const).map(opt => (
                            <Chip key={opt.value} label={opt.label} active={rangePreset === opt.value} onPress={() => setRangePreset(opt.value)} isDark={isDark} />
                        ))}
                    </ScrollView>

                    {/* Status */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
                        {([
                            { label: t('courses.all'),      value: 'all' },
                            { label: t('home.upcomingFilter'), value: 'upcoming' },
                            { label: t('home.finishedFilter'), value: 'finished' },
                            { label: t('home.canceledFilter'), value: 'CANCELED' },
                        ] as const).map(opt => (
                            <Chip key={opt.value} label={opt.label} active={statusFilter === opt.value} onPress={() => setStatusFilter(opt.value)} isDark={isDark} />
                        ))}
                    </ScrollView>

                    {/* Subjects */}
                    {subjects.length > 0 && !isParent && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
                            <Chip label={t('courses.all')} active={!selectedSubject} onPress={() => setSelectedSubject(null)} isDark={isDark} />
                            {subjects.map((s: any) => (
                                <Chip
                                    key={s.id}
                                    label={s.name || s.title}
                                    active={selectedSubject === s.id}
                                    onPress={() => setSelectedSubject(s.id)}
                                    isDark={isDark}
                                />
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Count */}
                {!showSkeleton && lessons.length > 0 && (
                    <Text style={[styles.countLabel, { color: theme.gray[500] }]}>
                        {t('home.lessons', { count: lessons.length })}
                    </Text>
                )}

                {/* List */}
                {showSkeleton ? (
                    <CalendarSkeleton isDark={isDark} theme={theme} />
                ) : lessons.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={56} color={theme.gray[300]} />
                        <Text style={[styles.emptyTitle, { color: isDark ? theme.gray[300] : theme.gray[600] }]}>
                            {t('home.noLessons')}
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: theme.gray[400] }]}>
                            {t('home.noLessonsSubtitle')}
                        </Text>
                    </View>
                ) : (
                    lessons.map((lesson) => (
                        <LessonCard
                            key={`${lesson.id}-${lesson.childId ?? ''}`}
                            lesson={lesson}
                            onPress={() => handleLessonPress(lesson)}
                            isDark={isDark}
                            theme={theme}
                            isParent={isParent}
                            isTeacher={isTeacher}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 3,
    },
    backBtn: { padding: 4, width: 32 },
    headerTitle: { fontSize: 18, fontFamily: Fonts.bold, flex: 1, textAlign: 'center' },
    content: { padding: 16 },
    filtersBlock: { gap: 10, marginBottom: 16 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 20, borderWidth: 1,
    },
    chipText: { fontSize: 13, fontFamily: Fonts.medium },
    countLabel: { fontSize: 12, fontFamily: Fonts.medium, marginBottom: 12 },
    card: {
        borderRadius: 16, padding: 16, marginBottom: 12,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10, elevation: 2,
        overflow: 'hidden',
    },
    liveStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    cardTitle: { fontSize: 15, fontFamily: Fonts.semiBold, marginBottom: 3 },
    cardCourse: { fontSize: 12, fontFamily: Fonts.regular },
    badge: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    },
    badgeText: { fontSize: 10, fontFamily: Fonts.bold },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, fontFamily: Fonts.regular },
    tagBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    tagText: { fontSize: 10, fontFamily: Fonts.semiBold },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 17, fontFamily: Fonts.semiBold, marginTop: 16, marginBottom: 6 },
    emptySubtitle: { fontSize: 13, fontFamily: Fonts.regular },
});
