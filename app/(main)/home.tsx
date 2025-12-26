import React from 'react';
import { StyleSheet, View, Text, FlatList, StatusBar } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, cskColors } from '@/constants/theme';
import HomeHeader from '@/components/HomeHeader';
import NotificationModal from '@/components/NotificationModal';
import { SubjectCard, TeacherCard, ScheduleCard } from '@/components/home';
import {
    useNotifications,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
    useDeleteNotificationMutation,
} from '@/hooks/useNotifications';

// Mock data - replace with real data from your API
const subjects = [
    { id: '1', name: 'Mathematics', icon: 'Σ' },
    { id: '2', name: 'Physics', icon: '⚛' },
    { id: '3', name: 'Chemistry', icon: '🧪' },
];

const teachers = [
    { id: '1', name: 'Ahmed Al-H...', subject: 'Mathematics', image: null },
    { id: '2', name: 'Mohamed Ha...', subject: 'Physics', image: null },
    { id: '3', name: 'Mohamed Ha...', subject: 'Arabic', image: null },
    { id: '4', name: 'Mohamed Ha...', subject: 'English', image: null },
];

const schedule = [
    {
        id: '1',
        title: 'Mathematics',
        lessons: 28,
        rating: 4.9,
        duration: '6h 30min',
        teacher: 'Mr. Ahmed Al-Hassan',
        image: null,
        color: '#E8F5E9',
    },
    {
        id: '2',
        title: 'Physics',
        lessons: 46,
        rating: 4.6,
        duration: '8h 28min',
        teacher: 'Mr. Ahmed Al-Hassan',
        image: null,
        color: cskColors[500],
        isHighlighted: true,
    },
];

export default function MainHomeScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const [showNotifications, setShowNotifications] = React.useState(false);

    // Scroll tracking for header animation
    const scrollY = useSharedValue(0);
    const lastScrollY = useSharedValue(0);
    const headerTranslateY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            const currentScrollY = event.contentOffset.y;
            const diff = currentScrollY - lastScrollY.value;

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

    const handleNotificationBellPress = () => {
        setShowNotifications(true);
    };

    const handleMarkAsRead = (id: string) => {
        markAsReadMutation.mutate(id);
    };

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    const handleNotificationItemPress = (notification: any) => {
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
    };

    const handleDeleteNotification = (notificationId: string) => {
        deleteNotificationMutation.mutate(notificationId);
    };

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const handleSearchSubmit = (query: string) => {
        console.log('Search query:', query);
    };

    const sectionTitleColor = theme.primary;
    const sectionSubtitleColor = isDark ? theme.gray[700] : theme.gray[500];
    const backgroundColor = isDark ? theme.background : '#FFFFFF';

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'light-content'}
                backgroundColor={isDark ? theme.csk[700] : cskColors[500]}
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
                    <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
                        My Subjects
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: sectionSubtitleColor }]}>
                        Recommendations For You
                    </Text>
                    <FlatList
                        data={subjects}
                        renderItem={({ item }) => <SubjectCard {...item} />}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    />
                </View>

                {/* My Teachers Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
                        My Teachers
                    </Text>
                    <FlatList
                        data={teachers}
                        renderItem={({ item }) => <TeacherCard {...item} />}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    />
                </View>

                {/* Your Schedule Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
                        Your Schedule
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: sectionSubtitleColor }]}>
                        Next Lessons
                    </Text>
                    {schedule.map((item) => (
                        <ScheduleCard key={item.id} {...item} />
                    ))}
                </View>
            </Animated.ScrollView>

            {/* Header positioned absolutely on top */}
            <HomeHeader
                onNotificationPress={handleNotificationBellPress}
                onSearchSubmit={handleSearchSubmit}
                notificationCount={unreadCount}
                scrollY={scrollY}
            />

            <NotificationModal
                visible={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                loading={isLoading}
                onRefresh={() => refetch()}
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
        paddingTop: 140,
        paddingBottom: 24,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        marginBottom: 16,
    },
    horizontalList: {
        paddingRight: 16,
    },
});
