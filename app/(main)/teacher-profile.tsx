import Avatar from '@/components/common/Avatar';
import CourseMarketplaceCard from '@/components/course/CourseMarketplaceCard';
import { Fonts } from '@/constants/theme';
import { useAllCourses } from '@/hooks/useCourses';
import { useTeacherProfile } from '@/hooks/useTeachers';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function TeacherProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme, isDark } = useTheme();
    const { t } = useTranslation();
    const router = useRouter();

    const { data: profileResponse, isLoading: isProfileLoading } = useTeacherProfile(id!);
    const { data: coursesResponse, isLoading: isCoursesLoading } = useAllCourses({ teacherId: id, limit: 100 });

    const teacher = profileResponse?.data;
    const courses = coursesResponse?.data || [];

    if (isProfileLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!teacher) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
                <Text style={[styles.errorText, { color: theme.gray[500] }]}>Teacher not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.primary }]}>
                    <Text style={{ color: '#FFF', fontFamily: Fonts.bold }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            {/* Header / Cover Area */}
            <View style={[styles.coverArea, { backgroundColor: theme.primary }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.profileCardWrap}>
                    <View style={[styles.profileCard, { backgroundColor: isDark ? theme.surface : '#FFF' }]}>
                        <View style={styles.avatarPosition}>
                            <Avatar 
                                uri={teacher.profileImg} 
                                name={teacher.name} 
                                size={100} 
                                style={{ borderWidth: 4, borderColor: isDark ? theme.surface : '#FFF' }} 
                            />
                        </View>
                        
                        <View style={styles.profileInfo}>
                            <Text style={[styles.teacherName, { color: isDark ? theme.text : '#1F2937' }]}>{teacher.name}</Text>
                            <Text style={[styles.teacherUsername, { color: theme.gray[500] }]}>@{teacher.username}</Text>
                            
                            {teacher.bio && (
                                <Text style={[styles.teacherBio, { color: isDark ? theme.gray[400] : theme.gray[600] }]}>
                                    {teacher.bio}
                                </Text>
                            )}

                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: theme.primary }]}>{courses.length}</Text>
                                    <Text style={[styles.statLabel, { color: theme.gray[500] }]}>{t('courses.courses')}</Text>
                                </View>
                                <View style={[styles.statDivider, { backgroundColor: theme.gray[200] }]} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: theme.primary }]}>4.8</Text>
                                    <View style={styles.ratingRow}>
                                        <Ionicons name="star" size={12} color="#FBBF24" />
                                        <Text style={[styles.statLabel, { color: theme.gray[500], marginLeft: 4 }]}>Rating</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Courses Section */}
                <View style={styles.coursesSection}>
                    <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#1F2937' }]}>
                        {t('courses.allCourses')} ({courses.length})
                    </Text>

                    {isCoursesLoading ? (
                        <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 20 }} />
                    ) : courses.length > 0 ? (
                        courses.map((course, index) => (
                            <Animated.View 
                                key={course.id}
                                entering={FadeIn.delay(index * 100)}
                                style={styles.courseCardWrap}
                            >
                                <CourseMarketplaceCard 
                                    course={course}
                                    onPress={(cid: string) => router.push({ pathname: '/course-details', params: { id: cid } })}
                                />
                            </Animated.View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="book-outline" size={48} color={theme.gray[300]} />
                            <Text style={[styles.emptyText, { color: theme.gray[500] }]}>No courses found for this teacher</Text>
                        </View>
                    )}
                </View>
                
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        marginBottom: 20,
    },
    backBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    coverArea: {
        height: 160,
        width: '100%',
        paddingTop: 48,
        paddingHorizontal: 20,
    },
    headerBackBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileCardWrap: {
        paddingHorizontal: 20,
        marginTop: -60,
        marginBottom: 24,
    },
    profileCard: {
        borderRadius: 24,
        padding: 24,
        paddingTop: 50,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    avatarPosition: {
        position: 'absolute',
        top: -50,
        alignSelf: 'center',
    },
    profileInfo: {
        alignItems: 'center',
        width: '100%',
    },
    teacherName: {
        fontSize: 22,
        fontFamily: Fonts.bold,
        marginBottom: 4,
    },
    teacherUsername: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        marginBottom: 16,
    },
    teacherBio: {
        fontSize: 15,
        fontFamily: Fonts.regular,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 24,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    statDivider: {
        width: 1,
        height: 30,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    coursesSection: {
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    courseCardWrap: {
        marginBottom: 16,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
        gap: 12,
    },
    emptyText: {
        fontFamily: Fonts.medium,
        fontSize: 16,
    },
});
