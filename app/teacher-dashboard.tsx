import { Fonts, cskColors } from '@/constants/theme';
import { useTeacherCourses } from '@/hooks/useCourses';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/libs/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function TeacherDashboardScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const user = useAuthStore((state) => state.user);
    const { data: coursesData, isLoading } = useTeacherCourses();

    const courses = coursesData?.data || [];

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f6f8f7' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, {
                backgroundColor: isDark ? '#183327' : '#ffffff',
                borderBottomColor: isDark ? '#2a4d3d' : '#e9ebed'
            }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { backgroundColor: isDark ? '#1f3b2e' : '#e7f3ee' }]}
                >
                    <Ionicons name="arrow-back" size={24} color={isDark ? cskColors[500] : '#0d1b15'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                    Teacher Dashboard
                </Text>
                <View style={{ width: 48 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Welcome Section */}
                <View style={styles.welcomeSection}>
                    <Text style={[styles.welcomeText, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                        Welcome back, {user?.name?.split(' ')[0] || 'Teacher'}!
                    </Text>
                    <Text style={[styles.welcomeSubtext, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                        Manage your courses and lessons
                    </Text>
                </View>

                {/* Create New Course Card */}
                <TouchableOpacity
                    style={[styles.createCourseCard, {
                        backgroundColor: cskColors[500],
                    }]}
                    onPress={() => router.push('/create-course')}
                    activeOpacity={0.9}
                >
                    <View style={styles.createCourseContent}>
                        <View style={styles.createCourseIcon}>
                            <Ionicons name="add-circle" size={48} color="#ffffff" />
                        </View>
                        <View style={styles.createCourseText}>
                            <Text style={styles.createCourseTitle}>Create New Course</Text>
                            <Text style={styles.createCourseSubtitle}>
                                Set up a new course with lessons and attendance tracking
                            </Text>
                        </View>
                        <Ionicons name="arrow-forward" size={24} color="#ffffff" />
                    </View>
                </TouchableOpacity>

                {/* Create New Lesson Card */}
                <TouchableOpacity
                    style={[styles.createLessonCard, {
                        backgroundColor: isDark ? '#183327' : '#ffffff',
                        borderColor: cskColors[500],
                    }]}
                    onPress={() => router.push('/create-lesson')}
                    activeOpacity={0.9}
                >
                    <View style={styles.createCourseContent}>
                        <View style={[styles.createLessonIcon, { backgroundColor: `${cskColors[500]}20` }]}>
                            <Ionicons name="calendar-outline" size={32} color={cskColors[500]} />
                        </View>
                        <View style={styles.createCourseText}>
                            <Text style={[styles.createLessonTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                                Create New Lesson
                            </Text>
                            <Text style={[styles.createLessonSubtitle, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                                Schedule a new lesson for your courses
                            </Text>
                        </View>
                        <Ionicons name="arrow-forward" size={24} color={cskColors[500]} />
                    </View>
                </TouchableOpacity>

                {/* Quick Stats */}
                <View style={styles.statsSection}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                        Quick Stats
                    </Text>
                    <View style={styles.statsGrid}>
                        <View style={[styles.statCard, {
                            backgroundColor: isDark ? '#183327' : '#ffffff',
                            borderColor: isDark ? '#2a4d3d' : '#e9ebed'
                        }]}>
                            <View style={[styles.statIconContainer, { backgroundColor: `${cskColors[500]}20` }]}>
                                <Ionicons name="book" size={24} color={cskColors[500]} />
                            </View>
                            <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                                {courses.length}
                            </Text>
                            <Text style={[styles.statLabel, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                                Active Courses
                            </Text>
                        </View>

                        <View style={[styles.statCard, {
                            backgroundColor: isDark ? '#183327' : '#ffffff',
                            borderColor: isDark ? '#2a4d3d' : '#e9ebed'
                        }]}>
                            <View style={[styles.statIconContainer, { backgroundColor: `${cskColors[500]}20` }]}>
                                <Ionicons name="people" size={24} color={cskColors[500]} />
                            </View>
                            <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                                {courses.reduce((sum, course) => sum + (course.enrolledStudents || 0), 0)}
                            </Text>
                            <Text style={[styles.statLabel, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                                Total Students
                            </Text>
                        </View>
                    </View>
                </View>

                {/* My Courses */}
                <View style={styles.coursesSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                            My Courses
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/teacher-courses')}>
                            <Text style={[styles.viewAllText, { color: cskColors[500] }]}>
                                View All
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {isLoading ? (
                        <ActivityIndicator size="large" color={cskColors[500]} style={{ marginVertical: 32 }} />
                    ) : courses.length > 0 ? (
                        <View style={styles.coursesList}>
                            {courses.slice(0, 3).map((course) => (
                                <TouchableOpacity
                                    key={course.id}
                                    style={[styles.courseCard, {
                                        backgroundColor: isDark ? '#183327' : '#ffffff',
                                        borderColor: isDark ? '#2a4d3d' : '#e9ebed'
                                    }]}
                                    onPress={() => router.push({ pathname: '/course-details', params: { id: course.id } })}
                                >
                                    <View style={styles.courseCardContent}>
                                        <View style={[styles.courseIcon, { backgroundColor: `${cskColors[500]}20` }]}>
                                            <Ionicons name="book-outline" size={24} color={cskColors[500]} />
                                        </View>
                                        <View style={styles.courseInfo}>
                                            <Text style={[styles.courseTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                                                {course.title}
                                            </Text>
                                            <Text style={[styles.courseSubtitle, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                                                {course.subjectName} | {course.enrolledStudents || 0} students | {course.billingType === 'MONTHLY' ? 'Monthly' : 'One-Time'}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={isDark ? '#6b737c' : '#949da5'} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={[styles.emptyState, {
                            backgroundColor: isDark ? '#183327' : '#ffffff',
                            borderColor: isDark ? '#2a4d3d' : '#e9ebed'
                        }]}>
                            <Ionicons name="book-outline" size={48} color={isDark ? '#3a4048' : '#d1d5d9'} />
                            <Text style={[styles.emptyStateText, { color: isDark ? '#6b737c' : '#949da5' }]}>
                                No courses yet
                            </Text>
                            <Text style={[styles.emptyStateSubtext, { color: isDark ? '#6b737c' : '#949da5' }]}>
                                Create your first course to get started
                            </Text>
                        </View>
                    )}
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsSection}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                        Quick Actions
                    </Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity
                            style={[styles.actionCard, {
                                backgroundColor: isDark ? '#183327' : '#ffffff',
                                borderColor: isDark ? '#2a4d3d' : '#e9ebed'
                            }]}
                            onPress={() => router.push('/teacher-courses')}
                        >
                            <Ionicons name="list" size={28} color={cskColors[500]} />
                            <Text style={[styles.actionText, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                View All Courses
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, {
                                backgroundColor: isDark ? '#183327' : '#ffffff',
                                borderColor: isDark ? '#2a4d3d' : '#e9ebed'
                            }]}
                            onPress={() => router.push('/settings')}
                        >
                            <Ionicons name="settings-outline" size={28} color={cskColors[500]} />
                            <Text style={[styles.actionText, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                Settings
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        flex: 1,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    welcomeSection: {
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 28,
        fontFamily: Fonts.bold,
        marginBottom: 4,
    },
    welcomeSubtext: {
        fontSize: 16,
        fontFamily: Fonts.regular,
    },
    createCourseCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    createCourseContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    createCourseIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    createCourseText: {
        flex: 1,
    },
    createCourseTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: '#ffffff',
        marginBottom: 4,
    },
    createCourseSubtitle: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    createLessonCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    createLessonIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createLessonTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        marginBottom: 4,
    },
    createLessonSubtitle: {
        fontSize: 14,
        fontFamily: Fonts.regular,
    },
    statsSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    statIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 32,
        fontFamily: Fonts.bold,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        textAlign: 'center',
    },
    coursesSection: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    viewAllText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    coursesList: {
        gap: 12,
    },
    courseCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
    },
    courseCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    courseIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    courseInfo: {
        flex: 1,
    },
    courseTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        marginBottom: 4,
    },
    courseSubtitle: {
        fontSize: 14,
        fontFamily: Fonts.regular,
    },
    emptyState: {
        padding: 48,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
        marginTop: 16,
    },
    emptyStateSubtext: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        marginTop: 4,
        textAlign: 'center',
    },
    actionsSection: {
        marginBottom: 24,
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        gap: 12,
    },
    actionText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        textAlign: 'center',
    },
});
