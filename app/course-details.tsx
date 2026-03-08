import { AssistantsSection, EnrollmentBadge, QRScannerModal } from '@/components/course';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function CourseDetailsScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const queryClient = useQueryClient();
    const params = useLocalSearchParams();
    const { id: courseId } = params;
    const { theme, isDark } = useTheme();
    const [showScanner, setShowScanner] = useState(false);
    const [expandedModules, setExpandedModules] = useState<{ [key: string]: boolean }>({ '0': true });
    const [showFullDescription, setShowFullDescription] = useState(false);

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

    const toggleModule = (index: string) => {
        setExpandedModules(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const getLessonIcon = (status: string, attendanceStatus?: string | null) => {
        if (attendanceStatus === 'PRESENT' || attendanceStatus === 'LATE') return 'checkmark-circle';
        if (status === 'LIVE') return 'play-circle';
        return 'lock-closed';
    };

    const getLessonIconColor = (status: string, attendanceStatus?: string | null) => {
        if (attendanceStatus === 'PRESENT' || attendanceStatus === 'LATE') return theme.primary;
        if (status === 'LIVE') return theme.primary;
        return theme.gray[400];
    };

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
                deliveryType: course.deliveryType || 'OFFLINE',
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
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Image Section */}
                <View style={styles.heroImageContainer}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800' }}
                        style={styles.heroImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.5)', 'transparent']}
                        style={styles.heroGradient}
                    />
                    <View style={styles.heroNav}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.heroButton}>
                            <Ionicons name="chevron-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.heroButton}>
                            <Ionicons name="share-outline" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Content Card */}
                <View style={[styles.mainCard, { backgroundColor: isDark ? theme.surface : '#FFFFFF' }]}>
                    <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: `${theme.primary}15` }]}>
                            <Text style={[styles.badgeText, { color: theme.primary }]}>{course.subjectName?.toUpperCase()}</Text>
                        </View>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#FFC107" />
                            <Text style={[styles.ratingText, { color: theme.gray[600] }]}>4.7</Text>
                            <Text style={[styles.ratingCount, { color: theme.gray[400] }]}>(1.2k)</Text>
                        </View>
                    </View>

                    <Text style={[styles.courseTitle, { color: isDark ? theme.text : '#0d1b15' }]}>{course.title}</Text>

                    <View style={[styles.instructorCard, { backgroundColor: isDark ? theme.background : '#F6F8F7', borderColor: `${theme.primary}10` }]}>
                        <View style={styles.instructorInfo}>
                            <Image
                                source={{ uri: teacher.profileImg || 'https://i.pravatar.cc/300?img=12' }}
                                style={[styles.avatar, { borderColor: `${theme.primary}30` }]}
                            />
                            <View>
                                <Text style={[styles.instructorLabel, { color: theme.gray[500] }]}>Instructor</Text>
                                <Text style={[styles.instructorName, { color: isDark ? theme.text : '#000' }]}>{teacher.name}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => router.push(`/conversation/${teacher.id}`)}>
                            <Text style={[styles.viewProfileText, { color: theme.primary }]}>View Profile</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Enrollment Count */}
                    {course.enrollmentCount !== undefined && (
                        <View style={{ marginTop: 12 }}>
                            <EnrollmentBadge count={course.enrollmentCount} />
                        </View>
                    )}
                </View>

                {/* Description Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#000' }]}>Description</Text>
                    <Text style={[styles.descriptionText, { color: theme.gray[600] }]} numberOfLines={showFullDescription ? undefined : 3}>
                        {course.description || 'This course provides a comprehensive introduction to the subject matter. Topics include fundamental concepts, practical applications, and advanced techniques...'}
                    </Text>
                    <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)} style={styles.readMoreButton}>
                        <Text style={[styles.readMoreText, { color: theme.primary }]}>
                            {showFullDescription ? 'Read Less' : 'Read More'}
                        </Text>
                        <Ionicons name={showFullDescription ? 'chevron-up' : 'chevron-down'} size={12} color={theme.primary} />
                    </TouchableOpacity>
                </View>

                {/* Course Assistants Section */}
                {course.assistants && course.assistants.length > 0 && (
                    <AssistantsSection
                        assistants={course.assistants}
                        isTeacher={isTeacher}
                        onAddAssistant={() => {
                            Alert.alert('Add Assistant', 'Assistant management UI coming soon');
                        }}
                        onRemoveAssistant={async (assistantId) => {
                            try {
                                const { removeCourseAssistant } = await import('@/services/CourseService');
                                await removeCourseAssistant(courseId as string, assistantId);
                                queryClient.invalidateQueries({ queryKey: ['course', courseId, 'details'] });
                                Alert.alert('Success', 'Assistant removed successfully');
                            } catch (error: any) {
                                Alert.alert('Error', error.message || 'Failed to remove assistant');
                            }
                        }}
                    />
                )}

                {/* Curriculum Section */}
                <View style={styles.section}>
                    <View style={styles.curriculumHeader}>
                        <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#000' }]}>Curriculum</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            {isTeacher && (
                                <TouchableOpacity onPress={() => setShowCreateModal(true)}>
                                    <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                                </TouchableOpacity>
                            )}
                            <Text style={[styles.curriculumMeta, { color: theme.gray[500] }]}>
                                {lessons.length} Lessons
                            </Text>
                        </View>
                    </View>

                    <View style={styles.curriculumList}>
                        {lessons.map((lesson, index) => {
                            const moduleKey = index.toString();
                            const isExpanded = expandedModules[moduleKey];
                            const lessonIcon = getLessonIcon(lesson.status, lesson.attendanceStatus);
                            const lessonIconColor = getLessonIconColor(lesson.status, lesson.attendanceStatus);

                            return (
                                <View key={lesson.id} style={[styles.moduleCard, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[100] }]}>
                                    <TouchableOpacity
                                        onPress={() => toggleModule(moduleKey)}
                                        style={[styles.moduleHeader, { backgroundColor: isExpanded ? `${theme.primary}08` : 'transparent' }]}
                                    >
                                        <View>
                                            <Text style={[styles.moduleLabel, { color: isExpanded ? theme.primary : theme.gray[400] }]}>
                                                LESSON {index + 1}
                                            </Text>
                                            <Text style={[styles.moduleTitle, { color: isDark ? theme.text : '#000' }]}>
                                                {lesson.title}
                                            </Text>
                                        </View>
                                        <Ionicons
                                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                            size={24}
                                            color={isExpanded ? theme.primary : theme.gray[400]}
                                        />
                                    </TouchableOpacity>

                                    {isExpanded && (
                                        <View style={styles.lessonDetails}>
                                            <View style={[styles.lessonItem, { backgroundColor: `${theme.primary}08` }]}>
                                                <View style={[styles.lessonIconContainer, { backgroundColor: lessonIconColor }]}>
                                                    <Ionicons name={lessonIcon as any} size={16} color="#FFF" />
                                                </View>
                                                <View style={styles.lessonInfo}>
                                                    <Text style={[styles.lessonTitle, { color: isDark ? theme.text : '#000' }]}>
                                                        {lesson.title}
                                                    </Text>
                                                    <Text style={[styles.lessonMeta, { color: theme.gray[500] }]}>
                                                        {new Date(lesson.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} | {new Date(lesson.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Text>
                                                    {lesson.locationName && (
                                                        <Text style={[styles.lessonLocation, { color: theme.gray[400] }]}>
                                                            <Ionicons name="location-outline" size={12} /> {lesson.locationName}
                                                        </Text>
                                                    )}
                                                </View>
                                                {(lesson.attendanceStatus === 'PRESENT' || lesson.attendanceStatus === 'LATE') && (
                                                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                                                )}
                                            </View>

                                            {!isTeacher && lesson.canMarkAttendance && (
                                                <TouchableOpacity
                                                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                                                    onPress={() => setShowScanner(true)}
                                                >
                                                    <Ionicons name="qr-code-outline" size={18} color="#FFF" />
                                                    <Text style={styles.actionButtonText}>Mark Attendance</Text>
                                                </TouchableOpacity>
                                            )}

                                            {!isTeacher && lesson.status === 'COMPLETED' && !lesson.attendanceStatus && (
                                                <TouchableOpacity
                                                    style={[styles.actionButton, { backgroundColor: theme.gray[200] }]}
                                                    onPress={() => router.push({ pathname: '/absence-request', params: { lessonId: lesson.id } })}
                                                >
                                                    <Ionicons name="document-text-outline" size={18} color={theme.gray[700]} />
                                                    <Text style={[styles.actionButtonText, { color: theme.gray[700] }]}>Request Excuse</Text>
                                                </TouchableOpacity>
                                            )}

                                            {isTeacher && lesson.status === 'SCHEDULED' && (
                                                <TouchableOpacity
                                                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                                                    onPress={async () => {
                                                        try {
                                                            await startLessonMutation.mutateAsync(lesson.id);
                                                            router.push({ pathname: '/teacher-control', params: { lessonId: lesson.id } });
                                                        } catch (err: any) {
                                                            Alert.alert('Error', err.message || 'Failed to start lesson');
                                                        }
                                                    }}
                                                >
                                                    <Ionicons name="play-circle-outline" size={18} color="#FFF" />
                                                    <Text style={styles.actionButtonText}>Start Lesson</Text>
                                                </TouchableOpacity>
                                            )}

                                            {isTeacher && lesson.status === 'LIVE' && (
                                                <TouchableOpacity
                                                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                                                    onPress={() => router.push({ pathname: '/teacher-control', params: { lessonId: lesson.id } })}
                                                >
                                                    <Ionicons name="settings-outline" size={18} color="#FFF" />
                                                    <Text style={styles.actionButtonText}>Manage Lesson</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {!isEnrolled && !isTeacher && (
                <View style={[styles.bottomBar, { backgroundColor: isDark ? `${theme.surface}CC` : 'rgba(255,255,255,0.8)', borderTopColor: isDark ? theme.border : theme.gray[200] }]}>
                    <View style={styles.priceContainer}>
                        <Text style={[styles.priceLabel, { color: theme.gray[400] }]}>FULL COURSE PRICE</Text>
                        <View style={styles.priceRow}>
                            <Text style={[styles.priceAmount, { color: isDark ? theme.text : '#000' }]}>
                                {course.isPaid ? course.price : '0'}
                            </Text>
                            <Text style={[styles.priceCurrency, { color: theme.gray[500] }]}>
                                {course.currency || 'EGP'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.enrollButton, { backgroundColor: theme.primary }]}
                        onPress={handleEnroll}
                        disabled={enrollMutation.isPending}
                    >
                        {enrollMutation.isPending ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.enrollButtonText}>Enroll Now</Text>
                                <Ionicons name="arrow-forward" size={16} color="#FFF" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            <QRScannerModal
                visible={showScanner}
                onClose={() => setShowScanner(false)}
                onScan={handleScan}
            />

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
    scrollContent: {
        paddingBottom: 40,
    },
    heroImageContainer: {
        width: '100%',
        height: 320,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 96,
    },
    heroNav: {
        position: 'absolute',
        top: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heroButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainCard: {
        marginTop: -32,
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        letterSpacing: 1,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    ratingText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    ratingCount: {
        fontSize: 11,
    },
    courseTitle: {
        fontSize: 24,
        fontFamily: Fonts.bold,
        lineHeight: 32,
        marginBottom: 16,
    },
    instructorCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    instructorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
    },
    instructorLabel: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    instructorName: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    viewProfileText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    section: {
        marginTop: 32,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        lineHeight: 22,
    },
    readMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    readMoreText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    curriculumHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    curriculumMeta: {
        fontSize: 12,
        fontFamily: Fonts.regular,
    },
    curriculumList: {
        marginTop: 8,
    },
    moduleCard: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    moduleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    moduleLabel: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        letterSpacing: 1,
        marginBottom: 4,
    },
    moduleTitle: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    lessonDetails: {
        padding: 8,
    },
    lessonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
    },
    lessonIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lessonInfo: {
        flex: 1,
    },
    lessonTitle: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        marginBottom: 4,
    },
    lessonMeta: {
        fontSize: 11,
        fontFamily: Fonts.regular,
    },
    lessonLocation: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        marginTop: 4,
    },
    actionButtonText: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
        color: '#FFF',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
    },
    priceContainer: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        letterSpacing: 1,
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    priceAmount: {
        fontSize: 28,
        fontFamily: Fonts.bold,
    },
    priceCurrency: {
        fontSize: 12,
        fontFamily: Fonts.semiBold,
    },
    enrollButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        shadowColor: '#4ec18b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 5,
    },
    enrollButtonText: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        color: '#FFF',
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
        marginTop: 12,
    },
    modalButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 6,
    },
});
