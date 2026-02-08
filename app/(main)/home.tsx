import HomeHeader from '@/components/HomeHeader';
import NotificationModal from '@/components/NotificationModal';
import { ScheduleCard, SubjectCard } from '@/components/home';
import { Fonts, cskColors } from '@/constants/theme';
import {
    useDeleteNotificationMutation,
    useMarkAllAsReadMutation,
    useMarkAsReadMutation,
    useNotifications,
} from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { logger } from '@/libs/logger';
import { ApiNotification } from '@/services/NotificationService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedScrollHandler,
    useSharedValue,
} from 'react-native-reanimated';

// Valid Ionicons names for SubjectCard
const subjects = [
    { id: '1', name: 'Math', icon: 'calculator' as keyof typeof Ionicons.glyphMap },
    { id: '2', name: 'Physics', icon: 'magnet' as keyof typeof Ionicons.glyphMap },
    { id: '3', name: 'Chemistry', icon: 'flask' as keyof typeof Ionicons.glyphMap },
    { id: '4', name: 'Bio', icon: 'leaf' as keyof typeof Ionicons.glyphMap },
    { id: '5', name: 'English', icon: 'book' as keyof typeof Ionicons.glyphMap },
];

const schedule = [
    {
        id: '1',
        title: 'Advanced Mathematics',
        time: '09:00 - 10:30',
        teacherName: 'Dr. Sarah Connor',
        status: 'LIVE',
        location: 'Room 302',
    },
    {
        id: '2',
        title: 'Physics Lab',
        time: '11:00 - 12:30',
        teacherName: 'Mr. John Smith',
        status: 'SCHEDULED',
        location: 'Lab 1',
    },
    {
        id: '3',
        title: 'Chemistry',
        time: '14:00 - 15:30',
        teacherName: 'Mrs. Jane Doe',
        status: 'SCHEDULED',
        location: 'Room 205',
    },
];

export default function MainHomeScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const [showNotifications, setShowNotifications] = React.useState(false);

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

    const renderSubjectItem = useCallback(({ item }: { item: typeof subjects[0] }) => (
        <SubjectCard
            {...item}
            onPress={() => router.push('/(main)/course')} // Navigate to course details
        />
    ), [router]);

    const subjectKeyExtractor = useCallback((item: typeof subjects[0]) => item.id, []);

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
                    <Text style={[styles.sectionTitle, { color: sectionTitleColor, marginBottom: 12 }]}>
                        {t('home.yourSchedule') || 'Your Schedule'}
                    </Text>

                    <View style={{ marginTop: 8 }}>
                        {schedule.map((item, index) => (
                            <ScheduleCard
                                key={item.id}
                                {...item}
                                status={item.status as any}
                                isLast={index === schedule.length - 1}
                                onPress={() => router.push('/(main)/course')}
                                onScanPress={handleScanQR}
                            />
                        ))}
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

