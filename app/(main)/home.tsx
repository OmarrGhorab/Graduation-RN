import HomeHeader from '@/components/HomeHeader';
import NotificationModal from '@/components/NotificationModal';
import { ScheduleCard, SubjectCard } from '@/components/home';
import { Fonts, cskColors } from '@/constants/theme';
import { useStudentCalendar } from '@/hooks/useCalendar';
import { useMySubjects } from '@/hooks/useCourses';
import {
    useDeleteNotificationMutation,
    useMarkAllAsReadMutation,
    useMarkAsReadMutation,
    useNotifications,
} from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { logger } from '@/libs/logger';
import { ApiSchedule } from '@/services/CalendarService';
import { ApiSubject } from '@/services/CourseService';
import { ApiNotification } from '@/services/NotificationService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [schedulePeriod, setSchedulePeriod] = React.useState<'LAST_24' | 'NEXT_48' | 'ALL'>('ALL');

    // Calculate dates for calendar
    const calendarRange = React.useMemo(() => {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);

        if (schedulePeriod === 'LAST_24') {
            start.setHours(now.getHours() - 24);
        } else if (schedulePeriod === 'NEXT_48') {
            end.setHours(now.getHours() + 48);
        } else {
            // ALL/Default: Last 24h to Next 48h
            start.setHours(now.getHours() - 24);
            end.setHours(now.getHours() + 48);
        }

        return {
            start: start.toISOString(),
            end: end.toISOString()
        };
    }, [schedulePeriod]);

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
    const { data: calendarData, isLoading: isLoadingCalendar } = useStudentCalendar(calendarRange.start, calendarRange.end);

    const subjects = React.useMemo(() => {
        return subjectsData?.data.map((subject: ApiSubject) => ({
            id: subject.id,
            name: subject.name,
            icon: getSubjectIcon(subject.icon)
        })) || [];
    }, [subjectsData]);

    const schedule = React.useMemo(() => {
        return calendarData?.data.map((item: ApiSchedule) => ({
            id: item.id,
            courseId: item.courseId,
            title: item.courseTitle,
            time: formatTimeRange(item.startTime, item.endTime),
            teacherName: item.title, // Lesson title as sub-info
            status: item.status,
            location: item.location
        })) || [];
    }, [calendarData]);

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

    const handleScanQR = useCallback(() => {
        // Navigate to QR scanner screen
        router.push('/(main)/course?action=scan'); // Example route
    }, [router]);

    const renderSubjectItem = useCallback(({ item }: { item: any }) => (
        <SubjectCard
            {...item}
            onPress={() => router.push({ pathname: '/subject-details', params: { id: item.id } })}
        />
    ), [router]);

    const subjectKeyExtractor = useCallback((item: any) => item.id, []);

    const sectionTitleColor = isDark ? theme.text : theme.gray[900];
    const backgroundColor = isDark ? theme.background : '#FFFFFF';

    return (
        <View style={[styles.container, { backgroundColor }]}>
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
            >
                {/* My Subjects Section */}
                <View style={styles.section}>
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

                <View style={[styles.section, { marginBottom: 24 }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
                            {t('home.yourSchedule') || 'Your Schedule'}
                        </Text>
                    </View>

                    {/* Period Selector */}
                    <View style={styles.periodSelector}>
                        <TouchableOpacity
                            onPress={() => setSchedulePeriod('ALL')}
                            style={[styles.periodChip, schedulePeriod === 'ALL' && { backgroundColor: theme.primary }]}
                        >
                            <Text style={[styles.periodChipText, { color: schedulePeriod === 'ALL' ? '#000' : theme.gray[500] }]}>Combined</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setSchedulePeriod('LAST_24')}
                            style={[styles.periodChip, schedulePeriod === 'LAST_24' && { backgroundColor: theme.primary }]}
                        >
                            <Text style={[styles.periodChipText, { color: schedulePeriod === 'LAST_24' ? '#000' : theme.gray[500] }]}>Past 24h</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setSchedulePeriod('NEXT_48')}
                            style={[styles.periodChip, schedulePeriod === 'NEXT_48' && { backgroundColor: theme.primary }]}
                        >
                            <Text style={[styles.periodChipText, { color: schedulePeriod === 'NEXT_48' ? '#000' : theme.gray[500] }]}>Next 48h</Text>
                        </TouchableOpacity>
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
                                    onPress={() => router.push({ pathname: '/course-details', params: { id: item.courseId } })}
                                    onScanPress={handleScanQR}
                                />
                            ))
                        ) : (
                            <View style={styles.emptySchedule}>
                                <Ionicons name="calendar-outline" size={32} color={theme.gray[300]} />
                                <Text style={{ color: theme.gray[400], marginTop: 8, fontFamily: Fonts.medium }}>No lessons found</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Bottom padding for tabs */}
                <View style={{ height: 100 }} />
            </Animated.ScrollView>

            {/* Floating QR Action Button */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.primary }]}
                    activeOpacity={0.8}
                    onPress={handleScanQR}
                >
                    <View style={[styles.fabRing, { borderColor: 'rgba(255,255,255,0.3)' }]} />
                    <Ionicons name="scan-outline" size={32} color="#FFFFFF" />
                </TouchableOpacity>
                {/* Temporary Teacher Control Button */}
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.surface, marginTop: 16, width: 48, height: 48, borderRadius: 24 }]}
                    activeOpacity={0.8}
                    onPress={() => router.push('/teacher-control')}
                >
                    <Ionicons name="school-outline" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            {/* Header positioned absolutely on top */}
            <HomeHeader
                onNotificationPress={handleNotificationBellPress}
                onSearchSubmit={handleSearchSubmit}
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
        paddingTop: 120, // Space for header
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
    periodSelector: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    periodChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    periodChipText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
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
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        zIndex: 50,
    },
    fab: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabRing: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 16,
        borderWidth: 2,
        opacity: 0.5,
    },
});

