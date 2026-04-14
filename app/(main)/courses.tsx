import CourseMarketplaceCard from '@/components/course/CourseMarketplaceCard';
import { Fonts } from '@/constants/theme';
import { useAllCourses } from '@/hooks/useCourses';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={theme.primary} />}
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
