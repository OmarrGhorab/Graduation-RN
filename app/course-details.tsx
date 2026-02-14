import { CourseStatsCard, QRScannerModal, SyllabusItem } from '@/components/course';
import { Fonts } from '@/constants/theme';
import { useCourseDetails, useEnrollCourse } from '@/hooks/useCourses';
import { useCreateLesson, useLessonMutations } from '@/hooks/useLessons';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/libs/auth';
import { scanAttendance } from '@/services/CourseService';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function CourseDetailsScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const params = useLocalSearchParams();
    const { id: courseId } = params;
    const { theme, isDark } = useTheme();
    const [showScanner, setShowScanner] = useState(false);

    const { profile } = useProfile();
    const user = useAuthStore(state => state.user);
    const isTeacher = user?.role === 'TEACHER';

    const { data: detailsData, isLoading, error } = useCourseDetails(courseId as string, profile?.id);
    const createLessonMutation = useCreateLesson();
    const { startLesson: startLessonMutation } = useLessonMutations();
    const enrollMutation = useEnrollCourse();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newLessonTitle, setNewLessonTitle] = useState('');

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
    if (!course) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.gray[400]} />
                <Text style={{ marginTop: 12, color: theme.gray[600], textAlign: 'center' }}>
                    Course data is incomplete
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.primary, fontFamily: Fonts.bold }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isEnrolled = !!detailsData.data?.enrollment || !!progress;

    const handleEnroll = async () => {
        if (!profile?.id) {
            Alert.alert('Error', 'Please login to enroll');
            return;
        }

        try {
            await enrollMutation.mutateAsync({
                courseId: courseId as string,
                studentId: profile.id
            });
            Alert.alert('Success', 'You have been enrolled in this course!');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to enroll in course');
        }
    };


    const handleScan = async (data: string) => {
        setShowScanner(false);
        try {
            const result = await scanAttendance(data);

            if (result.success) {
                // Invalidate query to refresh attendance status
                queryClient.invalidateQueries({ queryKey: ['course', courseId, 'details'] });

                router.push({
                    pathname: '/attendance-success',
                    params: {
                        data,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        location: course.locationName || 'Main Campus'
                    }
                });
            } else {
                Alert.alert('Attendance Failed', result.message || 'Could not verify attendance.');
            }
        } catch (error: any) {
            console.error('[CourseDetails] Scan failed:', error);
            Alert.alert('Error', error.message || 'Failed to scan QR code.');
        }
    };

    const handleCreateLesson = async () => {
        if (!newLessonTitle.trim()) {
            Alert.alert('Error', 'Please enter a lesson title');
            return;
        }

        try {
            await createLessonMutation.mutateAsync({
                courseId: courseId as string,
                title: newLessonTitle,
                description: 'New lesson created from mobile app',
                scheduledAt: new Date().toISOString(),
                durationMinutes: 90,
                locationName: course.locationName || 'Classroom',
                locationLat: course.locationLat || 30.0444,
                locationLng: course.locationLng || 31.2357,
                geofenceRadiusM: course.geofenceRadiusM || 100
            });

            Alert.alert('Success', 'Lesson created successfully');
            setShowCreateModal(false);
            setNewLessonTitle('');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to create lesson');
        }
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
                {!isTeacher && !isEnrolled && (
                    <Animated.View entering={FadeInDown.delay(50).duration(600)} style={[styles.enrollCard, { backgroundColor: theme.primary }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.enrollTitle, { color: '#FFF' }]}>Ready to start learning?</Text>
                            <Text style={[styles.enrollSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                                {course.isPaid ? `${course.currency} ${course.price}` : 'Free Course'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.enrollButton, { backgroundColor: '#FFF' }]}
                            onPress={handleEnroll}
                            disabled={enrollMutation.isPending}
                        >
                            {enrollMutation.isPending ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <Text style={[styles.enrollButtonText, { color: theme.primary }]}>
                                    {course.isPaid ? 'Enroll Now' : 'Join Free'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                )}
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

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#000' }]}>Course Syllabus</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {isTeacher && (
                            <TouchableOpacity onPress={() => setShowCreateModal(true)}>
                                <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity>
                            <Text style={[styles.viewAllText, { color: theme.primary }]}>VIEW ALL</Text>
                        </TouchableOpacity>
                    </View>
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
                            onAbsentRequest={() => router.push({ pathname: '/absence-request', params: { lessonId: item.id } })}
                            canMarkAttendance={item.canMarkAttendance}
                            attendanceStatus={item.attendanceStatus}
                            isTeacher={isTeacher}
                            onStartLesson={async () => {
                                try {
                                    await startLessonMutation.mutateAsync(item.id);
                                    router.push({
                                        pathname: '/teacher-control',
                                        params: { lessonId: item.id }
                                    });
                                } catch (err: any) {
                                    Alert.alert('Error', err.message || 'Failed to start lesson');
                                }
                            }}
                            onManageLesson={() => {
                                router.push({
                                    pathname: '/teacher-control',
                                    params: { lessonId: item.id }
                                });
                            }}
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

            {/* Simple Create Lesson Modal */}
            <Modal
                visible={showCreateModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? theme.surface : '#FFF' }]}>
                        <Text style={[styles.modalTitle, { color: isDark ? theme.text : '#000' }]}>Create New Lesson</Text>
                        <TextInput
                            style={[styles.input, { color: isDark ? theme.text : '#000', borderColor: theme.gray[200] }]}
                            placeholder="Lesson Title"
                            placeholderTextColor={theme.gray[400]}
                            value={newLessonTitle}
                            onChangeText={setNewLessonTitle}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.gray[100] }]}
                                onPress={() => setShowCreateModal(false)}
                            >
                                <Text style={{ color: '#000' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                                onPress={handleCreateLesson}
                                disabled={createLessonMutation.isPending}
                            >
                                {createLessonMutation.isPending ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={{ color: '#FFF' }}>Create</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        gap: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        textAlign: 'center',
    },
    input: {
        height: 56,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontFamily: Fonts.regular,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    enrollCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        gap: 16,
    },
    enrollTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        marginBottom: 4,
    },
    enrollSubtitle: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    enrollButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    enrollButtonText: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    }
});
