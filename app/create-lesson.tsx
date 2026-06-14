// Create Lesson Screen - Updated with Location Picker and Materials Upload
import CalendarModal from '@/components/CalendarModal';
import { useToast } from '@/components/toast';
import GeofenceSlider from '@/components/GeofenceSlider';
import LocationPickerModal from '@/components/location/LocationPickerModal';
import TimePickerModal from '@/components/TimePickerModal';
import { Fonts, cskColors } from '@/constants/theme';
import { useMyCourses, useCourse } from '@/hooks/useCourses';
import { useLessonDetails, useUpdateLesson } from '@/hooks/useLessons';
import { useLessonCreation } from '@/hooks/useLessonCreation';
import { useTheme } from '@/hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/libs/auth';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DeliveryType = 'ONLINE' | 'OFFLINE';
type LessonFormPrefill = {
    courseId?: string;
    title?: string;
    description?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    deliveryType?: DeliveryType;
    locationName?: string;
    locationLat?: number | string | null;
    locationLng?: number | string | null;
    geofenceRadiusM?: number;
    videoUrl?: string;
    materialsUrl?: string;
    isFree?: boolean;
};

function getFirstParamValue(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
}

function parseInitialLesson(value?: string | string[]): LessonFormPrefill | null {
    const rawValue = getFirstParamValue(value);
    if (!rawValue) return null;

    try {
        return JSON.parse(rawValue) as LessonFormPrefill;
    } catch {
        return null;
    }
}

