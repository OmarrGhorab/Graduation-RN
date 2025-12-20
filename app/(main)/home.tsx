import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    FlatList,
    StatusBar,
} from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { cskColors, grayColors, Fonts, warningColors } from '@/constants/theme';
import HomeHeader from '@/components/HomeHeader';
import NotificationModal from '@/components/NotificationModal';
import {
    useNotifications,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
    useRespondToParentLinkMutation,
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
    const [showNotifications, setShowNotifications] = React.useState(false);
    
    // Scroll tracking for header animation
    const scrollY = useSharedValue(0);
    const lastScrollY = useSharedValue(0);
    const headerTranslateY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            const currentScrollY = event.contentOffset.y;
            const diff = currentScrollY - lastScrollY.value;
            
            // Only hide/show when scrolling, not at the top
            if (currentScrollY > 0) {
                // Scrolling down - hide header
                if (diff > 0) {
                    headerTranslateY.value = Math.min(headerTranslateY.value + diff, 150);
                } 
                // Scrolling up - show header
                else {
                    headerTranslateY.value = Math.max(headerTranslateY.value + diff, 0);
                }
            } else {
                // At the top - always show header
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
    const respondMutation = useRespondToParentLinkMutation();

    const handleNotificationPress = () => {
        setShowNotifications(true);
    };

    const handleMarkAsRead = (id: string) => {
        markAsReadMutation.mutate(id);
    };

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    const handleParentLinkRespond = (
        _notificationId: string,
        _requestId: string,
        _action: 'accept' | 'decline'
    ) => {
        // Query is already invalidated in the mutation
    };

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const handleSearchSubmit = (query: string) => {
        // Handle search - navigate to search results or filter content
        console.log('Search query:', query);
        // router.push(`/search?q=${encodeURIComponent(query)}`);
    };

    const renderSubject = ({ item }: { item: typeof subjects[0] }) => (
        <TouchableOpacity style={styles.subjectCard} activeOpacity={0.7}>
            <Text style={styles.subjectIcon}>{item.icon}</Text>
            <Text style={styles.subjectName}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderTeacher = ({ item }: { item: typeof teachers[0] }) => (
        <TouchableOpacity style={styles.teacherCard} activeOpacity={0.7}>
            <View style={styles.teacherAvatar}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.teacherImage} />
                ) : (
                    <View style={styles.teacherPlaceholder}>
                        <Ionicons name="person" size={24} color={grayColors[400]} />
                    </View>
                )}
            </View>
            <Text style={styles.teacherName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.teacherSubject}>{item.subject}</Text>
        </TouchableOpacity>
    );

    const renderScheduleItem = ({ item }: { item: typeof schedule[0] }) => (
        <TouchableOpacity
            style={[
                styles.scheduleCard,
                item.isHighlighted && styles.scheduleCardHighlighted,
            ]}
            activeOpacity={0.7}
        >
            <View style={[styles.scheduleImage, { backgroundColor: item.isHighlighted ? 'rgba(255,255,255,0.2)' : item.color }]}>
                <Ionicons
                    name={item.title === 'Mathematics' ? 'calculator' : 'flask'}
                    size={40}
                    color={item.isHighlighted ? '#FFFFFF' : cskColors[500]}
                />
            </View>
            <View style={styles.scheduleContent}>
                <Text style={[styles.scheduleTitle, item.isHighlighted && styles.textWhite]}>
                    {item.title}
                </Text>
                <Text style={[styles.scheduleLessons, item.isHighlighted && styles.textWhiteLight]}>
                    {item.lessons} lessons
                </Text>
                <View style={styles.scheduleRating}>
                    <Ionicons name="star" size={14} color={warningColors[500]} />
                    <Text style={[styles.ratingText, item.isHighlighted && styles.textWhite]}>
                        {item.rating}
                    </Text>
                    <Text style={[styles.durationText, item.isHighlighted && styles.textWhiteLight]}>
                        · {item.duration}
                    </Text>
                </View>
                <View style={styles.teacherRow}>
                    <Ionicons
                        name="person-outline"
                        size={14}
                        color={item.isHighlighted ? '#FFFFFF' : grayColors[500]}
                    />
                    <Text style={[styles.teacherText, item.isHighlighted && styles.textWhiteLight]}>
                        {item.teacher}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={cskColors[500]} />

            <Animated.ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
            >
                {/* My Subjects Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Subjects</Text>
                    <Text style={styles.sectionSubtitle}>Recommendations For You</Text>
                    <FlatList
                        data={subjects}
                        renderItem={renderSubject}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    />
                </View>

                {/* My Teachers Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>My Teachers</Text>
                    <FlatList
                        data={teachers}
                        renderItem={renderTeacher}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    />
                </View>

                {/* Your Schedule Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Schedule</Text>
                    <Text style={styles.sectionSubtitle}>Next Lessons</Text>
                    {schedule.map((item) => (
                        <View key={item.id}>
                            {renderScheduleItem({ item })}
                        </View>
                    ))}
                </View>
            </Animated.ScrollView>

            {/* Header positioned absolutely on top */}
            <HomeHeader
                onNotificationPress={handleNotificationPress}
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
                onParentLinkRespond={handleParentLinkRespond}
                onLoadMore={handleLoadMore}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 140, // Space for the header
        paddingBottom: 24,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: cskColors[500],
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginBottom: 16,
    },
    horizontalList: {
        paddingRight: 16,
    },
    // Subject Card Styles
    subjectCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: grayColors[200],
        minWidth: 140,
    },
    subjectIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    subjectName: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: grayColors[900],
    },
    // Teacher Card Styles
    teacherCard: {
        alignItems: 'center',
        marginRight: 16,
        width: 80,
    },
    teacherAvatar: {
        marginBottom: 8,
    },
    teacherImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    teacherPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: grayColors[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    teacherName: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: grayColors[900],
        textAlign: 'center',
    },
    teacherSubject: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        textAlign: 'center',
    },
    // Schedule Card Styles
    scheduleCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: grayColors[200],
    },
    scheduleCardHighlighted: {
        backgroundColor: cskColors[500],
        borderColor: cskColors[500],
    },
    scheduleImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    scheduleContent: {
        flex: 1,
        justifyContent: 'center',
    },
    scheduleTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        color: grayColors[900],
        marginBottom: 4,
    },
    scheduleLessons: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginBottom: 8,
    },
    scheduleRating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: grayColors[900],
        marginLeft: 4,
    },
    durationText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: grayColors[400],
        marginLeft: 4,
    },
    teacherRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    teacherText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: grayColors[500],
        marginLeft: 4,
    },
    textWhite: {
        color: '#FFFFFF',
    },
    textWhiteLight: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
});
