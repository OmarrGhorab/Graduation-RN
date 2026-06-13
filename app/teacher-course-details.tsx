import { Fonts, cskColors } from '@/constants/theme';
import { useCourseDetails } from '@/hooks/useCourses';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/libs/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useEffect } from 'react';
import { useCourseReviews } from '@/hooks/useCourseReviews';
import { ReviewsSection } from '@/components/course';
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    Image,
    RefreshControl
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function TeacherCourseDetailsScreen() {
    const params = useLocalSearchParams();
    const { id } = params;
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        if (user && user.role !== 'TEACHER') {
            router.replace('/home');
        }
    }, [user, router]);

    if (!user || user.role !== 'TEACHER') return null;
    
    const { data: detailsData, isLoading, refetch } = useCourseDetails(id as string);
    const course = detailsData?.data?.course;
    const lessons = detailsData?.data?.lessons || [];

    const { 
        reviews, 
        summary,
        isLoading: isLoadingReviews,
    } = useCourseReviews(id as string);

    const ratingInfo = useMemo(() => {
        if (!summary) return { average: 0, count: 0, breakdown: { oneStar: 0, twoStars: 0, threeStars: 0, fourStars: 0, fiveStars: 0 } };
        return {
            average: summary.averageRating || 0,
            count: summary.totalReviews || 0,
            breakdown: summary.ratingBreakdown || { oneStar: 0, twoStars: 0, threeStars: 0, fourStars: 0, fiveStars: 0 }
        };
    }, [summary]);

    const scrollViewRef = useRef<ScrollView>(null);
    const reviewsSectionRef = useRef<View>(null);
    
    const stats = useMemo(() => {
        if (!course) return { enrolled: 0, lessons: 0, revenue: 0 };
        return {
            enrolled: course.enrollmentCount || 0,
            lessons: lessons.length,
            revenue: (course.price || 0) * (course.enrollmentCount || 0)
        };
    }, [course, lessons]);
    
    // Handle deep linking to a specific lesson or tab
    React.useEffect(() => {
        const targetLessonId = params.lessonId || params.lesson_id;
        if (targetLessonId && lessons.length > 0) {
            const lesson = lessons.find((l: any) => l.id === targetLessonId);
            if (lesson) {
                handleLessonPress(lesson);
            }
        }

        if (params.tab === 'REVIEWS') {
            // Wait for potential layout or data load
            setTimeout(() => {
                reviewsSectionRef.current?.measure((x, y, width, height, pageX, pageY) => {
                    scrollViewRef.current?.scrollTo({ y: pageY, animated: true });
                });
            }, 500);
        }
    }, [params.lessonId, params.lesson_id, params.tab, lessons]);

    if (isLoading && !detailsData) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f6f8f7', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={cskColors[500]} />
            </View>
        );
    }

    if (!course) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f6f8f7', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="alert-circle-outline" size={64} color={theme.gray[400]} />
                <Text style={{ color: theme.gray[600], marginTop: 16, fontFamily: Fonts.medium }}>{t('course.notFound')}</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24 }}>
                    <Text style={{ color: cskColors[500], fontFamily: Fonts.bold }}>{t('common.back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleLessonPress = (lesson: typeof lessons[number]) => {
        if (lesson.status === 'COMPLETED') {
            router.push({ pathname: '/lesson-analytics', params: { lessonId: lesson.id, courseId: id } });
            return;
        }

        if (lesson.status === 'LIVE' || lesson.status === 'SCHEDULED') {
            router.push({ pathname: '/teacher-control', params: { lessonId: lesson.id } });
            return;
        }

        router.push({ pathname: '/teacher-control', params: { lessonId: lesson.id } });
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f6f8f7' }]}>
            <StatusBar barStyle="light-content" />
            
            {/* Custom Header */}
            <LinearGradient
                colors={[cskColors[600], cskColors[500]]}
                style={[styles.header, { paddingTop: insets.top + 16 }]}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {course.title}
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/create-course', params: { editId: id } })}
                        style={styles.editButton}
                    >
                        <Ionicons name="create-outline" size={24} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                {/* Course Quick Stats */}
                <View style={styles.headerStats}>
                    <View style={styles.headerStatItem}>
                        <Text style={styles.headerStatValue}>{stats.enrolled}</Text>
                        <Text style={styles.headerStatLabel}>{t('teacher.enrolledStudents')}</Text>
                    </View>
                    <View style={styles.headerStatDivider} />
                    <View style={styles.headerStatItem}>
                        <Text style={styles.headerStatValue}>{stats.lessons}</Text>
                        <Text style={styles.headerStatLabel}>{t('teacher.totalLessons')}</Text>
                    </View>
                    <View style={styles.headerStatDivider} />
                    <View style={styles.headerStatItem}>
                        <Text style={styles.headerStatValue}>{stats.revenue.toLocaleString()}</Text>
                        <Text style={styles.headerStatLabel}>EGP</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={cskColors[500]} />
                }
            >
                {/* Course Metadata Section */}
                <View style={styles.section}>
                   <View style={[styles.courseInfoCard, { backgroundColor: isDark ? '#183327' : '#ffffff', borderColor: isDark ? '#2a4d3d' : '#e9ebed' }]}>
                        <View style={styles.courseHeader}>
                            <View style={[styles.statusBadge, { backgroundColor: course.status === 'ACTIVE' ? '#10b98120' : '#f59e0b20' }]}>
                                <View style={[styles.statusDot, { backgroundColor: course.status === 'ACTIVE' ? '#10b981' : '#f59e0b' }]} />
                                <Text style={[styles.statusText, { color: course.status === 'ACTIVE' ? '#10b981' : '#f59e0b' }]}>
                                    {course.status === 'ACTIVE' ? t('teacher.activeCourse') : t('teacher.inactiveCourse')}
                                </Text>
                            </View>
                            <Text style={[styles.subjectName, { color: theme.gray[500] }]}>{course.subjectName}</Text>
                        </View>
                        <Text style={[styles.courseDescription, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                            {course.description}
                        </Text>
                   </View>
                </View>

                {/* Lesson Management Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                            {t('teacher.totalLessons')} ({stats.lessons})
                        </Text>
                        <TouchableOpacity 
                            style={styles.addLessonBtn}
                            onPress={() => router.push({ pathname: '/create-lesson', params: { courseId: id } })}
                        >
                            <Ionicons name="add-circle" size={20} color={cskColors[500]} />
                            <Text style={styles.addLessonText}>{t('teacher.createNewLesson')}</Text>
                        </TouchableOpacity>
                    </View>

                    {lessons.length > 0 ? (
                        <View style={styles.lessonsList}>
                            {lessons.map((lesson, index) => (
                                <AnimatedTouchableOpacity 
                                    key={lesson.id} 
                                    entering={FadeInDown.delay(index * 100).duration(500)}
                                    style={[styles.lessonCard, { 
                                        backgroundColor: isDark ? '#183327' : '#ffffff',
                                        borderColor: isDark ? '#2a4d3d' : '#e9ebed'
                                    }]}
                                    onPress={() => handleLessonPress(lesson)}
                                    activeOpacity={0.9}
                                >
                                    <View style={styles.lessonTop}>
                                        <View style={styles.lessonInfoMain}>
                                            <Text style={[styles.lessonNumber, { color: cskColors[500] }]}>
                                                {t('courseDetails.lesson')} {lesson.lessonNumber}
                                            </Text>
                                            <Text style={[styles.lessonTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                                                {lesson.title}
                                            </Text>
                                        </View>
                                        <View style={[styles.lessonStatusBadge, { 
                                            backgroundColor: 
                                                lesson.status === 'LIVE' ? '#ef444420' : 
                                                lesson.status === 'COMPLETED' ? '#10b98120' : '#3b82f620' 
                                        }]}>
                                            <Text style={[styles.lessonStatusText, { 
                                                color: 
                                                    lesson.status === 'LIVE' ? '#ef4444' : 
                                                    lesson.status === 'COMPLETED' ? '#10b981' : '#3b82f6'
                                            }]}>
                                                {lesson.status}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.lessonMetaRow}>
                                        <View style={styles.metaItem}>
                                            <Ionicons name="calendar-outline" size={14} color={theme.gray[500]} />
                                            <Text style={[styles.metaText, { color: theme.gray[500] }]}>
                                                {new Date(lesson.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </Text>
                                        </View>
                                        <View style={styles.metaItem}>
                                            <Ionicons name="time-outline" size={14} color={theme.gray[500]} />
                                            <Text style={[styles.metaText, { color: theme.gray[500] }]}>
                                                {new Date(lesson.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                        {lesson.attendeeCount !== undefined && (
                                            <View style={styles.metaItem}>
                                                <Ionicons name="people-outline" size={14} color={cskColors[500]} />
                                                <Text style={[styles.metaText, { color: cskColors[500], fontFamily: Fonts.bold }]}>
                                                    {lesson.attendeeCount} {t('common.students') || 'Students'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={[styles.lessonDivider, { backgroundColor: isDark ? '#2a4d3d' : '#f0f2f4' }]} />

                                    <View style={styles.lessonActions}>
                                        {lesson.status === 'LIVE' ? (
                                            <TouchableOpacity 
                                                style={[styles.lessonActionBtn, { backgroundColor: cskColors[500] }]}
                                                onPress={() => handleLessonPress(lesson)}
                                            >
                                                <Ionicons name="settings-outline" size={18} color="#ffffff" />
                                                <Text style={styles.lessonActionBtnText}>{t('teacher.manageLesson')}</Text>
                                            </TouchableOpacity>
                                        ) : lesson.status === 'COMPLETED' ? (
                                            <TouchableOpacity 
                                                style={[styles.lessonActionBtn, { backgroundColor: isDark ? '#1f3b2e' : '#e7f3ee' }]}
                                                onPress={() => handleLessonPress(lesson)}
                                            >
                                                <Ionicons name="list-outline" size={18} color={cskColors[500]} />
                                                <Text style={[styles.lessonActionBtnText, { color: cskColors[500] }]}>{t('teacher.viewAttendance')}</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity 
                                                style={[styles.lessonActionBtn, { backgroundColor: isDark ? '#1f3b2e' : '#e7f3ee' }]}
                                                onPress={() => handleLessonPress(lesson)}
                                            >
                                                <Ionicons name="create-outline" size={18} color={cskColors[500]} />
                                                <Text style={[styles.lessonActionBtnText, { color: cskColors[500] }]}>{t('teacher.editLesson')}</Text>
                                            </TouchableOpacity>
                                        )}
                                        
                                        <TouchableOpacity 
                                            style={[styles.lessonManageBtn, { backgroundColor: isDark ? '#1f3b2e' : '#f0f2f4' }]}
                                            onPress={() => router.push({ pathname: '/lesson-analytics', params: { lessonId: lesson.id, courseId: id } })}
                                        >
                                            <Ionicons name="analytics-outline" size={18} color={isDark ? '#ffffff' : '#0d1b15'} />
                                        </TouchableOpacity>
                                    </View>
                                </AnimatedTouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <View style={[styles.emptyState, { backgroundColor: isDark ? '#183327' : '#ffffff' }]}>
                            <Ionicons name="calendar-outline" size={48} color={theme.gray[300]} />
                            <Text style={[styles.emptyText, { color: theme.gray[500] }]}>{t('teacher.noLessonsYet') || 'No lessons scheduled'}</Text>
                        </View>
                    )}
                </View>

                {/* Reviews Section */}
                <View ref={reviewsSectionRef}>
                    <ReviewsSection 
                        reviews={reviews}
                        averageRating={ratingInfo.average}
                        totalReviews={ratingInfo.count}
                        ratingBreakdown={ratingInfo.breakdown}
                        canReview={false} // Teacher can't review their own course
                        onAddReview={() => {}}
                        onEditReview={() => {}}
                        onDeleteReview={() => {}}
                    />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Quick Stats Floating Card (Optional, using header instead) */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 32,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        zIndex: 10,
        elevation: 5,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    editButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: '#ffffff',
        textAlign: 'center',
        marginHorizontal: 12,
    },
    headerStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    headerStatItem: {
        alignItems: 'center',
        flex: 1,
    },
    headerStatValue: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        color: '#ffffff',
    },
    headerStatLabel: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    headerStatDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    scrollView: {
        flex: 1,
        marginTop: -20,
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    addLessonBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    addLessonText: {
        color: cskColors[500],
        fontFamily: Fonts.semiBold,
        fontSize: 14,
    },
    courseInfoCard: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    courseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
    },
    subjectName: {
        fontSize: 13,
        fontFamily: Fonts.semiBold,
    },
    courseDescription: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        lineHeight: 22,
    },
    lessonsList: {
        gap: 16,
    },
    lessonCard: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    lessonTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    lessonInfoMain: {
        flex: 1,
    },
    lessonNumber: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        marginBottom: 2,
    },
    lessonTitle: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },
    lessonStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    lessonStatusText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
    },
    lessonMetaRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    lessonDivider: {
        height: 1,
        marginBottom: 16,
    },
    lessonActions: {
        flexDirection: 'row',
        gap: 12,
    },
    lessonActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 12,
    },
    lessonActionBtnText: {
        color: '#ffffff',
        fontFamily: Fonts.bold,
        fontSize: 14,
    },
    lessonManageBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#d1d5d9',
    },
    emptyText: {
        marginTop: 12,
        fontFamily: Fonts.medium,
    },
});
