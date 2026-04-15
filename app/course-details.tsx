import { AssistantsSection, EnrollmentBadge, FreeTrialBadge, LessonDetailsModal, QRScannerModal, ReviewModal, ReviewsSection } from '@/components/course';
import { Fonts } from '@/constants/theme';
import { useCourseReviews } from '@/hooks/useCourseReviews';
import { useCourse, useCourseDetails, useEnrollCourse, useMyCourses } from '@/hooks/useCourses';
import { useCreateLesson, useLessonMutations } from '@/hooks/useLessons';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { useVideoTracking } from '@/hooks/useVideoTracking';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/libs/auth';
import { CourseReview, removeCourseAssistant, scanAttendance } from '@/services/CourseService';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, { FadeIn } from 'react-native-reanimated';


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

    const { data: detailsData, isLoading: detailsLoading, error: detailsError } = useCourseDetails(courseId as string, profile?.id);
    const { data: basicCourseData, isLoading: basicLoading } = useCourse(courseId as string);
    const { data: myCoursesData, isLoading: myCoursesLoading } = useMyCourses();
    
    const isLoading = detailsLoading || basicLoading || myCoursesLoading;
    const error = detailsError;
    const createLessonMutation = useCreateLesson();
    const { startLesson: startLessonMutation } = useLessonMutations();
    const enrollMutation = useEnrollCourse();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [editingReview, setEditingReview] = useState<CourseReview | null>(null);
    const { addToCart, isAdding } = useCart();
    const [isPlayingVideo, setIsPlayingVideo] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState<any>(null);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const scrollViewRef = React.useRef<ScrollView>(null);
    const [activeTab, setActiveTab] = useState<'ABOUT' | 'CURRICULUM' | 'REVIEWS'>('ABOUT');

    const isEnrolledInMyCourses = React.useMemo(() => {
        if (!myCoursesData?.data) return false;
        return myCoursesData.data.some((c: any) => c.id === courseId);
    }, [myCoursesData?.data, courseId]);

    const isEnrolledForPreviewTracking =
        !!detailsData?.data?.enrollment ||
        !!detailsData?.data?.progress ||
        isEnrolledInMyCourses;
    
    // Check for preview video from either details endpoint or fallback to basic course endpoint
    const previewUrl = detailsData?.data?.course?.previewVideoUrl || 
                       (detailsData?.data as any)?.previewVideoUrl || 
                       detailsData?.data?.course?.preview_video_url || 
                       (detailsData?.data as any)?.preview_video_url ||
                       basicCourseData?.data?.previewVideoUrl ||
                       (basicCourseData?.data as any)?.preview_video_url;
    
    const player = useVideoPlayer(previewUrl, player => {
        player.loop = false;
        player.timeUpdateEventInterval = 1;
    });
    const previewPlaybackSnapshotRef = React.useRef({
        currentPosition: 0,
        duration: 0,
        isPlaying: false,
    });
    const previousPreviewPositionRef = React.useRef(0);

    const {
        recordHeartbeat: recordPreviewHeartbeat,
        shouldRestorePosition: shouldRestorePreviewPosition,
        initialPosition: initialPreviewPosition,
        markPositionRestored: markPreviewPositionRestored,
    } = useVideoTracking({
        entityId: courseId as string,
        enabled: !!previewUrl && isPlayingVideo && !isTeacher && !isEnrolledForPreviewTracking,
        mode: 'preview',
    });

    useEffect(() => {
        const subscription = player.addListener('playToEnd', () => {
            setIsPlayingVideo(false);
        });
        return () => subscription.remove();
    }, [player]);

    useEffect(() => {
        if (previewUrl && player) {
            player.replace(previewUrl);
        }
    }, [previewUrl, player]);

    useEffect(() => {
        if (!isPlayingVideo || !previewUrl || isTeacher || isEnrolledForPreviewTracking || !shouldRestorePreviewPosition) {
            return;
        }

        player.currentTime = initialPreviewPosition;
        markPreviewPositionRestored();
    }, [
        initialPreviewPosition,
        isPlayingVideo,
        isEnrolledForPreviewTracking,
        isTeacher,
        markPreviewPositionRestored,
        player,
        previewUrl,
        shouldRestorePreviewPosition,
    ]);

    useEffect(() => {
        if (!isPlayingVideo || !previewUrl || isTeacher || isEnrolledForPreviewTracking || !courseId) {
            return;
        }

        console.log('[VideoTracking] Preview tracking attached', { courseId });

        const pollInterval = setInterval(() => {
            const currentPosition = typeof player.currentTime === 'number' ? player.currentTime : 0;
            const duration = typeof player.duration === 'number' ? player.duration : 0;
            const isAdvancing = currentPosition > previousPreviewPositionRef.current;
            const isPlaying = player.playing || isAdvancing;

            previewPlaybackSnapshotRef.current = {
                currentPosition,
                duration,
                isPlaying,
            };

            if (isAdvancing) {
                recordPreviewHeartbeat({
                    currentPosition,
                    duration,
                    isPlaying,
                });
            }

            previousPreviewPositionRef.current = currentPosition;
        }, 1000);

        return () => clearInterval(pollInterval);
    }, [courseId, isEnrolledForPreviewTracking, isPlayingVideo, isTeacher, player, previewUrl, recordPreviewHeartbeat]);

    const playbackRates = [1.0, 1.25, 1.5, 2.0];

    const togglePlaybackRate = () => {
        const nextIndex = (playbackRates.indexOf(playbackRate) + 1) % playbackRates.length;
        const nextRate = playbackRates[nextIndex];
        setPlaybackRate(nextRate);
        player.playbackRate = nextRate;
    };

    // Reviews hook
    const {
        reviews,
        summary,
        createReview,
        updateReview,
        deleteReview,
        isLoading: reviewsLoading,
    } = useCourseReviews(courseId as string);

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
                    {error ? t('courses.failedToLoad') : t('courses.notFound')}
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.primary, fontFamily: Fonts.bold }}>{t('common.back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { course, progress, teacher, lessons } = detailsData.data;
    const safeLessons = lessons || [];
    
    if (!course) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.gray[400]} />
                <Text style={{ marginTop: 12, color: theme.gray[600], textAlign: 'center' }}>
                    {t('courses.incompleteData')}
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.primary, fontFamily: Fonts.bold }}>{t('common.back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isEnrolled = !!detailsData.data?.enrollment || !!progress || isEnrolledInMyCourses;

    const toggleModule = (index: string) => {
        setExpandedModules(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const getLessonIcon = (status: string, attendanceStatus?: string | null) => {
        if (attendanceStatus === 'PRESENT' || attendanceStatus === 'LATE') return 'checkmark-circle';
        if (status === 'LIVE') return 'play-circle';
        if (status === 'COMPLETED') return 'checkbox-outline';
        return 'calendar-outline';
    };

    const getLessonIconColor = (status: string, attendanceStatus?: string | null) => {
        if (attendanceStatus === 'PRESENT' || attendanceStatus === 'LATE') return theme.primary;
        if (status === 'LIVE') return theme.primary;
        return theme.gray[400];
    };

    const handleEnroll = async () => {
        if (!profile?.id) {
            Alert.alert(t('common.info'), t('courses.loginRequired'));
            return;
        }

        if (course.isPaid) {
            router.push({ pathname: '/checkout', params: { courseId: courseId as string } });
            return;
        }

        try {
            await enrollMutation.mutateAsync({
                courseId: courseId as string,
                studentId: profile.id
            });
            Alert.alert(t('common.success'), t('courses.enrolledMessage'));
        } catch (err: any) {
            Alert.alert(t('common.error'), err.message || t('courses.attendanceFailed'));
        }
    };

    const handleAddToCart = async () => {
        try {
            await addToCart({
                courseId: courseId as string,
                billingType: course.billingType || 'ONE_TIME'
            });
            Alert.alert(t('common.success'), t('courses.addedToCart'), [
                { text: t('courses.viewCart'), onPress: () => router.push('/cart') },
                { text: t('courses.continueShopping') }
            ]);
        } catch (err: any) {
            Alert.alert(t('common.error'), err.message || t('common.error'));
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
                        location: course.locationName || t('home.classroom')
                    }
                });
            } else {
                Alert.alert(t('common.error'), result.message || t('courses.attendanceFailed'));
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

        const lessonData = {
            courseId: courseId as string,
            title: newLessonTitle,
            description: t('courseDetails.newLessonDescription'),
            scheduledAt: new Date().toISOString(),
            durationMinutes: 90,
            deliveryType: course.deliveryType || 'OFFLINE',
            locationName: course.locationName || t('home.classroom'),
            locationLat: course.locationLat || 30.0444,
            locationLng: course.locationLng || 31.2357,
            geofenceRadiusM: course.geofenceRadiusM || 100
        };

        console.log('[CourseDetails] Creating lesson with data:', JSON.stringify(lessonData, null, 2));

        try {
            const result = await createLessonMutation.mutateAsync(lessonData);
            console.log('[CourseDetails] Lesson created successfully:', result);

            Alert.alert(t('common.success'), t('courses.lessonCreated'));
            setShowCreateModal(false);
            setNewLessonTitle('');
        } catch (err: any) {
            console.error('[CourseDetails] Failed to create lesson:', err);
            Alert.alert('Error', err.message || 'Failed to create lesson');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F6F8F7' }]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView 
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Image Section */}
                <View style={styles.heroImageContainer}>
                    {isPlayingVideo && previewUrl ? (
                            <View style={{ flex: 1, position: 'relative' }}>
                                <VideoView
                                    player={player}
                                    style={styles.heroVideo}
                                    fullscreenOptions={{ enable: true }}
                                    allowsPictureInPicture
                                    startsPictureInPictureAutomatically
                                />
                                <TouchableOpacity 
                                    style={styles.speedButton}
                                    onPress={togglePlaybackRate}
                                >
                                    <Ionicons name="speedometer-outline" size={14} color="#FFF" />
                                    <Text style={styles.speedButtonText}>{playbackRate}x</Text>
                                </TouchableOpacity>
                            </View>
                    ) : (
                        <>
                            <Image
                                source={{ uri: course.courseImage || 'https://images.unsplash.com/photo-1501504905953-f8319bd23edc?w=800' }}
                                style={styles.heroImage}
                            />
                            {previewUrl && (
                                <TouchableOpacity 
                                    style={styles.playButtonOverlay}
                                    onPress={() => {
                                        setIsPlayingVideo(true);
                                        player.play();
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.playIconContainer}>
                                        <Ionicons name="play" size={32} color="#FFF" style={{ marginLeft: 4 }} />
                                    </View>
                                    <Text style={styles.playText}>{t('course.watchPreview') || 'Watch Preview'}</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                    
                    <LinearGradient
                        colors={['rgba(0,0,0,0.4)', 'transparent']}
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
                    <View style={[styles.badgeRow, { marginBottom: 8 }]}>
                        <View style={[styles.badge, { backgroundColor: `${theme.primary}15` }]}>
                            <Text style={[styles.badgeText, { color: theme.primary }]}>{course.subjectName?.toUpperCase()}</Text>
                        </View>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#FFC107" />
                            <Text style={[styles.ratingText, { color: theme.gray[600] }]}>
                                {course.courseRating ? course.courseRating.toFixed(1) : t('courseDetails.newRating')}
                            </Text>
                            <Text style={[styles.ratingCount, { color: theme.gray[400] }]}>
                                ({course.totalReviews || 0})
                            </Text>
                        </View>
                    </View>

                    {course.freeTrialLessons && course.freeTrialLessons > 0 && (
                        <View style={{ marginBottom: 8 }}>
                            <FreeTrialBadge />
                            <Text style={[styles.freeTrialText, { color: theme.gray[500] }]}>
                                {t('courseDetails.freeLessons', { count: course.freeTrialLessons })}
                            </Text>
                        </View>
                    )}

                    <Text style={[styles.courseTitle, { color: isDark ? theme.text : '#0d1b15' }]}>{course.title}</Text>

                    <View style={[styles.instructorCard, { backgroundColor: isDark ? theme.background : '#F6F8F7', borderColor: `${theme.primary}10` }]}>
                        <View style={styles.instructorInfo}>
                            <Image
                                source={{ uri: teacher.profileImg || 'https://ui-avatars.com/api/?name=' + teacher.name }}
                                style={[styles.avatar, { borderColor: `${theme.primary}30` }]}
                            />
                            <View>
                                <Text style={[styles.instructorLabel, { color: theme.gray[500] }]}>{t('courseDetails.instructor')}</Text>
                                <Text style={[styles.instructorName, { color: isDark ? theme.text : '#000' }]}>{teacher.name}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => router.push(`/conversation/${teacher.id}`)}>
                            <Text style={[styles.viewProfileText, { color: theme.primary }]}>{t('courseDetails.viewProfile')}</Text>
                        </TouchableOpacity>
                    </View>

                    {course.enrollmentCount !== undefined && (
                        <View style={{ marginTop: 12 }}>
                            <EnrollmentBadge count={course.enrollmentCount} />
                        </View>
                    )}
                </View>

                {/* Tabs Selector */}
                <View style={[styles.tabsContainer, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderBottomColor: isDark ? theme.border : theme.gray[100] }]}>
                    <TouchableOpacity 
                        style={[styles.tabButton, activeTab === 'ABOUT' && { borderBottomColor: theme.primary }]} 
                        onPress={() => setActiveTab('ABOUT')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'ABOUT' ? theme.primary : theme.gray[500] }, activeTab === 'ABOUT' && { fontFamily: Fonts.bold }]}>
                            {t('courseDetails.aboutTab')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tabButton, activeTab === 'CURRICULUM' && { borderBottomColor: theme.primary }]} 
                        onPress={() => setActiveTab('CURRICULUM')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'CURRICULUM' ? theme.primary : theme.gray[500] }, activeTab === 'CURRICULUM' && { fontFamily: Fonts.bold }]}>
                            {t('courseDetails.curriculumTab')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tabButton, activeTab === 'REVIEWS' && { borderBottomColor: theme.primary }]} 
                        onPress={() => setActiveTab('REVIEWS')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'REVIEWS' ? theme.primary : theme.gray[500] }, activeTab === 'REVIEWS' && { fontFamily: Fonts.bold }]}>
                            {t('courseDetails.reviewsTab')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Content */}
                {activeTab === 'ABOUT' && (
                    <Animated.View entering={FadeIn.duration(400)}>
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#000' }]}>{t('courseDetails.description')}</Text>
                            <Text style={[styles.descriptionText, { color: theme.gray[600] }]} numberOfLines={showFullDescription ? undefined : 6}>
                                {course.description || t('courseDetails.noDescription')}
                            </Text>
                            <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)} style={styles.readMoreButton}>
                                <Text style={[styles.readMoreText, { color: theme.primary }]}>
                                    {showFullDescription ? t('courseDetails.readLess') : t('courseDetails.readMore')}
                                </Text>
                                <Ionicons name={showFullDescription ? 'chevron-up' : 'chevron-down'} size={12} color={theme.primary} />
                            </TouchableOpacity>
                        </View>

                        {course.assistants && course.assistants.length > 0 && (
                            <AssistantsSection
                                assistants={course.assistants}
                                isTeacher={isTeacher}
                                onAddAssistant={() => {
                                    Alert.alert('Add Assistant', 'Assistant management UI coming soon');
                                }}
                                onRemoveAssistant={async (assistantId) => {
                                    try {
                                        await removeCourseAssistant(courseId as string, assistantId);
                                        queryClient.invalidateQueries({ queryKey: ['course', courseId, 'details'] });
                                        Alert.alert(t('common.success'), t('courseDetails.removeAssistantSuccess'));
                                    } catch (error: any) {
                                        Alert.alert(t('common.error'), error.message || t('common.error'));
                                    }
                                }}
                            />
                        )}
                    </Animated.View>
                )}

                {activeTab === 'CURRICULUM' && (
                    <Animated.View entering={FadeIn.duration(400)}>
                        <View style={styles.section}>
                            <View style={styles.curriculumHeader}>
                                <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#000' }]}>{t('courseDetails.curriculum')}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    {previewUrl && (
                                        <TouchableOpacity 
                                            style={styles.previewButtonInline}
                                            onPress={() => {
                                                setIsPlayingVideo(true);
                                                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                                            }}
                                        >
                                            <Ionicons name="play-circle" size={18} color={theme.primary} />
                                            <Text style={[styles.previewButtonInlineText, { color: theme.primary }]}>{t('course.watchPreview')}</Text>
                                        </TouchableOpacity>
                                    )}
                                    {isTeacher && (
                                        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
                                            <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                                        </TouchableOpacity>
                                    )}
                                    <Text style={[styles.curriculumMeta, { color: theme.gray[500] }]}>
                                        {safeLessons.length} {t('courseDetails.lessons')}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.curriculumList}>
                                {safeLessons.map((lesson, index) => {
                                    const moduleKey = index.toString();
                                    const isExpanded = expandedModules[moduleKey];
                                    const isLocked = !lesson.isFree && !isEnrolled && !isTeacher;
                                    const lessonIcon = isLocked ? 'lock-closed' : getLessonIcon(lesson.status, lesson.attendanceStatus);
                                    const lessonIconColor = isLocked ? theme.gray[400] : getLessonIconColor(lesson.status, lesson.attendanceStatus);

                                    return (
                                        <View key={lesson.id} style={[styles.moduleCard, { backgroundColor: isDark ? theme.surface : '#FFFFFF', borderColor: isDark ? theme.border : theme.gray[100] }]}>
                                            <TouchableOpacity
                                                onPress={() => toggleModule(moduleKey)}
                                                style={[styles.moduleHeader, { backgroundColor: isExpanded ? `${theme.primary}08` : 'transparent' }]}
                                            >
                                                <View>
                                                    <Text style={[styles.moduleLabel, { color: isExpanded ? theme.primary : theme.gray[400] }]}>
                                                        {t('courseDetails.lesson')} {index + 1}
                                                    </Text>
                                                    <Text style={[styles.moduleTitle, { color: isDark ? theme.text : '#000' }]}>
                                                        {lesson.title}
                                                    </Text>
                                                </View>
                                                <Ionicons
                                                    name={isLocked ? 'lock-closed-outline' : (isExpanded ? 'chevron-up' : 'chevron-down')}
                                                    size={isLocked ? 18 : 24}
                                                    color={isLocked ? theme.gray[400] : (isExpanded ? theme.primary : theme.gray[400])}
                                                />
                                            </TouchableOpacity>

                                            {isExpanded && (
                                                <View style={styles.lessonDetails}>
                                                    <TouchableOpacity 
                                                        activeOpacity={0.7}
                                                        onPress={() => !isLocked && setSelectedLesson(lesson)}
                                                        style={[styles.lessonItem, { backgroundColor: `${theme.primary}08` }]}
                                                    >
                                                        <View style={[styles.lessonIconContainer, { backgroundColor: lessonIconColor }]}>
                                                            <Ionicons name={lessonIcon as any} size={16} color="#FFF" />
                                                        </View>
                                                        <View style={styles.lessonInfo}>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                                <Text style={[styles.lessonTitle, { color: isDark ? theme.text : '#000', opacity: isLocked ? 0.6 : 1 }]}>
                                                                    {lesson.title}
                                                                </Text>
                                                                    {lesson.isFree && <FreeTrialBadge variant="compact" />}
                                                                    {lesson.videoUrl && !isLocked && (
                                                                        <View style={{ backgroundColor: `${theme.primary}20`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                                            <Ionicons name="play-circle" size={12} color={theme.primary} />
                                                                            <Text style={{ fontSize: 10, color: theme.primary, fontFamily: Fonts.bold }}>WATCH</Text>
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            <Text style={[styles.lessonMeta, { color: theme.gray[500] }]}>
                                                                {new Date(lesson.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} | {new Date(lesson.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </Text>
                                                            {isLocked && (
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                                                    <Ionicons name="lock-closed" size={12} color={theme.gray[400]} />
                                                                    <Text style={{ fontSize: 12, color: theme.gray[400], fontFamily: Fonts.medium }}>
                                                                        {t('courseDetails.enrollToAccess')}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                            {lesson.locationName && !isLocked && (
                                                                <Text style={[styles.lessonLocation, { color: theme.gray[400] }]}>
                                                                    <Ionicons name="location-outline" size={12} /> {lesson.locationName}
                                                                </Text>
                                                            )}
                                                        </View>
                                                        {(lesson.attendanceStatus === 'PRESENT' || lesson.attendanceStatus === 'LATE') && !isLocked && (
                                                            <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                                                        )}
                                                    </TouchableOpacity>

                                                    {!isTeacher && !isLocked && lesson.canMarkAttendance && (
                                                        <TouchableOpacity
                                                            style={[styles.actionButton, { backgroundColor: theme.primary }]}
                                                            onPress={() => setShowScanner(true)}
                                                        >
                                                            <Ionicons name="qr-code-outline" size={18} color="#FFF" />
                                                            <Text style={styles.actionButtonText}>{t('courseDetails.markAttendance')}</Text>
                                                        </TouchableOpacity>
                                                    )}

                                                    {!isTeacher && !isLocked && lesson.status === 'COMPLETED' && !lesson.attendanceStatus && (
                                                        <TouchableOpacity
                                                            style={[styles.actionButton, { backgroundColor: theme.gray[200] }]}
                                                            onPress={() => router.push({ pathname: '/absence-request', params: { lessonId: lesson.id } })}
                                                        >
                                                            <Ionicons name="document-text-outline" size={18} color={theme.gray[700]} />
                                                            <Text style={[styles.actionButtonText, { color: theme.gray[700] }]}>{t('courseDetails.requestExcuse')}</Text>
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
                                                            <Text style={styles.actionButtonText}>{t('courseDetails.startLesson')}</Text>
                                                        </TouchableOpacity>
                                                    )}

                                                    {isTeacher && lesson.status === 'LIVE' && (
                                                        <TouchableOpacity
                                                            style={[styles.actionButton, { backgroundColor: theme.primary }]}
                                                            onPress={() => router.push({ pathname: '/teacher-control', params: { lessonId: lesson.id } })}
                                                        >
                                                            <Ionicons name="settings-outline" size={18} color="#FFF" />
                                                            <Text style={styles.actionButtonText}>{t('courseDetails.manageLesson')}</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </Animated.View>
                )}

                {activeTab === 'REVIEWS' && (
                    <Animated.View entering={FadeIn.duration(400)}>
                        <ReviewsSection
                                reviews={reviews}
                                averageRating={summary?.averageRating || 0}
                                totalReviews={summary?.totalReviews || 0}
                                ratingBreakdown={summary?.ratingBreakdown || { fiveStars: 0, fourStars: 0, threeStars: 0, twoStars: 0, oneStar: 0 }}
                                canReview={isEnrolled && !isTeacher}
                                userReview={reviews.find(r => r.studentId === profile?.id)}
                                onAddReview={() => {
                                    setEditingReview(null);
                                    setShowReviewModal(true);
                                }}
                                onEditReview={(review) => {
                                    setEditingReview(review);
                                    setShowReviewModal(true);
                                }}
                                onDeleteReview={async () => {
                                    Alert.alert(
                                        'Delete Review',
                                        'Are you sure you want to delete your review?',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Delete',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    try {
                                                        await deleteReview();
                                                        Alert.alert(t('common.success'), t('courseDetails.reviewDeleted'));
                                                    } catch (error: any) {
                                                        Alert.alert(t('common.error'), error.message || t('common.error'));
                                                    }
                                                },
                                            },
                                        ]
                                    );
                                }}
                            />
                        {reviews.length === 0 && !reviewsLoading && (
                            <View style={[styles.emptyState, { backgroundColor: isDark ? theme.surface : '#FFFFFF', marginTop: 0 }]}>
                                <Ionicons name="chatbubbles-outline" size={48} color={theme.gray[300]} />
                                <Text style={[styles.emptyText, { color: theme.gray[500] }]}>No reviews yet.</Text>
                            </View>
                        )}
                        {reviewsLoading && (
                            <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 20 }} />
                        )}
                    </Animated.View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {!isEnrolled && !isTeacher && (
                <View style={[styles.bottomBar, { 
                    backgroundColor: isDark ? theme.surface : '#FFFFFF', 
                    borderTopColor: isDark ? theme.border : theme.gray[200],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    elevation: 20
                }]}>
                    <View style={styles.priceContainer}>
                        <Text style={[styles.priceLabel, { color: theme.gray[400] }]}>{t('courseDetails.priceLabel')}</Text>
                        <View style={styles.priceRow}>
                            <Text style={[styles.priceAmount, { color: isDark ? theme.text : '#000' }]}>
                                {course.isPaid ? course.price : '0'}
                            </Text>
                            <Text style={[styles.priceCurrency, { color: theme.gray[500] }]}>
                                {course.currency || 'EGP'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.enrollActions}>
                        {course.isPaid && (
                            <TouchableOpacity
                                style={[styles.cartIconButton, { backgroundColor: `${theme.primary}10` }]}
                                onPress={handleAddToCart}
                                disabled={isAdding}
                            >
                                {isAdding ? (
                                    <ActivityIndicator size="small" color={theme.primary} />
                                ) : (
                                    <Ionicons name="cart-outline" size={22} color={theme.primary} />
                                )}
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.enrollButton, { backgroundColor: theme.primary, flex: course.isPaid ? 1 : 0 }]}
                            onPress={handleEnroll}
                            disabled={enrollMutation.isPending}
                        >
                            {enrollMutation.isPending ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <>
                                    <Text style={styles.enrollButtonText}>
                                        {course.isPaid ? t('courseDetails.buyNow') : t('courseDetails.enrollNow')}
                                    </Text>
                                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
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
                        <Text style={[styles.modalTitle, { color: isDark ? theme.text : '#000' }]}>{t('courseDetails.createLesson')}</Text>
                        <TextInput
                            style={[styles.input, { color: isDark ? theme.text : '#000', borderColor: theme.gray[200] }]}
                            placeholder={t('courseDetails.lessonTitle')}
                            placeholderTextColor={theme.gray[400]}
                            value={newLessonTitle}
                            onChangeText={setNewLessonTitle}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.gray[100] }]}
                                onPress={() => setShowCreateModal(false)}
                            >
                                <Text style={{ color: '#000' }}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                                onPress={handleCreateLesson}
                                disabled={createLessonMutation.isPending}
                            >
                                {createLessonMutation.isPending ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={{ color: '#FFF' }}>{t('courseDetails.create')}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <ReviewModal
                visible={showReviewModal}
                onClose={() => {
                    setShowReviewModal(false);
                    setEditingReview(null);
                }}
                onSubmit={async (rating, review) => {
                    try {
                        if (editingReview) {
                            await updateReview({ rating, Review: review });
                            Alert.alert(t('common.success'), t('courseDetails.reviewUpdated'));
                        } else {
                            await createReview({ rating, Review: review });
                            Alert.alert(t('common.success'), t('courseDetails.reviewSubmitted'));
                        }
                        setShowReviewModal(false);
                        setEditingReview(null);
                    } catch (error: any) {
                        Alert.alert('Error', error.message || 'Failed to submit review');
                        throw error;
                    }
                }}
                initialRating={editingReview?.rating}
                initialReview={editingReview?.review}
                isEdit={!!editingReview}
            />

            <LessonDetailsModal
                visible={!!selectedLesson}
                lesson={selectedLesson}
                isTeacher={isTeacher}
                onClose={() => setSelectedLesson(null)}
            />
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
    heroVideo: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
    },
    playButtonOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
        zIndex: 10,
    },
    speedButton: {
        position: 'absolute',
        top: StatusBar.currentHeight ? StatusBar.currentHeight + 64 : 100,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        zIndex: 20,
    },
    speedButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontFamily: Fonts.bold,
    },
    playIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(52, 199, 89, 0.9)', // Primary green
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    playText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: Fonts.bold,
        marginTop: 12,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
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
    freeTrialText: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        marginTop: 4,
    },
    courseTitle: {
        fontSize: 24,
        fontFamily: Fonts.bold,
        lineHeight: 32,
        marginBottom: 16,
    },
    previewButtonInline: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 'auto',
        marginLeft: 12,
    },
    previewButtonInlineText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        marginLeft: 4,
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
        paddingHorizontal: 20,
        paddingVertical: 12,
        paddingBottom: 20, // Reduced from 28
        borderTopWidth: 1,
    },
    priceContainer: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        letterSpacing: 0.5,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    priceAmount: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    priceCurrency: {
        fontSize: 11,
        fontFamily: Fonts.medium,
    },
    enrollActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1.5,
    },
    cartIconButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    enrollButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10, // Reduced from 12
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 8,
    },
    enrollButtonText: {
        fontSize: 15,
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
        marginBottom: 20,
    },
    input: {
        height: 56,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontFamily: Fonts.regular,
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        marginTop: 16,
    },
    tabButton: {
        paddingVertical: 12,
        marginRight: 24,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 20,
        borderRadius: 16,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        textAlign: 'center',
    },
});
