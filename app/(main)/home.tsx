import CalendarModal from '@/components/CalendarModal';
import HomeHeader from '@/components/HomeHeader';
import NotificationModal from '@/components/NotificationModal';
import QRScannerModal from '@/components/course/QRScannerModal';
import { ScheduleCard, SubjectCard } from '@/components/home';
import { Fonts, cskColors } from '@/constants/theme';
import { useStudentCalendar, useTeacherCalendar } from '@/hooks/useCalendar';
import { useMySubjects } from '@/hooks/useCourses';
import {
    useDeleteNotificationMutation,
    useMarkAllAsReadMutation,
    useMarkAsReadMutation,
    useNotifications,
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
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const formatTimeRange = (start: string, end: string) => {
    try {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')} - ${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
    } catch (e) {
        return 'TBD';
    }
};



export default function MainHomeScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
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

    const isTeacher = user?.role === 'TEACHER';

    // Calculate dates for calendar based on selected date range
    const calendarRange = React.useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return {
            start: start.toISOString(),
            end: end.toISOString()
        };
    }, [startDate, endDate]);

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
    } = isTeacher 
        ? useTeacherCalendar(calendarRange.start, calendarRange.end)
        : useStudentCalendar(calendarRange.start, calendarRange.end);

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
        return calendarData?.data?.map((item: ApiSchedule) => ({
            id: item.id,
            courseId: item.courseId,
            title: item.courseTitle,
            time: formatTimeRange(item.startTime, item.endTime),
            teacherName: item.title, // Lesson title as sub-info
            status: item.status,
            location: item.location,
            attendanceStatus: item.attendanceStatus,
            canMarkAttendance: item.canMarkAttendance
        })) || [];
    }, [calendarData]);

    const activeLessonId = useMemo(() => {
        const live = schedule.find(s => s.status === 'LIVE');
        if (live) return live.id;
        const upcoming = schedule.find(s => s.status === 'SCHEDULED');
        if (upcoming) return upcoming.id;
        return schedule[0]?.id;
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
        markAsReadMutation.mutate(id);
    }, [markAsReadMutation]);

    const handleMarkAllAsRead = useCallback(() => {
        markAllAsReadMutation.mutate();
    }, [markAllAsReadMutation]);

    const handleNotificationItemPress = useCallback((notification: ApiNotification) => {
        const { action } = notification;

        if (action && action.type === 'navigate') {
            logger.log('[Home] Unified Action Navigate:', action.target, action.params);

            if (action.target === 'chat-detail' && action.params?.conversationId) {
                router.push(`/conversation/${action.params.conversationId}`);
            } else if (action.target === 'link-requests') {
                router.push('/settings?section=parentLink');
            } else if (action.params) {
                router.push({ pathname: action.target as any, params: action.params });
            } else if (action.target) {
                router.push(action.target as any);
            }
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
        }
    }, [router]);

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
                    <View style={styles.dateRangeContainer}>
                        <View style={styles.dateRangeHeader}>
                            <View style={styles.dateRangeInfo}>
                                <Ionicons name="calendar" size={20} color={theme.primary} />
                                <Text style={[styles.dateRangeTitle, { color: isDark ? theme.text : theme.gray[900] }]}>
                                    {t('home.dateRange')}
                                </Text>
                            </View>
                            <Text style={[styles.dateRangeDays, { color: theme.gray[500] }]}>
                                {t('home.daysCount', { count: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) })}
                            </Text>
                        </View>

                        <View style={styles.dateRangeSelector}>
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
                                        {startDate.toLocaleDateString('en-US', { 
                                            weekday: 'short',
                                            month: 'short', 
                                            day: 'numeric'
                                        })}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down" size={20} color={theme.gray[400]} />
                            </TouchableOpacity>

                            <View style={styles.dateRangeDivider}>
                                <View style={[styles.dateRangeLine, { backgroundColor: isDark ? theme.border : theme.gray[200] }]} />
                                <View style={[styles.dateRangeArrowContainer, { backgroundColor: theme.primary }]}>
                                    <Ionicons name="arrow-forward" size={14} color="#ffffff" />
                                </View>
                                <View style={[styles.dateRangeLine, { backgroundColor: isDark ? theme.border : theme.gray[200] }]} />
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
                                        {endDate.toLocaleDateString('en-US', { 
                                            weekday: 'short',
                                            month: 'short', 
                                            day: 'numeric'
                                        })}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down" size={20} color={theme.gray[400]} />
                            </TouchableOpacity>
                        </View>

                        {/* Quick Date Presets */}
                        <View style={styles.quickPresets}>
                            <Text style={[styles.presetsLabel, { color: theme.gray[500] }]}>{t('home.quickSelect')}</Text>
                            <View style={styles.presetsRow}>
                                <TouchableOpacity
                                    onPress={() => {
                                        const today = new Date();
                                        setStartDate(today);
                                        const nextWeek = new Date(today);
                                        nextWeek.setDate(today.getDate() + 7);
                                        setEndDate(nextWeek);
                                    }}
                                    style={[styles.presetChip, { 
                                        backgroundColor: isDark ? theme.surface : '#ffffff', 
                                        borderColor: isDark ? theme.border : theme.gray[200] 
                                    }]}
                                >
                                    <Ionicons name="time-outline" size={14} color={theme.primary} />
                                    <Text style={[styles.presetText, { color: isDark ? theme.text : theme.gray[700] }]}>{t('home.sevenDays')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        const today = new Date();
                                        const start = new Date(today);
                                        start.setDate(1);
                                        setStartDate(start);
                                        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                                        setEndDate(end);
                                    }}
                                    style={[styles.presetChip, { 
                                        backgroundColor: isDark ? theme.surface : '#ffffff', 
                                        borderColor: isDark ? theme.border : theme.gray[200] 
                                    }]}
                                >
                                    <Ionicons name="calendar-clear-outline" size={14} color={theme.primary} />
                                    <Text style={[styles.presetText, { color: isDark ? theme.text : theme.gray[700] }]}>{t('home.thisMonth')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        const today = new Date();
                                        setStartDate(today);
                                        const nextMonth = new Date(today);
                                        nextMonth.setDate(today.getDate() + 30);
                                        setEndDate(nextMonth);
                                    }}
                                    style={[styles.presetChip, { 
                                        backgroundColor: isDark ? theme.surface : '#ffffff', 
                                        borderColor: isDark ? theme.border : theme.gray[200] 
                                    }]}
                                >
                                    <Ionicons name="trending-up-outline" size={14} color={theme.primary} />
                                    <Text style={[styles.presetText, { color: isDark ? theme.text : theme.gray[700] }]}>{t('home.thirtyDays')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={{ marginTop: 8 }}>
                        {isLoadingCalendar ? (
                            <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 20 }} />
                        ) : schedule.length > 0 ? (
                            schedule.map((item, index) => (
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

            {/* Header positioned absolutely on top */}

            <HomeHeader
                onNotificationPress={() => setShowNotifications(true)}
                onCalendarPress={() => router.push('/calendar')}
                notificationCount={unreadCount}
                scrollY={scrollY}
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


const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        paddingHorizontal: 16,
        gap: 8,
    },
    dateRangeLine: {
        flex: 1,
        height: 2,
    },
    dateRangeArrowContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickPresets: {
        gap: 8,
    },
    presetsLabel: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        marginBottom: 4,
    },
    presetsRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    presetChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    presetText: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
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