export default function CreateLessonScreen() {
    const router = useRouter();
    const {
        courseId: rawCourseId,
        editId: rawEditId,
        lessonId: rawLessonId,
        initialLesson,
    } = useLocalSearchParams<{ courseId?: string | string[]; editId?: string | string[]; lessonId?: string | string[]; initialLesson?: string | string[] }>();
    const paramCourseId = getFirstParamValue(rawCourseId) || '';
    const editId = getFirstParamValue(rawEditId) || getFirstParamValue(rawLessonId) || '';
    const { theme, isDark } = useTheme();
    const toast = useToast();
    const insets = useSafeAreaInsets();
    const user = useAuthStore(state => state.user);
    const { createLessonMutation } = useLessonCreation();

    useEffect(() => {
        if (user && user.role !== 'TEACHER') {
            router.replace('/home');
        }
    }, [user, router]);

    if (!user || user.role !== 'TEACHER') return null;
    const updateLessonMutation = useUpdateLesson();
    const isEditMode = !!editId;
    const { data: lessonDetailsResponse, isLoading: isLoadingLessonDetails } = useLessonDetails(editId || '');
    const lessonDetails = (lessonDetailsResponse?.data?.lesson || lessonDetailsResponse?.data) as LessonFormPrefill | undefined;
    const initialLessonData = useMemo(() => parseInitialLesson(initialLesson), [initialLesson]);

    // Form state
    const [courseId, setCourseId] = useState(paramCourseId || '');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [scheduledAt, setScheduledAt] = useState(new Date());
    const [durationMinutes, setDurationMinutes] = useState('60');
    const [deliveryType, setDeliveryType] = useState<DeliveryType>('ONLINE');
    const [locationName, setLocationName] = useState('');
    const [locationLat, setLocationLat] = useState('');
    const [locationLng, setLocationLng] = useState('');
    const [geofenceRadius, setGeofenceRadius] = useState('50');
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    // Materials state
    const [videoFile, setVideoFile] = useState<{ uri: string; name: string; type: string } | null>(null);
    const [documentFile, setDocumentFile] = useState<{ uri: string; name: string; type: string } | null>(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [materialsUrl, setMaterialsUrl] = useState('');

    // Upload progress state
    const [uploadProgress, setUploadProgress] = useState<{
        video: number;
        document: number;
        isUploading: boolean;
    }>({
        video: 0,
        document: 0,
        isUploading: false,
    });
    const [isFree, setIsFree] = useState(false);

    const showSuccessAndGoBack = (title: string, message?: string) => {
        toast.success(title, message);
        setTimeout(() => router.back(), 900);
    };

    // In create mode fetch all teacher's courses; in edit mode only fetch the specific course
    const { data: coursesData, isLoading: isLoadingCourses } = useMyCourses();
    const { data: singleCourseData, isLoading: isLoadingSingleCourse } = useCourse(courseId || paramCourseId);

    // Determine which course list to show in the picker
    const courses = isEditMode
        ? (singleCourseData?.data ? [singleCourseData.data] : [])
        : (coursesData?.data || []);
    const isLoadingCourseList = isEditMode ? isLoadingSingleCourse : isLoadingCourses;

    useEffect(() => {
        if (!isEditMode) return;

        const prefillSource = lessonDetails || initialLessonData;
        if (!prefillSource) return;

        setCourseId(prefillSource.courseId || paramCourseId || '');
        setTitle(prefillSource.title || '');
        setDescription(prefillSource.description || '');
        setScheduledAt(prefillSource.scheduledAt ? new Date(prefillSource.scheduledAt) : new Date());
        setDurationMinutes(String(prefillSource.durationMinutes || 60));
        setDeliveryType((prefillSource.deliveryType || 'ONLINE') as DeliveryType);
        setLocationName(prefillSource.locationName || '');
        setLocationLat(prefillSource.locationLat !== undefined && prefillSource.locationLat !== null ? String(prefillSource.locationLat) : '');
        setLocationLng(prefillSource.locationLng !== undefined && prefillSource.locationLng !== null ? String(prefillSource.locationLng) : '');
        setGeofenceRadius(String(prefillSource.geofenceRadiusM || 50));
        setVideoUrl(prefillSource.videoUrl || '');
        setMaterialsUrl(prefillSource.materialsUrl || '');
        setIsFree(Boolean(prefillSource.isFree));
        setVideoFile(null);
        setDocumentFile(null);
    }, [initialLessonData, isEditMode, lessonDetails, paramCourseId]);

    const handlePickVideo = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'video/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];

                // Check file size (500MB = 524,288,000 bytes)
                const maxSizeBytes = 500 * 1024 * 1024; // 500MB
                if (asset.size && asset.size > maxSizeBytes) {
                    const sizeMB = (asset.size / (1024 * 1024)).toFixed(2);
                    toast.warning(
                        'File Too Large',
                        `The selected video is ${sizeMB}MB. Maximum allowed size is 500MB.`
                    );
                    return;
                }

                // Show file size for debugging
                const sizeMB = asset.size ? (asset.size / (1024 * 1024)).toFixed(2) : 'unknown';
                console.log(`[Video] Selected file: ${asset.name}, Size: ${sizeMB}MB`);

                setVideoFile({
                    uri: asset.uri,
                    name: asset.name,
                    type: asset.mimeType || 'video/mp4',
                });
                setVideoUrl(''); // Clear URL if file is selected
            }
        } catch (error) {
            toast.error('Error', 'Failed to pick video file');
        }
    };

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];

                // Check file size (50MB = 52,428,800 bytes)
                const maxSizeBytes = 50 * 1024 * 1024; // 50MB
                if (asset.size && asset.size > maxSizeBytes) {
                    const sizeMB = (asset.size / (1024 * 1024)).toFixed(2);
                    toast.warning(
                        'File Too Large',
                        `The selected document is ${sizeMB}MB. Maximum allowed size is 50MB.`
                    );
                    return;
                }

                setDocumentFile({
                    uri: asset.uri,
                    name: asset.name,
                    type: asset.mimeType || 'application/pdf',
                });
                setMaterialsUrl(''); // Clear URL if file is selected
            }
        } catch (error) {
            toast.error('Error', 'Failed to pick document file');
        }
    };

    const handleSubmitLesson = async () => {
        // Validation
        if (!courseId) {
            toast.error('Validation Error', 'Please select a course');
            return;
        }

        if (!title.trim()) {
            toast.error('Validation Error', 'Please enter a lesson title');
            return;
        }

        try {
            // Updated Validation for Online Lessons: 
            // Either a Meeting Link OR a Video must be provided.
            if (deliveryType === 'ONLINE') {
                const hasVideo = !!videoFile || !!videoUrl.trim();
                const hasLink = !!locationName.trim();

                if (!hasVideo && !hasLink) {
                    toast.error('Content Required', 'Please provide either a meeting link or upload a video for this online lesson.');
                    return;
                }
            }

            if (deliveryType === 'OFFLINE' && (!locationName.trim() || !locationLat || !locationLng)) {
                toast.error('Validation Error', 'Please select a physical classroom location for offline lessons');
                return;
            }

            const lessonData = {
                title: title.trim(),
                description: description.trim(),
                scheduledAt: scheduledAt.toISOString(),
                durationMinutes: parseInt(durationMinutes) || 60,
                deliveryType,
                locationName: locationName.trim(),
                locationLat: locationLat ? parseFloat(locationLat) : undefined,
                locationLng: locationLng ? parseFloat(locationLng) : undefined,
                geofenceRadiusM: parseInt(geofenceRadius) || 50,
                isFree: deliveryType === 'ONLINE' ? isFree : false,
            };

            let lessonId = editId || '';

            if (isEditMode) {
                if (!editId) {
                    throw new Error('Lesson ID is missing');
                }

                await updateLessonMutation.mutateAsync({
                    lessonId: editId,
                    data: lessonData,
                });
            } else {
                const result = await createLessonMutation.mutateAsync({
                    courseId,
                    ...lessonData,
                });
                lessonId = result.data?.id || '';

                if (!lessonId) {
                    throw new Error('Lesson created but ID not returned');
                }
            }

            // Step 2: Upload or update materials if provided
            const hasMaterials = videoFile || videoUrl || documentFile || materialsUrl;

            if (hasMaterials) {
                toast.info('Uploading Materials', 'Please wait while your files are uploaded.');

                try {
                    // Import the upload functions
                    const { uploadLessonVideo, uploadLessonDocument, updateLessonMaterials } = await import('@/services/CourseService');

                    setUploadProgress({ video: 0, document: 0, isUploading: true });

                    // Upload video file if selected
                    if (videoFile) {
                        await uploadLessonVideo(lessonId, videoFile, (progress) => {
                            setUploadProgress(prev => ({ ...prev, video: progress }));
                        });
                    }
                    // Or update with video URL
                    else if (videoUrl) {
                        await updateLessonMaterials(lessonId, { videoUrl });
                    }

                    // Upload document file if selected
                    if (documentFile) {
                        await uploadLessonDocument(lessonId, documentFile, (progress) => {
                            setUploadProgress(prev => ({ ...prev, document: progress }));
                        });
                    }
                    // Or update with materials URL
                    else if (materialsUrl) {
                        await updateLessonMaterials(lessonId, { materialsUrl });
                    }

                    setUploadProgress({ video: 0, document: 0, isUploading: false });

                    showSuccessAndGoBack(
                        'Success',
                        isEditMode ? 'Lesson updated successfully.' : 'Lesson and materials uploaded successfully.'
                    );
                } catch (uploadError: any) {
                    console.error('Materials upload failed:', uploadError);
                    setUploadProgress({ video: 0, document: 0, isUploading: false });

                    let errorMessage = uploadError.message || 'Failed to upload materials. Please try again.';
                    let errorTitle = 'Upload Failed';

                    // Provide specific guidance for common errors
                    if (errorMessage.includes('too large') || errorMessage.includes('413')) {
                        errorTitle = 'Server Upload Limit Exceeded';
                        errorMessage = 'The server has a lower upload limit than expected (likely 1-2MB instead of 500MB).\n\n' +
                            'This is a server configuration issue. Temporary solutions:\n\n' +
                            '• Use the "Video URL" field instead (YouTube, Vimeo, etc.)\n' +
                            '• Compress your video to under 2MB\n' +
                            '• Contact your administrator to increase server upload limits\n\n' +
                            'See SERVER_UPLOAD_LIMIT_ISSUE.md for technical details.';
                    } else if (errorMessage.includes('Network error')) {
                        errorTitle = 'Network Error';
                        errorMessage = 'Connection lost during upload. Please check your internet connection and try again.';
                    } else if (errorMessage.includes('No authentication')) {
                        errorTitle = 'Authentication Error';
                        errorMessage = 'Your session has expired. Please log in again.';
                    }

                    toast.error(errorTitle, errorMessage);
                }
            } else {
                showSuccessAndGoBack(
                    'Success',
                    isEditMode ? 'Lesson updated successfully.' : 'Lesson created successfully.'
                );
            }
        } catch (error: any) {
            console.error(isEditMode ? 'Lesson update failed:' : 'Lesson creation failed:', error);
            toast.error('Error', error.message || (isEditMode ? 'Failed to update lesson' : 'Failed to create lesson'));
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f6f8f7' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, {
                backgroundColor: isDark ? '#183327' : '#ffffff',
                borderBottomColor: isDark ? '#2a4d3d' : '#e9ebed',
                paddingTop: insets.top + 12,
            }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { backgroundColor: isDark ? '#1f3b2e' : '#e7f3ee' }]}
                >
                    <MaterialIcons name="arrow-back" size={24} color={isDark ? cskColors[500] : '#0d1b15'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                    {isEditMode ? 'Edit Lesson' : 'Create New Lesson'}
                </Text>
                <View style={{ width: 48 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Course Selection */}
                    <View style={styles.section}>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                Course
                            </Text>
                            {(isLoadingCourseList || (isEditMode && isLoadingLessonDetails)) ? (
                                <View style={[styles.input, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                    justifyContent: 'center',
                                }]}>
                                    <ActivityIndicator size="small" color={cskColors[500]} />
                                </View>
                            ) : isEditMode && courses.length > 0 ? (
                                // Edit mode: show single course as read-only
                                <View style={[styles.courseOption, {
                                    backgroundColor: isDark ? '#1a2e24' : '#e7f3ee',
                                    borderColor: cskColors[500],
                                }]}>
                                    <Text style={[styles.courseOptionText, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                                        {courses[0].title}
                                    </Text>
                                    {courses[0].subjectName && (
                                        <Text style={[styles.courseOptionSubtext, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                                            {courses[0].subjectName}
                                        </Text>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.pickerContainer}>
                                    {courses.map((course) => (
                                        <TouchableOpacity
                                            key={course.id}
                                            style={[
                                                styles.courseOption,
                                                {
                                                    backgroundColor: courseId === course.id
                                                        ? cskColors[500]
                                                        : (isDark ? '#1e1e1e' : '#f7f8f9'),
                                                    borderColor: courseId === course.id
                                                        ? cskColors[500]
                                                        : (isDark ? '#3a4048' : '#d1d5d9'),
                                                },
                                            ]}
                                            onPress={() => setCourseId(course.id)}
                                            disabled={isEditMode}
                                        >
                                            <Text
                                                style={[
                                                    styles.courseOptionText,
                                                    {
                                                        color: courseId === course.id
                                                            ? '#ffffff'
                                                            : (isDark ? '#e1e5e9' : '#0d1b15'),
                                                    },
                                                ]}
                                            >
                                                {course.title}
                                            </Text>
                                            {course.subjectName && (
                                                <Text
                                                    style={[
                                                        styles.courseOptionSubtext,
                                                        {
                                                            color: courseId === course.id
                                                                ? 'rgba(255, 255, 255, 0.8)'
                                                                : (isDark ? '#a8b0b8' : '#696f77'),
                                                        },
                                                    ]}
                                                >
                                                    {course.subjectName}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Basic Info Section */}
                    <View style={styles.section}>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                Lesson Title
                            </Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                    color: isDark ? '#e1e5e9' : '#0d1b15',
                                }]}
                                placeholder="e.g., Introduction to React Native"
                                placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                Description
                            </Text>
                            <TextInput
                                style={[styles.textArea, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                    color: isDark ? '#e1e5e9' : '#0d1b15',
                                }]}
                                placeholder="Describe what will be covered in this lesson..."
                                placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Schedule Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                            Schedule
                        </Text>

                        <View style={styles.row}>
                            <View style={[styles.inputContainer, styles.flex1]}>
                                <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                    Date
                                </Text>
                                <TouchableOpacity
                                    style={[styles.dateTimeButton, {
                                        backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                    }]}
                                    onPress={() => setShowCalendarModal(true)}
                                >
                                    <MaterialIcons name="calendar-today" size={20} color={cskColors[500]} />
                                    <Text style={[styles.dateTimeText, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                        {scheduledAt.toLocaleDateString()}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.inputContainer, styles.flex1]}>
                                <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                    Time
                                </Text>
                                <TouchableOpacity
                                    style={[styles.dateTimeButton, {
                                        backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                    }]}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <MaterialIcons name="access-time" size={20} color={cskColors[500]} />
                                    <Text style={[styles.dateTimeText, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                        {scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                Duration (minutes)
                            </Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                    color: isDark ? '#e1e5e9' : '#0d1b15',
                                }]}
                                placeholder="60"
                                placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                value={durationMinutes}
                                onChangeText={setDurationMinutes}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* Delivery Type */}
                    <View style={styles.section}>
                        <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                            Delivery Type
                        </Text>
                        <View style={[styles.segmentedControl, {
                            backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                        }]}>
                            <TouchableOpacity
                                style={[
                                    styles.segmentButton,
                                    deliveryType === 'ONLINE' && {
                                        backgroundColor: cskColors[500],
                                    },
                                ]}
                                onPress={() => setDeliveryType('ONLINE')}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        {
                                            color: deliveryType === 'ONLINE'
                                                ? '#ffffff'
                                                : (isDark ? '#a8b0b8' : '#696f77'),
                                        },
                                    ]}
                                >
                                    Online
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.segmentButton,
                                    deliveryType === 'OFFLINE' && {
                                        backgroundColor: cskColors[500],
                                    },
                                ]}
                                onPress={() => setDeliveryType('OFFLINE')}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        {
                                            color: deliveryType === 'OFFLINE'
                                                ? '#ffffff'
                                                : (isDark ? '#a8b0b8' : '#696f77'),
                                        },
                                    ]}
                                >
                                    Offline
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Location Input - Conditional based on delivery type */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                {deliveryType === 'ONLINE' ? 'Meeting Link' : 'Location'} {deliveryType === 'OFFLINE' && '(Required)'}
                            </Text>

                            {deliveryType === 'ONLINE' ? (
                                <TextInput
                                    style={[styles.input, {
                                        backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                        color: isDark ? '#e1e5e9' : '#0d1b15',
                                    }]}
                                    placeholder="https://zoom.us/j/... or Google Meet link"
                                    placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                    value={locationName}
                                    onChangeText={setLocationName}
                                    keyboardType="url"
                                    autoCapitalize="none"
                                />
                            ) : (
                                <TouchableOpacity
                                    style={[styles.locationPickerButton, {
                                        backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                        borderColor: locationName ? cskColors[500] : (isDark ? '#3a4048' : '#d1d5d9'),
                                    }]}
                                    onPress={() => setShowLocationPicker(true)}
                                >
                                    <MaterialIcons
                                        name="location-on"
                                        size={24}
                                        color={locationName ? cskColors[500] : (isDark ? '#6b737c' : '#949da5')}
                                    />
                                    <View style={{ flex: 1 }}>
                                        {locationName ? (
                                            <>
                                                <Text style={[styles.locationNameText, {
                                                    color: isDark ? '#e1e5e9' : '#0d1b15'
                                                }]}>
                                                    {locationName}
                                                </Text>
                                                {locationLat && locationLng && (
                                                    <Text style={[styles.coordinatesText, {
                                                        color: isDark ? '#a8b0b8' : '#696f77'
                                                    }]}>
                                                        {parseFloat(locationLat).toFixed(4)}, {parseFloat(locationLng).toFixed(4)}
                                                    </Text>
                                                )}
                                            </>
                                        ) : (
                                            <Text style={[styles.locationPlaceholder, {
                                                color: isDark ? '#6b737c' : '#949da5'
                                            }]}>
                                                Tap to select location
                                            </Text>
                                        )}
                                    </View>
                                    <MaterialIcons
                                        name="chevron-right"
                                        size={24}
                                        color={isDark ? '#6b737c' : '#949da5'}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>

                        {deliveryType === 'OFFLINE' && locationName && (
                            <View style={styles.inputContainer}>
                                <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                    Geofence Radius
                                </Text>
                                <GeofenceSlider
                                    value={parseInt(geofenceRadius) || 50}
                                    onValueChange={(value) => setGeofenceRadius(value.toString())}
                                    minValue={10}
                                    maxValue={200}
                                    step={10}
                                />
                                <Text style={[styles.helperText, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                                    Students must be within this radius to mark attendance
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Materials Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                            Lesson Materials (Optional)
                        </Text>

                        {/* Free Lesson Toggle - Only for ONLINE */}
                        {deliveryType === 'ONLINE' && (
                            <TouchableOpacity
                                style={[styles.freeToggle, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                    borderColor: isFree ? cskColors[500] : (isDark ? '#3a4048' : '#d1d5d9'),
                                }]}
                                onPress={() => setIsFree(!isFree)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.freeToggleTitle, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                        Free Trial Lesson
                                    </Text>
                                    <Text style={[styles.freeToggleSubtext, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                                        Allow non-enrolled students to access this lesson
                                    </Text>
                                </View>
                                <View style={[styles.checkbox, {
                                    backgroundColor: isFree ? cskColors[500] : 'transparent',
                                    borderColor: isFree ? cskColors[500] : (isDark ? '#6b737c' : '#949da5'),
                                }]}>
                                    {isFree && <MaterialIcons name="check" size={18} color="#ffffff" />}
                                </View>
                            </TouchableOpacity>
                        )}

                        {/* Video Upload */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                Lesson Video
                            </Text>
                            {videoFile ? (
                                <View style={[styles.filePreview, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                }]}>
                                    <MaterialIcons name="videocam" size={24} color={cskColors[500]} />
                                    <Text style={[styles.fileName, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                        {videoFile.name}
                                    </Text>
                                    <TouchableOpacity onPress={() => setVideoFile(null)}>
                                        <MaterialIcons name="close" size={20} color="#dc2626" />
                                    </TouchableOpacity>
                                </View>
                            ) : videoUrl ? (
                                <View style={[styles.filePreview, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                }]}>
                                    <MaterialIcons name="link" size={24} color={cskColors[500]} />
                                    <Text style={[styles.fileName, { color: isDark ? '#e1e5e9' : '#0d1b15' }]} numberOfLines={1}>
                                        {videoUrl}
                                    </Text>
                                    <TouchableOpacity onPress={() => setVideoUrl('')}>
                                        <MaterialIcons name="close" size={20} color="#dc2626" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={[styles.uploadButton, {
                                            backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                            borderColor: isDark ? '#3a4048' : '#d1d5d9',
                                        }]}
                                        onPress={handlePickVideo}
                                    >
                                        <MaterialIcons name="cloud-upload" size={24} color={cskColors[500]} />
                                        <Text style={[styles.uploadButtonText, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                            Upload Video File
                                        </Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.orText, { color: isDark ? '#6b737c' : '#949da5' }]}>or</Text>
                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                            color: isDark ? '#e1e5e9' : '#0d1b15',
                                        }]}
                                        placeholder="Paste video URL (YouTube, Vimeo, etc.)"
                                        placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                        value={videoUrl}
                                        onChangeText={setVideoUrl}
                                        keyboardType="url"
                                        autoCapitalize="none"
                                    />
                                </>
                            )}
                        </View>

                        {/* Document Upload */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                Course Materials (PDF, Slides)
                            </Text>
                            {documentFile ? (
                                <View style={[styles.filePreview, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                }]}>
                                    <MaterialIcons name="description" size={24} color={cskColors[500]} />
                                    <Text style={[styles.fileName, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                        {documentFile.name}
                                    </Text>
                                    <TouchableOpacity onPress={() => setDocumentFile(null)}>
                                        <MaterialIcons name="close" size={20} color="#dc2626" />
                                    </TouchableOpacity>
                                </View>
                            ) : materialsUrl ? (
                                <View style={[styles.filePreview, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                }]}>
                                    <MaterialIcons name="link" size={24} color={cskColors[500]} />
                                    <Text style={[styles.fileName, { color: isDark ? '#e1e5e9' : '#0d1b15' }]} numberOfLines={1}>
                                        {materialsUrl}
                                    </Text>
                                    <TouchableOpacity onPress={() => setMaterialsUrl('')}>
                                        <MaterialIcons name="close" size={20} color="#dc2626" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={[styles.uploadButton, {
                                            backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                            borderColor: isDark ? '#3a4048' : '#d1d5d9',
                                        }]}
                                        onPress={handlePickDocument}
                                    >
                                        <MaterialIcons name="cloud-upload" size={24} color={cskColors[500]} />
                                        <Text style={[styles.uploadButtonText, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                            Upload Document
                                        </Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.orText, { color: isDark ? '#6b737c' : '#949da5' }]}>or</Text>
                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                            color: isDark ? '#e1e5e9' : '#0d1b15',
                                        }]}
                                        placeholder="Paste document URL"
                                        placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                        value={materialsUrl}
                                        onChangeText={setMaterialsUrl}
                                        keyboardType="url"
                                        autoCapitalize="none"
                                    />
                                </>
                            )}
                        </View>
                    </View>

                    {/* Bottom padding for fixed button */}
                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Date/Time Pickers */}
            <CalendarModal
                visible={showCalendarModal}
                onClose={() => setShowCalendarModal(false)}
                selectedDate={scheduledAt}
                onSelectDate={(date) => {
                    const newDate = new Date(scheduledAt);
                    newDate.setFullYear(date.getFullYear());
                    newDate.setMonth(date.getMonth());
                    newDate.setDate(date.getDate());
                    setScheduledAt(newDate);
                }}
                mode="start"
                minDate={new Date()}
            />

            {/* Time Picker Modal */}
            <TimePickerModal
                visible={showTimePicker}
                onClose={() => setShowTimePicker(false)}
                selectedTime={scheduledAt}
                onSelectTime={(time) => {
                    setScheduledAt(time);
                }}
            />

            {/* Location Picker Modal */}
            <LocationPickerModal
                visible={showLocationPicker}
                onClose={() => setShowLocationPicker(false)}
                onSelectLocation={(location) => {
                    setLocationName(location.name);
                    setLocationLat(location.latitude.toString());
                    setLocationLng(location.longitude.toString());
                }}
                initialGeofenceRadius={parseInt(geofenceRadius) || 50}
                onGeofenceRadiusChange={(radius) => setGeofenceRadius(radius.toString())}
            />

            {/* Fixed Footer */}
            <View style={[styles.footer, {
                backgroundColor: isDark ? 'rgba(24, 51, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderTopColor: isDark ? '#2a4d3d' : '#e9ebed',
            }]}>
                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: cskColors[500] }]}
                    onPress={handleSubmitLesson}
                    disabled={createLessonMutation.isPending || updateLessonMutation.isPending || uploadProgress.isUploading || (isEditMode && isLoadingLessonDetails)}
                    activeOpacity={0.9}
                >
                    {(createLessonMutation.isPending || updateLessonMutation.isPending || uploadProgress.isUploading) ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <>
                            <Text style={styles.createButtonText}>{isEditMode ? 'Save Changes' : 'Create Lesson'}</Text>
                            <MaterialIcons name={isEditMode ? 'save' : 'rocket-launch'} size={24} color="#ffffff" />
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Upload Progress Modal */}
            {uploadProgress.isUploading && (
                <View style={[styles.progressOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
                    <View style={[styles.progressModal, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
                        <Text style={[styles.progressTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                            Uploading Materials
                        </Text>

                        {videoFile && (
                            <View style={styles.progressItem}>
                                <View style={styles.progressHeader}>
                                    <MaterialIcons name="videocam" size={20} color={cskColors[500]} />
                                    <Text style={[styles.progressLabel, { color: isDark ? '#e0e7e4' : '#0d1b15' }]}>
                                        Video
                                    </Text>
                                    <Text style={[styles.progressPercent, { color: cskColors[500] }]}>
                                        {Math.round(uploadProgress.video)}%
                                    </Text>
                                </View>
                                <View style={[styles.progressBarContainer, { backgroundColor: isDark ? '#2a2a2a' : '#e5e7eb' }]}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            {
                                                backgroundColor: cskColors[500],
                                                width: `${uploadProgress.video}%`
                                            }
                                        ]}
                                    />
                                </View>
                            </View>
                        )}

                        {documentFile && (
                            <View style={styles.progressItem}>
                                <View style={styles.progressHeader}>
                                    <MaterialIcons name="description" size={20} color={cskColors[500]} />
                                    <Text style={[styles.progressLabel, { color: isDark ? '#e0e7e4' : '#0d1b15' }]}>
                                        Document
                                    </Text>
                                    <Text style={[styles.progressPercent, { color: cskColors[500] }]}>
                                        {Math.round(uploadProgress.document)}%
                                    </Text>
                                </View>
                                <View style={[styles.progressBarContainer, { backgroundColor: isDark ? '#2a2a2a' : '#e5e7eb' }]}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            {
                                                backgroundColor: cskColors[500],
                                                width: `${uploadProgress.document}%`
                                            }
                                        ]}
                                    />
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
        marginBottom: 16,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    input: {
        height: 56,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: Fonts.regular,
    },
    textArea: {
        minHeight: 120,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: Fonts.regular,
    },
    pickerContainer: {
        gap: 8,
    },
    courseOption: {
        minHeight: 56,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: 'center',
        borderWidth: 2,
    },
    courseOptionText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },
    courseOptionSubtext: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
    segmentedControl: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 12,
        gap: 4,
        marginBottom: 16,
    },
    segmentButton: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    flex1: {
        flex: 1,
    },
    dateTimeButton: {
        height: 56,
        borderRadius: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateTimeText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
    locationPickerButton: {
        minHeight: 56,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 2,
    },
    locationNameText: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
    },
    coordinatesText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
    locationPlaceholder: {
        fontSize: 15,
        fontFamily: Fonts.regular,
    },
    helperText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        marginTop: 6,
        paddingHorizontal: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
    },
    createButton: {
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    freeToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        marginBottom: 16,
    },
    freeToggleTitle: {
        fontSize: 15,
        fontFamily: Fonts.semiBold,
    },
    freeToggleSubtext: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadButton: {
        height: 56,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    uploadButtonText: {
        fontSize: 15,
        fontFamily: Fonts.medium,
    },
    orText: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        textAlign: 'center',
        marginVertical: 8,
    },
    filePreview: {
        height: 56,
        borderRadius: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    fileName: {
        flex: 1,
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    progressOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    progressModal: {
        width: '85%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    progressTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
        marginBottom: 24,
        textAlign: 'center',
    },
    progressItem: {
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    progressLabel: {
        flex: 1,
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
    progressPercent: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    progressBarContainer: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
});
