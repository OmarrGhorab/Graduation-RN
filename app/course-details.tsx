import { CourseStatsCard, QRScannerModal, SyllabusItem } from '@/components/course';
import { Fonts } from '@/constants/theme';
import { useCourseDetails } from '@/hooks/useCourses';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function CourseDetailsScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id: courseId } = params;
    const { theme, isDark } = useTheme();
    const [showScanner, setShowScanner] = useState(false);

    const { profile } = useProfile();
    const { data: detailsData, isLoading, error } = useCourseDetails(courseId as string, profile?.id);

    useEffect(() => {
        if (params.action === 'scan') {
            setShowScanner(true);
        }
    }, [params.action]);

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7', justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (error || !detailsData) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.gray[400]} />
                <Text style={{ marginTop: 12, color: theme.gray[600], textAlign: 'center' }}>
                    {error ? 'Failed to load course details' : 'Course not found'}
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.primary, fontFamily: Fonts.bold }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { course, progress, teacher, lessons } = detailsData.data;

    const handleScan = (data: string) => {
        setShowScanner(false);
        router.push({
            pathname: '/attendance-success',
            params: {
                data,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                location: course.locationName || 'Main Campus'
            }
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {/* Header */}
            <View style={[styles.header, { paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? theme.text : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.gray[600] }]}>{course.subjectName?.toUpperCase() || 'COURSE DETAILS'}</Text>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="ellipsis-vertical" size={24} color={isDark ? theme.text : '#000'} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <Animated.View entering={FadeInDown.duration(600)} style={styles.heroSection}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[200] }]}>
                        <Ionicons name="school-outline" size={48} color={theme.primary} />
                    </View>
                    <Text style={[styles.courseTitle, { color: isDark ? theme.text : '#0d1b15' }]}>{course.title}</Text>
                    <Text style={[styles.courseSubtitle, { color: theme.gray[500] }]}>
                        {course.subjectName} • {course.deliveryType}
                    </Text>
                </Animated.View>

                {/* Stats Card */}
                {progress ? (
                    <CourseStatsCard
                        attendance={progress.attendancePercentage || 0}
                        classesAttended={(progress.presentCount || 0) + (progress.lateCount || 0)}
                        totalClasses={progress.totalClasses || 0}
                        targetPercentage={progress.targetPercentage || 0}
                    />
                ) : (
                    <View style={[styles.instructorCard, { padding: 16, alignItems: 'center', backgroundColor: isDark ? theme.surface : '#FFFFFF' }]}>
                        <Text style={{ color: theme.gray[500], fontFamily: Fonts.medium }}>No progress data available yet</Text>
                    </View>
                )}

                {/* Instructor Info */}
                <Animated.View entering={FadeInDown.delay(100).duration(600)} style={[styles.instructorCard, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[200] }]}>
                    <View style={styles.instructorInfo}>
                        <Image
                            source={{ uri: teacher.profileImg || 'https://i.pravatar.cc/300?img=12' }}
                            style={styles.avatar}
                        />
                        <View>
                            <Text style={[styles.instructorName, { color: isDark ? theme.text : '#000' }]}>{teacher.name}</Text>
                            <Text style={[styles.department, { color: theme.gray[500] }]}>Instructor</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.chatButton, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}
                        onPress={() => router.push(`/conversation/${teacher.id}`)}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.primary} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Syllabus Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#000' }]}>Course Syllabus</Text>
                    <TouchableOpacity>
                        <Text style={[styles.viewAllText, { color: theme.primary }]}>VIEW ALL</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.syllabusList, { borderLeftColor: isDark ? theme.border : theme.gray[200] }]}>
                    {lessons.map((item, index) => (
                        <SyllabusItem
                            key={item.id}
                            title={item.title}
                            status={item.status as any}
                            time={new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            date={new Date(item.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            location={item.locationName}
                            description={item.description}
                            isLast={index === lessons.length - 1}
                            onPress={() => console.log('Syllabus item pressed')}
                            onMarkAttendance={() => setShowScanner(true)}
                            onAbsentRequest={() => router.push('/absence-request')}
                            canMarkAttendance={item.canMarkAttendance}
                        />
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <QRScannerModal
                visible={showScanner}
                onClose={() => setShowScanner(false)}
                onScan={handleScan}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    iconButton: {
        padding: 8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        letterSpacing: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    courseTitle: {
        fontSize: 24,
        fontFamily: Fonts.bold,
        textAlign: 'center',
        marginBottom: 4,
    },
    courseSubtitle: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    instructorCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    instructorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'rgba(18, 237, 135, 0.2)',
    },
    instructorName: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    department: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    chatButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
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
    viewAllText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        letterSpacing: 0.5,
    },
    syllabusList: {
        borderLeftWidth: 2,
        marginLeft: 8,
        paddingLeft: 24,
        paddingBottom: 16,
    },
});
