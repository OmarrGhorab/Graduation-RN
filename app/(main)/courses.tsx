import CourseMarketplaceCard from '@/components/course/CourseMarketplaceCard';
import { Fonts } from '@/constants/theme';
import { useAllCourses, useRecommendedCourses, useTrendingCourses } from '@/hooks/useCourses';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { ApiCourse, RecommendationCourseItem } from '@/services/CourseService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const FILTERS = ['all', 'math', 'science', 'physics', 'chemistry', 'english', 'cs'];

export default function CoursesScreen() {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: coursesData, isLoading, refetch } = useAllCourses({
        search: searchQuery,
        // In a real app, you might filter by subject ID, but for now we filter locally or pass name
    });
    const { data: trendingData, isLoading: trendingLoading, refetch: refetchTrending } = useTrendingCourses();
    const { data: recommendedData, isLoading: recommendedLoading, refetch: refetchRecommended } = useRecommendedCourses();
    const skeletonColor = isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB';

    const mapRecommendationToCourse = (item: RecommendationCourseItem): ApiCourse => ({
        id: item.courseId,
        title: item.title,
        description: '',
        subjectId: '',
        subjectName: item.subjectName,
        teacherId: '',
        teacherName: item.teacher.name,
        teacherProfileImg: item.teacher.avatar,
        courseImage: item.courseImage,
        enrolledStudents: item.enrolledCount,
        deliveryType: 'ONLINE',
        locationName: '',
        geofenceRadiusM: 0,
        totalLessons: 0,
        attendanceWindowMinutes: 0,
        price: item.price,
        currency: item.currency,
        isPaid: item.price > 0,
        billingType: 'ONE_TIME',
        status: 'ACTIVE',
        attendanceWeight: 0,
        createdAt: '',
        updatedAt: '',
    });

    const trendingCourses = useMemo(
        () => (trendingData?.data || []).map(mapRecommendationToCourse),
        [trendingData]
    );

    const recommendedCourses = useMemo(
        () => (recommendedData?.data || []).map(mapRecommendationToCourse),
        [recommendedData]
    );

    // Handle local filtering for demo if API doesn't support name filtering yet
    const filteredCourses = coursesData?.data?.filter(course => {
        if (activeFilter === 'all') return true;
        const normalizedFilterName = t(`subjects_list.${activeFilter}`).toLowerCase();
        return course.subjectName.toLowerCase() === normalizedFilterName.toLowerCase();
    });

    const handleCoursePress = (courseId: string) => {
        // Navigate to the course details page
        router.push({ pathname: '/course-details', params: { id: courseId } });
    };

    const handleRefresh = () => {
        refetch();
        refetchTrending();
        refetchRecommended();
    };

    const renderSliderSection = (title: string, icon: keyof typeof Ionicons.glyphMap, data: ApiCourse[], loading: boolean) => {
        if (!loading && data.length === 0) {
            return null;
        }

        return (
            <View style={styles.sliderSection}>
                <View style={styles.sliderHeader}>
                    <View style={styles.sliderTitleRow}>
                        <View style={[styles.sliderIconWrap, { backgroundColor: `${theme.primary}12` }]}>
                            <Ionicons name={icon} size={16} color={theme.primary} />
                        </View>
                        <Text style={[styles.sliderTitle, { color: isDark ? theme.text : '#1F2937' }]}>
                            {title}
                        </Text>
                    </View>
                </View>

                {loading ? (
                    <FlatList
                        data={[0, 1, 2]}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.toString()}
                        contentContainerStyle={styles.sliderList}
                        renderItem={() => (
                            <View style={[styles.sliderCardWrap, styles.skeletonCard, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : '#EEF2F7' }]}>
                                <View style={[styles.skeletonImage, { backgroundColor: skeletonColor }]} />
                                <View style={styles.skeletonBody}>
                                    <View style={[styles.skeletonLineShort, { backgroundColor: skeletonColor }]} />
                                    <View style={[styles.skeletonLine, { backgroundColor: skeletonColor }]} />
                                    <View style={[styles.skeletonLineMedium, { backgroundColor: skeletonColor }]} />
                                    <View style={[styles.skeletonAvatar, { backgroundColor: skeletonColor }]} />
                                    <View style={[styles.skeletonDivider, { backgroundColor: skeletonColor }]} />
                                    <View style={styles.skeletonFooter}>
                                        <View>
                                            <View style={[styles.skeletonTinyLine, { backgroundColor: skeletonColor }]} />
                                            <View style={[styles.skeletonTinyLineWide, { backgroundColor: skeletonColor }]} />
                                        </View>
                                        <View style={[styles.skeletonPrice, { backgroundColor: skeletonColor }]} />
                                    </View>
                                </View>
                            </View>
                        )}
                    />
                ) : (
                    <FlatList
                        data={data}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.sliderList}
                        renderItem={({ item }) => (
                            <View style={styles.sliderCardWrap}>
                                <CourseMarketplaceCard
                                    course={item}
                                    onPress={handleCoursePress}
                                />
                            </View>
                        )}
                    />
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {/* Header Area */}
            <View style={[styles.header, { backgroundColor: isDark ? theme.surface : '#FFFFFF', paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 48 }]}>
                <Text style={[styles.headerTitle, { color: isDark ? theme.text : '#1F2937' }]}>{t('courses.title') || 'Explore Courses'}</Text>

                {/* Search Bar */}
                <View style={[styles.searchContainer, { backgroundColor: isDark ? theme.background : '#F3F4F6' }]}>
                    <Ionicons name="search-outline" size={20} color={theme.gray[400]} />
                    <TextInput
                        style={[styles.searchInput, { color: isDark ? theme.text : '#1F2937' }]}
                        placeholder={t('courses.searchPlaceholder')}
                        placeholderTextColor={theme.gray[400]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Filter Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContainer}
                >
                    {FILTERS.map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: activeFilter === filter ? theme.primary : (isDark ? theme.background : '#F3F4F6'),
                                    borderColor: activeFilter === filter ? theme.primary : (isDark ? theme.border : 'transparent'),
                                    borderWidth: 1,
                                }
                            ]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    { color: activeFilter === filter ? '#FFFFFF' : (isDark ? theme.gray[400] : theme.gray[600]) }
                                ]}
                            >
                                {filter === 'all' ? t('courses.all') : t(`subjects_list.${filter}`)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Course List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredCourses}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={isLoading || trendingLoading || recommendedLoading} onRefresh={handleRefresh} tintColor={theme.primary} />}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            {renderSliderSection(
                                t('courses.recommendedForYou') || 'Recommended For You',
                                'sparkles-outline',
                                recommendedCourses,
                                recommendedLoading
                            )}
                            {renderSliderSection(
                                t('courses.trendingNow') || 'Trending Now',
                                'flame-outline',
                                trendingCourses,
                                trendingLoading
                            )}
                        </View>
                    }
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInDown.delay(index * 100).duration(500)}>
                            <CourseMarketplaceCard
                                course={item}
                                onPress={handleCoursePress}
                            />
                        </Animated.View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="search" size={48} color={theme.gray[300]} />
                            <Text style={[styles.emptyText, { color: theme.gray[500] }]}>{t('courses.noCoursesFound')}</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: Fonts.bold,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        paddingHorizontal: 16,
        height: 48,
        borderRadius: 12,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontFamily: Fonts.regular,
        fontSize: 16,
    },
    filtersContainer: {
        paddingHorizontal: 20,
        paddingRight: 8,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    filterText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listHeader: {
        gap: 8,
        marginBottom: 8,
    },
    sliderSection: {
        marginBottom: 12,
    },
    sliderHeader: {
        marginBottom: 12,
    },
    sliderTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sliderIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sliderTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    sliderList: {
        paddingRight: 4,
    },
    sliderCardWrap: {
        width: 280,
        marginRight: 14,
    },
    sliderLoading: {
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    skeletonCard: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    skeletonImage: {
        height: 140,
        width: '100%',
    },
    skeletonBody: {
        padding: 16,
    },
    skeletonLineShort: {
        width: 84,
        height: 10,
        borderRadius: 5,
        marginBottom: 12,
    },
    skeletonLine: {
        width: '92%',
        height: 16,
        borderRadius: 8,
        marginBottom: 10,
    },
    skeletonLineMedium: {
        width: '68%',
        height: 14,
        borderRadius: 7,
        marginBottom: 16,
    },
    skeletonAvatar: {
        width: 110,
        height: 24,
        borderRadius: 12,
        marginBottom: 16,
    },
    skeletonDivider: {
        width: '100%',
        height: 1,
        marginBottom: 14,
    },
    skeletonFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    skeletonTinyLine: {
        width: 90,
        height: 12,
        borderRadius: 6,
        marginBottom: 8,
    },
    skeletonTinyLineWide: {
        width: 110,
        height: 12,
        borderRadius: 6,
    },
    skeletonPrice: {
        width: 64,
        height: 18,
        borderRadius: 9,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        gap: 12,
    },
    emptyText: {
        fontFamily: Fonts.medium,
        fontSize: 16,
    },
});
