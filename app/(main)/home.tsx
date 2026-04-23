import CalendarModal from '@/components/CalendarModal';
import HomeHeader from '@/components/HomeHeader';
import NotificationModal from '@/components/NotificationModal';
import QRScannerModal from '@/components/course/QRScannerModal';
import { ScheduleCard, SubjectCard, TeacherDashboardSummary } from '@/components/home';
import { ParentMonitoringSuite } from '@/components/home/ParentMonitoringSuite';
import { Fonts, cskColors, errorColors } from '@/constants/theme';
import { useCalendar, useStudentCalendar, useTeacherCalendar } from '@/hooks/useCalendar';
import { useMySubjects } from '@/hooks/useCourses';
import {
    useDeleteNotificationMutation,
    useMarkAllAsReadMutation,
    useMarkAsReadMutation,
    useNotifications,
    NOTIFICATIONS_QUERY_KEY,
} from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/libs/auth';
import { logger } from '@/libs/logger';
import { ApiSchedule } from '@/services/CalendarService';
import { ApiSubject, scanAttendance } from '@/services/CourseService';
import { DeviceService } from '@/services/DeviceService';
import { ApiNotification } from '@/services/NotificationService';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedScrollHandler,
    useSharedValue,
} from 'react-native-reanimated';


const getSubjectIcon = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const name = (iconName || '').toLowerCase();
    if (name.includes('calculator')) return 'calculator';
    if (name.includes('magnet')) return 'magnet';
    if (name.includes('flask')) return 'flask';
    if (name.includes('leaf')) return 'leaf';
    if (name.includes('code') || name.includes('laptop')) return 'code-slash';
    if (name.includes('book')) return 'book';
    if (name.includes('megaphone')) return 'megaphone';
    return 'school';
};

const ensureUTC = (dateStr: string) => {
    if (!dateStr) return dateStr;
    if (dateStr.includes('T') || dateStr.includes('Z') || dateStr.includes('+')) return dateStr;
    return dateStr.replace(' ', 'T') + 'Z';
};

