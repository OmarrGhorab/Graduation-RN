import CourseMarketplaceCard from '@/components/course/CourseMarketplaceCard';
import { Fonts, cskColors } from '@/constants/theme';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { ApiCourse } from '@/services/CourseService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert
} from 'react-native';
import { deleteCourse } from '@/services/CourseService';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function TeacherCoursesScreen() {
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();

    const { data: coursesData, isLoading, refetch } = useTeacherCourses();
    const courses = coursesData?.success ? coursesData.data : [];


    const handleCoursePress = (courseId: string) => {
        router.push({ pathname: '/course-details', params: { id: courseId } });
    };

    const handleEditCourse = (course: ApiCourse) => {
        // Navigate to edit course screen (which usually reuses create-course logic with initial data)
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
            paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 48 
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
                        {courses.reduce((acc, c) => acc + (c.enrolledStudents || 0), 0)}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.gray[500] }]}>Total Students</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#F6F8F7' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
            
            {renderHeader()}

            <FlatList
                data={courses}
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
                    <Animated.View entering={FadeInDown.delay(index * 100).duration(500)}>
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
                                <Ionicons name="book-outline" size={64} color={theme.gray[300]} />
                            </View>
                            <Text style={[styles.emptyText, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                No courses found
                            </Text>
                            <Text style={[styles.emptySubtext, { color: theme.gray[500] }]}>
                                You haven't created any courses yet. Start by creating your first course!
                            </Text>
                            <TouchableOpacity
                                style={[styles.createBtn, { backgroundColor: cskColors[500] }]}
                                onPress={() => router.push('/create-course')}
                            >
                                <Text style={styles.createBtnText}>Create Course</Text>
                            </TouchableOpacity>
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
