import { Fonts, cskColors, Colors } from '@/constants/theme';
import { useLessonAbsences } from '@/hooks/useCourses';
import { useLessonAttendance, useLessonDetails, useManualAttendanceOverride } from '@/hooks/useLessons';
import { useTheme } from '@/hooks/useTheme';
import { useProfile } from '@/hooks/useProfile';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, Alert, ScrollView, Platform } from 'react-native';

const STATUS_COLORS = {
    PRESENT: '#12ed87',
    LATE: '#fbbf24',
    ABSENT: '#ef4444',
    EXCUSED: '#3b82f6',
};

const STATUS_BG = {
    PRESENT: 'rgba(18, 237, 135, 0.15)',
    LATE: 'rgba(251, 191, 36, 0.15)',
    ABSENT: 'rgba(239, 68, 68, 0.10)',
    EXCUSED: 'rgba(59, 130, 246, 0.15)',
};

const STATUS_BORDER = {
    PRESENT: 'rgba(18, 237, 135, 0.2)',
    LATE: 'rgba(251, 191, 36, 0.2)',
    ABSENT: 'rgba(239, 68, 68, 0.2)',
    EXCUSED: 'rgba(59, 130, 246, 0.2)',
};

const STATUS_TEXT = {
    PRESENT: '#0db566',
    LATE: '#b45309',
    ABSENT: '#dc2626',
    EXCUSED: '#2563eb',
};