const formatTimeRange = (start: string, end: string) => {
    try {
        const startDate = new Date(ensureUTC(start));
        const endDate = new Date(ensureUTC(end));
        
        return `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')} - ${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
    } catch (e) {
        return 'TBD';
    }
};



export default function MainHomeScreen() {
    const router = useRouter();
    const { action } = useLocalSearchParams<{ action?: string }>();
    const queryClient = useQueryClient();
    const { theme, isDark } = useTheme();
    const { t, locale } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [isScannerVisible, setIsScannerVisible] = React.useState(false);
    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const [datePickerMode, setDatePickerMode] = React.useState<'start' | 'end'>('start');
    const [startDate, setStartDate] = React.useState(new Date());
    const [endDate, setEndDate] = React.useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 7); // Default to 7 days from now
        return date;
    });
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [rangePreset, setRangePreset] = React.useState<'upcoming_7' | 'upcoming_30' | 'prev_7' | 'manual'>('upcoming_7');
    const [statusFilter, setStatusFilter] = React.useState<'upcoming' | 'finished' | 'CANCELED' | 'all'>('upcoming');
    const [selectedSubject, setSelectedSubject] = React.useState<string | null>(null);

    const isTeacher = user?.role === 'TEACHER';

    // Handle deep-linked actions (e.g., from notifications)
    React.useEffect(() => {
        if (action === 'scan' && !isScannerVisible) {
            logger.log('[Home] Deep link action: scan');
            setIsScannerVisible(true);
            
            // Clear the param to prevent re-triggering if user returns to this screen
            // Use setTimeout to ensure the modal has started opening and state is updated
            setTimeout(() => {
                router.setParams({ action: undefined });
            }, 500);
        }
    }, [action, isScannerVisible]);

    // Calculate dates for calendar based on selected date range
    const calendarFilters = React.useMemo(() => {
        const filters: any = {};
        
        if (rangePreset !== 'manual') {
            filters.range = rangePreset;
        } else {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filters.start = start.toISOString();
            filters.end = end.toISOString();
        }

        if (statusFilter !== 'all') {
            filters.status = statusFilter;
        }

        if (selectedSubject) {
            filters.subject = selectedSubject;
        }

        return filters;
    }, [startDate, endDate, rangePreset, statusFilter, selectedSubject]);

    // Scroll tracking for header animation
    const scrollY = useSharedValue(0);
    const lastScrollY = useSharedValue(0);
    const headerTranslateY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            const currentScrollY = event.contentOffset.y;
            const diff = currentScrollY - lastScrollY.value;

            // Simple header hide/show logic on scroll
            if (currentScrollY > 0) {
                if (diff > 0) {
                    headerTranslateY.value = Math.min(headerTranslateY.value + diff, 150);
                } else {
                    headerTranslateY.value = Math.max(headerTranslateY.value + diff, 0);
                }
            } else {
                headerTranslateY.value = 0;
            }

            lastScrollY.value = currentScrollY;
            scrollY.value = headerTranslateY.value;
        },
    });

    // React Query hooks for notifications
    const {
        notifications,
        unreadCount,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refetch,
    } = useNotifications();

    const { data: subjectsData, isLoading: isLoadingSubjects } = useMySubjects();
    
    // Use appropriate calendar based on user role
    const { 
        data: calendarData, 
        isLoading: isLoadingCalendar,
        refetch: refetchCalendar
    } = useCalendar(calendarFilters);

    const subjects = React.useMemo(() => {
        return subjectsData?.data?.map((subject: ApiSubject) => ({
            id: subject.id,
            name: subject.name,
            icon: getSubjectIcon(subject.icon)
        })) || [];
    }, [subjectsData]);

    // Force refresh calendar data when screen comes into focus
    // This ensures that returning from the success screen shows updated attendance status
    useFocusEffect(
        React.useCallback(() => {
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
        }, [queryClient])
    );

    const schedule = React.useMemo(() => {
        const mapped = calendarData?.data?.map((item: ApiSchedule) => ({
            id: item.id,
            courseId: item.courseId,
            title: item.courseTitle,
            time: formatTimeRange(item.startTime, item.endTime),
            teacherName: item.title, // Lesson title as sub-info
            status: item.status,
            location: item.location,
            attendanceStatus: item.attendanceStatus,
            canMarkAttendance: item.canMarkAttendance,
            startTime: ensureUTC(item.startTime),
            endTime: ensureUTC(item.endTime)
        })) || [];

        // Smart Priority Sorting: LIVE > SCHEDULED > etc
        return mapped.sort((a: any, b: any) => {
            // 1. LIVE always at top
            if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
            if (a.status !== 'LIVE' && b.status === 'LIVE') return 1;

            // 2. SCHEDULED next
            if (a.status === 'SCHEDULED' && b.status === 'COMPLETED') return -1;
            if (a.status === 'COMPLETED' && b.status === 'SCHEDULED') return 1;

            if (a.status === 'CANCELED' && b.status !== 'CANCELED') return 1;
            if (a.status !== 'CANCELED' && b.status === 'CANCELED') return -1;

            // 3. Within same status, sort by urgency (closest first)
            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        });
    }, [calendarData]);

    const activeLessonId = useMemo(() => {
        const live = schedule.find((s: any) => s.status === 'LIVE');
        if (live) return live.id;
        const upcoming = schedule.find((s: any) => s.status === 'SCHEDULED');
        if (upcoming) return upcoming.id;
        return (schedule[0] as any)?.id;
    }, [schedule]);

    const onRefresh = React.useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                refetchCalendar(),
                refetch(), // notifications
            ]);
        } catch (error) {
            console.error('[Home] Refresh failed:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchCalendar, refetch]);

    const markAsReadMutation = useMarkAsReadMutation();
    const markAllAsReadMutation = useMarkAllAsReadMutation();
    const deleteNotificationMutation = useDeleteNotificationMutation();

    const handleNotificationBellPress = useCallback(() => {
        setShowNotifications(true);
    }, []);

    const handleMarkAsRead = useCallback((id: string) => {
        if (id.startsWith('push-')) {
            // Local-only notification, just update cache
            queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data.map((n: ApiNotification) =>
                            n.id === id ? { ...n, read: true } : n
                        ),
                    })),
                };
            });
            return;
        }
        markAsReadMutation.mutate(id);
    }, [markAsReadMutation, queryClient]);

    const handleMarkAllAsRead = useCallback(() => {
        markAllAsReadMutation.mutate();
    }, [markAllAsReadMutation]);

    const handleNotificationItemPress = useCallback((notification: ApiNotification) => {
        const { action, type, data } = notification;
        const role = user?.role;

        // 0. Emergency Security Handling (Highest Priority)
        if (type === 'security_new_device_blocked') {
            logger.log('[Home] Security alert tapped in list, redirecting to Security Alert screen');
            router.push({
                pathname: '/security-alert' as any,
                params: {
                    deviceName: data?.newDevice?.name,
                    platform: data?.newDevice?.platform,
                    ipAddress: data?.newDevice?.ipAddress,
                    timestamp: data?.timestamp,
                    securityTip: data?.securityTip
                }
            });
            setShowNotifications(false);
            return;
        }

        // 1. Role-Based Overrides (Consistency with system tray / NotificationListener)
        if (type === 'lesson_started' || type === 'LESSON_STARTED' || type === 'reminder') {
            if (role === 'STUDENT') {
                logger.log('[Home] Student tapped lesson notification in list, opening scanner');
                setIsScannerVisible(true);
                setShowNotifications(false);
                return;
            } else if (role === 'TEACHER') {
                const lessonId = data?.lessonId || data?.lesson_id || action?.params?.lessonId;
                if (lessonId) {
                    logger.log('[Home] Teacher tapped lesson notification in list, going to Control');
                    router.push({ pathname: '/teacher-control', params: { lessonId } });
                    setShowNotifications(false);
                    return;
                }
            }
        }

        if (action && action.type === 'navigate') {
            logger.log('[Home] Unified Action Navigate:', action.target, action.params);

            // Security Guard: Prevent students from accessing teacher screens
            const teacherOnlyScreens = ['teacher-control', 'teacher-dashboard', 'teacher-courses', 'create-course', 'create-lesson', 'lesson-analytics'];
            if (role === 'STUDENT' && teacherOnlyScreens.includes(action.target)) {
                logger.warn(`[Home] Student attempted to access ${action.target}, redirecting to scan`);
                setIsScannerVisible(true);
                setShowNotifications(false);
                return;
            }

            if (action.target === 'chat-detail' && action.params?.conversationId) {
                router.push(`/conversation/${action.params.conversationId}`);
            } else if (action.target === 'link-requests') {
                router.push('/settings?section=parentLink');
            } else if (action.target === '/security-settings' || action.target === 'security-settings') {
                // Map generic security settings target to the specific alert screen if we have data
                router.push({
                    pathname: '/security-alert' as any,
                    params: {
                        deviceName: data?.newDevice?.name,
                        platform: data?.newDevice?.platform,
                        ipAddress: data?.newDevice?.ipAddress,
                        timestamp: data?.timestamp,
                        securityTip: data?.securityTip
                    }
                });
            } else if (action.target === '/course-reviews' || action.target === 'course-reviews') {
                const courseId = action.params?.id || action.params?.courseId;
                if (courseId) {
                    router.push({ pathname: '/course-details', params: { id: courseId, tab: 'REVIEWS' } });
                } else {
                    router.push('/(main)/courses');
                }
            } else if (action.params) {
                router.push({ pathname: action.target as any, params: action.params });
            } else if (action.target) {
                router.push(action.target as any);
            }
            setShowNotifications(false);
            return;
        }

        // Backward compatibility
        if (
            notification.type === 'parent_link_request' ||
            notification.type === 'parent_link_accepted' ||
            notification.type === 'parent_link_declined' ||
            notification.type === 'parent_link_request_accepted' ||
            notification.type === 'parent_link_request_declined' ||
            notification.type === 'unlink_request' ||
            notification.type === 'unlink_request_accepted' ||
            notification.type === 'unlink_request_declined'
        ) {
            router.push('/settings?section=parentLink');
            setShowNotifications(false);
            return;
        }

        if (notification.type === 'parent_report_ready') {
            const studentId = data?.studentId || data?.student_id;
            const period = data?.period;
            router.push({
                pathname: '/progress-report' as any,
                params: { studentId, period }
            });
            setShowNotifications(false);
            return;
        }
    }, [router, user?.role, t]);

    const handleDeleteNotification = useCallback((notificationId: string) => {
        deleteNotificationMutation.mutate(notificationId);
    }, [deleteNotificationMutation]);

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handleSearchSubmit = useCallback((query: string) => {
        // TODO: Implement search
    }, []);

    const handleCloseNotifications = useCallback(() => {
        setShowNotifications(false);
    }, []);

    const handleRefreshNotifications = useCallback(() => {
        refetch();
    }, [refetch]);

    const handleScanQR = React.useCallback(() => {
        setIsScannerVisible(true);
    }, []);

    const renderSubjectItem = useCallback(({ item }: { item: any }) => (
        <SubjectCard
            {...item}
            onPress={() => router.push({ pathname: '/subject-details', params: { id: item.id } })}
        />
    ), [router]);

    const subjectKeyExtractor = useCallback((item: any) => item.id, []);

    const sectionTitleColor = isDark ? theme.text : theme.gray[900];
    const backgroundColor = isDark ? theme.background : '#FFFFFF';

    const handleScan = async (data: string) => {
        setIsScannerVisible(false);
        try {
            // Fetch current location for attendance validation
            const location = await DeviceService.getPreciseLocation({ accuracy: 'high' });
            
            const result = await scanAttendance(data, {
                latitude: location?.latitude,
                longitude: location?.longitude
            });

            if (result.success) {
                // Optimistically update all calendar query results to show 'PRESENT' 
                // for the lesson that was just scanned (the backend knows which one)
                // This prevents the "Mark Attendance" button from showing while refetching
                queryClient.setQueriesData({ queryKey: ['calendar'] }, (old: any) => {
                    if (!old || !old.data) return old;
                    return {
                        ...old,
                        data: old.data.map((item: any) => {
                            // If we could determine the lesson ID from the data payload here, we'd be more precise.
                            // But for now, any LIVE lesson a student just scanned is likely the one.
                            if (item.status === 'LIVE' && !item.attendanceStatus) {
                                return { ...item, attendanceStatus: 'PRESENT' };
                            }
                            return item;
                        })
                    };
                });

                // Refresh calendar to reflect official attendance
                queryClient.invalidateQueries({ queryKey: ['calendar'] });
                
                Alert.alert(t('common.success'), result.message || t('home.attendanceSuccess'));
                router.push({
                    pathname: '/attendance-success',
                    params: {
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        location: t('home.classroom')
                    }
                });
            } else {
                Alert.alert(t('courses.attendanceFailed'), result.message || t('courses.attendanceFailed'));
            }
        } catch (error: any) {
            logger.log('Error marking attendance:', error);
            Alert.alert(t('common.error'), error.message || t('common.error'));
        }
    };

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <QRScannerModal
                visible={isScannerVisible}
                onClose={() => setIsScannerVisible(false)}
                onScan={handleScan}
            />

            {/* Custom Calendar Modal */}
            <CalendarModal
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                selectedDate={datePickerMode === 'start' ? startDate : endDate}
                onSelectDate={(date) => {
                    if (datePickerMode === 'start') {
                        setStartDate(date);
                        // Ensure end date is after start date
                        if (date > endDate) {
                            const newEnd = new Date(date);
                            newEnd.setDate(newEnd.getDate() + 7);
                            setEndDate(newEnd);
                        }
                    } else {
                        setEndDate(date);
                        // Ensure start date is before end date
                        if (date < startDate) {
                            const newStart = new Date(date);
                            newStart.setDate(newStart.getDate() - 7);
                            setStartDate(newStart);
                        }
                    }
                }}
                mode={datePickerMode}
                minDate={datePickerMode === 'end' ? startDate : undefined}
                maxDate={datePickerMode === 'start' ? endDate : undefined}
            />

            <StatusBar
                barStyle="light-content"
                backgroundColor={cskColors[500]}
                translucent={true}
            />

            {user?.role === 'PARENT' ? (
                <View style={{ flex: 1 }}>
                    <ParentMonitoringSuite />
                </View>
            ) : (
                <Animated.ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            colors={[theme.primary]}
                            tintColor={theme.primary}
                            progressViewOffset={140}
                        />
                    }
                >
                    {user?.role === 'TEACHER' && <TeacherDashboardSummary />}

                    {/* My Subjects Section */}
                    {subjects.length > 0 && (
                        <View style={[styles.section, { marginTop: 12 }]}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
                                    {t('home.mySubjects') || 'My Subjects'}
                                </Text>
                                {/* More button could go here */}
                            </View>
                            <FlatList
                                data={subjects}
                                renderItem={renderSubjectItem}
                                keyExtractor={subjectKeyExtractor}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.horizontalList}
                            />
                        </View>
                    )}

                <View style={[styles.section, { marginBottom: 24 }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
                            {t('home.yourSchedule') || 'Your Schedule'}
                        </Text>
                    </View>

                    {/* Date Range Selector */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#000' }]}>{t('home.schedule')}</Text>
                        <TouchableOpacity 
                            onPress={() => router.push('/calendar')}
                            style={{ padding: 4 }}
                        >
                            <Text style={{ color: theme.primary, fontFamily: Fonts.medium, fontSize: 13 }}>{t('home.viewCalendar')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Filter Presets */}
                    <View style={{ marginBottom: 16 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                            <FilterChip 
                                label={t('home.next7Days')} 
                                active={rangePreset === 'upcoming_7'} 
                                onPress={() => setRangePreset('upcoming_7')} 
                                icon="time-outline"
                            />
                            <FilterChip 
                                label={t('home.next30Days')} 
                                active={rangePreset === 'upcoming_30'} 
                                onPress={() => setRangePreset('upcoming_30')} 
                                icon="calendar-outline"
                            />
                            <FilterChip 
                                label={t('home.pastWeek')} 
                                active={rangePreset === 'prev_7'} 
                                onPress={() => setRangePreset('prev_7')} 
                                icon="archive-outline"
                            />
                            <FilterChip 
                                label={rangePreset === 'manual' ? t('home.customRange') : t('home.manualSelect')} 
                                active={rangePreset === 'manual'} 
                                onPress={() => {
                                    setRangePreset('manual');
                                    setShowDatePicker(true);
                                }} 
                                icon="options-outline"
                            />
                        </ScrollView>
                    </View>

                    {/* Manual Range UI (Only when manual preset selected) */}
                    {rangePreset === 'manual' && (
                        <View style={[styles.dateRangeSelector, { marginBottom: 20 }]}>
                            <TouchableOpacity
                                onPress={() => {
                                    setDatePickerMode('start');
                                    setShowDatePicker(true);
                                }}
                                style={[styles.dateButton, { 
                                    backgroundColor: isDark ? theme.surface : '#ffffff', 
                                    borderColor: theme.primary,
                                    borderWidth: 2
                                }]}
                            >
                                <View style={[styles.dateIconContainer, { backgroundColor: `${theme.primary}15` }]}>
                                    <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.dateLabel, { color: theme.gray[500] }]}>{t('home.startDate')}</Text>
                                    <Text style={[styles.dateText, { color: isDark ? theme.text : theme.gray[900] }]}>
                                        {startDate.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <View style={styles.dateRangeDivider}>
                                <Ionicons name="arrow-forward" size={14} color={theme.primary} />
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    setDatePickerMode('end');
                                    setShowDatePicker(true);
                                }}
                                style={[styles.dateButton, { 
                                    backgroundColor: isDark ? theme.surface : '#ffffff', 
                                    borderColor: theme.primary,
                                    borderWidth: 2
                                }]}
                            >
                                <View style={[styles.dateIconContainer, { backgroundColor: `${theme.primary}15` }]}>
                                    <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.dateLabel, { color: theme.gray[500] }]}>{t('home.endDate')}</Text>
                                    <Text style={[styles.dateText, { color: isDark ? theme.text : theme.gray[900] }]}>
                                        {endDate.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Status Filters */}
                    <View style={{ marginBottom: 12 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                            <FilterChip 
                                label={t('home.upcomingFilter')} 
                                active={statusFilter === 'upcoming'} 
                                onPress={() => setStatusFilter('upcoming')} 
                                color={theme.primary}
                            />
                            <FilterChip 
                                label={t('home.finishedFilter')} 
                                active={statusFilter === 'finished'} 
                                onPress={() => setStatusFilter('finished')} 
                                color={theme.gray[500]}
                            />
                            <FilterChip 
                                label={t('home.canceledFilter')} 
                                active={statusFilter === 'CANCELED'} 
                                onPress={() => setStatusFilter('CANCELED')} 
                                color={errorColors[500]}
                            />
                            <FilterChip 
                                label={t('home.allStatuses')} 
                                active={statusFilter === 'all'} 
                                onPress={() => setStatusFilter('all')} 
                                variant="outline"
                            />
                        </ScrollView>
                    </View>

                    {/* Subject Filters */}
                    {subjects.length > 0 && (
                        <View style={{ marginBottom: 20 }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                <FilterChip 
                                    label={t('courses.all')} 
                                    active={!selectedSubject} 
                                    onPress={() => setSelectedSubject(null)} 
                                    variant={!selectedSubject ? 'filled' : 'outline'}
                                />
                                {subjects.map((subject: any) => (
                                    <FilterChip 
                                        key={subject.id}
                                        label={subject.name || subject.title} 
                                        active={selectedSubject === subject.id} 
                                        onPress={() => setSelectedSubject(subject.id)}
                                        variant={selectedSubject === subject.id ? 'filled' : 'outline'}
                                    />
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    <View style={{ marginTop: 8 }}>
                        {isLoadingCalendar ? (
                            <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} />
                        ) : schedule.length > 0 ? (
                            schedule.map((item: any, index: number) => (
                                <ScheduleCard
                                    key={item.id}
                                    {...item}
                                    status={item.status as any}
                                    isLast={index === schedule.length - 1}
                                    isTeacher={user?.role === 'TEACHER'}
                                    onPress={() => {
                                        if (user?.role === 'TEACHER' && item.status === 'LIVE') {
                                            router.push({ pathname: '/teacher-control', params: { lessonId: item.id } });
                                        } else {
                                            router.push({ pathname: '/course-details', params: { id: item.courseId } });
                                        }
                                    }}
                                    onScanPress={handleScanQR}
                                />
                            ))
                        ) : (
                            <View style={styles.emptySchedule}>
                                <Ionicons name="calendar-outline" size={32} color={theme.gray[300]} />
                                <Text style={{ color: theme.gray[400], marginTop: 8, fontFamily: Fonts.medium }}>{t('home.noLessons')}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Bottom padding for tabs */}
                <View style={{ height: 100 }} />
            </Animated.ScrollView>
            )}

            {/* Header positioned absolutely on top */}

            <HomeHeader
                onNotificationPress={() => setShowNotifications(true)}
                onCalendarPress={() => router.push('/calendar')}
                onRefreshPress={onRefresh}
                onReschedulePress={async () => {
                    logger.log('[Home] Background rescheduling fetch');
                    await queryClient.invalidateQueries({ queryKey: isTeacher ? ['teacherCalendar'] : ['studentCalendar'] });
                }}
                notificationCount={unreadCount}
                scrollY={scrollY}
                isRefreshing={isRefreshing}
            />

            <NotificationModal
                visible={showNotifications}
                onClose={handleCloseNotifications}
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                loading={isLoading}
                onRefresh={handleRefreshNotifications}
                onNotificationPress={handleNotificationItemPress}
                onLoadMore={handleLoadMore}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onDeleteNotification={handleDeleteNotification}
            />
        </View>
    );
}


interface FilterChipProps {
    label: string;
    active: boolean;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    color?: string;
    variant?: 'filled' | 'outline';
}

function FilterChip({ label, active, onPress, icon, color, variant = 'filled' }: FilterChipProps) {
    const { theme, isDark } = useTheme();
    const activeColor = color || theme.primary;

    return (
        <TouchableOpacity 
            onPress={onPress}
            style={[
                styles.chip,
                active ? { backgroundColor: activeColor, borderColor: activeColor } : { backgroundColor: 'transparent', borderColor: isDark ? theme.gray[700] : theme.gray[200] },
                variant === 'outline' && !active && { borderWidth: 1 }
            ]}
        >
            {icon && <Ionicons name={icon} size={14} color={active ? '#FFF' : theme.gray[500]} style={{ marginRight: 4 }} />}
            <Text style={[styles.chipText, { color: active ? '#FFF' : theme.gray[500] }]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 140, // Space for header
        paddingBottom: 24,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    horizontalList: {
        paddingRight: 16,
    },
    dateRangeContainer: {
        backgroundColor: 'transparent',
        borderRadius: 16,
        marginBottom: 16,
    },
    dateRangeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateRangeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateRangeTitle: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    dateRangeDays: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
    },
    dateRangeSelector: {
        gap: 12,
        marginBottom: 16,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    dateIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateLabel: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    dateText: {
        fontSize: 15,
        fontFamily: Fonts.bold,
    },
    dateRangeDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    emptySchedule: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(0,0,0,0.05)',
    },
});

