import GeofenceSlider from '@/components/GeofenceSlider';
import LocationPickerModal from '@/components/location/LocationPickerModal';
import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getAllSubjects } from '@/services/CourseService';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
import { useCourseCreation } from '../hooks/useCourseCreation';

type DeliveryType = 'ONLINE' | 'OFFLINE';
type BillingType = 'ONE_TIME' | 'MONTHLY';

export default function CreateCourseScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { createCourseMutation } = useCourseCreation();

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [courseImage, setCourseImage] = useState('');
    const [imageInputMode, setImageInputMode] = useState<'url' | 'upload'>('url');
    const [deliveryType, setDeliveryType] = useState<DeliveryType>('ONLINE');
    const [locationName, setLocationName] = useState('');
    const [locationLat, setLocationLat] = useState('');
    const [locationLng, setLocationLng] = useState('');
    const [geofenceRadius, setGeofenceRadius] = useState('50');
    const [totalLessons, setTotalLessons] = useState('12');
    const [attendanceWindow, setAttendanceWindow] = useState('15');
    const [price, setPrice] = useState('0');
    const [currency, setCurrency] = useState('EGP');
    const [isPaid, setIsPaid] = useState(false);
    const [billingType, setBillingType] = useState<BillingType>('ONE_TIME');
    const [attendanceWeight, setAttendanceWeight] = useState('0.3');
    const [freeTrialLessons, setFreeTrialLessons] = useState('0');
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    // Fetch subjects
    const { data: subjectsResponse, isLoading: isLoadingSubjects } = useQuery({
        queryKey: ['subjects'],
        queryFn: getAllSubjects,
    });

    const subjects = subjectsResponse?.data || [];

    // Form state extensions
    const [videoFile, setVideoFile] = useState<{ uri: string; name: string; type: string } | null>(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setCourseImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const pickVideo = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setVideoFile({
                    uri: result.assets[0].uri,
                    name: `course_preview_${Date.now()}.mp4`,
                    type: 'video/mp4'
                });
                setVideoUrl(''); // Clear manual URL
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick video');
        }
    };

    const handleCreateCourse = async () => {
        if (!title.trim() || !subjectId) {
            Alert.alert('Validation Error', 'Title and Subject are required');
            return;
        }

        // Online Validation: Need either a Meeting Link OR a Video
        if (deliveryType === 'ONLINE') {
            const hasVideo = !!videoFile || !!videoUrl.trim();
            const hasLink = !!locationName.trim();
            if (!hasVideo && !hasLink) {
                Alert.alert('Content Required', 'Please provide either a meeting link or upload a course preview video.');
                return;
            }
        }

        if (deliveryType === 'OFFLINE' && (!locationName.trim() || !locationLat || !locationLng)) {
            Alert.alert('Validation Error', 'Please select a location for offline courses');
            return;
        }

        try {
            setUploading(true);
            const { uploadCourseImage, uploadCoursePreviewVideo } = await import('@/services/CourseService');
            
            // 1. Handle Image Upload if needed
            let finalImageUrl = courseImage;
            if (courseImage && courseImage.startsWith('file://')) {
                const imgRes = await uploadCourseImage({
                    uri: courseImage,
                    name: 'course_thumb.jpg',
                    type: 'image/jpeg'
                });
                finalImageUrl = imgRes.data.url;
            }

            // 2. Handle Video Upload if needed
            let finalVideoUrl = videoUrl;
            let finalVideoPublicId = '';
            if (videoFile) {
                const vidRes = await uploadCoursePreviewVideo({
                    uri: videoFile.uri,
                    name: videoFile.name,
                    type: videoFile.type
                }, (progress) => {
                    console.log(`[Preview Upload] ${progress.toFixed(0)}%`);
                });
                finalVideoUrl = vidRes.data.url;
                finalVideoPublicId = vidRes.data.publicId;
            }

            // 3. Prepare Final Data (MAPPED TO POSTMAN SPEC)
            const courseData = {
                title: title.trim(),
                description: description.trim(),
                subjectId,
                courseImage: finalImageUrl,
                previewVideoUrl: finalVideoUrl.trim() || undefined,
                previewVideoPublicId: finalVideoPublicId || undefined,
                deliveryType,
                locationName: locationName.trim(),
                locationLat: locationLat ? parseFloat(locationLat) : undefined,
                locationLng: locationLng ? parseFloat(locationLng) : undefined,
                geofenceRadiusM: parseInt(geofenceRadius) || 50,
                totalLessons: parseInt(totalLessons) || 12,
                freeTrialLessons: parseInt(freeTrialLessons) || 0,
                attendanceWindowMinutes: parseInt(attendanceWindow) || 15,
                price: parseFloat(price) || 0,
                currency,
                isPaid,
                billingType,
                attendanceWeight: parseFloat(attendanceWeight) || 0.3,
            };

            await createCourseMutation.mutateAsync(courseData);
            
            setUploading(false);
            Alert.alert('Success', 'Course created successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            setUploading(false);
            Alert.alert('Error', error.message || 'Failed to create course');
        }
    };

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
                    <MaterialIcons name="arrow-back" size={24} color={isDark ? cskColors[500] : '#0d1b15'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>
                    Create New Course
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
                    {/* Basic Info Section */}
                    <View style={styles.section}>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                Course Title
                            </Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                    color: isDark ? '#e1e5e9' : '#0d1b15',
                                }]}
                                placeholder="e.g., Advanced Mathematics"
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
                                placeholder="Describe the course learning objectives and curriculum..."
                                placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                Course Image (Optional)
                            </Text>
                            
                            {/* Mode Toggle */}
                            <View style={[styles.segmentedControl, {
                                backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                marginBottom: 12,
                            }]}>
                                <TouchableOpacity
                                    style={[
                                        styles.segmentButton,
                                        imageInputMode === 'url' && {
                                            backgroundColor: cskColors[500],
                                        },
                                    ]}
                                    onPress={() => setImageInputMode('url')}
                                >
                                    <MaterialIcons 
                                        name="link" 
                                        size={18} 
                                        color={imageInputMode === 'url' ? '#ffffff' : (isDark ? '#a8b0b8' : '#696f77')} 
                                    />
                                    <Text
                                        style={[
                                            styles.segmentTextSmall,
                                            {
                                                color: imageInputMode === 'url'
                                                    ? '#ffffff'
                                                    : (isDark ? '#a8b0b8' : '#696f77'),
                                            },
                                        ]}
                                    >
                                        URL
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.segmentButton,
                                        imageInputMode === 'upload' && {
                                            backgroundColor: cskColors[500],
                                        },
                                    ]}
                                    onPress={() => setImageInputMode('upload')}
                                >
                                    <MaterialIcons 
                                        name="upload" 
                                        size={18} 
                                        color={imageInputMode === 'upload' ? '#ffffff' : (isDark ? '#a8b0b8' : '#696f77')} 
                                    />
                                    <Text
                                        style={[
                                            styles.segmentTextSmall,
                                            {
                                                color: imageInputMode === 'upload'
                                                    ? '#ffffff'
                                                    : (isDark ? '#a8b0b8' : '#696f77'),
                                            },
                                        ]}
                                    >
                                        Upload
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {imageInputMode === 'url' ? (
                                <TextInput
                                    style={[styles.input, {
                                        backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                        color: isDark ? '#e1e5e9' : '#0d1b15',
                                    }]}
                                    placeholder="https://example.com/course-image.jpg"
                                    placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                    value={courseImage}
                                    onChangeText={setCourseImage}
                                    keyboardType="url"
                                    autoCapitalize="none"
                                />
                            ) : (
                                <View>
                                    <TouchableOpacity
                                        style={[styles.imageUploadButton, {
                                            backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                            borderColor: courseImage ? cskColors[500] : (isDark ? '#3a4048' : '#d1d5d9'),
                                        }]}
                                        onPress={pickImage}
                                    >
                                        <MaterialIcons
                                            name="add-photo-alternate"
                                            size={32}
                                            color={courseImage ? cskColors[500] : (isDark ? '#6b737c' : '#949da5')}
                                        />
                                        <Text style={[styles.imageUploadText, {
                                            color: isDark ? '#e1e5e9' : '#0d1b15'
                                        }]}>
                                            {courseImage ? 'Change Image' : 'Tap to upload image'}
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    {courseImage && (
                                        <View style={styles.imagePreviewContainer}>
                                            <Image
                                                source={{ uri: courseImage }}
                                                style={styles.imagePreview}
                                                resizeMode="cover"
                                            />
                                            <TouchableOpacity
                                                style={[styles.removeImageButton, {
                                                    backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
                                                }]}
                                                onPress={() => setCourseImage('')}
                                            >
                                                <MaterialIcons name="close" size={20} color={isDark ? '#ffffff' : '#0d1b15'} />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                Course Preview Video (Trailer)
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
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={[styles.uploadButton, {
                                            backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                            borderColor: isDark ? '#3a4048' : '#d1d5d9',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            padding: 12,
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderStyle: 'dashed',
                                            justifyContent: 'center',
                                            gap: 8,
                                        }]}
                                        onPress={pickVideo}
                                    >
                                        <MaterialIcons name="movie-creation" size={24} color={cskColors[500]} />
                                        <Text style={{ color: isDark ? '#e1e5e9' : '#0d1b15', fontFamily: Fonts.medium }}>
                                            Upload Preview Video
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    <View style={{ height: 12 }} />
                                    
                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                            color: isDark ? '#e1e5e9' : '#0d1b15',
                                        }]}
                                        placeholder="Or paste video URL (YouTube/Vimeo)"
                                        placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                        value={videoUrl}
                                        onChangeText={setVideoUrl}
                                        keyboardType="url"
                                        autoCapitalize="none"
                                    />
                                </>
                            )}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                Total Lessons
                            </Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                    color: isDark ? '#e1e5e9' : '#0d1b15',
                                }]}
                                placeholder="12"
                                placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                value={totalLessons}
                                onChangeText={setTotalLessons}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                Free Trial Lessons (Intro)
                            </Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                    color: isDark ? '#e1e5e9' : '#0d1b15',
                                }]}
                                placeholder="0"
                                placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                value={freeTrialLessons}
                                onChangeText={setFreeTrialLessons}
                                keyboardType="numeric"
                            />
                            <Text style={[styles.helperText, { color: isDark ? '#a8b0b8' : '#696f77' }]}>
                                Number of lessons students can watch before buying
                            </Text>
                        </View>
                    </View>

                    {/* Classification Section */}
                    <View style={styles.section}>
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                Subject
                            </Text>
                            {isLoadingSubjects ? (
                                <View style={[styles.input, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                    justifyContent: 'center',
                                }]}>
                                    <ActivityIndicator size="small" color={cskColors[500]} />
                                </View>
                            ) : (
                                <View style={styles.pickerContainer}>
                                    {subjects.map((subject) => (
                                        <TouchableOpacity
                                            key={subject.id}
                                            style={[
                                                styles.subjectOption,
                                                {
                                                    backgroundColor: subjectId === subject.id
                                                        ? (isDark ? cskColors[500] : cskColors[500])
                                                        : (isDark ? '#1e1e1e' : '#f7f8f9'),
                                                    borderColor: subjectId === subject.id
                                                        ? cskColors[500]
                                                        : (isDark ? '#3a4048' : '#d1d5d9'),
                                                },
                                            ]}
                                            onPress={() => setSubjectId(subject.id)}
                                        >
                                            <Text
                                                style={[
                                                    styles.subjectOptionText,
                                                    {
                                                        color: subjectId === subject.id
                                                            ? '#ffffff'
                                                            : (isDark ? '#e1e5e9' : '#0d1b15'),
                                                    },
                                                ]}
                                            >
                                                {subject.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
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

                    {/* Scheduling & Pricing */}
                    <View style={styles.section}>
                        <View style={styles.row}>
                            <View style={[styles.inputContainer, styles.flex1]}>
                                <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                    Attendance Window
                                </Text>
                                <View style={styles.inputWithSuffix}>
                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                            color: isDark ? '#e1e5e9' : '#0d1b15',
                                        }]}
                                        placeholder="15"
                                        placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                        value={attendanceWindow}
                                        onChangeText={setAttendanceWindow}
                                        keyboardType="numeric"
                                    />
                                    <Text style={[styles.suffix, { color: isDark ? '#6b737c' : '#949da5' }]}>
                                        MINS
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.inputContainer, styles.flex1]}>
                                <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                    Billing Type
                                </Text>
                                <View style={[styles.segmentedControl, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                }]}>
                                    <TouchableOpacity
                                        style={[
                                            styles.segmentButtonSmall,
                                            billingType === 'ONE_TIME' && {
                                                backgroundColor: cskColors[500],
                                            },
                                        ]}
                                        onPress={() => setBillingType('ONE_TIME')}
                                    >
                                        <Text
                                            style={[
                                                styles.segmentTextSmall,
                                                {
                                                    color: billingType === 'ONE_TIME'
                                                        ? '#ffffff'
                                                        : (isDark ? '#a8b0b8' : '#696f77'),
                                                },
                                            ]}
                                        >
                                            One-time
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.segmentButtonSmall,
                                            billingType === 'MONTHLY' && {
                                                backgroundColor: cskColors[500],
                                            },
                                        ]}
                                        onPress={() => setBillingType('MONTHLY')}
                                    >
                                        <Text
                                            style={[
                                                styles.segmentTextSmall,
                                                {
                                                    color: billingType === 'MONTHLY'
                                                        ? '#ffffff'
                                                        : (isDark ? '#a8b0b8' : '#696f77'),
                                                },
                                            ]}
                                        >
                                            Monthly
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                Pricing
                            </Text>
                            <View style={styles.row}>
                                <View style={[styles.currencyPicker, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                }]}>
                                    <Text style={[styles.currencyText, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                        {currency}
                                    </Text>
                                </View>
                                <TextInput
                                    style={[styles.input, styles.flex1, {
                                        backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                        color: isDark ? '#e1e5e9' : '#0d1b15',
                                    }]}
                                    placeholder="0.00"
                                    placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                    value={price}
                                    onChangeText={(text) => {
                                        setPrice(text);
                                        setIsPaid(parseFloat(text) > 0);
                                    }}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Bottom padding for fixed button */}
                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

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
                    style={[styles.createButton, { 
                        backgroundColor: (createCourseMutation.isPending || uploading) ? '#6b737c' : cskColors[500] 
                    }]}
                    onPress={handleCreateCourse}
                    disabled={createCourseMutation.isPending || uploading}
                    activeOpacity={0.9}
                >
                    {createCourseMutation.isPending ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <>
                            <Text style={styles.createButtonText}>Create Course</Text>
                            <MaterialIcons name="rocket-launch" size={24} color="#ffffff" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
    section: {
        marginBottom: 24,
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
    subjectOption: {
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderWidth: 2,
    },
    subjectOptionText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
    segmentedControl: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 12,
        gap: 4,
    },
    segmentButton: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentButtonSmall: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
    segmentTextSmall: {
        fontSize: 14,
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
    imageUploadButton: {
        minHeight: 120,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    imageUploadText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    imagePreviewContainer: {
        marginTop: 12,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 180,
        borderRadius: 12,
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    inputWithSuffix: {
        position: 'relative',
    },
    suffix: {
        position: 'absolute',
        right: 16,
        top: 18,
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    flex1: {
        flex: 1,
    },
    currencyPicker: {
        width: 96,
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    currencyText: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
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
    filePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginTop: 4,
    },
    fileName: {
        flex: 1,
        fontSize: 14,
        fontFamily: Fonts.medium,
    },
    uploadButton: {
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    createButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
});
