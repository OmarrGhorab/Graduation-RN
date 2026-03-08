// Create Lesson Screen - Updated with Location Picker
import CalendarModal from '@/components/CalendarModal';
import GeofenceSlider from '@/components/GeofenceSlider';
import LocationPickerModal from '@/components/location/LocationPickerModal';
import TimePickerModal from '@/components/TimePickerModal';
import { Fonts, cskColors } from '@/constants/theme';
import { useMyCourses } from '@/hooks/useCourses';
import { useLessonCreation } from '@/hooks/useLessonCreation';
import { useTheme } from '@/hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

type DeliveryType = 'ONLINE' | 'OFFLINE';

export default function CreateLessonScreen() {
    const router = useRouter();
    const { courseId: paramCourseId } = useLocalSearchParams<{ courseId?: string }>();
    const { theme, isDark } = useTheme();
    const { createLessonMutation } = useLessonCreation();

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

    // Fetch courses
    const { data: coursesData, isLoading: isLoadingCourses } = useMyCourses();
    const courses = coursesData?.data || [];

    const handleCreateLesson = async () => {
        // Validation
        if (!courseId) {
            Alert.alert('Validation Error', 'Please select a course');
            return;
        }

        if (!title.trim()) {
            Alert.alert('Validation Error', 'Please enter a lesson title');
            return;
        }

        if (deliveryType === 'ONLINE' && !locationName.trim()) {
            Alert.alert('Validation Error', 'Please enter a meeting link for online lessons');
            return;
        }

        if (deliveryType === 'OFFLINE' && (!locationName.trim() || !locationLat || !locationLng)) {
            Alert.alert('Validation Error', 'Please select a location for offline lessons');
            return;
        }

        try {
            const lessonData = {
                courseId,
                title: title.trim(),
                description: description.trim(),
                scheduledAt: scheduledAt.toISOString(),
                durationMinutes: parseInt(durationMinutes) || 60,
                deliveryType,
                locationName: locationName.trim(),
                locationLat: locationLat ? parseFloat(locationLat) : undefined,
                locationLng: locationLng ? parseFloat(locationLng) : undefined,
                geofenceRadiusM: parseInt(geofenceRadius) || 50,
            };

            await createLessonMutation.mutateAsync(lessonData);

            Alert.alert(
                'Success',
                'Lesson created successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create lesson');
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
                    Create New Lesson
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
                            {isLoadingCourses ? (
                                <View style={[styles.input, {
                                    backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                    justifyContent: 'center',
                                }]}>
                                    <ActivityIndicator size="small" color={cskColors[500]} />
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
                    onPress={handleCreateLesson}
                    disabled={createLessonMutation.isPending}
                    activeOpacity={0.9}
                >
                    {createLessonMutation.isPending ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <>
                            <Text style={styles.createButtonText}>Create Lesson</Text>
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
});
