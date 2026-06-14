import CourseMarketplaceCard from '@/components/course/CourseMarketplaceCard';
import { Fonts, cskColors } from '@/constants/theme';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { ApiCourse } from '@/services/CourseService';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/libs/auth';
import { useRouter } from 'expo-router';
import React, { useMemo, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert
} from 'react-native';
import { deleteCourse } from '@/services/CourseService';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TeacherCoursesScreen() {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const user = useAuthStore(state => state.user);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (user && user.role !== 'TEACHER') {
            router.replace('/home');
        }
    }, [user, router]);

    if (!user || user.role !== 'TEACHER') return null;

    const { data: coursesData, isLoading, refetch } = useTeacherCourses();
    const courses: ApiCourse[] = coursesData?.success ? coursesData.data : [];

    const filteredCourses = useMemo(() => {
        const q = debouncedQuery.trim().toLowerCase();
        if (!q) return courses;
        return courses.filter((c) =>
            c.title?.toLowerCase().includes(q) ||
            c.subject?.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q)
        );
    }, [courses, debouncedQuery]);

    const handleCoursePress = (courseId: string) => {
        router.push({ pathname: '/teacher-course-details', params: { id: courseId } });
    };

    const handleEditCourse = (course: ApiCourse) => {
        router.push({ pathname: '/create-course', params: { editId: course.id } });
    };

    const handleDeleteCourse = (courseId: string) => {
        Alert.alert(
            t('teacher.deleteCourse'),
            t('teacher.deleteConfirm'),
            [
                { text: t('common.cancel') || "Cancel", style: "cancel" },
                {
                    text: t('common.delete') || "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await deleteCourse(courseId);
                            if (response.success) {
                                Alert.alert(t('common.success') || "Success", t('teacher.deleteSuccess'));
                                refetch();
                            } else {
                                Alert.alert(t('common.error') || "Error", t('teacher.deleteError'));
                            }
                        } catch (error) {
                            Alert.alert(t('common.error') || "Error", t('common.unexpectedError') || "An unexpected error occurred");
                        }
                    }
                }
            ]
        );
    };

    const renderHeader = () => (
        <View style={[styles.header, {
            backgroundColor: isDark ? '#183327' : '#FFFFFF',
            paddingTop: insets.top + 12
        }]}>
            <View style={styles.headerTopRow}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { backgroundColor: isDark ? '#1f3b2e' : '#e7f3ee' }]}
                >
                    <Ionicons name="arrow-back" size={24} color={isDark ? cskColors[500] : '#0d1b15'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                    {t('teacher.myCourses')}
                </Text>
                <TouchableOpacity
                    onPress={() => router.push('/create-course')}
                    style={[styles.addButton, { backgroundColor: cskColors[500] }]}
                >
                    <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: cskColors[500] }]}>{courses.length}</Text>
                    <Text style={[styles.statLabel, { color: theme.gray[500] }]}>{t('course.totalCourses') || 'Total Courses'}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.gray[200] }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: cskColors[500] }]}>
                        {coursesData?.summary ? coursesData.summary.totalUniqueStudents : courses.reduce((acc, c) => acc + (c.enrollmentCount || c.enrolledStudents || 0), 0)}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.gray[500] }]}>{t('common.students') || 'Total Students'}</Text>
                </View>
            </View>

            {/* Search bar */}
            <View style={[styles.searchBar, {
                backgroundColor: isDark ? '#1f3b2e' : '#F0F2F5',
                borderColor: isDark ? '#2a4a38' : 'transparent',
            }]}>
                <Ionicons name="search" size={18} color={theme.gray[400]} style={{ marginRight: 8 }} />
                <TextInput
                    style={[styles.searchInput, { color: isDark ? '#ffffff' : '#0d1b15' }]}
                    placeholder={t('common.search') || 'Search courses...'}
                    placeholderTextColor={theme.gray[400]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={theme.gray[400]} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#F6F8F7' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {renderHeader()}

            <FlatList
                data={filteredCourses}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={refetch}
                        tintColor={cskColors[500]}
                        colors={[cskColors[500]]}
                    />
                }
                renderItem={({ item, index }) => (
                    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
                        <CourseMarketplaceCard
                            course={item}
                            onPress={handleCoursePress}
                            isManagement={true}
                            onEdit={handleEditCourse}
                            onDelete={handleDeleteCourse}
                        />
                    </Animated.View>
                )}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? '#183327' : '#FFF' }]}>
                                <Ionicons
                                    name={debouncedQuery ? 'search-outline' : 'book-outline'}
                                    size={64}
                                    color={theme.gray[300]}
                                />
                            </View>
                            <Text style={[styles.emptyText, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                {debouncedQuery ? `No courses matching "${debouncedQuery}"` : t('teacher.noCoursesYet')}
                            </Text>
                            <Text style={[styles.emptySubtext, { color: theme.gray[500] }]}>
                                {debouncedQuery ? 'Try a different search term' : t('teacher.createFirstCourse')}
                            </Text>
                            {!debouncedQuery && (
                                <TouchableOpacity
                                    style={[styles.createBtn, { backgroundColor: cskColors[500] }]}
                                    onPress={() => router.push('/create-course')}
                                >
                                    <Text style={styles.createBtnText}>{t('teacher.createNewCourse')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={cskColors[500]} />
                        </View>
                    )
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        zIndex: 10,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        flex: 1,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 22,
        fontFamily: Fonts.bold,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: 30,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: Fonts.regular,
        padding: 0,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    emptyText: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        marginBottom: 12,
    },
    emptySubtext: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
    },
    createBtn: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 24,
        elevation: 4,
    },
    createBtnText: {
        color: '#FFF',
        fontFamily: Fonts.bold,
        fontSize: 16,
    },
    loadingContainer: {
        marginTop: 100,
    }
});
