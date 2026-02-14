import { Fonts, cskColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getAllSubjects } from '@/services/CourseService';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
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
    const [deliveryType, setDeliveryType] = useState<DeliveryType>('ONLINE');
    const [locationName, setLocationName] = useState('');
    const [locationLat, setLocationLat] = useState('');
    const [locationLng, setLocationLng] = useState('');
    const [geofenceRadius, setGeofenceRadius] = useState('50');
    const [attendanceWindow, setAttendanceWindow] = useState('15');
    const [price, setPrice] = useState('0');
    const [currency, setCurrency] = useState('EGP');
    const [isPaid, setIsPaid] = useState(false);
    const [billingType, setBillingType] = useState<BillingType>('ONE_TIME');
    const [attendanceWeight, setAttendanceWeight] = useState('0.3');

    // Fetch subjects
    const { data: subjectsResponse, isLoading: isLoadingSubjects } = useQuery({
        queryKey: ['subjects'],
        queryFn: getAllSubjects,
    });

    const subjects = subjectsResponse?.data || [];

    const handleCreateCourse = async () => {
        // Validation
        if (!title.trim()) {
            Alert.alert('Validation Error', 'Please enter a course title');
            return;
        }

        if (!subjectId) {
            Alert.alert('Validation Error', 'Please select a subject');
            return;
        }

        if (deliveryType === 'OFFLINE' && !locationName.trim()) {
            Alert.alert('Validation Error', 'Please enter a location name for offline courses');
            return;
        }

        try {
            const courseData = {
                title: title.trim(),
                description: description.trim(),
                subjectId,
                deliveryType,
                locationName: locationName.trim(),
                locationLat: locationLat ? parseFloat(locationLat) : undefined,
                locationLng: locationLng ? parseFloat(locationLng) : undefined,
                geofenceRadiusM: parseInt(geofenceRadius) || 50,
                attendanceWindowMinutes: parseInt(attendanceWindow) || 15,
                price: parseFloat(price) || 0,
                currency,
                isPaid,
                billingType,
                attendanceWeight: parseFloat(attendanceWeight) || 0.3,
            };

            await createCourseMutation.mutateAsync(courseData);
            
            Alert.alert(
                'Success',
                'Course created successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error: any) {
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

                        {/* Location Input */}
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                Location Name
                            </Text>
                            <View style={styles.inputWithIcon}>
                                <MaterialIcons
                                    name="location-on"
                                    size={24}
                                    color={cskColors[500]}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={[styles.inputWithIconText, {
                                        backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                        color: isDark ? '#e1e5e9' : '#0d1b15',
                                    }]}
                                    placeholder={deliveryType === 'ONLINE' ? 'Zoom link or meeting URL' : 'Physical location'}
                                    placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                    value={locationName}
                                    onChangeText={setLocationName}
                                />
                            </View>
                        </View>

                        {/* Coordinates (Optional for OFFLINE) */}
                        {deliveryType === 'OFFLINE' && (
                            <View style={styles.row}>
                                <View style={[styles.inputContainer, styles.flex1]}>
                                    <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                        Latitude (Optional)
                                    </Text>
                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                            color: isDark ? '#e1e5e9' : '#0d1b15',
                                        }]}
                                        placeholder="30.0444"
                                        placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                        value={locationLat}
                                        onChangeText={setLocationLat}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={[styles.inputContainer, styles.flex1]}>
                                    <Text style={[styles.label, { color: isDark ? '#e1e5e9' : '#0d1b15' }]}>
                                        Longitude (Optional)
                                    </Text>
                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: isDark ? '#1e1e1e' : '#f7f8f9',
                                            color: isDark ? '#e1e5e9' : '#0d1b15',
                                        }]}
                                        placeholder="31.2357"
                                        placeholderTextColor={isDark ? '#6b737c' : '#949da5'}
                                        value={locationLng}
                                        onChangeText={setLocationLng}
                                        keyboardType="numeric"
                                    />
                                </View>
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

            {/* Fixed Footer */}
            <View style={[styles.footer, {
                backgroundColor: isDark ? 'rgba(24, 51, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderTopColor: isDark ? '#2a4d3d' : '#e9ebed',
            }]}>
                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: cskColors[500] }]}
                    onPress={handleCreateCourse}
                    disabled={createCourseMutation.isPending}
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
    inputWithIcon: {
        position: 'relative',
    },
    inputIcon: {
        position: 'absolute',
        left: 16,
        top: 16,
        zIndex: 1,
    },
    inputWithIconText: {
        height: 56,
        borderRadius: 12,
        paddingLeft: 52,
        paddingRight: 16,
        fontSize: 16,
        fontFamily: Fonts.regular,
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
    createButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
});
