import { Fonts, cskColors } from '@/constants/theme';
import { useAbsenceMutations } from '@/hooks/useCourses';
import { useLessonDetails } from '@/hooks/useLessons';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/libs/auth';
import { useLinkedChildren, useChildAttendance } from '@/hooks/useParentLinks';
import { AbsenceReasonType, uploadAbsenceAttachment } from '@/services/CourseService';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AbsenceRequestScreen() {
    const router = useRouter();
    const { lessonId, studentId: paramStudentId, studentName: paramStudentName } = useLocalSearchParams();
    const { theme, isDark } = useTheme();
    const { profile } = useProfile();
    const user = useAuthStore(state => state.user);
    const isParent = user?.role === 'PARENT';
    const { children, isLoading: isLoadingChildren } = useLinkedChildren();
    const { createAbsence } = useAbsenceMutations();

    // Form State
    const [reason, setReason] = useState<AbsenceReasonType>('MEDICAL');
    const [notes, setNotes] = useState('');
    const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showReasonPicker, setShowReasonPicker] = useState(false);
    
    // Parent specific state
    const [selectedChildId, setSelectedChildId] = useState<string | null>((paramStudentId as string) || null);
    const [showChildPicker, setShowChildPicker] = useState(false);

    const activeStudentId = (isParent ? selectedChildId : profile?.id) || null;

    // Internal lesson selection if not provided in params
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>((lessonId as string) || null);
    const [showLessonPicker, setShowLessonPicker] = useState(false);

    // Fetch attendance history for selection
    const { data: attendanceResponse, isLoading: isLoadingAttendance } = useChildAttendance(activeStudentId);
    const absentLessons = useMemo(() => {
        return attendanceResponse?.data.filter((record: any) => record.status === 'ABSENT' || record.status === 'LATE') || [];
    }, [attendanceResponse]);

    // Fetch details for the effective lessonId
    const effectiveLessonId = (lessonId as string) || selectedLessonId;
    const { data: lessonResponse, isLoading: isLoadingLesson } = useLessonDetails(effectiveLessonId as string);
    const lesson = lessonResponse?.data;

    const selectedChildName = useMemo(() => {
        if (paramStudentName) return paramStudentName as string;
        return children.find(c => c.id === selectedChildId)?.name || 'Select Child';
    }, [selectedChildId, children, paramStudentName]);

    const selectedLessonDisplay = useMemo(() => {
        if (lesson) return `${lesson.title} (${new Date(lesson.scheduledAt).toLocaleDateString()})`;
        return 'Select Lesson';
    }, [lesson]);

    const handlePickImage = async () => {
        try {
            // Request permissions first
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'We need access to your gallery to upload attachments.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setAttachmentUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('[ImagePicker Error]', error);
            Alert.alert('Error', 'An unexpected error occurred while picking the image.');
        }
    };

    const handleRemoveImage = () => {
        setAttachmentUri(null);
    };

    const handleSubmit = async () => {
        if (!effectiveLessonId || !activeStudentId) {
            Alert.alert('Error', !activeStudentId ? 'Please select a child' : 'Please select a missed lesson');
            return;
        }

        if (!notes.trim()) {
            Alert.alert('Error', 'Please provide details for the absence');
            return;
        }

        try {
            setIsSubmitting(true);
            
            // Upload to Cloudinary if attachment exists
            let finalAttachmentUrl = undefined;
            if (attachmentUri) {
                try {
                    finalAttachmentUrl = await uploadAbsenceAttachment(attachmentUri);
                } catch (uploadErr) {
                    console.error('[Upload Error]', uploadErr);
                    throw new Error('Failed to upload proof image. Please try again.');
                }
            }

            await createAbsence.mutateAsync({
                lessonId: effectiveLessonId as string,
                studentId: activeStudentId,
                reasonType: reason,
                reasonText: notes,
                attachment: finalAttachmentUrl
            });
            Alert.alert('Success', 'The absence request has been submitted successfully.');
            router.back();
        } catch (error: any) {
            // Handle 409 Conflict - duplicate request
            if (error.response?.status === 409 || error.message?.includes('already submitted')) {
                Alert.alert(
                    'Request Already Exists',
                    'An excuse has already been submitted for this lesson. Please wait for review.',
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            } else {
                Alert.alert('Error', error.message || 'Failed to submit absence request');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getReasonLabel = (type: AbsenceReasonType) => {
        switch (type) {
            case 'MEDICAL': return 'Medical / Sickness';
            case 'TECHNICAL': return 'Technical Issue (Phone/Network)';
            case 'EMERGENCY': return 'Urgent Emergency';
            case 'PERSONAL': return 'Personal / Family Circumstances';
            case 'PARENT_EXCUSE': return 'Parental Verified Excuse';
            default: return type;
        }
    };

    const formattedDate = lesson?.scheduledAt
        ? new Date(lesson.scheduledAt).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
        : 'Loading...';

    const formattedTime = lesson?.scheduledAt
        ? new Date(lesson.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '--:--';

    const REASONS: AbsenceReasonType[] = ['MEDICAL', 'TECHNICAL', 'EMERGENCY', 'PERSONAL', 'PARENT_EXCUSE'];

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f8fcfa' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#10221a' : '#f8fcfa'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#10221a' : '#f8fcfa' }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                >
                    <MaterialIcons name="arrow-back-ios-new" size={20} color={isDark ? '#fff' : '#0d1b15'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0d1b15' }]}>Excuse Request</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 150 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Child Selection (Parent Only) */}
                {isParent && (
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#f0fdf7' : '#0d1b15' }]}>Selecting for Child</Text>
                        <TouchableOpacity
                            style={[styles.dropdown, {
                                backgroundColor: isDark ? '#1a332a' : '#ffffff',
                                borderColor: isDark ? '#2a4a3c' : '#cfe7dc',
                                marginBottom: 20
                            }]}
                            activeOpacity={0.7}
                            onPress={() => !paramStudentId && setShowChildPicker(true)}
                            disabled={!!paramStudentId} // Disable if studentId is passed via params
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Ionicons name="person-outline" size={20} color={cskColors[500]} />
                                <Text style={[styles.dropdownText, { color: isDark ? '#f0fdf7' : '#0d1b15' }]}>
                                    {selectedChildName}
                                </Text>
                            </View>
                            {!paramStudentId && <MaterialIcons name="keyboard-arrow-down" size={24} color={cskColors[500]} />}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Lesson Info / Selector */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: isDark ? '#f0fdf7' : '#0d1b15' }]}>Source Lesson</Text>
                    {lessonId ? (
                        <View style={[styles.lessonCard, { backgroundColor: isDark ? '#1a332a' : '#ffffff', borderColor: isDark ? '#2a4a3c' : '#cfe7dc' }]}>
                            <View style={[styles.lessonIconContainer, { backgroundColor: isDark ? 'rgba(18, 237, 135, 0.1)' : '#f0fdf7' }]}>
                                <MaterialIcons name="class" size={24} color={cskColors[500]} />
                            </View>
                            <View style={styles.lessonInfo}>
                                <Text style={[styles.lessonTitle, { color: isDark ? '#fff' : '#0d1b15' }]} numberOfLines={1}>
                                    {isLoadingLesson ? 'Loading lesson...' : (lesson?.title || 'Unknown Lesson')}
                                </Text>
                                <Text style={[styles.lessonMeta, { color: isDark ? '#88cba8' : '#4c9a75' }]}>
                                    {formattedDate} | {formattedTime}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.dropdown, {
                                backgroundColor: isDark ? '#1a332a' : '#ffffff',
                                borderColor: isDark ? '#2a4a3c' : '#cfe7dc',
                                marginBottom: 10
                            }]}
                            activeOpacity={0.7}
                            onPress={() => setShowLessonPicker(true)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <MaterialIcons name="event-busy" size={20} color={cskColors[500]} />
                                <Text style={[styles.dropdownText, { color: isDark ? '#f0fdf7' : '#0d1b15' }]}>
                                    {selectedLessonDisplay}
                                </Text>
                            </View>
                            <MaterialIcons name="keyboard-arrow-down" size={24} color={cskColors[500]} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Form Items */}
                <View style={styles.form}>
                    {/* Reason Selection (Dropdown) */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#f0fdf7' : '#0d1b15' }]}>Primary Reason</Text>
                        <TouchableOpacity
                            style={[styles.dropdown, {
                                backgroundColor: isDark ? '#1a332a' : '#ffffff',
                                borderColor: isDark ? '#2a4a3c' : '#cfe7dc'
                            }]}
                            activeOpacity={0.7}
                            onPress={() => setShowReasonPicker(true)}
                        >
                            <Text style={[styles.dropdownText, { color: isDark ? '#f0fdf7' : '#0d1b15' }]}>
                                {getReasonLabel(reason)}
                            </Text>
                            <MaterialIcons name="keyboard-arrow-down" size={24} color={cskColors[500]} />
                        </TouchableOpacity>
                    </View>

                    {/* Detailed Notes */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: isDark ? '#f0fdf7' : '#0d1b15' }]}>Explanation / Details</Text>
                        <View style={styles.textAreaContainer}>
                            <TextInput
                                style={[styles.textArea, {
                                    backgroundColor: isDark ? '#1a332a' : '#ffffff',
                                    color: isDark ? '#f0fdf7' : '#0d1b15',
                                    borderColor: isDark ? '#2a4a3c' : '#cfe7dc'
                                }]}
                                placeholder="Describe why you cannot attend this lesson..."
                                placeholderTextColor={isDark ? '#4c9a75' : '#a0aec0'}
                                multiline
                                textAlignVertical="top"
                                value={notes}
                                onChangeText={setNotes}
                                maxLength={300}
                            />
                            <Text style={[styles.charCount, { color: '#4c9a75' }]}>
                                {notes.length}/300
                            </Text>
                        </View>
                    </View>

                    {/* Attachment Section */}
                    <View style={styles.evidenceSection}>
                        <View style={styles.evidenceHeader}>
                            <Text style={[styles.label, { color: isDark ? '#f0fdf7' : '#0d1b15' }]}>Proof / Documentation</Text>
                            <View style={[styles.optionalBadge, { backgroundColor: isDark ? 'rgba(18, 237, 135, 0.1)' : '#f0fdf7' }]}>
                                <Text style={[styles.optionalText, { color: cskColors[500] }]}>Optional</Text>
                            </View>
                        </View>

                        <View style={styles.attachmentRow}>
                            {!attachmentUri ? (
                                <TouchableOpacity
                                    style={[styles.addEvidenceButton, { backgroundColor: isDark ? '#1a332a' : '#ffffff', borderColor: isDark ? '#2a4a3c' : '#cfe7dc' }]}
                                    activeOpacity={0.7}
                                    onPress={handlePickImage}
                                >
                                    <View style={[styles.addIconCircle, { backgroundColor: cskColors[500] }]}>
                                        <MaterialIcons name="add-photo-alternate" size={24} color="#10221a" />
                                    </View>
                                    <Text style={[styles.addEvidenceText, { color: isDark ? '#88cba8' : '#4c9a75' }]}>Add Attachment</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.thumbnailContainer, { backgroundColor: isDark ? '#1a332a' : '#ffffff', borderColor: isDark ? '#2a4a3c' : '#cfe7dc' }]}>
                                    <Image source={{ uri: attachmentUri }} style={styles.thumbnail} />
                                    <TouchableOpacity style={styles.removeButton} onPress={handleRemoveImage} activeOpacity={0.8}>
                                        <MaterialIcons name="close" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.hintText, { color: isDark ? '#4c9a75' : '#718096' }]}>
                            Upload medical reports or family notes if available.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Dropdown Modal */}
            <Modal
                visible={showReasonPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowReasonPicker(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowReasonPicker(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#142a20' : '#ffffff' }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#2a4a3c' : '#edf2f7' }]}>
                            <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>Select Reason</Text>
                            <TouchableOpacity onPress={() => setShowReasonPicker(false)}>
                                <MaterialIcons name="close" size={24} color={isDark ? '#88cba8' : '#4c9a75'} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.reasonsList}>
                            {REASONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[
                                        styles.reasonItem,
                                        reason === opt && { backgroundColor: isDark ? 'rgba(18, 237, 135, 0.1)' : '#f0fdf7' }
                                    ]}
                                    onPress={() => {
                                        setReason(opt);
                                        setShowReasonPicker(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.reasonItemText,
                                        { color: isDark ? '#f0fdf7' : '#0d1b15' },
                                        reason === opt && { color: cskColors[500], fontFamily: Fonts.bold }
                                    ]}>
                                        {getReasonLabel(opt)}
                                    </Text>
                                    {reason === opt && <MaterialIcons name="check" size={20} color={cskColors[500]} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Pressable>
            </Modal>

            {/* Child Selection Modal */}
            <Modal
                visible={showChildPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowChildPicker(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowChildPicker(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#142a20' : '#ffffff' }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#2a4a3c' : '#edf2f7' }]}>
                            <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>Select Child</Text>
                            <TouchableOpacity onPress={() => setShowChildPicker(false)}>
                                <MaterialIcons name="close" size={24} color={isDark ? '#88cba8' : '#4c9a75'} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.reasonsList}>
                            {isLoadingChildren ? (
                                <ActivityIndicator size="small" color={cskColors[500]} style={{ margin: 20 }} />
                            ) : children.length === 0 ? (
                                <Text style={{ textAlign: 'center', margin: 20, color: '#4c9a75' }}>No linked children found</Text>
                            ) : (
                                children.map((child) => (
                                    <TouchableOpacity
                                        key={child.id}
                                        style={[
                                            styles.reasonItem,
                                            selectedChildId === child.id && { backgroundColor: isDark ? 'rgba(18, 237, 135, 0.1)' : '#f0fdf7' }
                                        ]}
                                        onPress={() => {
                                            setSelectedChildId(child.id);
                                            setShowChildPicker(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.reasonItemText,
                                            { color: isDark ? '#f0fdf7' : '#0d1b15' },
                                            selectedChildId === child.id && { color: cskColors[500], fontFamily: Fonts.bold }
                                        ]}>
                                            {child.name}
                                        </Text>
                                        {selectedChildId === child.id && <MaterialIcons name="check" size={20} color={cskColors[500]} />}
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </View>
                </Pressable>
            </Modal>

            {/* Lesson Selection Modal */}
            <Modal
                visible={showLessonPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowLessonPicker(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowLessonPicker(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#142a20' : '#ffffff' }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#2a4a3c' : '#edf2f7' }]}>
                            <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>Select Missed Lesson</Text>
                            <TouchableOpacity onPress={() => setShowLessonPicker(false)}>
                                <MaterialIcons name="close" size={24} color={isDark ? '#88cba8' : '#4c9a75'} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.reasonsList}>
                            {isLoadingAttendance ? (
                                <ActivityIndicator size="small" color={cskColors[500]} style={{ margin: 20 }} />
                            ) : absentLessons.length === 0 ? (
                                <View style={{ padding: 30, alignItems: 'center' }}>
                                    <Ionicons name="checkmark-circle-outline" size={48} color={cskColors[500]} />
                                    <Text style={{ textAlign: 'center', marginTop: 10, color: '#4c9a75', fontFamily: Fonts.medium }}>
                                        No absent lessons found for this child.
                                    </Text>
                                </View>
                            ) : (
                                absentLessons.map((record: any) => (
                                    <TouchableOpacity
                                        key={record.lessonId}
                                        style={[
                                            styles.reasonItem,
                                            effectiveLessonId === record.lessonId && { backgroundColor: isDark ? 'rgba(18, 237, 135, 0.1)' : '#f0fdf7' }
                                        ]}
                                        onPress={() => {
                                            setSelectedLessonId(record.lessonId);
                                            setShowLessonPicker(false);
                                        }}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={[
                                                styles.reasonItemText,
                                                { color: isDark ? '#f0fdf7' : '#0d1b15' },
                                                effectiveLessonId === record.lessonId && { color: cskColors[500], fontFamily: Fonts.bold }
                                            ]}>
                                                {record.lessonTitle}
                                            </Text>
                                            <Text style={{ fontSize: 12, color: '#888' }}>
                                                {new Date(record.date).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        {effectiveLessonId === record.lessonId && <MaterialIcons name="check" size={20} color={cskColors[500]} />}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>
            <LinearGradient
                colors={isDark ? ['transparent', '#10221a'] : ['transparent', '#f8fcfa']}
                style={styles.footer}
                pointerEvents="box-none"
            >
                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: cskColors[500], shadowColor: cskColors[500] }]}
                    activeOpacity={0.8}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#10221a" />
                    ) : (
                        <>
                            <Text style={styles.submitButtonText}>Submit Request</Text>
                            <MaterialIcons name="arrow-forward" size={20} color="#10221a" />
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.secureBadge}>
                    <MaterialIcons name="verified-user" size={14} color={cskColors[500]} />
                    <Text style={[styles.secureText, { color: isDark ? '#88cba8' : '#4c9a75' }]}>OFFICIAL SUBMISSION</Text>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    lessonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    lessonIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    lessonInfo: {
        flex: 1,
    },
    lessonTitle: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        marginBottom: 4,
    },
    lessonMeta: {
        fontSize: 13,
        fontFamily: Fonts.medium,
    },
    form: {
        gap: 24,
    },
    inputGroup: {
        gap: 12,
    },
    label: {
        fontSize: 14,
        fontFamily: Fonts.semiBold,
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        height: 54,
    },
    dropdownText: {
        fontSize: 15,
        fontFamily: Fonts.medium,
    },
    textAreaContainer: {
        position: 'relative',
    },
    textArea: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 15,
        fontFamily: Fonts.regular,
        minHeight: 140,
    },
    charCount: {
        position: 'absolute',
        bottom: 12,
        right: 16,
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    evidenceSection: {
        gap: 12,
    },
    evidenceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optionalBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    optionalText: {
        fontSize: 11,
        fontFamily: Fonts.bold,
    },
    attachmentRow: {
        flexDirection: 'row',
    },
    addEvidenceButton: {
        width: '100%',
        height: 80,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 12,
    },
    addIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addEvidenceText: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    thumbnailContainer: {
        width: 120,
        height: 120,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hintText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        maxHeight: SCREEN_HEIGHT * 0.7,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    reasonsList: {
        padding: 12,
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 4,
    },
    reasonItemText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 30,
    },
    submitButton: {
        width: '100%',
        height: 60,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    submitButtonText: {
        color: '#10221a',
        fontSize: 17,
        fontFamily: Fonts.bold,
    },
    secureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 16,
    },
    secureText: {
        fontSize: 11,
        fontFamily: Fonts.bold,
        letterSpacing: 0.8,
    },
});