export default function AttendanceListScreen() {
    const router = useRouter();
    const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
    const { theme, isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: attendanceResponse, isLoading: isLoadingAttendance } = useLessonAttendance(lessonId!);
    const { data: lessonResponse, isLoading: isLoadingLesson } = useLessonDetails(lessonId!);
    const { data: absencesResponse, isLoading: isLoadingAbsences } = useLessonAbsences(lessonId!);
    const { profile } = useProfile();
    const overrideMutation = useManualAttendanceOverride();

    // Override State
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [overrideStatus, setOverrideStatus] = useState<'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED'>('PRESENT');
    const [overrideReason, setOverrideReason] = useState('');
    const [isOverrideModalVisible, setIsOverrideModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isTeacher = profile?.role === 'TEACHER' || profile?.role === 'ADMIN';

    const isLoading = isLoadingAttendance || isLoadingLesson || isLoadingAbsences;

    const lesson = lessonResponse?.data;
    const students = attendanceResponse?.data || [];

    // Filter students based on search
    const filteredStudents = useMemo(() => {
        return students.filter(student =>
            (student.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (student.studentId || '').includes(searchQuery)
        );
    }, [students, searchQuery]);

    const renderStudentItem = ({ item }: { item: any }) => {
        const studentAbsence = absencesResponse?.data?.find(a => a.studentId === item.studentId);

        let status = (item.status || 'ABSENT') as keyof typeof STATUS_COLORS;

        // If there's an approved absence request, override status to EXCUSED
        if (studentAbsence?.status === 'APPROVED') {
            status = 'EXCUSED';
        }

        const isAbsent = status === 'ABSENT';
        const isExcused = status === 'EXCUSED';
        const hasPendingRequest = studentAbsence?.status === 'PENDING';

        return (
            <TouchableOpacity
                style={[
                    styles.studentCard,
                    {
                        backgroundColor: isDark ? '#1a2e26' : '#ffffff',
                        borderColor: hasPendingRequest ? STATUS_COLORS.EXCUSED : 'transparent',
                        borderWidth: hasPendingRequest ? 1 : 0,
                    }
                ]}
                onPress={() => {
                    if (isTeacher) {
                        setSelectedStudent(item);
                        setOverrideStatus((item.status || 'ABSENT') as any);
                        setOverrideReason('');
                        setIsOverrideModalVisible(true);
                    } else {
                        router.push({
                            pathname: '/student-analytics',
                            params: {
                                name: item.studentName || 'Student',
                                id: item.studentId,
                                image: item.studentProfileImg,
                                courseId: lesson?.courseId
                            }
                        });
                    }
                }}
            >
                <View style={styles.avatarContainer}>
                    {item.studentProfileImg ? (
                        <Image
                            source={{ uri: item.studentProfileImg }}
                            style={[
                                styles.avatar,
                                (isAbsent || isExcused) && { opacity: 0.8 }
                            ]}
                        />
                    ) : (
                    <View style={[styles.avatar, { backgroundColor: isDark ? '#2a4d3d' : '#e7f3ee', alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ color: theme.primary, fontFamily: Fonts?.bold || 'System', fontSize: 18 }}>
                            {(item.studentName || 'S').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    )}
                    {(status === 'PRESENT' || status === 'LATE') && (
                        <View style={[styles.statusDot, { backgroundColor: cskColors[500], borderColor: isDark ? '#1a2e26' : '#ffffff' }]} />
                    )}
                </View>

                <View style={styles.studentInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.studentName, { color: isDark ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
                            {item.studentName || (item.studentId ? `Student ${item.studentId.slice(-4)}` : 'Unknown Student')}
                        </Text>
                        {hasPendingRequest && (
                            <MaterialIcons name="info-outline" size={14} color={STATUS_COLORS.EXCUSED} />
                        )}
                    </View>
                    <Text style={[styles.studentDetails, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={1}>
                        ID: {item.studentId ? item.studentId.slice(0, 8) : 'N/A'} {hasPendingRequest ? '| Pending Excuse' : ''}
                    </Text>
                </View>

                <View style={[
                    styles.statusBadge,
                    {
                        backgroundColor: STATUS_BG[status] || STATUS_BG.ABSENT,
                        borderColor: STATUS_BORDER[status] || STATUS_BORDER.ABSENT
                    }
                ]}>
                    <Text style={[
                        styles.statusText,
                        { color: isDark ? STATUS_COLORS[status] || STATUS_COLORS.ABSENT : STATUS_TEXT[status] || STATUS_TEXT.ABSENT }
                    ]}>
                        {status}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f8fcfa', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#10221a' : '#f8fcfa' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#10221a' : '#f8fcfa'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? '#10221a' : '#f8fcfa' }]}>
                <View style={styles.headerTop}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
                            {lesson?.title || 'Attendance List'}
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                            Lesson Status: {lesson?.status ? (lesson.status.charAt(0) + lesson.status.slice(1).toLowerCase()) : 'Loading...'}
                        </Text>
                    </View>
                    <TouchableOpacity style={[styles.filterButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                        <MaterialIcons name="tune" size={24} color={isDark ? '#e2e8f0' : '#334155'} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color={isDark ? '#64748b' : '#94a3b8'} style={styles.searchIcon} />
                    <TextInput
                        style={[
                            styles.searchInput,
                            {
                                backgroundColor: isDark ? '#1a2e26' : '#ffffff',
                                color: isDark ? '#ffffff' : '#0f172a'
                            }
                        ]}
                        placeholder="Search student by name or ID"
                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Dashboard Stats */}
            {!isLoading && (
                <View style={styles.dashboardContainer}>
                    <View style={styles.statsGridRow}>
                        <View style={[styles.dashboardStat, { backgroundColor: isDark ? 'rgba(18, 237, 135, 0.1)' : 'rgba(18, 237, 135, 0.05)', borderColor: isDark ? 'rgba(18, 237, 135, 0.2)' : 'rgba(18, 237, 135, 0.1)' }]}>
                            <Text style={[styles.statValue, { color: STATUS_TEXT.PRESENT }]}>{students.filter(s => s.status === 'PRESENT').length}</Text>
                            <Text style={[styles.statLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Present</Text>
                        </View>
                        <View style={[styles.dashboardStat, { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.05)', borderColor: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)' }]}>
                            <Text style={[styles.statValue, { color: STATUS_TEXT.LATE }]}>{students.filter(s => s.status === 'LATE').length}</Text>
                            <Text style={[styles.statLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Late</Text>
                        </View>
                        <View style={[styles.dashboardStat, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)', borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }]}>
                            <Text style={[styles.statValue, { color: STATUS_TEXT.ABSENT }]}>{students.filter(s => s.status === 'ABSENT').length}</Text>
                            <Text style={[styles.statLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Absent</Text>
                        </View>
                        <View style={[styles.dashboardStat, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)', borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }]}>
                            <Text style={[styles.statValue, { color: STATUS_TEXT.EXCUSED }]}>{students.filter(s => s.status === 'EXCUSED').length}</Text>
                            <Text style={[styles.statLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Excused</Text>
                        </View>
                    </View>
                </View>
            )}


            {/* Content List */}
            <FlatList
                data={filteredStudents}
                renderItem={renderStudentItem}
                keyExtractor={item => item.id || item.studentId}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <View style={styles.listHeader}>
                        <Text style={[styles.listHeaderTitle, { color: isDark ? '#64748b' : '#94a3b8' }]}>STUDENTS ({filteredStudents.length})</Text>
                        <Text style={[styles.liveUpdateText, { color: isDark ? cskColors[500] : '#0db566' }]}>Live Updates On</Text>
                    </View>
                )}
            />

            {/* Override Modal */}
            <Modal
                visible={isOverrideModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsOverrideModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#142a20' : '#ffffff' }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#2a4a3c' : '#edf2f7' }]}>
                            <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#0d1b15' }]}>Manual Override</Text>
                            <TouchableOpacity onPress={() => setIsOverrideModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color={isDark ? '#88cba8' : '#4c9a75'} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ padding: 20 }}>
                            <Text style={[styles.studentLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Student</Text>
                            <Text style={[styles.studentValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>{selectedStudent?.studentName}</Text>

                            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#0f172a', marginTop: 20 }]}>New Status</Text>
                            <View style={styles.statusGrid}>
                                {(['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] as const).map((status) => (
                                    <TouchableOpacity
                                        key={status}
                                        style={[
                                            styles.statusOption,
                                            {
                                                backgroundColor: overrideStatus === status ? STATUS_BG[status] : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'),
                                                borderColor: overrideStatus === status ? STATUS_BORDER[status] : 'transparent',
                                            }
                                        ]}
                                        onPress={() => setOverrideStatus(status)}
                                    >
                                        <View style={[styles.statusOptionDot, { backgroundColor: STATUS_COLORS[status] }]} />
                                        <Text style={[
                                            styles.statusOptionText,
                                            { color: overrideStatus === status ? (isDark ? STATUS_COLORS[status] : STATUS_TEXT[status]) : (isDark ? '#94a3b8' : '#64748b') }
                                        ]}>
                                            {status}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#0f172a', marginTop: 20 }]}>Reason for Change</Text>
                            <TextInput
                                style={[
                                    styles.overrideInput,
                                    {
                                        backgroundColor: isDark ? '#1a2e26' : '#f1f5f9',
                                        color: isDark ? '#ffffff' : '#0f172a',
                                        borderColor: isDark ? '#2a4a3c' : '#e2e8f0'
                                    }
                                ]}
                                placeholder="E.g. Student phone battery died..."
                                placeholderTextColor="#64748b"
                                multiline
                                value={overrideReason}
                                onChangeText={setOverrideReason}
                            />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.cancelBtn, { borderColor: isDark ? '#2a4a3c' : '#e2e8f0' }]}
                                onPress={() => setIsOverrideModalVisible(false)}
                            >
                                <Text style={[styles.cancelBtnText, { color: isDark ? '#94a3b8' : '#64748b' }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitBtn, { backgroundColor: cskColors[500] }]}
                                disabled={isSubmitting || !overrideReason.trim()}
                                onPress={async () => {
                                    try {
                                        setIsSubmitting(true);
                                        await overrideMutation.mutateAsync({
                                            lessonId: lessonId!,
                                            data: {
                                                studentId: selectedStudent.studentId,
                                                status: overrideStatus,
                                                reason: overrideReason
                                            }
                                        });
                                        setIsOverrideModalVisible(false);
                                        Alert.alert('Success', 'Attendance status updated successfully.');
                                    } catch (err: any) {
                                        Alert.alert('Error', err.message || 'Failed to update attendance');
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                            >
                                {isSubmitting ? <ActivityIndicator size="small" color="#0f172a" /> : <Text style={styles.submitBtnText}>Confirm</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>


            {/* Bottom Floating Action */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: cskColors[500], shadowColor: 'rgba(0,0,0,0.2)' }]}
                    activeOpacity={0.9}
                    onPress={() => router.back()}
                >
                    <MaterialIcons name="check-circle" size={24} color="#0f172a" />
                    <Text style={styles.fabText}>Finalize Attendance</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom Gradient Fade */}
            <LinearGradient
                colors={isDark ? ['rgba(16, 34, 26, 0)', '#10221a'] : ['rgba(248, 252, 250, 0)', '#f8fcfa']}
                style={styles.bottomGradient}
                pointerEvents="none"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
        paddingBottom: 20,
        gap: 16,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: Fonts?.bold || 'System',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
    filterButton: {
        padding: 8,
        borderRadius: 12,
    },
    searchContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    searchIcon: {
        position: 'absolute',
        left: 16,
        zIndex: 1,
    },
    searchInput: {
        width: '100%',
        height: 52,
        borderRadius: 16,
        paddingLeft: 48,
        paddingRight: 16,
        fontSize: 16,
        fontFamily: Fonts.regular,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 120, // Space for FAB
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 8,
    },
    listHeaderTitle: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        letterSpacing: 1,
    },
    liveUpdateText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        gap: 16,
        borderWidth: 1,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    statusDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
    },
    studentInfo: {
        flex: 1,
        gap: 2,
    },
    studentName: {
        fontSize: 16,
        fontFamily: Fonts.semiBold,
    },
    studentDetails: {
        fontSize: 14,
        fontFamily: Fonts.regular,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 20,
    },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 30,
        gap: 8,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
    },
    fabText: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        color: '#0f172a',
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 96,
        zIndex: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: Fonts.bold,
    },
    studentLabel: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    studentValue: {
        fontSize: 18,
        fontFamily: Fonts.semiBold,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 15,
        fontFamily: Fonts.bold,
        marginBottom: 12,
    },
    statusGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statusOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        minWidth: '45%',
    },
    statusOptionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusOptionText: {
        fontSize: 14,
        fontFamily: Fonts.bold,
    },
    overrideInput: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        height: 100,
        textAlignVertical: 'top',
        fontSize: 15,
        fontFamily: Fonts.regular,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    cancelBtnText: {
        fontSize: 16,
        fontFamily: Fonts.bold,
    },
    submitBtn: {
        flex: 2,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnText: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        color: '#0f172a',
    },
    dashboardContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    statsGridRow: {
        flexDirection: 'row',
        gap: 8,
    },
    dashboardStat: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
    },
    statValue: {
        fontSize: 18,
        fontFamily: Fonts.bold,
    },
    statLabel: {
        fontSize: 11,
        fontFamily: Fonts.semiBold,
        marginTop: 2,
    },
});


